import { z } from 'zod'

export const salesCoachSchema = z.object({
  customerProfile: z.string(),
  recommendedApproach: z.string(),
  riskFactors: z.array(z.string()),
  doNot: z.array(z.string())
})

export type SalesCoachResult = z.infer<typeof salesCoachSchema>
