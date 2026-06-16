import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { intentAnalyzerAgent } from '@/ai/agents/intent-analyzer/intent-analyzer.agent'
import { leadScorerAgent } from '@/ai/agents/lead-scorer/lead-scorer.agent'
import { replyGeneratorAgent } from '@/ai/agents/reply-generator/reply-generator.agent'
import { salesCoachAgent } from '@/ai/agents/sales-coach/sales-coach.agent'
import { ProductKnowledgeEngine } from '@/ai/agents/product-knowledge/product-knowledge.agent'
import { z } from 'zod'

const analyzeRequestSchema = z.object({
  conversationId: z.string(),
  message: z.string().min(1),
  productId: z.string()
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = analyzeRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 })
    }

    const { conversationId, message, productId } = parsed.data

    const [product, conversation] = await Promise.all([
      prisma.product.findUnique({ where: { id: productId } }),
      prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          customer: true,
          lead: true,
          messages: {
            orderBy: { createdAt: 'asc' },
            take: 10
          }
        }
      })
    ])

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    const historyList = conversation
      ? conversation.messages.map(msg => ({
          role: msg.role === 'CUSTOMER' ? 'user' as const : 'assistant' as const,
          content: msg.content
        }))
      : []

    const customerProfile = conversation?.customer?.behaviorProfile as Record<string, any> || {}
    const previousScore = conversation?.lead?.currentScore || 0
    const historySummary = conversation?.summary || ''

    const productContext = ProductKnowledgeEngine.formatProductContext(product)

    // Execute core agents
    const intentResult = await intentAnalyzerAgent.execute({
      message,
      history: historyList,
      productContext
    })

    const leadScorerResult = await leadScorerAgent.execute({
      message,
      intent: intentResult.data,
      previousScore,
      customerProfile,
      historySummary
    })

    const replyGeneratorResult = await replyGeneratorAgent.execute({
      message,
      intent: intentResult.data,
      leadScore: leadScorerResult.data,
      productDetails: productContext,
      history: historyList,
      customerProfile
    })

    const salesCoachResult = await salesCoachAgent.execute({
      message,
      intent: intentResult.data,
      leadScore: leadScorerResult.data,
      customerProfile,
      historySummary
    })

    return NextResponse.json({
      intent: intentResult.data,
      leadScore: leadScorerResult.data,
      suggestedReply: replyGeneratorResult.data,
      salesCoachNotes: salesCoachResult.data
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Manual AI analysis pipeline execution failed' }, { status: 500 })
  }
}
