import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';
import { cardSchema } from '../../schema/billing.js';

export const cardExpiringSchema = baseTemplateSchema.extend({
  card: cardSchema,
  /** The renewal the expired card would otherwise miss. */
  nextChargeDate: z.iso.date(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  plan: z.string().min(1),
  updatePaymentUrl: z.url(),
});

export type CardExpiringProps = z.infer<typeof cardExpiringSchema>;
