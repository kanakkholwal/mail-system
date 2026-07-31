import type { ReactElement } from 'react';
import {
  band, brandHeader, Callout, cta, DataList, divider, editorialCta, editorialHeadline, editorialKicker,
  editorialLede, fallbackLink, footer, hero, ledgerSection, Meter, palette, space,
} from '../../kit/index.js';
import { PHOTO, PHOTO_ALT } from '../../samples/photos.js';
import { compactNumber, date } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { usageLimitSchema, type UsageLimitProps } from './schema.js';

const CONSEQUENCE: Record<UsageLimitProps['atLimit'], (unit: string) => string> = {
  blocked: () => 'New runs are rejected until the quota resets or you move up a plan.',
  throttled: () => 'Runs keep working but are queued behind paying capacity, so they get noticeably slower.',
  overage: (rate) => `Everything keeps working and the extra is billed at ${rate}.`,
};

export default defineTemplate<UsageLimitProps>({
  meta: {
    key: 'usage_limit',
    name: 'Usage limit approaching',
    genre: 'activation',
    description:
      'Quota warning with a table-based meter that survives Outlook, and an explicit statement of what happens at 100%.',
    modes: ['email', 'web'],
    primaryAction: 'Raise the limit',
    requiresUnsubscribe: false,
  },
  schema: usageLimitSchema,

  subject: (props) => `You are at ${Math.round((props.used / props.limit) * 100)}% of your ${props.metricLabel}`.slice(0, 78),

  sample: {
    ...demoBase,
    previewText: 'Resets on 1 August. Raise the limit now if you need headroom before then.',
    metricLabel: 'monthly build minutes',
    used: 8450,
    limit: 10000,
    unit: 'minutes',
    resetsOn: '2026-08-01',
    plan: 'Studio',
    upgradeUrl: 'https://nexonauts.com/billing/upgrade',
    atLimit: 'blocked',
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const pct = Math.min(100, Math.round((props.used / props.limit) * 100));
    const critical = pct >= 90;
    const unit = props.unit ? ` ${props.unit}` : '';

    return [
      brandHeader(ctx),
      hero({ src: PHOTO.usageLimit, alt: PHOTO_ALT.usageLimit }),
      band(
        [
          ...editorialKicker(`${pct}% used`, { color: critical ? palette.danger : palette.warning }),
          editorialHeadline(`You are close to your ${props.metricLabel} limit`),
          editorialLede(
            `The quota resets on ${date(props.resetsOn, locale)}. If you need headroom before then, moving up a plan takes effect immediately.`,
          ),
          // The meter is built from table cells with bgcolor, because Outlook's
          // word engine ignores percentage widths on divs.
          <Meter
            key="meter"
            percent={pct}
            label={`${compactNumber(props.used, locale)} of ${compactNumber(props.limit, locale)}${unit}`}
            value={`${pct}%`}
            containerPadding={`0px 0px ${space.lg} 0px`}
          />,
        ],
        { pt: space.xl, pb: space.lg, key: 'hero-copy' },
      ),
      band(
        [
          ...ledgerSection('The quota'),
          <DataList
            key="dl"
            rows={[
              { key: 'Plan', value: props.plan },
              { key: 'Used', value: `${compactNumber(props.used, locale)}${unit}`, mono: true },
              { key: 'Included', value: `${compactNumber(props.limit, locale)}${unit}`, mono: true },
              { key: 'Resets', value: date(props.resetsOn, locale) },
            ]}
            containerPadding={`0px 0px ${space.lg} 0px`}
          />,
          cta({ ctx, label: 'Raise the limit', href: props.upgradeUrl, fullWidth: true, gap: space.sm, key: 'c' }),
          fallbackLink(ctx, props.upgradeUrl),
        ],
        { pt: space.xs, pb: space.xl, key: 'hero' },
      ),
      band(
        [
          divider({ gap: space.none, key: 'd' }),
          <Callout
            key="what"
            tone={critical ? 'danger' : 'neutral'}
            title={`At 100%`}
            body={CONSEQUENCE[props.atLimit](props.overageRate ?? '')}
            containerPadding={`${space.md} 0px 0px 0px`}
          />,
        ],
        { pt: space.none, pb: space.xxl, key: 'consequence' },
      ),
      ...footer(ctx),
    ];
  },
});
