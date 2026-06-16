import { z } from 'zod'

export const summarizerSchema = z.object({
  summary: z.string(),
  keyTopics: z.array(z.string()),
  customerSentiment: z.string(),
  nextAction: z.string()
})

export type SummarizerResult = z.infer<typeof summarizerSchema>
