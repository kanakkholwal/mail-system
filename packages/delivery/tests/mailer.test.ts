import { describe, expect, it, vi } from 'vitest';
import { createMailer } from '../src/mailer.js';
import { DeliveryError } from '../src/errors.js';
import { MemoryIdempotencyStore } from '../src/idempotency.js';
import { consoleTransport } from '../src/transports/console.js';
import type { OutboundMessage, SendResult, Transport } from '../src/types.js';

const message = (overrides: Partial<OutboundMessage> = {}): OutboundMessage => ({
  from: { email: 'noreply@nexonauts.com', name: 'Nexonauts' },
  to: [{ email: 'priya@example.com' }],
  subject: 'Reset your password',
  html: '<p>hello</p>',
  text: 'hello',
  ...overrides,
});

function flakyTransport(failures: number, retryable = true): Transport & { calls: number } {
  let calls = 0;
  return {
    name: 'flaky',
    get calls() {
      return calls;
    },
    async send(): Promise<SendResult> {
      calls += 1;
      if (calls <= failures) {
        throw new DeliveryError('boom', { transport: 'flaky', retryable });
      }
      return { transport: 'flaky', messageId: `id-${calls}`, accepted: [], rejected: [], deduped: false };
    },
  };
}

const noSleep = { policy: { baseDelayMs: 0, maxDelayMs: 0, jitter: false } };

describe('retry', () => {
  it('replays a retryable failure until it succeeds', async () => {
    const transport = flakyTransport(2);
    const mailer = createMailer({ transport, retry: noSleep.policy });
    const result = await mailer.send(message());
    expect(result.messageId).toBe('id-3');
    expect(transport.calls).toBe(3);
  });

  it('gives up immediately on a permanent failure', async () => {
    const transport = flakyTransport(1, false);
    const mailer = createMailer({ transport, retry: noSleep.policy });
    await expect(mailer.send(message())).rejects.toThrow(/boom/);
    expect(transport.calls).toBe(1);
  });

  it('stops after the configured attempt count', async () => {
    const transport = flakyTransport(99);
    const mailer = createMailer({ transport, retry: { ...noSleep.policy, attempts: 3 } });
    await expect(mailer.send(message())).rejects.toThrow(/boom/);
    expect(transport.calls).toBe(3);
  });

  it('reports each retry to the logger', async () => {
    const logger = vi.fn();
    const mailer = createMailer({ transport: flakyTransport(1), retry: noSleep.policy, logger });
    await mailer.send(message());
    const events = logger.mock.calls.map(([event]) => event.event);
    expect(events).toContain('send.retry');
    expect(events).toContain('send.ok');
  });
});

describe('idempotency', () => {
  it('delivers once for a repeated key and flags the replay', async () => {
    const transport = flakyTransport(0);
    const store = new MemoryIdempotencyStore();
    const mailer = createMailer({ transport, retry: noSleep.policy, idempotency: { store } });

    const first = await mailer.send(message({ idempotencyKey: 'invoice-1042' }));
    const second = await mailer.send(message({ idempotencyKey: 'invoice-1042' }));

    expect(first.deduped).toBe(false);
    expect(second.deduped).toBe(true);
    expect(second.messageId).toBe(first.messageId);
    expect(transport.calls).toBe(1);
  });

  it('treats distinct keys as distinct sends', async () => {
    const transport = flakyTransport(0);
    const mailer = createMailer({ transport, retry: noSleep.policy });
    await mailer.send(message({ idempotencyKey: 'a' }));
    await mailer.send(message({ idempotencyKey: 'b' }));
    expect(transport.calls).toBe(2);
  });

  it('frees the key after a permanent failure so a fixed payload can reuse it', async () => {
    const store = new MemoryIdempotencyStore();
    const failing = flakyTransport(1, false);
    const mailer = createMailer({ transport: failing, retry: noSleep.policy, idempotency: { store } });

    await expect(mailer.send(message({ idempotencyKey: 'k' }))).rejects.toThrow();
    expect(await store.get('k')).toBeUndefined();

    const ok = await mailer.send(message({ idempotencyKey: 'k' }));
    expect(ok.deduped).toBe(false);
  });

  it('expires entries once the ttl passes', async () => {
    let clock = 1_000;
    const store = new MemoryIdempotencyStore(() => clock);
    await store.set('k', { transport: 't', messageId: 'm', accepted: [], rejected: [], deduped: false }, 500);
    expect(await store.get('k')).toBeDefined();
    clock += 501;
    expect(await store.get('k')).toBeUndefined();
  });
});

describe('validation', () => {
  it('refuses a message with no recipients', async () => {
    const mailer = createMailer({ transport: consoleTransport({ quiet: true }) });
    await expect(mailer.send(message({ to: [] }))).rejects.toThrow(/No recipients/);
  });
});

describe('console transport', () => {
  it('captures sends instead of delivering them', async () => {
    const transport = consoleTransport({ quiet: true });
    const mailer = createMailer({ transport });
    await mailer.send(message({ subject: 'Local only' }));
    expect(transport.sent).toHaveLength(1);
    expect(transport.sent[0]?.subject).toBe('Local only');
  });
});
