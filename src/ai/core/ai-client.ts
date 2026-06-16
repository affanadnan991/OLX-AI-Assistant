import OpenAI from 'openai'
import { env } from '@/lib/env'
import { logger } from '@/lib/logger'

// Initialize OpenAI client using validated environment variables
export const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
  baseURL: env.OPENAI_API_BASE,
})

export interface AgentResult<T> {
  success: boolean;
  data: T;
  metadata: {
    model: string;
    tokenCount: number;
    latencyMs: number;
    timestamp: Date;
  };
}

export interface AIAgent<TInput, TOutput> {
  readonly name: string;
  readonly model: string;
  execute(input: TInput): Promise<AgentResult<TOutput>>;
}
