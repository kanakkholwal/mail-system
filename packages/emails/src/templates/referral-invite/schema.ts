import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const referralInviteSchema = baseTemplateSchema.extend({
  referralUrl: z.url(),
  referralCode: z.string().min(3).max(24),
  /** Stated in the recipient's own terms, not as a vague "get rewards". */
  rewardForYou: z.string().min(1),
  rewardForFriend: z.string().min(1),
  /** Progress toward a capped programme, shown honestly when there is a cap. */
  progress: z
    .object({ referred: z.number().int().nonnegative(), cap: z.number().int().positive() })
    .optional(),
  termsUrl: z.url().optional(),
});

export type ReferralInviteProps = z.infer<typeof referralInviteSchema>;
