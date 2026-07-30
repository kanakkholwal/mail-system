export interface RateLimitDecision {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export interface RateLimitStore {
  hit(key: string, windowMs: number, max: number): Promise<RateLimitDecision>;
  dispose?(): void;
}

interface Window {
  count: number;
  resetAt: number;
}

/**
 * Fixed window, process local. Swap in a Redis implementation of this interface
 * for a multi-instance deployment; nothing else in the service changes.
 */
export class MemoryRateLimitStore implements RateLimitStore {
  private readonly windows = new Map<string, Window>();
  private readonly now: () => number;
  private readonly sweeper: ReturnType<typeof setInterval> | undefined;

  constructor(options: { sweepMs?: number; now?: () => number } = {}) {
    this.now = options.now ?? Date.now;
    if (options.sweepMs !== 0) {
      this.sweeper = setInterval(() => this.sweep(), options.sweepMs ?? 60_000);
      this.sweeper.unref?.();
    }
  }

  hit(key: string, windowMs: number, max: number): Promise<RateLimitDecision> {
    const at = this.now();
    const existing = this.windows.get(key);
    const window = existing && existing.resetAt > at ? existing : { count: 0, resetAt: at + windowMs };
    window.count += 1;
    this.windows.set(key, window);

    return Promise.resolve({
      allowed: window.count <= max,
      limit: max,
      remaining: Math.max(0, max - window.count),
      resetAt: window.resetAt,
    });
  }

  dispose(): void {
    if (this.sweeper) clearInterval(this.sweeper);
    this.windows.clear();
  }

  private sweep(): void {
    const at = this.now();
    for (const [key, window] of this.windows) {
      if (window.resetAt <= at) this.windows.delete(key);
    }
  }
}
