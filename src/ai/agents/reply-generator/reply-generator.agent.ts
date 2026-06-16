import { openai, AIAgent, AgentResult } from '../../core/ai-client'
import { replyGeneratorSchema, ReplyResult } from './reply-generator.schema'
import { REPLY_GENERATOR_SYSTEM_PROMPT } from './reply-generator.prompt'
import { env } from '@/lib/env'
import { createAgentLogger } from '@/lib/logger'
import { zodResponseFormat } from 'openai/helpers/zod'
import { IntentResult } from '../intent-analyzer/intent-analyzer.schema'
import { LeadScoreResult } from '../lead-scorer/lead-scorer.schema'

const log = createAgentLogger('reply-generator')

export interface ReplyGeneratorInput {
  message: string
  intent: IntentResult
  leadScore: LeadScoreResult
  productDetails: string
  history: { role: 'user' | 'assistant'; content: string }[]
  customerProfile: Record<string, any>
}

export class ReplyGeneratorAgent implements AIAgent<ReplyGeneratorInput, ReplyResult> {
  readonly name = 'reply-generator'
  readonly model = env.OPENAI_MODEL_SMART

  async execute(input: ReplyGeneratorInput): Promise<AgentResult<ReplyResult>> {
    const startTime = Date.now()
    log.info({ message: 'Generating suggested reply' }, input.message)

    try {
      const historyContent = input.history
        .map(h => `${h.role === 'user' ? 'Customer' : 'Seller'}: ${h.content}`)
        .join('\n')

      const response = await openai.beta.chat.completions.parse({
        model: this.model,
        messages: [
          { role: 'system', content: REPLY_GENERATOR_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Product Ground Truth Details:\n${input.productDetails}\n\nCustomer Profile: ${JSON.stringify(input.customerProfile)}\n\nLatest Detected Intent: ${JSON.stringify(input.intent)}\nLead Score: ${JSON.stringify(input.leadScore)}\n\nConversation History:\n${historyContent || 'No history.'}\n\nLatest Message: "${input.message}"`
          }
        ],
        response_format: zodResponseFormat(replyGeneratorSchema, 'reply_generation'),
        temperature: 0.7, // Higher temp for more natural/dynamic human-like sales conversational tone
      })

      const latencyMs = Date.now() - startTime
      const parsedData = response.choices[0].message.parsed

      if (!parsedData) {
        throw new Error('Failed to parse reply-generator structured output response.')
      }

      const tokenCount = response.usage?.total_tokens ?? 0

      log.debug({ latencyMs, tokenCount, result: parsedData }, 'Reply generation completed successfully')

      return {
        success: true,
        data: parsedData,
        metadata: {
          model: this.model,
          tokenCount,
          latencyMs,
          timestamp: new Date()
        }
      }
    } catch (error) {
      log.error({ error, input }, 'Error in ReplyGeneratorAgent')
      return {
        success: false,
        data: {
          message: 'Bhai, thora sa wait karein, main specs check kar ke batata hoon.',
          tone: 'warm_negotiator',
          strategy: 'Fallback default message due to generation error.',
          alternativeReplies: ['Bhai, please share your number, direct contact kar leta hoon.']
        },
        metadata: {
          model: this.model,
          tokenCount: 0,
          latencyMs: Date.now() - startTime,
          timestamp: new Date()
        }
      }
    }
  }
}

export const replyGeneratorAgent = new ReplyGeneratorAgent()
