import { prisma } from '@/lib/prisma'
import { intentAnalyzerAgent } from '../agents/intent-analyzer/intent-analyzer.agent'
import { leadScorerAgent } from '../agents/lead-scorer/lead-scorer.agent'
import { replyGeneratorAgent } from '../agents/reply-generator/reply-generator.agent'
import { salesCoachAgent } from '../agents/sales-coach/sales-coach.agent'
import { conversationSummarizerAgent } from '../agents/conversation-summarizer/summarizer.agent'
import { ProductKnowledgeEngine } from '../agents/product-knowledge/product-knowledge.agent'
import { createAgentLogger } from '@/lib/logger'

const log = createAgentLogger('sales-pipeline')

export interface PipelineOutput {
  intent: any
  leadScore: any
  suggestedReply: any
  salesCoachNotes: any
  conversationSummary: any
}

export async function executeSalesPipeline(conversationId: string, incomingMessageText: string): Promise<PipelineOutput | null> {
  log.info({ conversationId }, 'Initiating sales pipeline execution')

  try {
    // 1. Fetch data from database
    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: {
        lead: {
          include: {
            product: true
          }
        },
        customer: true,
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 15
        }
      }
    })

    if (!conversation) {
      log.error({ conversationId }, 'Conversation not found for sales pipeline')
      return null
    }

    const { lead, customer, messages } = conversation
    const product = lead?.product

    if (!product) {
      log.error({ conversationId }, 'Product reference not found on conversation lead')
      return null
    }

    // Map existing message logs for LLM contexts
    const historyList = messages.map(msg => ({
      role: msg.role === 'CUSTOMER' ? 'user' as const : 'assistant' as const,
      content: msg.content
    }))

    // Build Product Ground Truth
    const productContext = ProductKnowledgeEngine.formatProductContext(product)

    // A. Execute Intent Analyzer
    const intentResult = await intentAnalyzerAgent.execute({
      message: incomingMessageText,
      history: historyList,
      productContext
    })

    // B. Execute Lead Scorer
    const leadScorerResult = await leadScorerAgent.execute({
      message: incomingMessageText,
      intent: intentResult.data,
      previousScore: lead.currentScore,
      customerProfile: (customer.behaviorProfile as Record<string, any>) || {},
      historySummary: conversation.summary || ''
    })

    // C. Execute Reply Generator
    const replyGeneratorResult = await replyGeneratorAgent.execute({
      message: incomingMessageText,
      intent: intentResult.data,
      leadScore: leadScorerResult.data,
      productDetails: productContext,
      history: historyList,
      customerProfile: (customer.behaviorProfile as Record<string, any>) || {}
    })

    // D. Execute Sales Coach
    const salesCoachResult = await salesCoachAgent.execute({
      message: incomingMessageText,
      intent: intentResult.data,
      leadScore: leadScorerResult.data,
      customerProfile: (customer.behaviorProfile as Record<string, any>) || {},
      historySummary: conversation.summary || ''
    })

    // E. Execute Conversation Summarizer
    // Include latest message in summary generation
    const updatedHistoryList = [...historyList, { role: 'user' as const, content: incomingMessageText }]
    const summarizerResult = await conversationSummarizerAgent.execute({
      history: updatedHistoryList
    })

    // 2. Perform DB Updates
    // Save AI Decisions (Audit log)
    const auditDecisions = [
      { agentName: intentAnalyzerAgent.name, model: intentAnalyzerAgent.model, input: { message: incomingMessageText }, output: intentResult.data, latency: intentResult.metadata.latencyMs, tokens: intentResult.metadata.tokenCount },
      { agentName: leadScorerAgent.name, model: leadScorerAgent.model, input: { message: incomingMessageText }, output: leadScorerResult.data, latency: leadScorerResult.metadata.latencyMs, tokens: leadScorerResult.metadata.tokenCount },
      { agentName: replyGeneratorAgent.name, model: replyGeneratorAgent.model, input: { message: incomingMessageText }, output: replyGeneratorResult.data, latency: replyGeneratorResult.metadata.latencyMs, tokens: replyGeneratorResult.metadata.tokenCount },
      { agentName: salesCoachAgent.name, model: salesCoachAgent.model, input: { message: incomingMessageText }, output: salesCoachResult.data, latency: salesCoachResult.metadata.latencyMs, tokens: salesCoachResult.metadata.tokenCount },
      { agentName: conversationSummarizerAgent.name, model: conversationSummarizerAgent.model, input: { message: incomingMessageText }, output: summarizerResult.data, latency: summarizerResult.metadata.latencyMs, tokens: summarizerResult.metadata.tokenCount }
    ]

    // Create a new customer message first (to link to AI decisions if needed)
    const newMsg = await prisma.message.create({
      data: {
        conversationId,
        role: 'CUSTOMER',
        content: incomingMessageText,
        aiGenerated: false,
        approved: true,
        metadata: {
          intent: intentResult.data.primary,
          confidence: intentResult.data.confidence
        }
      }
    })

    for (const decision of auditDecisions) {
      await prisma.aIDecision.create({
        data: {
          messageId: newMsg.id,
          agentName: decision.agentName,
          modelUsed: decision.model,
          input: decision.input,
          output: decision.output as any,
          latencyMs: decision.latency,
          tokenCount: decision.tokens
        }
      })
    }

    // Update Lead current details
    await prisma.lead.update({
      where: { id: lead.id },
      data: {
        currentScore: leadScorerResult.data.score,
        temperature: leadScorerResult.data.temperature,
        lastContactAt: new Date()
      }
    })

    // Log in LeadScoreHistory table
    await prisma.leadScoreHistory.create({
      data: {
        leadId: lead.id,
        temperature: leadScorerResult.data.temperature,
        score: leadScorerResult.data.score,
        reasoning: leadScorerResult.data.reasoning,
        signals: leadScorerResult.data.signals as any,
        triggeredBy: newMsg.id
      }
    })

    // Update Conversation summary and last active timestamp
    await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        summary: summarizerResult.data.summary,
        lastMessageAt: new Date(),
        messageCount: {
          increment: 1
        }
      }
    })

    // Update Customer profile traits if any new behavior detected
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        behaviorProfile: {
          ...(customer.behaviorProfile as Record<string, any>),
          inferredSentiment: summarizerResult.data.customerSentiment,
          keyTopics: summarizerResult.data.keyTopics
        }
      }
    })

    // Save suggested response (approved: false)
    await prisma.message.create({
      data: {
        conversationId,
        role: 'AI_SUGGESTED',
        content: replyGeneratorResult.data.message,
        aiGenerated: true,
        approved: false,
        metadata: {
          strategy: replyGeneratorResult.data.strategy,
          tone: replyGeneratorResult.data.tone,
          alternativeReplies: replyGeneratorResult.data.alternativeReplies,
          coaching: salesCoachResult.data
        }
      }
    })

    log.info({ conversationId }, 'Sales pipeline execution completed successfully')

    return {
      intent: intentResult.data,
      leadScore: leadScorerResult.data,
      suggestedReply: replyGeneratorResult.data,
      salesCoachNotes: salesCoachResult.data,
      conversationSummary: summarizerResult.data
    }
  } catch (error) {
    log.error({ error, conversationId }, 'Critical pipeline failure')
    return null
  }
}
