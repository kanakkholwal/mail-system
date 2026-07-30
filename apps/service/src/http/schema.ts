import { z } from 'zod';

/** Accepts a bare address or a named one, so callers are not forced into objects. */
const address = z.union([
  z.email().transform((email) => ({ email })),
  z.object({ email: z.email(), name: z.string().min(1).max(120).optional() }),
]);

const addressList = z.union([address.transform((one) => [one]), z.array(address).min(1)]);

export const renderModeSchema = z.enum(['email', 'web', 'document']);

export const renderRequestSchema = z.object({
  template: z.string().min(1),
  mode: renderModeSchema.default('email'),
  payload: z.looseObject({}),
  subject: z.string().min(1).max(200).optional(),
  design: z.boolean().default(false),
});

const attachment = z.object({
  filename: z.string().min(1).max(200),
  contentBase64: z.string().min(1),
  contentType: z.string().min(1).max(120).optional(),
  contentId: z.string().min(1).max(120).optional(),
});

/**
 * `mode` is absent on purpose. Web and document renders carry print rules and a
 * page shell that do not belong in a MIME body, so sends are always email mode.
 */
export const sendRequestSchema = z.object({
  template: z.string().min(1),
  payload: z.looseObject({}),
  to: addressList,
  cc: addressList.optional(),
  bcc: addressList.optional(),
  from: address.optional(),
  replyTo: address.optional(),
  subject: z.string().min(1).max(200).optional(),
  headers: z.record(z.string().min(1), z.string()).optional(),
  tags: z.record(z.string().min(1), z.string()).optional(),
  attachments: z.array(attachment).max(10).optional(),
  idempotencyKey: z.string().min(8).max(200).optional(),
});

export type RenderRequest = z.infer<typeof renderRequestSchema>;
export type SendRequest = z.infer<typeof sendRequestSchema>;
export type RequestAddress = z.infer<typeof address>;
