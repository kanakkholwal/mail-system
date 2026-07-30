import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const abandonedCartSchema = baseTemplateSchema.extend({
  currency: z.string().length(3),
  items: z
    .array(
      z.object({
        description: z.string().min(1),
        detail: z.string().optional(),
        quantity: z.number().int().positive(),
        unitPrice: z.number().nonnegative(),
        imageUrl: z.url().optional(),
        /** Scarcity is only shown when it is a real stock figure. */
        stockLeft: z.number().int().positive().optional(),
      }),
    )
    .min(1)
    .max(4),
  checkoutUrl: z.url(),
  /** Genuine reservation window, or omitted. Never a fabricated countdown. */
  reservedUntil: z.iso.datetime().optional(),
  incentive: z.object({ code: z.string().min(3), description: z.string().min(1) }).optional(),
});

export type AbandonedCartProps = z.infer<typeof abandonedCartSchema>;
