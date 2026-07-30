import type { ReactElement } from 'react';
import {
  accentRule, AmountBlock, band, bandSplit, brandHeader, caption, cta, DataList, divider, footer,
  heading, label, LineItems, palette, small, space, StatusBadge, title, type Ctx,
} from '../../kit/index.js';
import { dateTime, money, percent } from '../../lib/format.js';
import { computeTotals, lineTotal } from '../../lib/totals.js';
import type { ItemRow, TotalRow } from '../../kit/tools/line-items.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { paymentReceiptSchema, type PaymentReceiptProps } from './schema.js';

export default defineTemplate<PaymentReceiptProps>({
  meta: {
    key: 'payment_receipt',
    name: 'Payment receipt',
    genre: 'billing',
    description: 'Receipt confirmation as an email, and the same data as a filable A4 tax record.',
    modes: ['email', 'web', 'document'],
    primaryAction: '',
    requiresUnsubscribe: false,
  },
  schema: paymentReceiptSchema,

  subject: (props) => `Receipt ${props.receiptNumber} from ${props.from.name}`.slice(0, 78),

  sample: {
    ...demoBase,
    previewText: 'Payment of 7,861.27 GBP received. Nothing further is owed on this invoice.',
    locale: { tag: 'en-GB', direction: 'ltr' },
    receiptNumber: 'RC-2026-0311',
    invoiceNumber: 'NX-2026-0148',
    paidAt: '2026-07-29T14:12:00.000Z',
    amount: 7861.27,
    currency: 'GBP',
    card: { brand: 'Visa', last4: '4417', expiry: '09/28' },
    transactionId: 'txn_3PqL8aK2mVn0R4Xe',
    from: {
      name: 'Nexonauts Ltd',
      email: 'billing@nexonauts.com',
      addressLines: ['Unit 4, Bevenden Works', '18 Bevenden Street', 'London N1 6BH', 'United Kingdom'],
      taxId: 'VAT GB 412 8830 21',
    },
    to: {
      name: 'Kestrel Health Group',
      contactName: 'Priya Raman',
      addressLines: ['Kestrel House', '92 Deansgate', 'Manchester M3 2ER', 'United Kingdom'],
      taxId: 'VAT GB 229 4417 88',
    },
    items: [
      { description: 'Balance on invoice NX-2026-0148', quantity: 1, unitPrice: 6551.06, taxable: true },
    ],
    taxRate: 0.2,
    taxLabel: 'VAT',
    invoiceUrl: 'https://pay.nexonauts.com/i/NX-2026-0148',
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const fmt = (value: number) => money(value, props.currency, locale);

    const itemRows: ItemRow[] = props.items.map((item) => ({
      description: item.description,
      ...(item.detail ? { detail: item.detail } : {}),
      quantity: item.unit ? `${item.quantity} ${item.unit}` : String(item.quantity),
      rate: fmt(item.unitPrice),
      amount: fmt(lineTotal(item)),
    }));

    const totals = computeTotals({ items: props.items, taxRate: props.taxRate });
    const totalRows: TotalRow[] = [
      { label: 'Subtotal', value: fmt(totals.subtotal) },
      ...(props.taxRate > 0
        ? [{ label: `${props.taxLabel} ${percent(props.taxRate, locale)}`, value: fmt(totals.tax) }]
        : []),
      { label: 'Paid', value: fmt(props.amount), emphasis: true },
    ];

    const method = props.card ? `${props.card.brand} ending ${props.card.last4}` : 'Bank transfer';
    const detailRows = [
      { key: 'Receipt', value: props.receiptNumber, mono: true },
      ...(props.invoiceNumber ? [{ key: 'Invoice', value: props.invoiceNumber, mono: true }] : []),
      { key: 'Paid', value: dateTime(props.paidAt, locale) },
      { key: 'Method', value: method },
      { key: 'Transaction', value: props.transactionId, mono: true },
    ];

    return ctx.mode === 'document'
      ? receiptDocument(props, { itemRows, totalRows, detailRows, fmt })
      : receiptMail(props, ctx, { detailRows, fmt, method });
  },
});

interface MailBits {
  detailRows: { key: string; value: string; mono?: boolean }[];
  fmt: (value: number) => string;
  method: string;
}

function receiptMail(props: PaymentReceiptProps, ctx: Ctx, bits: MailBits): ReactElement[] {
  return [
    brandHeader(ctx),
    accentRule(ctx),
    band(
      [
        <StatusBadge key="badge" tone="success" text="Payment received" containerPadding={`0px 0px ${space.md} 0px`} />,
        title('Thanks, that is settled', { key: 'h', gap: space.xs }),
        caption(`Receipt ${props.receiptNumber}`, { key: 'sub', gap: space.lg }),
        <AmountBlock
          key="amount"
          label="Amount paid"
          amount={bits.fmt(props.amount)}
          meta={`Charged to ${bits.method}`}
          color={palette.success}
          containerPadding={`0px 0px ${space.lg} 0px`}
        />,
        <DataList key="dl" rows={bits.detailRows} containerPadding="0px" />,
      ],
      { pt: space.xs, pb: space.lg, key: 'hero' },
    ),
    band(
      [
        divider({ gap: space.none, key: 'd' }),
        small('Keep this email as your receipt. A printable copy is available from the invoice page.', {
          key: 'k',
          gap: props.invoiceUrl ? space.md : space.none,
        }),
        ...(props.invoiceUrl
          ? [
              cta({
                ctx,
                label: 'View invoice',
                href: props.invoiceUrl,
                variant: 'secondary',
                fullWidth: true,
                gap: space.none,
                key: 'c',
              }),
            ]
          : []),
      ],
      { pt: space.none, pb: space.xxl, key: 'tail' },
    ),
    ...footer(ctx),
  ];
}

/** A receipt is a tax record, so print carries both parties and the tax split. */
function receiptDocument(
  props: PaymentReceiptProps,
  bits: { itemRows: ItemRow[]; totalRows: TotalRow[]; detailRows: MailBits['detailRows']; fmt: (v: number) => string },
): ReactElement[] {
  return [
    bandSplit(
      [
        heading(props.from.name, { key: 'fn', gap: space.xxs }),
        caption([...props.from.addressLines, props.from.taxId ?? ''].filter(Boolean).join('<br />'), {
          key: 'fa',
          gap: space.none,
        }),
      ],
      [
        label('Receipt', { key: 'rl', align: 'right', gap: space.xxs }),
        title(props.receiptNumber, { key: 'rn', align: 'right', gap: space.none }),
      ],
      { pt: space.xl, pb: space.lg, key: 'masthead' },
    ),
    band([divider({ gap: space.none, key: 'd1' })], { pt: space.none, pb: space.lg, key: 'rule' }),
    bandSplit(
      [
        label('Received from', { key: 'bl', gap: space.xs }),
        heading(props.to.name, { key: 'tn', gap: space.xxs }),
        caption(
          [props.to.contactName ?? '', ...props.to.addressLines, props.to.taxId ?? ''].filter(Boolean).join('<br />'),
          { key: 'ta', gap: space.none },
        ),
      ],
      [<DataList key="meta" rows={bits.detailRows} containerPadding="0px" />],
      { pt: space.none, pb: space.xl, key: 'parties' },
    ),
    ...(bits.itemRows.length > 0
      ? [
          band([<LineItems key="items" rows={bits.itemRows} totals={bits.totalRows} containerPadding="0px" />], {
            pt: space.none,
            pb: space.xl,
            key: 'items',
          }),
        ]
      : []),
    band(
      [
        divider({ gap: space.none, key: 'd2' }),
        caption('This receipt confirms payment in full. No further amount is due.', {
          key: 't',
          gap: space.none,
        }),
      ],
      { pt: space.none, pb: space.xl, key: 'terms' },
    ),
  ];
}
