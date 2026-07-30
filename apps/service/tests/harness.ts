import { DeliveryError, type OutboundMessage, type SendResult, type Transport } from '@better-mailer/delivery';
import type { Hono } from 'hono';
import { createApp } from '../src/app.js';
import { createDeps } from '../src/deps.js';
import { loadEnv } from '../src/env.js';
import type { AppEnv, Deps } from '../src/http/context.js';
import { createLogger } from '../src/logger.js';
import { MemoryRateLimitStore } from '../src/rate-limit.js';

export interface StubTransport extends Transport {
  sent: OutboundMessage[];
  fail(error: DeliveryError): void;
  hold(): () => void;
}

export function stubTransport(name = 'stub'): StubTransport {
  const sent: OutboundMessage[] = [];
  let failure: DeliveryError | undefined;
  let gate: Promise<void> | undefined;

  return {
    name,
    sent,
    fail(error) {
      failure = error;
    },
    hold() {
      let open = (): void => {};
      gate = new Promise<void>((resolve) => {
        open = resolve;
      });
      return () => {
        gate = undefined;
        open();
      };
    },
    async send(message) {
      if (gate) await gate;
      if (failure) throw failure;
      sent.push(message);
      const result: SendResult = {
        transport: name,
        messageId: `stub-${sent.length}`,
        accepted: message.to.map((address) => address.email),
        rejected: [],
        deduped: false,
      };
      return result;
    },
    verify: () => Promise.resolve(),
  };
}

const BASE_ENV = {
  NODE_ENV: 'test',
  LOG_LEVEL: 'silent',
  MAIL_FROM_EMAIL: 'hello@nexonauts.com',
  MAIL_FROM_NAME: 'Nexonauts',
} as const;

export interface Harness {
  app: Hono<AppEnv>;
  deps: Deps;
  transport: StubTransport;
  clock: { advance(ms: number): void };
}

export function harness(env: Record<string, string> = {}, transport = stubTransport()): Harness {
  let time = 1_700_000_000_000;
  const parsed = loadEnv({ ...BASE_ENV, ...env });

  const deps = createDeps(parsed, {
    transport,
    logger: createLogger('silent'),
    limiter: new MemoryRateLimitStore({ sweepMs: 0, now: () => time }),
    now: () => time,
  });

  return {
    app: createApp(deps),
    deps,
    transport,
    clock: {
      advance(ms) {
        time += ms;
      },
    },
  };
}

/** Assertions do the narrowing here, so the response shape stays loose on purpose. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function readBody<T = any>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

export function json(body: unknown, headers: Record<string, string> = {}): RequestInit {
  const payload = JSON.stringify(body);
  return {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'content-length': String(Buffer.byteLength(payload)), ...headers },
    body: payload,
  };
}
