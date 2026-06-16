import { z } from 'zod'
import { INTENT_TAXONOMY } from '@/config/intent-taxonomy'

export const intentAnalyzerSchema = z.object({
  primary: z.enum(INTENT_TAXONOMY),
  secondary: z.array(z.enum(INTENT_TAXONOMY)),
  confidence: z.number().min(0).max(1),
  signals: z.array(z.string()),
})

export type IntentResult = z.infer<typeof intentAnalyzerSchema>
