import { openai, AIAgent, AgentResult } from '../../core/ai-client'
import { summarizerSchema, SummarizerResult } from './summarizer.schema'
import { SUMMARIZER_SYSTEM_PROMPT } from './summarizer.prompt'
import { env } from '@/lib/env'
import { createAgentLogger } from '@/lib/logger'
import { zodResponseFormat } from 'openai/helpers/zod'

const log = createAgentLogger('conversation-summarizer')

export interface SummarizerInput {
  history: { role: 'user' | 'assistant'; content: string }[]
}

export class ConversationSummarizerAgent implements AIAgent<SummarizerInput, SummarizerResult> {
  readonly name = 'conversation-summarizer'
  readonly model = env.OPENAI_MODEL_FAST

  async execute(input: SummarizerInput): Promise<AgentResult<SummarizerResult>> {
    const startTime = Date.now()
    log.info('Summarizing conversation history')

    try {
      const historyContent = input.history
        .map(h => `${h.role === 'user' ? 'Customer' : 'Seller'}: ${h.content}`)
        .join('\n')

      const response = await openai.beta.chat.completions.parse({
        model: this.model,
        messages: [
          { role: 'system', content: SUMMARIZER_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Conversation History:\n${historyContent || 'No history.'}`
          }
        ],
        response_format: zodResponseFormat(summarizerSchema, 'conversation_summarization'),
        temperature: 0.1,
      })

      const latencyMs = Date.now() - startTime
      const parsedData = response.choices[0].message.parsed

      if (!parsedData) {
        throw new Error('Failed to parse summarizer structured output response.')
      }

      const tokenCount = response.usage?.total_tokens ?? 0

      log.debug({ latencyMs, tokenCount, result: parsedData }, 'Conversation summary completed successfully')

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
      log.error({ error, input }, 'Error in ConversationSummarizerAgent')
      return {
        success: false,
        data: {
          summary: 'Conversation ongoing.',
          keyTopics: [],
          customerSentiment: 'neutral',
          nextAction: 'Respond to buyer.'
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

export const conversationSummarizerAgent = new ConversationSummarizerAgent()
