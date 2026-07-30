import { listTemplates } from '@better-mailer/emails';
import { Hono } from 'hono';
import type { AppEnv, Deps } from '../context.js';

interface Probe {
  ok: boolean;
  checkedAt: number;
  error?: string;
}

/** Probes run every few seconds; caching keeps a readiness check off the provider's rate limit. */
function cachedVerify(deps: Deps): () => Promise<Probe> {
  let last: Probe | undefined;
  let inFlight: Promise<Probe> | undefined;

  return async () => {
    const at = deps.now();
    if (last && at - last.checkedAt < deps.env.READY_CACHE_MS) return last;
    if (inFlight) return inFlight;

    inFlight = deps.mailer
      .verify()
      .then((): Probe => ({ ok: true, checkedAt: deps.now() }))
      .catch((error: unknown): Probe => ({
        ok: false,
        checkedAt: deps.now(),
        error: error instanceof Error ? error.message : String(error),
      }))
      .then((probe) => {
        last = probe;
        inFlight = undefined;
        return probe;
      });

    return inFlight;
  };
}

export function healthRoutes(deps: Deps): Hono<AppEnv> {
  const routes = new Hono<AppEnv>();
  const startedAt = deps.now();
  const verify = cachedVerify(deps);

  routes.get('/healthz', (c) =>
    c.json({ status: 'ok', uptimeMs: deps.now() - startedAt, version: process.env.npm_package_version ?? null }),
  );

  routes.get('/readyz', async (c) => {
    if (deps.lifecycle.isDraining) {
      return c.json({ status: 'draining', inFlight: deps.lifecycle.active }, 503);
    }

    const probe = await verify();
    return c.json(
      {
        status: probe.ok ? 'ready' : 'degraded',
        transport: deps.mailer.transportName,
        templates: listTemplates().length,
        sends: { inUse: deps.sends.inUse, queued: deps.sends.depth },
        checks: { transport: probe.ok ? 'ok' : 'fail', ...(probe.error ? { transportError: probe.error } : {}) },
      },
      probe.ok ? 200 : 503,
    );
  });

  return routes;
}
