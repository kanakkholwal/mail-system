import { serve } from '@hono/node-server';
import { createApp } from './app.js';
import { createDeps } from './deps.js';
import { EnvError, loadEnv, type ServiceEnv } from './env.js';

function readEnv(): ServiceEnv {
  try {
    return loadEnv();
  } catch (error) {
    if (!(error instanceof EnvError)) throw error;
    console.error(error.message);
    process.exit(78); // EX_CONFIG
  }
}

function boot(): void {
  const env = readEnv();
  const deps = createDeps(env);
  const { logger, lifecycle } = deps;
  const server = serve({ fetch: createApp(deps).fetch, hostname: env.HOST, port: env.PORT });

  logger.info('service.listening', {
    host: env.HOST,
    port: env.PORT,
    transport: deps.mailer.transportName,
    authenticated: (env.SERVICE_API_KEYS?.length ?? 0) > 0,
  });

  if (!env.SERVICE_API_KEYS?.length) {
    logger.warn('service.unauthenticated', {
      hint: 'Set SERVICE_API_KEYS before exposing this port. Required when NODE_ENV=production.',
    });
  }

  let shuttingDown = false;
  const shutdown = async (signal: string): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;

    lifecycle.beginDrain();
    logger.info('service.draining', { signal, inFlight: lifecycle.active });

    const idle = await lifecycle.waitForIdle(env.SHUTDOWN_GRACE_MS);
    deps.limiter.dispose?.();
    server.close(() => {
      logger.info('service.stopped', { signal, drained: idle, abandoned: idle ? 0 : lifecycle.active });
      process.exit(idle ? 0 : 1);
    });
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error('process.unhandledRejection', { message: reason instanceof Error ? reason.message : String(reason) });
  });

  process.on('uncaughtException', (error) => {
    logger.error('process.uncaughtException', { message: error.message, stack: error.stack });
    process.exit(1);
  });
}

boot();
