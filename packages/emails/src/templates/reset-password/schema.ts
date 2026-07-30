import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const resetPasswordSchema = baseTemplateSchema.extend({
  resetUrl: z.url(),
  expiresInMinutes: z.number().int().min(1).max(1440).default(30),
  /**
   * Origin metadata for the request. Showing it cuts "was this you" support
   * tickets and gives the recipient grounds to act if it was not them.
   */
  request: z
    .object({
      device: z.string().optional(),
      location: z.string().optional(),
      ipAddress: z.string().optional(),
      requestedAt: z.iso.datetime().optional(),
    })
    .optional(),
});

export type ResetPasswordProps = z.infer<typeof resetPasswordSchema>;
