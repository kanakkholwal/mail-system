import type { LineItem } from '../schema/billing.js';
import { round2 } from './format.js';

export interface Totals {
  subtotal: number;
  discount: number;
  taxBase: number;
  tax: number;
  total: number;
  paid: number;
  balance: number;
}

export interface TotalsInput {
  items: LineItem[];
  taxRate: number;
  discount?: number;
  amountPaid?: number;
}

export function lineTotal(item: LineItem): number {
  return round2(item.quantity * item.unitPrice);
}

/**
 * A flat discount is apportioned across the taxable share of the subtotal, so
 * discounting an invoice that mixes taxable work with zero-rated disbursements
 * cannot reduce the tax base by more than its taxable portion.
 */
export function computeTotals(input: TotalsInput): Totals {
  const subtotal = round2(input.items.reduce((sum, item) => sum + lineTotal(item), 0));
  const taxableSubtotal = round2(
    input.items.filter((item) => item.taxable).reduce((sum, item) => sum + lineTotal(item), 0),
  );

  const discount = round2(Math.min(Math.max(input.discount ?? 0, 0), subtotal));
  const taxableShare = subtotal === 0 ? 0 : taxableSubtotal / subtotal;
  const taxBase = round2(Math.max(taxableSubtotal - discount * taxableShare, 0));
  const tax = round2(taxBase * input.taxRate);

  const total = round2(subtotal - discount + tax);
  const paid = round2(Math.min(Math.max(input.amountPaid ?? 0, 0), total));

  return { subtotal, discount, taxBase, tax, total, paid, balance: round2(total - paid) };
}
