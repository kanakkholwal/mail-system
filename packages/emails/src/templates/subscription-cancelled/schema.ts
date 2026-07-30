import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const subscriptionCancelledSchema = baseTemplateSchema.extend({
  plan: z.string().min(1),
  cancelledAt: z.iso.date(),
  /** Paid term already covered, so access runs to the end of it. */
  accessUntil: z.iso.date(),
  reactivateUrl: z.url(),
  exportDataUrl: z.url().optional(),
  /** Offering a reason link is honest; making cancellation hard is a dark pattern. */
  feedbackUrl: z.url().optional(),
  /** How long data is retained after access ends, in days. */
  dataRetentionDays: z.number().int().min(0).max(3650).default(30),
});

export type SubscriptionCancelledProps = z.infer<typeof subscriptionCancelledSchema>;
