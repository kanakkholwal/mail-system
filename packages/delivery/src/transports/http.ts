import { DeliveryError, isRetryableStatus, isTransientNetworkError } from '../errors.js';

export interface HttpCallOptions {
  transport: string;
  url: string;
  headers: Record<string, string>;
  body: unknown;
  signal?: AbortSignal | undefined;
  method?: 'POST' | 'PUT';
}

/**
 * Shared JSON POST for the REST providers. Kept dependency-free so these
 * transports run unchanged on Workers, Deno and Bun as well as Node.
 */
export async function postJson(options: HttpCallOptions): Promise<{ status: number; body: unknown }> {
  const { transport, url, headers, body, signal, method = 'POST' } = options;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers: { 'content-type': 'application/json', accept: 'application/json', ...headers },
      body: JSON.stringify(body),
      ...(signal ? { signal } : {}),
    });
  } catch (error) {
    throw new DeliveryError(`${transport}: request failed`, {
      transport,
      // A connection that never landed is safe to replay.
      retryable: isTransientNetworkError(error) || (error as Error)?.name === 'TimeoutError',
      cause: error,
    });
  }

  const raw = await response.text();
  const parsed = raw.length > 0 ? safeJson(raw) : undefined;

  if (!response.ok) {
    throw new DeliveryError(`${transport}: ${response.status} ${describe(parsed) ?? response.statusText}`, {
      transport,
      retryable: isRetryableStatus(response.status),
      statusCode: response.status,
      detail: parsed ?? raw,
    });
  }

  return { status: response.status, body: parsed };
}

function safeJson(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    return raw;
  }
}

function describe(body: unknown): string | undefined {
  if (typeof body === 'string') return body;
  if (body === null || typeof body !== 'object') return undefined;
  const record = body as Record<string, unknown>;
  for (const field of ['message', 'Message', 'error', 'errors', 'detail']) {
    const value = record[field];
    if (typeof value === 'string') return value;
  }
  return undefined;
}

export function requireEnv(transport: string, name: string, value: string | undefined): string {
  if (!value || value.trim().length === 0) {
    throw new DeliveryError(`${transport}: missing required config "${name}"`, { transport, retryable: false });
  }
  return value;
}
