import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';
import { cardSchema } from '../../schema/billing.js';

export const paymentFailedSchema = baseTemplateSchema.extend({
  amount: z.number().positive(),
  currency: z.string().length(3),
  plan: z.string().min(1),
  card: cardSchema.optional(),
  /** Verbatim decline reason from the processor, translated for a human. */
  declineReason: z
    .enum(['insufficient_funds', 'expired_card', 'card_declined', 'authentication_required', 'unknown'])
    .default('card_declined'),
  updatePaymentUrl: z.url(),
  retry: z
    .object({
      attempt: z.number().int().min(1),
      of: z.number().int().min(1),
      nextAttempt: z.iso.date(),
    })
    .optional(),
  /** When access is withdrawn if payment keeps failing. Drives the urgency. */
  gracePeriodEnds: z.iso.date().optional(),
});

export type PaymentFailedProps = z.infer<typeof paymentFailedSchema>;
