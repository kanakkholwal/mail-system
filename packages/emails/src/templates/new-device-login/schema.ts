import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const newDeviceLoginSchema = baseTemplateSchema.extend({
  /** Primary action is remedial: securing the account, not acknowledging it. */
  secureAccountUrl: z.url(),
  reviewSessionsUrl: z.url().optional(),
  signIn: z.object({
    device: z.string(),
    browser: z.string().optional(),
    location: z.string().optional(),
    ipAddress: z.string().optional(),
    at: z.iso.datetime(),
  }),
  /** Shown when the sign-in was flagged as unusual rather than merely new. */
  flagged: z.boolean().default(false),
});

export type NewDeviceLoginProps = z.infer<typeof newDeviceLoginSchema>;
