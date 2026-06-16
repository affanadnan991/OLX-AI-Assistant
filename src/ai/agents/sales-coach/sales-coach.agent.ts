import { openai, AIAgent, AgentResult } from '../../core/ai-client'
import { salesCoachSchema, SalesCoachResult } from './sales-coach.schema'
import { SALES_COACH_SYSTEM_PROMPT } from './sales-coach.prompt'
import { env } from '@/lib/env'
import { createAgentLogger } from '@/lib/logger'
import { zodResponseFormat } from 'openai/helpers/zod'
import { IntentResult } from '../intent-analyzer/intent-analyzer.schema'
import { LeadScoreResult } from '../lead-scorer/lead-scorer.schema'

const log = createAgentLogger('sales-coach')

export interface SalesCoachInput {
  message: string
  intent: IntentResult
  leadScore: LeadScoreResult
  customerProfile: Record<string, any>
  historySummary: string
}

export class SalesCoachAgent implements AIAgent<SalesCoachInput, SalesCoachResult> {
  readonly name = 'sales-coach'
  readonly model = env.OPENAI_MODEL_SMART

  async execute(input: SalesCoachInput): Promise<AgentResult<SalesCoachResult>> {
    const startTime = Date.now()
    log.info({ message: 'Generating sales coaching advice' }, input.message)

    try {
      const response = await openai.beta.chat.completions.parse({
        model: this.model,
        messages: [
          { role: 'system', content: SALES_COACH_SYSTEM_PROMPT },
          {
            role: 'user',
            content: `Latest Message: "${input.message}"\nDetected Intent: ${JSON.stringify(input.intent)}\nLead Score Details: ${JSON.stringify(input.leadScore)}\nCustomer Profile: ${JSON.stringify(input.customerProfile)}\nHistory Summary: ${input.historySummary || 'No summary available.'}`
          }
        ],
        response_format: zodResponseFormat(salesCoachSchema, 'sales_coaching'),
        temperature: 0.1,
      })

      const latencyMs = Date.now() - startTime
      const parsedData = response.choices[0].message.parsed

      if (!parsedData) {
        throw new Error('Failed to parse sales-coach structured output response.')
      }

      const tokenCount = response.usage?.total_tokens ?? 0

      log.debug({ latencyMs, tokenCount, result: parsedData }, 'Sales coaching advice generated successfully')

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
      log.error({ error, input }, 'Error in SalesCoachAgent')
      return {
        success: false,
        data: {
          customerProfile: 'Unknown Profile',
          recommendedApproach: 'Be polite, highlight the phone condition, and check availability.',
          riskFactors: ['Information incomplete'],
          doNot: ['Do not compromise on price without verifying buyer intent']
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

export const salesCoachAgent = new SalesCoachAgent()
