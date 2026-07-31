import type { ReactElement } from 'react';
import {
  accentRule, band, bandSplit, brandHeader, caption, cta, DataList, divider, footer, heading, label,
  ledgerMasthead, ledgerSection, LineItems, lede, small, space, StatusBadge, title, type Ctx,
} from '../../kit/index.js';
import { date, dateTime, money, percent } from '../../lib/format.js';
import { computeTotals, lineTotal } from '../../lib/totals.js';
import type { ItemRow, TotalRow } from '../../kit/tools/line-items.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { orderConfirmedSchema, type OrderConfirmedProps } from './schema.js';

export default defineTemplate<OrderConfirmedProps>({
  meta: {
    key: 'order_confirmed',
    name: 'Order confirmed',
    genre: 'commerce',
    description: 'Order confirmation as an email, and the same order as a printable packing slip.',
    modes: ['email', 'web', 'document'],
    primaryAction: 'Track your order',
    requiresUnsubscribe: false,
  },
  schema: orderConfirmedSchema,

  subject: (props) => `Order ${props.orderNumber} confirmed`,

  sample: {
    ...demoBase,
    recipientName: 'Priya',
    previewText: 'Arriving between 4 and 6 August. Nothing else needed from you.',
    locale: { tag: 'en-GB', direction: 'ltr' },
    orderNumber: 'NX-88213',
    placedAt: '2026-07-30T10:02:00.000Z',
    currency: 'GBP',
    items: [
      { description: 'Field Notes, ruled, 3-pack', quantity: 2, unitPrice: 11.5, taxable: true },
      { description: 'Sakura Pigma Micron 05, black', detail: 'Box of 12', quantity: 1, unitPrice: 22, taxable: true },
      { description: 'A5 hardcover sketchbook, 180gsm', quantity: 1, unitPrice: 18.75, taxable: true },
    ],
    shippingCost: 4.95,
    taxRate: 0.2,
    taxLabel: 'VAT',
    discount: { label: 'Returning customer', amount: 5 },
    merchant: {
      name: 'Nexonauts Supply',
      addressLines: ['Unit 4, Bevenden Works', 'London N1 6BH', 'United Kingdom'],
      taxId: 'VAT GB 412 8830 21',
    },
    shipTo: {
      name: 'Priya Raman',
      addressLines: ['Kestrel House', '92 Deansgate', 'Manchester M3 2ER', 'United Kingdom'],
    },
    deliveryEstimate: { earliest: '2026-08-04', latest: '2026-08-06' },
    orderUrl: 'https://nexonauts.com/orders/NX-88213',
    supportNote: 'Changes are possible until the order is packed, usually within a few hours.',
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const fmt = (value: number) => money(value, props.currency, locale);

    const itemRows: ItemRow[] = props.items.map((item) => ({
      description: item.description,
      ...(item.detail ? { detail: item.detail } : {}),
      quantity: String(item.quantity),
      rate: fmt(item.unitPrice),
      amount: fmt(lineTotal(item)),
    }));

    const base = computeTotals({
      items: props.items,
      taxRate: props.taxRate,
      ...(props.discount ? { discount: props.discount.amount } : {}),
    });
    const grandTotal = base.total + props.shippingCost;

    const totalRows: TotalRow[] = [
      { label: 'Subtotal', value: fmt(base.subtotal) },
      ...(props.discount ? [{ label: props.discount.label, value: fmt(base.discount), credit: true }] : []),
      ...(props.shippingCost > 0 ? [{ label: 'Shipping', value: fmt(props.shippingCost) }] : []),
      ...(props.taxRate > 0
        ? [{ label: `${props.taxLabel} ${percent(props.taxRate, locale)}`, value: fmt(base.tax) }]
        : []),
      { label: 'Total', value: fmt(grandTotal), emphasis: true },
    ];

    const window = `${date(props.deliveryEstimate.earliest, locale)} to ${date(props.deliveryEstimate.latest, locale)}`;

    return ctx.mode === 'document'
      ? packingSlip(props, { itemRows, totalRows, window })
      : confirmationMail(props, ctx, { itemRows, totalRows, window });
  },
});

interface Bits {
  itemRows: ItemRow[];
  totalRows: TotalRow[];
  window: string;
}

function confirmationMail(props: OrderConfirmedProps, ctx: Ctx, bits: Bits): ReactElement[] {
  const locale = props.locale.tag;
  const greeting = props.recipientName ? `Thanks, ${props.recipientName}.` : 'Thanks.';

  return [
    ...ledgerMasthead(ctx, { docType: 'Order', docNumber: props.orderNumber }),
    band(
      [
        <StatusBadge key="badge" tone="success" text="Confirmed" containerPadding={`0px 0px ${space.md} 0px`} />,
        title(`${greeting} Your order is in`, { key: 'h' }),
        // The delivery window is the one fact the recipient actually wants.
        lede(`Arriving between <strong>${bits.window}</strong>. Nothing else is needed from you.`, { key: 'l' }),
        <DataList
          key="dl"
          rows={[
            { key: 'Placed', value: dateTime(props.placedAt, locale) },
            { key: 'Delivering to', value: props.shipTo.name },
          ]}
          containerPadding={`0px 0px ${space.lg} 0px`}
        />,
        cta({ ctx, label: 'Track your order', href: props.orderUrl, fullWidth: true, gap: space.none, key: 'c' }),
      ],
      { pt: space.lg, pb: space.xl, key: 'hero' },
    ),
    band(
      [
        ...ledgerSection('Your order'),
        <LineItems key="items" rows={bits.itemRows} totals={bits.totalRows} containerPadding="0px" />,
      ],
      { pt: space.none, pb: space.lg, key: 'items' },
    ),
    band(
      [
        divider({ gap: space.none, key: 'sd' }),
        label('Shipping to', { key: 'sl', gap: space.xs }),
        caption([props.shipTo.name, ...props.shipTo.addressLines].join('<br />'), {
          key: 'sa',
          gap: props.supportNote ? space.md : space.none,
        }),
        ...(props.supportNote ? [small(props.supportNote, { key: 'sn', gap: space.none })] : []),
      ],
      { pt: space.none, pb: space.xxl, key: 'shipping' },
    ),
    ...footer(ctx),
  ];
}

/** Print is a packing slip: no buttons, no marketing, both addresses. */
function packingSlip(props: OrderConfirmedProps, bits: Bits): ReactElement[] {
  const locale = props.locale.tag;
  return [
    bandSplit(
      [
        heading(props.merchant.name, { key: 'mn', gap: space.xxs }),
        caption([...props.merchant.addressLines, props.merchant.taxId ?? ''].filter(Boolean).join('<br />'), {
          key: 'ma',
          gap: space.none,
        }),
      ],
      [
        label('Packing slip', { key: 'pl', align: 'right', gap: space.xxs }),
        title(props.orderNumber, { key: 'pn', align: 'right', gap: space.none }),
      ],
      { pt: space.xl, pb: space.lg, key: 'masthead' },
    ),
    band([divider({ gap: space.none, key: 'd1' })], { pt: space.none, pb: space.lg, key: 'rule' }),
    bandSplit(
      [
        label('Ship to', { key: 'sl', gap: space.xs }),
        heading(props.shipTo.name, { key: 'sn', gap: space.xxs }),
        caption(props.shipTo.addressLines.join('<br />'), { key: 'sa', gap: space.none }),
      ],
      [
        <DataList
          key="meta"
          rows={[
            { key: 'Order', value: props.orderNumber, mono: true },
            { key: 'Placed', value: date(props.placedAt.slice(0, 10), locale) },
            { key: 'Delivery window', value: bits.window },
            { key: 'Items', value: String(props.items.reduce((sum, item) => sum + item.quantity, 0)), mono: true },
          ]}
          containerPadding="0px"
        />,
      ],
      { pt: space.none, pb: space.xl, key: 'parties' },
    ),
    band([<LineItems key="items" rows={bits.itemRows} totals={bits.totalRows} containerPadding="0px" />], {
      pt: space.none,
      pb: space.xl,
      key: 'items',
    }),
    band(
      [
        divider({ gap: space.none, key: 'd2' }),
        caption('Keep this slip with the parcel if you need to return anything.', { key: 't', gap: space.none }),
      ],
      { pt: space.none, pb: space.xl, key: 'terms' },
    ),
  ];
}
