import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const passwordChangedSchema = baseTemplateSchema.extend({
  changedAt: z.iso.datetime(),
  /** Remedial action, shown as the primary because the benign case needs none. */
  secureAccountUrl: z.url(),
  device: z.string().optional(),
  location: z.string().optional(),
  /** True when the change also revoked every other session. */
  sessionsRevoked: z.boolean().default(true),
});

export type PasswordChangedProps = z.infer<typeof passwordChangedSchema>;
