import { z } from 'zod'

const envSchema = z.object({
  // Database
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DIRECT_URL: z.string().optional(),

  // OpenAI / AI Provider
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  OPENAI_API_BASE: z.string().optional().default('https://api.openai.com/v1'),
  OPENAI_MODEL_FAST: z.string().optional().default('gpt-4o-mini'),
  OPENAI_MODEL_SMART: z.string().optional().default('gpt-4o'),

  // App
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  NEXT_PUBLIC_APP_URL: z.string().optional().default('http://localhost:3000'),

  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
})

type Env = z.infer<typeof envSchema>

function validateEnv(): Env {
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    console.error('❌ Invalid environment variables:')
    console.error(parsed.error.flatten().fieldErrors)
    throw new Error('Invalid environment configuration. Check your .env.local file.')
  }
  return parsed.data
}

export const env = validateEnv()
