import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const usageLimitSchema = baseTemplateSchema
  .extend({
    metricLabel: z.string().min(1),
    used: z.number().nonnegative(),
    limit: z.number().positive(),
    /** Unit shown next to the figures, such as "builds" or "GB". */
    unit: z.string().default(''),
    resetsOn: z.iso.date(),
    plan: z.string().min(1),
    upgradeUrl: z.url(),
    /** What happens at 100%: throttled, blocked, or billed for overage. */
    atLimit: z.enum(['throttled', 'blocked', 'overage']).default('blocked'),
    overageRate: z.string().optional(),
  })
  .refine((value) => value.atLimit !== 'overage' || Boolean(value.overageRate), {
    message: 'overageRate is required when atLimit is "overage"',
    path: ['overageRate'],
  });

export type UsageLimitProps = z.infer<typeof usageLimitSchema>;
