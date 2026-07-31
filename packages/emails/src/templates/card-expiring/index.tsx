import type { ReactElement } from 'react';
import {
  band, cta, DataList, divider, fallbackLink, footer, ledgerAmount, ledgerMasthead, ledgerSection, lede,
  small, space, StatusBadge, title,
} from '../../kit/index.js';
import { date, money } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { cardExpiringSchema, type CardExpiringProps } from './schema.js';

export default defineTemplate<CardExpiringProps>({
  meta: {
    key: 'card_expiring',
    name: 'Card expiring soon',
    genre: 'billing',
    description: 'Pre-emptive card update. Recovering a payment before it fails is far cheaper than dunning after.',
    modes: ['email', 'web'],
    primaryAction: 'Update card',
    requiresUnsubscribe: false,
  },
  schema: cardExpiringSchema,

  subject: (props) => `Your card ending ${props.card.last4} expires soon`,

  sample: {
    ...demoBase,
    previewText: 'Update it before 1 September so your renewal is not interrupted.',
    locale: { tag: 'en-GB', direction: 'ltr' },
    card: { brand: 'Mastercard', last4: '8812', expiry: '08/26' },
    nextChargeDate: '2026-09-01',
    amount: 1450,
    currency: 'GBP',
    plan: 'Studio, 4 seats, monthly',
    updatePaymentUrl: 'https://nexonauts.com/billing/payment-method',
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;

    return [
      ...ledgerMasthead(ctx, { docType: 'Card on file', docNumber: `•••• ${props.card.last4}` }),
      band(
        [
          <StatusBadge key="badge" tone="warning" text="Action needed soon" containerPadding={`0px 0px ${space.md} 0px`} />,
          title(`Your ${props.card.brand} expires before your next renewal`, { key: 'h' }),
          lede(
            `Nothing has failed yet. Updating the card now means your renewal on ${date(props.nextChargeDate, locale)} goes through without interruption.`,
            { key: 'l' },
          ),
          // The charge, not the expiry date, is what the reader is deciding about.
          ...ledgerAmount({
            label: 'Next charge',
            amount: money(props.amount, props.currency, locale),
            meta: `${date(props.nextChargeDate, locale)} · ${props.plan}`,
          }),
          cta({
            ctx,
            label: 'Update card',
            href: props.updatePaymentUrl,
            fullWidth: true,
            gap: space.sm,
            key: 'c',
          }),
          fallbackLink(ctx, props.updatePaymentUrl),
        ],
        { pt: space.lg, pb: space.lg, key: 'hero' },
      ),
      band(
        [
          ...ledgerSection('The card'),
          <DataList
            key="dl"
            rows={[
              { key: 'Card', value: `${props.card.brand} ending ${props.card.last4}` },
              ...(props.card.expiry ? [{ key: 'Expires', value: props.card.expiry, mono: true, tone: 'danger' as const }] : []),
              { key: 'Plan', value: props.plan },
            ]}
            containerPadding="0px"
          />,
        ],
        { pt: space.none, pb: space.lg, key: 'card-detail' },
      ),
      band(
        [
          divider({ gap: space.none, key: 'd' }),
          small('If you have already updated it elsewhere, you can ignore this. We only send this once per card.', {
            key: 'n',
            gap: space.none,
          }),
        ],
        { pt: space.none, pb: space.xxl, key: 'tail' },
      ),
      ...footer(ctx),
    ];
  },
});
