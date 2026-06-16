import { z } from 'zod'

export const leadScorerSchema = z.object({
  temperature: z.enum(['HOT', 'WARM', 'COLD', 'SPAM']),
  score: z.number().min(0).max(100),
  reasoning: z.string(),
  signals: z.array(
    z.object({
      signal: z.string(),
      weight: z.number(),
      evidence: z.string()
    })
  )
})

export type LeadScoreResult = z.infer<typeof leadScorerSchema>
