import { DeliveryError } from './errors.js';
import { MemoryIdempotencyStore, type IdempotencyStore } from './idempotency.js';
import { defaultRetryPolicy, withRetry, type RetryPolicy } from './retry.js';
import { recipientEmails, type OutboundMessage, type SendResult, type Transport } from './types.js';

export interface LogEvent {
  level: 'info' | 'warn' | 'error';
  event: string;
  transport: string;
  recipients: number;
  attempt?: number;
  delayMs?: number;
  durationMs?: number;
  messageId?: string;
  idempotencyKey?: string;
  error?: string;
}

export type Logger = (event: LogEvent) => void;

export interface MailerOptions {
  transport: Transport;
  retry?: Partial<RetryPolicy>;
  idempotency?: { store?: IdempotencyStore; ttlMs?: number };
  logger?: Logger;
  /** Aborts a single send attempt. Applies per attempt, not to the whole retry chain. */
  timeoutMs?: number;
  now?: () => number;
}

const DEFAULT_TTL_MS = 24 * 60 * 60 * 1000;

export class Mailer {
  private readonly transport: Transport;
  private readonly retry: RetryPolicy;
  private readonly store: IdempotencyStore;
  private readonly ttlMs: number;
  private readonly logger: Logger | undefined;
  private readonly timeoutMs: number | undefined;
  private readonly now: () => number;

  constructor(options: MailerOptions) {
    this.transport = options.transport;
    this.retry = { ...defaultRetryPolicy, ...options.retry };
    this.store = options.idempotency?.store ?? new MemoryIdempotencyStore();
    this.ttlMs = options.idempotency?.ttlMs ?? DEFAULT_TTL_MS;
    this.logger = options.logger;
    this.timeoutMs = options.timeoutMs;
    this.now = options.now ?? Date.now;
  }

  get transportName(): string {
    return this.transport.name;
  }

  async verify(): Promise<void> {
    await this.transport.verify?.();
  }

  async send(message: OutboundMessage): Promise<SendResult> {
    const recipients = recipientEmails(message).length;
    if (recipients === 0) {
      throw new DeliveryError('No recipients', { transport: this.transport.name, retryable: false });
    }

    const key = message.idempotencyKey;
    if (key) {
      const replay = await this.replay(key, recipients);
      if (replay) return replay;
    }

    const startedAt = this.now();
    try {
      const result = await withRetry(() => this.attempt(message), {
        policy: this.retry,
        onRetry: ({ attempt, delayMs, error }) => {
          this.log({
            level: 'warn',
            event: 'send.retry',
            transport: this.transport.name,
            recipients,
            attempt,
            delayMs,
            error: error instanceof Error ? error.message : String(error),
            ...(key ? { idempotencyKey: key } : {}),
          });
        },
      });

      if (key) await this.store.set(key, result, this.ttlMs);
      this.log({
        level: 'info',
        event: 'send.ok',
        transport: this.transport.name,
        recipients,
        durationMs: this.now() - startedAt,
        messageId: result.messageId,
        ...(key ? { idempotencyKey: key } : {}),
      });
      return result;
    } catch (error) {
      // Releasing lets a corrected payload reuse the key instead of being stuck.
      if (key) await this.store.release(key);
      this.log({
        level: 'error',
        event: 'send.failed',
        transport: this.transport.name,
        recipients,
        durationMs: this.now() - startedAt,
        error: error instanceof Error ? error.message : String(error),
        ...(key ? { idempotencyKey: key } : {}),
      });
      throw error;
    }
  }

  private async attempt(message: OutboundMessage): Promise<SendResult> {
    if (this.timeoutMs === undefined) return this.transport.send(message);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException('Send timed out', 'TimeoutError')), this.timeoutMs);
    try {
      return await this.transport.send(message, controller.signal);
    } finally {
      clearTimeout(timer);
    }
  }

  /** Returns a stored result, or waits out a concurrent send holding the key. */
  private async replay(key: string, recipients: number): Promise<SendResult | undefined> {
    const cached = await this.store.get(key);
    if (cached) {
      this.log({
        level: 'info',
        event: 'send.deduped',
        transport: this.transport.name,
        recipients,
        idempotencyKey: key,
        messageId: cached.messageId,
      });
      return { ...cached, deduped: true };
    }

    if (await this.store.claim(key, this.ttlMs)) return undefined;

    for (let poll = 0; poll < 20; poll += 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      const settled = await this.store.get(key);
      if (settled) return { ...settled, deduped: true };
    }

    throw new DeliveryError('A send with this idempotency key is still in flight', {
      transport: this.transport.name,
      retryable: true,
    });
  }

  private log(event: LogEvent): void {
    this.logger?.(event);
  }
}

export function createMailer(options: MailerOptions): Mailer {
  return new Mailer(options);
}
