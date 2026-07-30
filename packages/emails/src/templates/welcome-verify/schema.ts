import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const welcomeVerifySchema = baseTemplateSchema.extend({
  verifyUrl: z.url(),
  /** Shown alongside the button for anyone who cannot click through. */
  verifyCode: z
    .string()
    .regex(/^[0-9A-Z]{4,8}$/, 'Use 4 to 8 uppercase alphanumerics')
    .optional(),
  expiresInHours: z.number().int().min(1).max(168).default(24),
  /** Two or three concrete first steps. More than three reads as a wall. */
  nextSteps: z.array(z.object({ title: z.string(), body: z.string() })).max(3).default([]),
});

export type WelcomeVerifyProps = z.infer<typeof welcomeVerifySchema>;
