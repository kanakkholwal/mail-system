import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';
import { lineItemSchema, partySchema } from '../../schema/billing.js';

export const orderConfirmedSchema = baseTemplateSchema.extend({
  orderNumber: z.string().min(1),
  placedAt: z.iso.datetime(),
  currency: z.string().length(3),
  items: z.array(lineItemSchema).min(1),
  shippingCost: z.number().nonnegative().default(0),
  taxRate: z.number().min(0).max(1).default(0),
  taxLabel: z.string().default('Tax'),
  discount: z.object({ label: z.string(), amount: z.number().nonnegative() }).optional(),
  merchant: partySchema,
  shipTo: partySchema,
  /** A range reads as more honest than a single date and cuts "where is it" mail. */
  deliveryEstimate: z.object({ earliest: z.iso.date(), latest: z.iso.date() }),
  orderUrl: z.url(),
  supportNote: z.string().optional(),
});

export type OrderConfirmedProps = z.infer<typeof orderConfirmedSchema>;
