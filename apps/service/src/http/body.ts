import type { z } from 'zod';
import type { AppContext } from './context.js';
import { HttpError } from './errors.js';

export async function readJson<T>(c: AppContext, schema: z.ZodType<T>): Promise<T> {
  if (!c.req.header('content-type')?.includes('application/json')) {
    throw new HttpError(415, 'bad_request', 'Send Content-Type: application/json.');
  }

  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    throw new HttpError(400, 'bad_request', 'Request body is not valid JSON.');
  }

  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, 'bad_request', 'Request body failed validation.', {
      issues: parsed.error.issues.map((issue) => ({ path: issue.path, message: issue.message })),
    });
  }
  return parsed.data;
}
