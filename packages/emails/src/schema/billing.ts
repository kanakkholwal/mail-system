import { z } from 'zod';

export const partySchema = z.object({
  name: z.string().min(1),
  contactName: z.string().optional(),
  email: z.email().optional(),
  addressLines: z.array(z.string()).max(6).default([]),
  /** Printed verbatim, so include the scheme name (for example "VAT GB ..."). */
  taxId: z.string().optional(),
});

export const lineItemSchema = z.object({
  description: z.string().min(1),
  /** Second line under the description: dates worked, scope, SKU. */
  detail: z.string().optional(),
  quantity: z.number().positive(),
  unit: z.string().optional(),
  unitPrice: z.number(),
  /** Excluded from the tax base when false, for disbursements rebilled at cost. */
  taxable: z.boolean().default(true),
});

export const paymentMethodSchema = z.object({
  label: z.string().min(1),
  fields: z.array(z.object({ key: z.string(), value: z.string() })).min(1),
});

export const cardSchema = z.object({
  brand: z.string().min(1),
  last4: z.string().regex(/^[0-9]{4}$/),
  expiry: z.string().regex(/^(0[1-9]|1[0-2])\/[0-9]{2}$/, 'Use MM/YY').optional(),
});

export const moneyContextSchema = z.object({
  /** ISO 4217. Drives Intl currency formatting and the symbol shown. */
  currency: z.string().length(3),
});

export type Party = z.infer<typeof partySchema>;
export type LineItem = z.infer<typeof lineItemSchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type Card = z.infer<typeof cardSchema>;
