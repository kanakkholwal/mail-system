import { createHash, randomUUID, timingSafeEqual } from 'node:crypto';
import type { MiddlewareHandler } from 'hono';
import type { AppContext, AppEnv, Deps } from './context.js';
import { HttpError } from './errors.js';

const SAFE_REQUEST_ID = /^[\w.:-]{8,128}$/;

export function requestContext(deps: Deps): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const inbound = c.req.header('x-request-id');
    const requestId = inbound && SAFE_REQUEST_ID.test(inbound) ? inbound : randomUUID();
    c.set('requestId', requestId);
    c.set('principal', undefined);
    c.set('logger', deps.logger.child({ requestId }));
    c.header('x-request-id', requestId);

    deps.lifecycle.enter();
    const startedAt = deps.now();
    try {
      await next();
    } finally {
      deps.lifecycle.exit();
      const durationMs = deps.now() - startedAt;
      const probe = c.req.path === '/healthz' || c.req.path === '/readyz';
      const log = c.get('logger');
      log[probe ? 'debug' : 'info']('request', {
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        durationMs,
        ...(c.get('principal') ? { principal: c.get('principal') } : {}),
      });
    }
  };
}

function digest(value: string): Buffer {
  return createHash('sha256').update(value).digest();
}

/** Hashing first gives both sides a fixed length, which timingSafeEqual requires. */
function matches(presented: string, keys: readonly string[]): string | undefined {
  const offered = digest(presented);
  let found: string | undefined;
  for (const key of keys) {
    if (timingSafeEqual(offered, digest(key))) found = key;
  }
  return found;
}

export function bearerAuth(deps: Deps): MiddlewareHandler<AppEnv> {
  const keys = deps.env.SERVICE_API_KEYS ?? [];

  return async (c, next) => {
    if (keys.length === 0) return next();

    const header = c.req.header('authorization') ?? '';
    const [scheme, token] = header.split(' ');
    if (scheme?.toLowerCase() !== 'bearer' || !token) {
      c.header('www-authenticate', 'Bearer realm="better-mailer"');
      throw new HttpError(401, 'unauthorized', 'Send an Authorization: Bearer <api key> header.');
    }

    const key = matches(token, keys);
    if (!key) throw new HttpError(401, 'unauthorized', 'The API key was not recognised.');

    c.set('principal', `key_${digest(key).toString('hex').slice(0, 8)}`);
    return next();
  };
}

function clientKey(c: AppContext, trustProxy: boolean): string {
  const principal = c.get('principal');
  if (principal) return principal;
  if (trustProxy) {
    const forwarded = c.req.header('x-forwarded-for')?.split(',')[0]?.trim();
    if (forwarded) return `ip_${forwarded}`;
  }
  return 'ip_unknown';
}

export function rateLimit(deps: Deps): MiddlewareHandler<AppEnv> {
  const { RATE_LIMIT_MAX: max, RATE_LIMIT_WINDOW_MS: windowMs } = deps.env;

  return async (c, next) => {
    const decision = await deps.limiter.hit(clientKey(c, deps.env.TRUST_PROXY), windowMs, max);
    const resetSeconds = Math.max(0, Math.ceil((decision.resetAt - deps.now()) / 1000));

    c.header('ratelimit-limit', String(decision.limit));
    c.header('ratelimit-remaining', String(decision.remaining));
    c.header('ratelimit-reset', String(resetSeconds));

    if (!decision.allowed) {
      throw new HttpError(429, 'rate_limited', `Rate limit of ${max} requests per window exceeded.`, undefined, {
        'retry-after': String(Math.max(1, resetSeconds)),
      });
    }
    return next();
  };
}
