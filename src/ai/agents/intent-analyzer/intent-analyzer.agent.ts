import { openai, AIAgent, AgentResult } from '../../core/ai-client'
import { intentAnalyzerSchema, IntentResult } from './intent-analyzer.schema'
import { INTENT_ANALYZER_SYSTEM_PROMPT } from './intent-analyzer.prompt'
import { env } from '@/lib/env'
import { createAgentLogger } from '@/lib/logger'
import { zodResponseFormat } from 'openai/helpers/zod'

const log = createAgentLogger('intent-analyzer')

export interface IntentAnalyzerInput {
  message: string
  history: { role: 'user' | 'assistant'; content: string }[]
  productContext: string
}

export class IntentAnalyzerAgent implements AIAgent<IntentAnalyzerInput, IntentResult> {
  readonly name = 'intent-analyzer'
  readonly model = env.OPENAI_MODEL_FAST

  async execute(input: IntentAnalyzerInput): Promise<AgentResult<IntentResult>> {
    const startTime = Date.now()
    log.info({ message: 'Analyzing customer intent' }, input.message)

    try {
      const historyContent = input.history
        .map(h => `${h.role === 'user' ? 'Customer' : 'Seller'}: ${h.content}`)
        .join('\n')

      const response = await openai.beta.chat.completions.parse({
        model: this.model,
        messages: [
          { role: 'system', content: INTENT_ANALYZER_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Product Details:\n${input.productContext}\n\nConversation History:\n${historyContent || 'No previous messages.'}\n\nLatest Message:\n"${input.message}"`
          }
        ],
        response_format: zodResponseFormat(intentAnalyzerSchema, 'intent_analysis'),
        temperature: 0.1,
      })

      const latencyMs = Date.now() - startTime
      const parsedData = response.choices[0].message.parsed

      if (!parsedData) {
        throw new Error('Failed to parse intent-analyzer structured output response.')
      }

      const tokenCount = response.usage?.total_tokens ?? 0

      log.debug({ latencyMs, tokenCount, result: parsedData }, 'Intent analysis completed successfully')

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
      log.error({ error, input }, 'Error in IntentAnalyzerAgent')
      return {
        success: false,
        data: {
          primary: 'UNKNOWN',
          secondary: [],
          confidence: 0,
          signals: []
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

export const intentAnalyzerAgent = new IntentAnalyzerAgent()
