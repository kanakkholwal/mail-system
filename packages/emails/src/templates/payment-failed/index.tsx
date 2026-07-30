import type { ReactElement } from 'react';
import {
  accentRule, AmountBlock, band, brandHeader, Callout, cta, DataList, divider, fallbackLink, footer,
  lede, palette, space, StatusBadge, title,
} from '../../kit/index.js';
import { date, money } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { paymentFailedSchema, type PaymentFailedProps } from './schema.js';

/** Naming the actual cause is what turns a dunning email into a recovered payment. */
const REASON: Record<PaymentFailedProps['declineReason'], string> = {
  insufficient_funds: 'The card was declined for insufficient funds.',
  expired_card: 'The card on file has expired.',
  card_declined: 'The bank declined the charge without giving a reason.',
  authentication_required: 'The bank asked for extra authentication that could not be completed automatically.',
  unknown: 'The charge did not go through.',
};

const FIX: Record<PaymentFailedProps['declineReason'], string> = {
  insufficient_funds: 'Top up the account or use a different card, then we will retry straight away.',
  expired_card: 'Add the new expiry date, or a different card, and we will retry straight away.',
  card_declined: 'Your bank can usually clear this in a minute, or you can use a different card.',
  authentication_required: 'Confirming the payment in your banking app resolves this.',
  unknown: 'Updating your payment method is the quickest way to resolve it.',
};

export default defineTemplate<PaymentFailedProps>({
  meta: {
    key: 'payment_failed',
    name: 'Payment failed (dunning)',
    genre: 'billing',
    description: 'Recovery email that names the decline cause and the exact fix, with the deadline made concrete.',
    modes: ['email', 'web'],
    primaryAction: 'Update payment method',
    requiresUnsubscribe: false,
  },
  schema: paymentFailedSchema,

  subject: (props) => `Action needed: your ${props.branding.name} payment did not go through`.slice(0, 78),

  sample: {
    ...demoBase,
    previewText: 'The card ending 8812 was declined. Update it to keep your workspace active.',
    locale: { tag: 'en-GB', direction: 'ltr' },
    amount: 1450,
    currency: 'GBP',
    plan: 'Studio, 4 seats, monthly',
    card: { brand: 'Mastercard', last4: '8812', expiry: '06/26' },
    declineReason: 'insufficient_funds',
    updatePaymentUrl: 'https://nexonauts.com/billing/payment-method',
    retry: { attempt: 2, of: 4, nextAttempt: '2026-08-02' },
    gracePeriodEnds: '2026-08-09',
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];

    rows.push(
      band(
        [
          <StatusBadge key="badge" tone="danger" text="Payment failed" containerPadding={`0px 0px ${space.md} 0px`} />,
          title('Your payment did not go through', { key: 'h' }),
          lede(`${REASON[props.declineReason]} ${FIX[props.declineReason]}`, { key: 'l' }),
          <AmountBlock
            key="amount"
            label="Amount outstanding"
            amount={money(props.amount, props.currency, locale)}
            meta={props.plan}
            color={palette.danger}
            containerPadding={`0px 0px ${space.lg} 0px`}
          />,
          cta({
            ctx,
            label: 'Update payment method',
            href: props.updatePaymentUrl,
            fullWidth: true,
            gap: space.sm,
            key: 'c',
          }),
          fallbackLink(ctx, props.updatePaymentUrl),
        ],
        { pt: space.xs, pb: space.xl, key: 'hero' },
      ),
    );

    const detail = [
      ...(props.card
        ? [{ key: 'Card on file', value: `${props.card.brand} ending ${props.card.last4}`, mono: false }]
        : []),
      ...(props.retry
        ? [
            { key: 'Attempt', value: `${props.retry.attempt} of ${props.retry.of}` },
            { key: 'Next retry', value: date(props.retry.nextAttempt, locale) },
          ]
        : []),
      ...(props.gracePeriodEnds
        ? [{ key: 'Access until', value: date(props.gracePeriodEnds, locale), tone: 'danger' as const }]
        : []),
    ];

    if (detail.length > 0) {
      rows.push(
        band([divider({ gap: space.none, key: 'd' }), <DataList key="dl" rows={detail} containerPadding={`${space.md} 0px 0px 0px`} />], {
          pt: space.none,
          pb: space.lg,
          key: 'schedule',
        }),
      );
    }

    rows.push(
      band(
        [
          <Callout
            key="warn"
            tone="warning"
            title="What happens if it keeps failing"
            body={
              props.gracePeriodEnds
                ? `We retry automatically${props.retry ? ` up to ${props.retry.of} times` : ''}. If none succeed by ${date(props.gracePeriodEnds, locale)}, the workspace moves to read-only. Nothing is deleted and paying restores it immediately.`
                : 'We keep retrying automatically. Your data is never deleted for a failed payment.'
            }
            containerPadding="0px"
          />,
        ],
        { pt: space.none, pb: space.xxl, key: 'consequence' },
      ),
    );

    rows.push(...footer(ctx));
    return rows;
  },
});
