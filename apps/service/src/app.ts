import { Hono } from 'hono';
import { bodyLimit } from 'hono/body-limit';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import type { AppEnv, Deps } from './http/context.js';
import { handleError, HttpError } from './http/errors.js';
import { bearerAuth, rateLimit, requestContext } from './http/middleware.js';
import { healthRoutes } from './http/routes/health.js';
import { messageRoutes } from './http/routes/messages.js';
import { templateRoutes } from './http/routes/templates.js';

const ROUTES = [
  'GET /healthz',
  'GET /readyz',
  'GET /v1/templates',
  'GET /v1/templates/:key',
  'GET /v1/templates/:key/preview?mode=',
  'GET /v1/templates/:key/text?mode=',
  'GET /v1/templates/:key/design?mode=',
  'POST /v1/render',
  'POST /v1/send',
] as const;

export function createApp(deps: Deps): Hono<AppEnv> {
  const app = new Hono<AppEnv>();

  app.onError((error, c) => handleError(error, c));
  app.notFound((c) => handleError(new HttpError(404, 'not_found', `No route for ${c.req.method} ${c.req.path}.`), c));

  app.use('*', requestContext(deps));
  app.use('*', secureHeaders());
  if (deps.env.CORS_ORIGINS?.length) {
    app.use('/v1/*', cors({ origin: deps.env.CORS_ORIGINS, allowHeaders: ['content-type', 'authorization', 'idempotency-key'] }));
  }

  app.route('/', healthRoutes(deps));

  const v1 = new Hono<AppEnv>();
  v1.use('*', bearerAuth(deps));
  v1.use('*', rateLimit(deps));
  v1.use(
    '*',
    bodyLimit({
      maxSize: deps.env.MAX_BODY_BYTES,
      onError: () => {
        throw new HttpError(413, 'payload_too_large', `Request body exceeds ${deps.env.MAX_BODY_BYTES} bytes.`);
      },
    }),
  );
  v1.route('/templates', templateRoutes(deps));
  v1.route('/', messageRoutes(deps));

  app.route('/v1', v1);

  app.get('/', (c) =>
    c.json({
      service: '@better-mailer/service',
      transport: deps.mailer.transportName,
      authenticated: (deps.env.SERVICE_API_KEYS?.length ?? 0) > 0,
      routes: ROUTES,
    }),
  );

  return app;
}
