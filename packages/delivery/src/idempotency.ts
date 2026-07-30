import type { SendResult } from './types.js';

export interface IdempotencyStore {
  get(key: string): Promise<SendResult | undefined>;
  set(key: string, result: SendResult, ttlMs: number): Promise<void>;
  /**
   * Claims a key before the send runs. False means another attempt already
   * holds it, so the caller must not deliver again.
   */
  claim(key: string, ttlMs: number): Promise<boolean>;
  release(key: string): Promise<void>;
}

interface Entry {
  expiresAt: number;
  result?: SendResult;
}

/**
 * Default store. Per-process only, so a multi-instance deployment should swap in
 * Redis or Postgres to make deduplication actually hold across replicas.
 */
export class MemoryIdempotencyStore implements IdempotencyStore {
  private readonly entries = new Map<string, Entry>();

  constructor(private readonly now: () => number = Date.now) {}

  async get(key: string): Promise<SendResult | undefined> {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt <= this.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.result;
  }

  async claim(key: string, ttlMs: number): Promise<boolean> {
    this.sweep();
    const existing = this.entries.get(key);
    if (existing && existing.expiresAt > this.now()) return false;
    this.entries.set(key, { expiresAt: this.now() + ttlMs });
    return true;
  }

  async set(key: string, result: SendResult, ttlMs: number): Promise<void> {
    this.entries.set(key, { expiresAt: this.now() + ttlMs, result });
  }

  async release(key: string): Promise<void> {
    this.entries.delete(key);
  }

  get size(): number {
    this.sweep();
    return this.entries.size;
  }

  private sweep(): void {
    const cutoff = this.now();
    for (const [key, entry] of this.entries) {
      if (entry.expiresAt <= cutoff) this.entries.delete(key);
    }
  }
}
