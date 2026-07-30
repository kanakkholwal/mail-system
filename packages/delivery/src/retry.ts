import { DeliveryError } from './errors.js';

export interface RetryPolicy {
  /** Total attempts including the first. 1 disables retrying. */
  attempts: number;
  baseDelayMs: number;
  maxDelayMs: number;
  /** Randomises delay to stop retries from synchronising into a thundering herd. */
  jitter: boolean;
}

export const defaultRetryPolicy: RetryPolicy = {
  attempts: 4,
  baseDelayMs: 250,
  maxDelayMs: 8_000,
  jitter: true,
};

export interface RetryContext {
  attempt: number;
  delayMs: number;
  error: unknown;
}

/** Full jitter: uniform in [0, exponential]. Beats equal jitter under contention. */
export function backoffDelay(attempt: number, policy: RetryPolicy, random: () => number = Math.random): number {
  const exponential = Math.min(policy.baseDelayMs * 2 ** (attempt - 1), policy.maxDelayMs);
  return policy.jitter ? Math.round(random() * exponential) : exponential;
}

function retryable(error: unknown): boolean {
  return error instanceof DeliveryError ? error.retryable : false;
}

export interface RetryOptions {
  policy?: Partial<RetryPolicy>;
  onRetry?: (context: RetryContext) => void;
  signal?: AbortSignal;
  sleep?: (ms: number, signal?: AbortSignal) => Promise<void>;
}

function defaultSleep(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException('Aborted', 'AbortError'));
      return;
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason ?? new DOMException('Aborted', 'AbortError'));
    };
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

export async function withRetry<T>(operation: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const policy = { ...defaultRetryPolicy, ...options.policy };
  const sleep = options.sleep ?? defaultSleep;
  let lastError: unknown;

  for (let attempt = 1; attempt <= policy.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isLast = attempt === policy.attempts;
      if (isLast || !retryable(error)) throw error;

      const delayMs = backoffDelay(attempt, policy);
      options.onRetry?.({ attempt, delayMs, error });
      await sleep(delayMs, options.signal);
    }
  }

  throw lastError;
}
