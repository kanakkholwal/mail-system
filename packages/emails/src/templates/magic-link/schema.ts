import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const magicLinkSchema = baseTemplateSchema.extend({
  signInUrl: z.url(),
  /** Typed alternative for anyone reading mail on a different device. */
  fallbackCode: z
    .string()
    .regex(/^[0-9A-Z]{4,8}$/, 'Use 4 to 8 uppercase alphanumerics')
    .optional(),
  expiresInMinutes: z.number().int().min(1).max(60).default(15),
  request: z
    .object({
      device: z.string().optional(),
      location: z.string().optional(),
      ipAddress: z.string().optional(),
    })
    .optional(),
});

export type MagicLinkProps = z.infer<typeof magicLinkSchema>;
