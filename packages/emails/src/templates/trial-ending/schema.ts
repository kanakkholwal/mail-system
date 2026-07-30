import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const trialEndingSchema = baseTemplateSchema.extend({
  plan: z.string().min(1),
  trialEndsOn: z.iso.date(),
  daysLeft: z.number().int().min(0).max(60),
  priceAfter: z.number().nonnegative(),
  currency: z.string().length(3),
  interval: z.enum(['month', 'year']).default('month'),
  upgradeUrl: z.url(),
  /**
   * What the account has actually accumulated. Concrete usage converts far
   * better than a feature list, because it makes the loss specific.
   */
  usage: z.array(z.object({ label: z.string(), value: z.string() })).max(4).default([]),
  /** Capabilities withdrawn when the trial lapses. */
  losesAccessTo: z.array(z.string()).max(4).default([]),
});

export type TrialEndingProps = z.infer<typeof trialEndingSchema>;
