import { envSchema as mailEnvSchema } from '@better-mailer/delivery';
import { z } from 'zod';

const csv = z
  .string()
  .transform((value) => value.split(',').map((part) => part.trim()).filter(Boolean))
  .pipe(z.array(z.string().min(1)));

export const serviceEnvSchema = mailEnvSchema
  .extend({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    HOST: z.string().default('0.0.0.0'),
    PORT: z.coerce.number().int().min(1).max(65535).default(8787),
    LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),

    SERVICE_API_KEYS: csv.optional(),
    /** Unset means no CORS headers, which is the right default for a keyed server-to-server API. */
    CORS_ORIGINS: csv.optional(),
    /** Only enable behind a proxy you control; a client can forge this header. */
    TRUST_PROXY: z.stringbool().default(false),

    RATE_LIMIT_MAX: z.coerce.number().int().positive().default(60),
    RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

    SEND_CONCURRENCY: z.coerce.number().int().positive().default(8),
    SEND_QUEUE_MAX: z.coerce.number().int().nonnegative().default(64),
    SEND_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
    SEND_MAX_RECIPIENTS: z.coerce.number().int().positive().default(50),

    MAX_BODY_BYTES: z.coerce.number().int().positive().default(512 * 1024),
    READY_CACHE_MS: z.coerce.number().int().nonnegative().default(15_000),
    SHUTDOWN_GRACE_MS: z.coerce.number().int().positive().default(10_000),
  })
  .check((ctx) => {
    if (ctx.value.NODE_ENV === 'production' && !ctx.value.SERVICE_API_KEYS?.length) {
      ctx.issues.push({
        code: 'custom',
        input: ctx.value.SERVICE_API_KEYS,
        path: ['SERVICE_API_KEYS'],
        message: 'is required when NODE_ENV=production. An unauthenticated send endpoint is an open relay.',
      });
    }
  });

export type ServiceEnv = z.infer<typeof serviceEnvSchema>;

export class EnvError extends Error {
  constructor(readonly issues: string[]) {
    super(`Invalid service environment.\n  ${issues.join('\n  ')}\n\nCopy .env.example to .env and fill it in.`);
    this.name = 'EnvError';
  }
}

export function loadEnv(source: Record<string, string | undefined> = process.env): ServiceEnv {
  const parsed = serviceEnvSchema.safeParse(source);
  if (parsed.success) return parsed.data;
  throw new EnvError(parsed.error.issues.map((issue) => `${issue.path.join('.') || '(root)'}: ${issue.message}`));
}
