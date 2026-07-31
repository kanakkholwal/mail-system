import type { ReactElement } from 'react';
import {
  band, Callout, cta, DataList, divider, footer, ledgerMasthead, ledgerSection, lede, small, space,
  StatusBadge, title,
} from '../../kit/index.js';
import { date } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { subscriptionCancelledSchema, type SubscriptionCancelledProps } from './schema.js';

export default defineTemplate<SubscriptionCancelledProps>({
  meta: {
    key: 'subscription_cancelled',
    name: 'Subscription cancelled',
    genre: 'billing',
    description:
      'Cancellation confirmation that states plainly what was cancelled, until when access runs, and when data is deleted.',
    modes: ['email', 'web'],
    primaryAction: 'Reactivate',
    requiresUnsubscribe: false,
  },
  schema: subscriptionCancelledSchema,

  subject: (props) => `Your ${props.plan} subscription is cancelled`.slice(0, 78),

  sample: {
    ...demoBase,
    previewText: 'Access runs to 31 August. Your data is kept for 30 days after that.',
    locale: { tag: 'en-GB', direction: 'ltr' },
    plan: 'Studio, 4 seats, monthly',
    cancelledAt: '2026-07-30',
    accessUntil: '2026-08-31',
    reactivateUrl: 'https://nexonauts.com/billing/reactivate',
    exportDataUrl: 'https://nexonauts.com/settings/export',
    feedbackUrl: 'https://nexonauts.com/feedback/cancellation',
    dataRetentionDays: 30,
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;

    return [
      ...ledgerMasthead(ctx, { docType: 'Cancellation', docNumber: date(props.cancelledAt, locale) }),
      // No guilt copy and no hidden reactivation. Confirmshaming a cancellation
      // is a dark pattern and it costs more trust than it recovers revenue.
      band(
        [
          <StatusBadge key="badge" tone="neutral" text="Cancelled" containerPadding={`0px 0px ${space.md} 0px`} />,
          title('Your subscription is cancelled', { key: 'h' }),
          lede(
            `That is done, and you will not be charged again. You keep full access until the end of the term you have already paid for.`,
            { key: 'l' },
          ),
        ],
        { pt: space.lg, pb: space.none, key: 'hero' },
      ),
      band(
        [
          ...ledgerSection('The record'),
          <DataList
            key="dl"
            rows={[
              { key: 'Plan', value: props.plan },
              { key: 'Cancelled', value: date(props.cancelledAt, locale) },
              { key: 'Access until', value: date(props.accessUntil, locale) },
              { key: 'Final charge', value: 'None', tone: 'success' },
            ]}
            containerPadding="0px"
          />,
        ],
        { pt: space.none, pb: space.lg, key: 'record' },
      ),
      band(
        [
          divider({ gap: space.none, key: 'd' }),
          <Callout
            key="data"
            tone="neutral"
            title="Your data"
            body={
              props.dataRetentionDays > 0
                ? `We keep everything for ${props.dataRetentionDays} days after ${date(props.accessUntil, locale)}, so reactivating inside that window restores your workspace exactly as it was. After that it is deleted permanently.`
                : `Your workspace is deleted when access ends on ${date(props.accessUntil, locale)}. Export anything you need before then.`
            }
            containerPadding={`${space.md} 0px ${space.lg} 0px`}
          />,
          cta({
            ctx,
            label: 'Reactivate',
            href: props.reactivateUrl,
            fullWidth: true,
            gap: props.exportDataUrl ? space.xs : space.none,
            key: 'c',
          }),
          ...(props.exportDataUrl
            ? [
                cta({
                  ctx,
                  label: 'Export my data',
                  href: props.exportDataUrl,
                  variant: 'secondary',
                  fullWidth: true,
                  gap: space.none,
                  key: 'c2',
                }),
              ]
            : []),
        ],
        { pt: space.none, pb: space.lg, key: 'options' },
      ),
      ...(props.feedbackUrl
        ? [
            band(
              [
                small(
                  `If you have a minute, <a href="${props.feedbackUrl}">tell us what went wrong</a>. It is two questions and it genuinely shapes what we build.`,
                  { key: 'fb', gap: space.none },
                ),
              ],
              { pt: space.none, pb: space.xxl, key: 'feedback' },
            ),
          ]
        : []),
      ...footer(ctx),
    ];
  },
});
