import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';
import { cardSchema, lineItemSchema, partySchema } from '../../schema/billing.js';

export const paymentReceiptSchema = baseTemplateSchema.extend({
  receiptNumber: z.string().min(1),
  invoiceNumber: z.string().optional(),
  paidAt: z.iso.datetime(),
  amount: z.number().positive(),
  currency: z.string().length(3),
  card: cardSchema.optional(),
  transactionId: z.string().min(1),
  /** Both parties are required on the document, which is a tax record. */
  from: partySchema,
  to: partySchema,
  items: z.array(lineItemSchema).default([]),
  taxRate: z.number().min(0).max(1).default(0),
  taxLabel: z.string().default('Tax'),
  invoiceUrl: z.url().optional(),
});

export type PaymentReceiptProps = z.infer<typeof paymentReceiptSchema>;
