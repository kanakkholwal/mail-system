import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';
import { lineItemSchema, partySchema, paymentMethodSchema } from '../../schema/billing.js';

export const invoiceIssuedSchema = baseTemplateSchema.extend({
  number: z.string().min(1),
  status: z.enum(['due', 'paid', 'overdue']).default('due'),
  issueDate: z.iso.date(),
  dueDate: z.iso.date(),
  currency: z.string().length(3),
  from: partySchema,
  to: partySchema,
  items: z.array(lineItemSchema).min(1),
  /** Fractional. 0.2 renders as "VAT 20%". */
  taxRate: z.number().min(0).max(1).default(0),
  taxLabel: z.string().default('Tax'),
  discount: z.object({ label: z.string(), amount: z.number().nonnegative() }).optional(),
  /** Already settled, such as a deposit. The balance is the remainder. */
  amountPaid: z.number().nonnegative().optional(),
  purchaseOrder: z.string().optional(),
  projectName: z.string().optional(),
  payUrl: z.url(),
  paymentMethods: z.array(paymentMethodSchema).max(3).default([]),
  notes: z.string().optional(),
  terms: z.string().min(1),
  lateFeeNote: z.string().optional(),
});

export type InvoiceIssuedProps = z.infer<typeof invoiceIssuedSchema>;
