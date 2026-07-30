import { createMailer, transportFromEnv, type Transport } from '@better-mailer/delivery';
import { Semaphore } from './concurrency.js';
import type { ServiceEnv } from './env.js';
import type { Deps } from './http/context.js';
import { Lifecycle } from './lifecycle.js';
import { createLogger, type Logger } from './logger.js';
import { MemoryRateLimitStore, type RateLimitStore } from './rate-limit.js';

export interface DepsOverrides {
  transport?: Transport;
  logger?: Logger;
  limiter?: RateLimitStore;
  now?: () => number;
}

export function createDeps(env: ServiceEnv, overrides: DepsOverrides = {}): Deps {
  const logger = overrides.logger ?? createLogger(env.LOG_LEVEL);
  const transport = overrides.transport ?? transportFromEnv(env);

  return {
    env,
    logger,
    now: overrides.now ?? Date.now,
    lifecycle: new Lifecycle(),
    limiter: overrides.limiter ?? new MemoryRateLimitStore(),
    sends: new Semaphore(env.SEND_CONCURRENCY, env.SEND_QUEUE_MAX),
    mailer: createMailer({
      transport,
      timeoutMs: env.SEND_TIMEOUT_MS,
      logger: (event) => logger[event.level](event.event, { ...event }),
    }),
  };
}
