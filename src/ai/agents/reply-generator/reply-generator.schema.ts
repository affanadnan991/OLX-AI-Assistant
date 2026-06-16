import { z } from 'zod'

export const replyGeneratorSchema = z.object({
  message: z.string(),
  tone: z.string(),
  strategy: z.string(),
  alternativeReplies: z.array(z.string())
})

export type ReplyResult = z.infer<typeof replyGeneratorSchema>
