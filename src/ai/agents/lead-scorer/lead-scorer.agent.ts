import { openai, AIAgent, AgentResult } from '../../core/ai-client'
import { leadScorerSchema, LeadScoreResult } from './lead-scorer.schema'
import { LEAD_SCORER_SYSTEM_PROMPT } from './lead-scorer.prompt'
import { env } from '@/lib/env'
import { createAgentLogger } from '@/lib/logger'
import { zodResponseFormat } from 'openai/helpers/zod'
import { IntentResult } from '../intent-analyzer/intent-analyzer.schema'

const log = createAgentLogger('lead-scorer')

export interface LeadScorerInput {
  message: string
  intent: IntentResult
  previousScore: number
  customerProfile: Record<string, any>
  historySummary: string
}

export class LeadScorerAgent implements AIAgent<LeadScorerInput, LeadScoreResult> {
  readonly name = 'lead-scorer'
  readonly model = env.OPENAI_MODEL_SMART

  async execute(input: LeadScorerInput): Promise<AgentResult<LeadScoreResult>> {
    const startTime = Date.now()
    log.info({ message: 'Scoring lead activity' }, input.message)

    try {
      const response = await openai.beta.chat.completions.parse({
        model: this.model,
        messages: [
          { role: 'system', content: LEAD_SCORER_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Latest Message: "${input.message}"\nDetected Intent: ${JSON.stringify(input.intent)}\nPrevious Score: ${input.previousScore}\nCustomer Behavior/Profile: ${JSON.stringify(input.customerProfile)}\nConversation History Summary: ${input.historySummary || 'No summary available.'}`
          }
        ],
        response_format: zodResponseFormat(leadScorerSchema, 'lead_scoring'),
        temperature: 0.1,
      })

      const latencyMs = Date.now() - startTime
      const parsedData = response.choices[0].message.parsed

      if (!parsedData) {
        throw new Error('Failed to parse lead-scorer structured output response.')
      }

      const tokenCount = response.usage?.total_tokens ?? 0

      log.debug({ latencyMs, tokenCount, result: parsedData }, 'Lead scoring completed successfully')

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
      log.error({ error, input }, 'Error in LeadScorerAgent')
      return {
        success: false,
        data: {
          temperature: 'COLD',
          score: input.previousScore,
          reasoning: 'Error occurred during automated scoring pipeline calculation.',
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

export const leadScorerAgent = new LeadScorerAgent()
