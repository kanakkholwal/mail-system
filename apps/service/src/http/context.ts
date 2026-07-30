import type { Mailer } from '@better-mailer/delivery';
import type { Context } from 'hono';
import type { Semaphore } from '../concurrency.js';
import type { ServiceEnv } from '../env.js';
import type { Lifecycle } from '../lifecycle.js';
import type { Logger } from '../logger.js';
import type { RateLimitStore } from '../rate-limit.js';

export interface Deps {
  env: ServiceEnv;
  mailer: Mailer;
  logger: Logger;
  lifecycle: Lifecycle;
  limiter: RateLimitStore;
  sends: Semaphore;
  now: () => number;
}

export interface AppEnv {
  Variables: {
    requestId: string;
    logger: Logger;
    /** Set once the bearer token matched, so the rate limiter can key on the caller. */
    principal: string | undefined;
  };
}

export type AppContext = Context<AppEnv>;
