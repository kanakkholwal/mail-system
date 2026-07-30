import { describe, expect, it } from 'vitest';
import { QueueFullError, Semaphore } from '../src/concurrency.js';
import { Lifecycle } from '../src/lifecycle.js';
import { createLogger } from '../src/logger.js';
import { MemoryRateLimitStore } from '../src/rate-limit.js';

describe('lifecycle', () => {
  it('resolves immediately when nothing is in flight', async () => {
    await expect(new Lifecycle().waitForIdle(50)).resolves.toBe(true);
  });

  it('waits for in-flight work to finish before reporting idle', async () => {
    const lifecycle = new Lifecycle();
    lifecycle.enter();
    lifecycle.enter();

    const idle = lifecycle.waitForIdle(1000);
    lifecycle.exit();
    expect(lifecycle.active).toBe(1);
    lifecycle.exit();

    await expect(idle).resolves.toBe(true);
  });

  it('gives up after the grace period and reports the work it abandoned', async () => {
    const lifecycle = new Lifecycle();
    lifecycle.enter();
    await expect(lifecycle.waitForIdle(20)).resolves.toBe(false);
    expect(lifecycle.active).toBe(1);
  });

  it('flips to draining once and stays there', () => {
    const lifecycle = new Lifecycle();
    expect(lifecycle.isDraining).toBe(false);
    lifecycle.beginDrain();
    lifecycle.beginDrain();
    expect(lifecycle.isDraining).toBe(true);
  });
});

describe('semaphore', () => {
  it('runs up to the limit and hands the slot to the next waiter', async () => {
    const semaphore = new Semaphore(2, 4);
    const first = await semaphore.acquire();
    const second = await semaphore.acquire();
    expect(semaphore.inUse).toBe(2);

    const third = semaphore.acquire();
    expect(semaphore.depth).toBe(1);

    first();
    await expect(third).resolves.toBeTypeOf('function');
    expect(semaphore.inUse).toBe(2);

    second();
    (await third)();
    expect(semaphore.inUse).toBe(0);
  });

  it('rejects past the queue bound instead of growing without limit', async () => {
    const semaphore = new Semaphore(1, 1);
    await semaphore.acquire();
    void semaphore.acquire();
    await expect(semaphore.acquire()).rejects.toBeInstanceOf(QueueFullError);
  });

  it('ignores a double release so a slot cannot be handed out twice', async () => {
    const semaphore = new Semaphore(1, 0);
    const release = await semaphore.acquire();
    release();
    release();
    expect(semaphore.inUse).toBe(0);
  });
});

describe('rate limit store', () => {
  it('counts within a window and resets after it', async () => {
    let time = 0;
    const store = new MemoryRateLimitStore({ sweepMs: 0, now: () => time });

    expect(await store.hit('a', 1000, 2)).toMatchObject({ allowed: true, remaining: 1 });
    expect(await store.hit('a', 1000, 2)).toMatchObject({ allowed: true, remaining: 0 });
    expect(await store.hit('a', 1000, 2)).toMatchObject({ allowed: false, remaining: 0 });

    expect(await store.hit('b', 1000, 2)).toMatchObject({ allowed: true });

    time = 1001;
    expect(await store.hit('a', 1000, 2)).toMatchObject({ allowed: true, remaining: 1 });
  });
});

describe('logger', () => {
  it('emits one JSON object per line and honours the level', () => {
    const lines: string[] = [];
    const logger = createLogger('warn', (line) => lines.push(line));
    logger.info('ignored');
    logger.warn('kept', { status: 429 });

    expect(lines).toHaveLength(1);
    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed).toMatchObject({ level: 'warn', event: 'kept', status: 429 });
    expect(typeof parsed.time).toBe('string');
  });

  it('redacts credential-shaped fields and carries child context', () => {
    const lines: string[] = [];
    createLogger('info', (line) => lines.push(line))
      .child({ requestId: 'r1' })
      .error('boom', { authorization: 'Bearer secret', apiKey: 'k', safe: 'visible' });

    const parsed = JSON.parse(lines[0] ?? '{}');
    expect(parsed.requestId).toBe('r1');
    expect(parsed.authorization).toBe('[redacted]');
    expect(parsed.apiKey).toBe('[redacted]');
    expect(parsed.safe).toBe('visible');
  });
});
