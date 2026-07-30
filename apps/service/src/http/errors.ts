import { ConfigError, DeliveryError } from '@better-mailer/delivery';
import { RenderRuleError, TemplateValidationError } from '@better-mailer/emails';
import type { ContentfulStatusCode } from 'hono/utils/http-status';
import { QueueFullError } from '../concurrency.js';
import type { AppContext } from './context.js';

export type ErrorType =
  | 'bad_request'
  | 'unauthorized'
  | 'not_found'
  | 'unsupported_mode'
  | 'unsubscribe_required'
  | 'validation_error'
  | 'payload_too_large'
  | 'rate_limited'
  | 'overloaded'
  | 'delivery_failed'
  | 'misconfigured'
  | 'unavailable'
  | 'internal_error';

export interface ErrorBody {
  error: { type: ErrorType; message: string; details?: unknown };
  requestId: string;
}

export class HttpError extends Error {
  constructor(
    readonly status: ContentfulStatusCode,
    readonly type: ErrorType,
    message: string,
    readonly details?: unknown,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

interface Mapped {
  status: ContentfulStatusCode;
  type: ErrorType;
  message: string;
  details?: unknown;
  headers?: Record<string, string>;
  expected: boolean;
}

function map(error: unknown): Mapped {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      type: error.type,
      message: error.message,
      expected: error.status < 500,
      ...(error.details === undefined ? {} : { details: error.details }),
      ...(error.headers ? { headers: error.headers } : {}),
    };
  }

  if (error instanceof TemplateValidationError) {
    return {
      status: 422,
      type: 'validation_error',
      message: error.message,
      details: { template: error.key, issues: error.issues },
      expected: true,
    };
  }

  if (error instanceof RenderRuleError) {
    return {
      status: error.rule === 'unsupported_mode' ? 400 : 422,
      type: error.rule,
      message: error.message,
      details: { template: error.key },
      expected: true,
    };
  }

  if (error instanceof QueueFullError) {
    return {
      status: 503,
      type: 'overloaded',
      message: 'Too many sends in flight. Retry shortly.',
      headers: { 'retry-after': '2' },
      expected: true,
    };
  }

  if (error instanceof ConfigError) {
    return { status: 500, type: 'misconfigured', message: error.message, expected: false };
  }

  if (error instanceof DeliveryError) {
    // A retryable provider fault is the provider's outage, not the caller's bug.
    return {
      status: error.retryable ? 503 : 502,
      type: 'delivery_failed',
      message: error.message,
      details: { transport: error.transport, retryable: error.retryable },
      ...(error.retryable ? { headers: { 'retry-after': '5' } } : {}),
      expected: false,
    };
  }

  return { status: 500, type: 'internal_error', message: 'Unexpected error', expected: false };
}

export function handleError(error: unknown, c: AppContext): Response {
  const mapped = map(error);
  const requestId = c.get('requestId');
  const logger = c.get('logger');

  logger[mapped.expected ? 'warn' : 'error']('request.error', {
    type: mapped.type,
    status: mapped.status,
    message: error instanceof Error ? error.message : String(error),
    ...(mapped.expected || !(error instanceof Error) ? {} : { stack: error.stack }),
  });

  const body: ErrorBody = {
    error: {
      type: mapped.type,
      message: mapped.message,
      ...(mapped.details === undefined ? {} : { details: mapped.details }),
    },
    requestId,
  };

  for (const [name, value] of Object.entries(mapped.headers ?? {})) c.header(name, value);
  return c.json(body, mapped.status);
}
