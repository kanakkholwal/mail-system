export class DeliveryError extends Error {
  readonly transport: string;
  readonly retryable: boolean;
  readonly statusCode: number | undefined;
  readonly detail: unknown;

  constructor(
    message: string,
    options: { transport: string; retryable: boolean; statusCode?: number; detail?: unknown; cause?: unknown },
  ) {
    super(message, options.cause === undefined ? undefined : { cause: options.cause });
    this.name = 'DeliveryError';
    this.transport = options.transport;
    this.retryable = options.retryable;
    this.statusCode = options.statusCode;
    this.detail = options.detail;
  }
}

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigError';
  }
}

/**
 * Retrying a 4xx just burns quota and can trip abuse limits, so only transport
 * faults, timeouts, 429 and 5xx are replayed. 408 and 425 are timing faults.
 */
export function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

/** SMTP replies in the 4yz range are transient by RFC 5321; 5yz are permanent. */
export function isRetryableSmtpCode(code: unknown): boolean {
  const numeric = typeof code === 'number' ? code : Number.parseInt(String(code ?? ''), 10);
  return Number.isFinite(numeric) && numeric >= 400 && numeric < 500;
}

const TRANSIENT_SYSCALLS = new Set([
  'ECONNRESET',
  'ECONNREFUSED',
  'ETIMEDOUT',
  'EPIPE',
  'EAI_AGAIN',
  'ENOTFOUND',
  'ESOCKETTIMEDOUT',
]);

export function isTransientNetworkError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'TimeoutError') return true;
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === 'string' && TRANSIENT_SYSCALLS.has(code);
}
