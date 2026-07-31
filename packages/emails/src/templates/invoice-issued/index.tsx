import type { ReactElement } from 'react';
import {
  accentRule, band, bandSplit, brandHeader, caption, cta, DataList, divider, fallbackLink,
  footer, heading, label, ledgerAmount, ledgerMasthead, ledgerSection, LineItems, palette, small, space,
  StatusBadge, text, title, type Ctx,
} from '../../kit/index.js';
import { date, daysUntil, money, percent } from '../../lib/format.js';
import { computeTotals, lineTotal } from '../../lib/totals.js';
import type { ItemRow, TotalRow } from '../../kit/tools/line-items.js';
import type { Party } from '../../schema/billing.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { invoiceIssuedSchema, type InvoiceIssuedProps } from './schema.js';

const TONE = { due: 'warning', paid: 'success', overdue: 'danger' } as const;
const STATUS_TEXT = { due: 'Awaiting payment', paid: 'Paid in full', overdue: 'Overdue' } as const;

export default defineTemplate<InvoiceIssuedProps>({
  meta: {
    key: 'invoice_issued',
    name: 'Invoice issued',
    genre: 'billing',
    description:
      'One invoice as three artifacts: the email notification, the hosted payment page, and the print-ready A4 document.',
    modes: ['email', 'web', 'document'],
    primaryAction: 'Pay invoice',
    requiresUnsubscribe: false,
  },
  schema: invoiceIssuedSchema,

  subject: (props) =>
    `Invoice ${props.number} from ${props.from.name} is ready`.slice(0, 78),

  sample: {
    ...demoBase,
    previewText: 'Balance due 7,861.27 GBP by 14 August. Pay by card or bank transfer.',
    number: 'NX-2026-0148',
    status: 'due',
    issueDate: '2026-07-24',
    dueDate: '2026-08-14',
    currency: 'GBP',
    locale: { tag: 'en-GB', direction: 'ltr' },
    projectName: 'Kestrel Patient Portal, Phase 2',
    purchaseOrder: 'KH-PO-4471',
    from: {
      name: 'Nexonauts Ltd',
      contactName: 'Ama Boateng',
      email: 'billing@nexonauts.com',
      addressLines: ['Unit 4, Bevenden Works', '18 Bevenden Street', 'London N1 6BH', 'United Kingdom'],
      taxId: 'VAT GB 412 8830 21',
    },
    to: {
      name: 'Kestrel Health Group',
      contactName: 'Priya Raman',
      email: 'accounts@kestrelhealth.co.uk',
      addressLines: ['Kestrel House', '92 Deansgate', 'Manchester M3 2ER', 'United Kingdom'],
      taxId: 'VAT GB 229 4417 88',
    },
    items: [
      {
        description: 'Product design retainer',
        detail: '1 to 31 July 2026, discovery, UI design, weekly reviews',
        quantity: 1,
        unit: 'month',
        unitPrice: 4800,
        taxable: true,
      },
      {
        description: 'Design system audit',
        detail: 'Component inventory, token remap, accessibility pass',
        quantity: 14,
        unit: 'hrs',
        unitPrice: 145,
        taxable: true,
      },
      {
        description: 'Moderated usability sessions',
        detail: '5 participants, recruitment, moderation, findings deck',
        quantity: 5,
        unit: 'sessions',
        unitPrice: 320,
        taxable: true,
      },
      {
        description: 'Figma seats rebilled at cost',
        detail: 'Disbursement, outside the scope of VAT',
        quantity: 3,
        unit: 'seats',
        unitPrice: 15,
        taxable: false,
      },
    ],
    taxRate: 0.2,
    taxLabel: 'VAT',
    discount: { label: 'Retainer renewal credit', amount: 250 },
    amountPaid: 2000,
    payUrl: 'https://pay.nexonauts.com/i/NX-2026-0148',
    paymentMethods: [
      {
        label: 'Bank transfer (GBP)',
        fields: [
          { key: 'Account name', value: 'Nexonauts Ltd' },
          { key: 'Sort code', value: '04-29-09' },
          { key: 'Account number', value: '18820447' },
          { key: 'Reference', value: 'NX-2026-0148' },
        ],
      },
      {
        label: 'International (SWIFT)',
        fields: [
          { key: 'IBAN', value: 'GB29 REVO 0429 0918 8204 47' },
          { key: 'BIC', value: 'REVOGB21' },
        ],
      },
    ],
    notes:
      'Phase 3 kickoff is held for the week of 24 August. Tell me if the PO reference needs splitting across cost centres and I will reissue.',
    terms: 'Net 21 days from the date of issue.',
    lateFeeNote:
      'Statutory interest of 8% above the Bank of England base rate may apply to sums unpaid after the due date, under the Late Payment of Commercial Debts (Interest) Act 1998.',
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const fmt = (value: number) => money(value, props.currency, locale);
    const totals = computeTotals({
      items: props.items,
      taxRate: props.taxRate,
      ...(props.discount ? { discount: props.discount.amount } : {}),
      ...(props.amountPaid === undefined ? {} : { amountPaid: props.amountPaid }),
    });

    const itemRows: ItemRow[] = props.items.map((item) => ({
      description: item.description,
      ...(item.detail ? { detail: item.detail } : {}),
      quantity: item.unit ? `${item.quantity} ${item.unit}` : String(item.quantity),
      rate: fmt(item.unitPrice),
      amount: fmt(lineTotal(item)),
    }));

    const partial = totals.paid > 0;
    const totalRows: TotalRow[] = [
      { label: 'Subtotal', value: fmt(totals.subtotal) },
      ...(props.discount ? [{ label: props.discount.label, value: fmt(totals.discount), credit: true }] : []),
      ...(props.taxRate > 0
        ? [{ label: `${props.taxLabel} ${percent(props.taxRate, locale)}`, value: fmt(totals.tax) }]
        : []),
      { label: 'Total', value: fmt(totals.total), emphasis: !partial },
      ...(partial
        ? [
            { label: 'Deposit received', value: fmt(totals.paid), credit: true },
            { label: 'Balance due', value: fmt(totals.balance), emphasis: true },
          ]
        : []),
    ];

    const netDays = daysUntil(props.dueDate, new Date(`${props.issueDate}T00:00:00.000Z`));

    return ctx.mode === 'document'
      ? documentLayout(props, ctx, { itemRows, totalRows, totals, fmt, netDays })
      : mailLayout(props, ctx, { itemRows, totalRows, totals, fmt, netDays });
  },
});

interface Computed {
  itemRows: ItemRow[];
  totalRows: TotalRow[];
  totals: ReturnType<typeof computeTotals>;
  fmt: (value: number) => string;
  netDays: number;
}

/** Email and web share a layout: lead with the amount, then the single action. */
function mailLayout(props: InvoiceIssuedProps, ctx: Ctx, c: Computed): ReactElement[] {
  const locale = props.locale.tag;
  const owed = props.status === 'paid' ? 0 : c.totals.balance;
  const rows: ReactElement[] = ledgerMasthead(ctx, { docType: 'Invoice', docNumber: props.number });

  rows.push(
    band(
      [
        <StatusBadge
          key="badge"
          tone={TONE[props.status]}
          text={STATUS_TEXT[props.status]}
          containerPadding={`0px 0px ${space.md} 0px`}
        />,
        caption(
          [props.projectName, props.purchaseOrder ? `PO ${props.purchaseOrder}` : '']
            .filter(Boolean)
            .join(' &nbsp;·&nbsp; '),
          { key: 'sub', gap: space.lg },
        ),
        ...ledgerAmount({
          label: props.status === 'paid' ? 'Paid in full' : 'Balance due',
          amount: c.fmt(owed),
          meta:
            props.status === 'paid'
              ? 'Settled in full. Nothing further is owed.'
              : `Due ${date(props.dueDate, locale)}, net ${c.netDays} days`,
          tone: props.status === 'overdue' ? palette.danger : palette.ink,
        }),
        ...(props.status === 'paid'
          ? []
          : [
              cta({ ctx, label: 'Pay invoice', href: props.payUrl, fullWidth: true, gap: space.sm, key: 'c' }),
              fallbackLink(ctx, props.payUrl, { lead: 'Prefer to pay in a browser? Use this link:' }),
            ]),
      ],
      { pt: space.lg, pb: space.xl, key: 'hero' },
    ),
  );

  rows.push(
    band(
      [
        ...ledgerSection('What this covers'),
        <LineItems key="items" rows={c.itemRows} totals={c.totalRows} containerPadding="0px" />,
      ],
      { pt: space.none, pb: space.lg, key: 'items' },
    ),
  );

  // The hosted page is where someone actually pays, so bank details belong there.
  if (ctx.mode === 'web' && props.paymentMethods.length > 0) {
    rows.push(...paymentMethodRows(props, space.lg));
  }

  if (props.notes) {
    rows.push(
      band([divider({ gap: space.none, key: 'nd' }), label('Note', { key: 'nl', gap: space.xs }), small(props.notes, { key: 'n', gap: space.none })], {
        pt: space.none,
        pb: space.xxl,
        key: 'notes',
      }),
    );
  }

  rows.push(...footer(ctx, ctx.mode === 'email' ? { webViewUrl: props.payUrl } : {}));
  return rows;
}

/**
 * Print is a formal document, not a notification: no buttons, both parties'
 * addresses, and the payment instructions and terms a client's finance team
 * needs to settle and file it.
 */
function documentLayout(props: InvoiceIssuedProps, ctx: Ctx, c: Computed): ReactElement[] {
  const locale = props.locale.tag;
  const rows: ReactElement[] = [];

  rows.push(
    bandSplit(
      [
        heading(props.from.name, { key: 'fn', gap: space.xxs }),
        caption(props.from.addressLines.join('<br />'), { key: 'fa', gap: space.xs }),
        ...(props.from.taxId ? [caption(props.from.taxId, { key: 'ft', gap: space.none })] : []),
      ],
      [
        label('Invoice', { key: 'il', align: 'right', gap: space.xxs }),
        title(props.number, { key: 'inum', align: 'right', gap: space.none }),
      ],
      { pt: space.xl, pb: space.lg, ratio: 'equal', key: 'masthead' },
    ),
  );

  rows.push(band([divider({ gap: space.none, key: 'd1' })], { pt: space.none, pb: space.lg, key: 'rule1' }));

  rows.push(
    bandSplit(
      [
        label('Billed to', { key: 'bl', gap: space.xs }),
        heading(props.to.name, { key: 'tn', gap: space.xxs }),
        caption(
          [
            props.to.contactName ?? '',
            ...props.to.addressLines,
            props.to.taxId ?? '',
          ]
            .filter(Boolean)
            .join('<br />'),
          { key: 'ta', gap: space.none },
        ),
      ],
      [
        <DataList
          key="meta"
          rows={[
            { key: 'Issued', value: date(props.issueDate, locale) },
            { key: 'Due', value: date(props.dueDate, locale) },
            ...(props.purchaseOrder ? [{ key: 'PO', value: props.purchaseOrder, mono: true }] : []),
            ...(props.projectName ? [{ key: 'Project', value: props.projectName }] : []),
            {
              key: 'Amount due',
              value: c.fmt(props.status === 'paid' ? 0 : c.totals.balance),
              mono: true,
            },
          ]}
          containerPadding="0px"
        />,
      ],
      { pt: space.none, pb: space.xl, ratio: 'equal', key: 'parties' },
    ),
  );

  rows.push(
    band([<LineItems key="items" rows={c.itemRows} totals={c.totalRows} containerPadding="0px" />], {
      pt: space.none,
      pb: space.xl,
      key: 'items',
    }),
  );

  if (props.paymentMethods.length > 0) rows.push(...paymentMethodRows(props, space.xl));

  const legal = [props.terms, props.lateFeeNote].filter(Boolean).join('<br /><br />');
  rows.push(
    band(
      [
        divider({ gap: space.none, key: 'd2' }),
        label('Terms', { key: 'tl', gap: space.xs }),
        caption(legal, { key: 'tt', gap: props.notes ? space.md : space.none }),
        ...(props.notes ? [caption(props.notes, { key: 'nt', gap: space.none })] : []),
      ],
      { pt: space.none, pb: space.xl, key: 'terms' },
    ),
  );

  return rows;
}

function paymentMethodRows(props: InvoiceIssuedProps, pb: string): ReactElement[] {
  const children: ReactElement[] = [
    divider({ gap: space.none, key: 'pd' }),
    label('How to pay', { key: 'pl', gap: space.md }),
  ];

  props.paymentMethods.forEach((method, index) => {
    children.push(heading(method.label, { key: `pm${index}`, gap: space.xs }));
    children.push(
      <DataList
        key={`pf${index}`}
        rows={method.fields.map((field) => ({ key: field.key, value: field.value, mono: true }))}
        containerPadding={`0px 0px ${index === props.paymentMethods.length - 1 ? '0px' : space.lg} 0px`}
      />,
    );
  });

  return [band(children, { pt: space.none, pb, key: 'payment-methods' })];
}
