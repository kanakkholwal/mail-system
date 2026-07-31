import type { ReactElement } from 'react';
import {
  band, brandHeader, Callout, cta, DataList, divider, editorialCta, editorialHeadline, editorialKicker,
  editorialLede, fallbackLink, footer, hero, label, palette, small, space, statRow, text,
} from '../../kit/index.js';
import { PHOTO, PHOTO_ALT } from '../../samples/photos.js';
import { date, money } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { trialEndingSchema, type TrialEndingProps } from './schema.js';

export default defineTemplate<TrialEndingProps>({
  meta: {
    key: 'trial_ending',
    name: 'Trial ending',
    genre: 'activation',
    description:
      'Conversion email that argues from the account\'s own accumulated usage rather than from a feature list.',
    modes: ['email', 'web'],
    primaryAction: 'Keep the plan',
    requiresUnsubscribe: false,
  },
  schema: trialEndingSchema,

  subject: (props) =>
    props.daysLeft <= 1
      ? `Your ${props.branding.name} trial ends tomorrow`
      : `${props.daysLeft} days left on your ${props.branding.name} trial`,

  sample: {
    ...demoBase,
    previewText: 'Your projects and history stay exactly as they are if you keep the plan.',
    plan: 'Studio',
    trialEndsOn: '2026-08-03',
    daysLeft: 4,
    priceAfter: 29,
    currency: 'USD',
    interval: 'month',
    upgradeUrl: 'https://nexonauts.com/billing/upgrade?plan=studio',
    usage: [
      { label: 'Projects created', value: '7' },
      { label: 'Teammates invited', value: '3' },
      { label: 'Builds indexed', value: '1,284' },
      { label: 'Hours saved (estimated)', value: '19' },
    ],
    losesAccessTo: ['Private projects', 'Team roles and permissions', 'Build history beyond 7 days'],
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const urgent = props.daysLeft <= 2;
    const price = `${money(props.priceAfter, props.currency, locale)} per ${props.interval}`;
    const rows: ReactElement[] = [
      brandHeader(ctx),
      hero({ src: PHOTO.trialEnding, alt: PHOTO_ALT.trialEnding }),
    ];

    rows.push(
      band(
        [
          ...editorialKicker(
            props.daysLeft === 0 ? 'Ends today' : `${props.daysLeft} days left`,
            { color: urgent ? palette.danger : palette.muted },
          ),
          editorialHeadline(
            props.daysLeft <= 1 ? 'Your trial ends tomorrow' : `Your trial ends ${date(props.trialEndsOn, locale)}`,
          ),
          editorialLede(
            `Keeping ${props.plan} is ${price}. Nothing about your workspace changes, and you can cancel whenever you like.`,
          ),
          editorialCta(ctx, { label: 'Keep the plan', href: props.upgradeUrl }),
          fallbackLink(ctx, props.upgradeUrl),
        ],
        { pt: space.xl, pb: space.xl, key: 'hero-copy' },
      ),
    );

    // Their own numbers are the argument. A generic feature grid is not.
    if (props.usage.length > 0) {
      rows.push(
        band([divider({ gap: space.none, key: 'd' }), label('What you built during the trial', { key: 'ul', gap: space.none })], {
          pt: space.none,
          pb: space.md,
          key: 'usage-head',
        }),
      );
      rows.push(
        props.usage.length >= 2
          ? statRow(
              props.usage.slice(0, 3).map((row) => ({ value: row.value, label: row.label })),
              'usage-stats',
            )
          : band(
              [
                <DataList
                  key="usage"
                  rows={props.usage.map((row) => ({ key: row.label, value: row.value, mono: true }))}
                  containerPadding="0px"
                />,
              ],
              { pt: space.none, pb: space.lg, key: 'usage' },
            ),
      );
    }

    if (props.losesAccessTo.length > 0) {
      rows.push(
        band(
          [
            <Callout
              key="loss"
              tone="warning"
              title="If the trial lapses"
              body={`These switch off: ${props.losesAccessTo.join(', ')}. Your data is not deleted, so upgrading later restores everything.`}
              containerPadding="0px"
            />,
          ],
          { pt: space.none, pb: space.lg, key: 'loss' },
        ),
      );
    }

    rows.push(
      band([small('Questions about which plan fits? Reply to this email and a human answers.', { key: 'q', gap: space.none })], {
        pt: space.none,
        pb: space.xxl,
        key: 'tail',
      }),
    );

    rows.push(...footer(ctx));
    return rows;
  },
});
