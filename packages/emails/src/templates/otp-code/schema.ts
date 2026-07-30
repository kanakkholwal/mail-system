import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const otpCodeSchema = baseTemplateSchema.extend({
  code: z.string().regex(/^[0-9]{4,8}$/, 'Use 4 to 8 digits'),
  expiresInMinutes: z.number().int().min(1).max(30).default(10),
  /** What the code authorises. Naming it prevents relay-style phishing. */
  purpose: z.enum(['sign_in', 'confirm_payment', 'change_email', 'delete_account']).default('sign_in'),
});

export type OtpCodeProps = z.infer<typeof otpCodeSchema>;
