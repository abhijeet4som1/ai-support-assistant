import { z } from 'zod';

const bool = z
  .string()
  .optional()
  .transform((v) => v === 'true' || v === '1');

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  LOG_PRETTY: bool,

  DATABASE_URL: z.string().min(1),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters'),
  ACCESS_TOKEN_TTL_MINUTES: z.coerce.number().positive().default(15),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().positive().default(7),
  SEED_USERS: z.string().default('agent1:agent1pass,agent2:agent2pass'),

  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),
  GEMINI_CHAT_MODEL: z.string().default('gemini-3.8-flash'),
  /**
   * Thinking level of the chat model. Thinking tokens are billed as output and count against
   * maxOutputTokens; "medium" matched the previous model on quality at similar latency, "high"
   * cost ~8x and took a minute per answer (docs/evaluation-report.md §7.1).
   */
  GEMINI_THINKING_LEVEL: z.enum(['minimal', 'low', 'medium', 'high']).default('medium'),
  GEMINI_EMBEDDING_MODEL: z.string().default('gemini-embedding-2'),
  GEMINI_EMBEDDING_DIMENSIONS: z.coerce.number().int().positive().default(768),
  /** Context window of the chat model, used to report how much of it each call consumes. */
  GEMINI_CONTEXT_WINDOW_TOKENS: z.coerce.number().int().positive().default(1_048_576),
  /** Per-request timeout for every Gemini call (chat, summary, embeddings); a hung call fails the turn instead of holding the request. */
  GEMINI_TIMEOUT_MS: z.coerce.number().int().positive().default(60_000),
  /** Upper bound (estimated tokens) for an assembled prompt; older history is dropped beyond it. */
  CHAT_PROMPT_TOKEN_BUDGET: z.coerce.number().int().positive().default(120_000),

  /** Optional Langfuse tracing; enabled when both keys are present. */
  LANGFUSE_PUBLIC_KEY: z.string().optional(),
  LANGFUSE_SECRET_KEY: z.string().optional(),
  LANGFUSE_BASE_URL: z.string().url().default('https://cloud.langfuse.com'),

  RAG_TOP_K: z.coerce.number().int().positive().default(4),
  RAG_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.55),
  RAG_CORRECTIONS_TOP_K: z.coerce.number().int().min(0).default(3),
  RAG_CORRECTIONS_MIN_SCORE: z.coerce.number().min(0).max(1).default(0.65),
  CHAT_HISTORY_WINDOW: z.coerce.number().int().positive().default(12),

  MAX_UPLOAD_MB: z.coerce.number().positive().default(10),
});

export type Config = z.infer<typeof schema>;

/** Parse and validate process.env once. Fails fast with a readable list of problems. */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = schema.safeParse(env);
  if (!result.success) {
    const lines = result.error.issues.map(
      (i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`,
    );
    throw new Error(`Invalid environment configuration:\n${lines.join('\n')}`);
  }
  return result.data;
}
