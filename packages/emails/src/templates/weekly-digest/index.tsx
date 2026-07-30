import type { ReactElement } from 'react';
import {
  accentRule, band, brandHeader, Callout, cta, DataList, divider, footer, heading, label, lede, Meter,
  small, space, text, title,
} from '../../kit/index.js';
import { date } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBaseMarketing } from '../../samples/common.js';
import { weeklyDigestSchema, type DigestTrend, type WeeklyDigestProps } from './schema.js';

/**
 * The arrow carries direction and the word carries meaning, so the row still
 * reads correctly without colour. `inverse` decouples "up" from "good".
 */
function trendRow(metric: DigestTrend): { key: string; value: string; mono: boolean; tone: 'success' | 'danger' | 'default' } {
  const arrow = metric.direction === 'up' ? '↑' : metric.direction === 'down' ? '↓' : '';
  const good = metric.direction === 'flat' ? null : (metric.direction === 'up') !== metric.inverse;
  const delta = metric.delta ? ` ${arrow}${metric.delta}` : arrow ? ` ${arrow}` : '';
  return {
    key: metric.label,
    value: `${metric.value}${delta}`,
    mono: true,
    tone: good === null ? 'default' : good ? 'success' : 'danger',
  };
}

export default defineTemplate<WeeklyDigestProps>({
  meta: {
    key: 'weekly_digest',
    name: 'Weekly digest',
    genre: 'engagement',
    description:
      'Activity summary that leads with what needs attention, and colours trends by whether they are good rather than by direction.',
    modes: ['email', 'web'],
    primaryAction: 'Open dashboard',
    requiresUnsubscribe: true,
  },
  schema: weeklyDigestSchema,

  subject: (props) => `Your week: ${props.metrics[0]?.label ?? 'summary'} ${props.metrics[0]?.value ?? ''}`.slice(0, 78),

  sample: {
    ...demoBaseMarketing,
    previewText: 'Two things need a look, and build time is down 38%.',
    periodStart: '2026-07-20',
    periodEnd: '2026-07-26',
    dashboardUrl: 'https://nexonauts.com/insights',
    metrics: [
      { label: 'Builds', value: '1,284', direction: 'up', delta: '12%', inverse: false },
      { label: 'Median build time', value: '48s', direction: 'down', delta: '38%', inverse: true },
      { label: 'Failed builds', value: '31', direction: 'up', delta: '9%', inverse: true },
      { label: 'Active teammates', value: '7', direction: 'flat', inverse: false },
    ],
    needsAttention: [
      {
        title: 'kestrel-portal is failing on main',
        body: 'Nine consecutive failures since Thursday, all on the same migration step.',
        url: 'https://nexonauts.com/p/kestrel-portal/builds',
      },
      {
        title: 'Two invites never accepted',
        body: 'Sent 11 days ago. Invites expire after 14, so they will need resending.',
      },
    ],
    highlight: { label: 'Build minutes used this month', percent: 84, value: '8,450 of 10,000' },
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const period = `${date(props.periodStart, locale)} to ${date(props.periodEnd, locale)}`;
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];

    rows.push(
      band(
        [
          label(period, { key: 'p', gap: space.xs }),
          title('Your week in review', { key: 'h', gap: space.xs }),
          lede(
            props.needsAttention.length > 0
              ? `${props.needsAttention.length} ${props.needsAttention.length === 1 ? 'thing needs' : 'things need'} a look. The numbers are below.`
              : 'Nothing needs your attention this week. The numbers are below.',
            { key: 'l' },
          ),
        ],
        { pt: space.xs, pb: space.md, key: 'intro' },
      ),
    );

    // Problems first. A digest that buries the failing build under vanity
    // metrics gets skimmed and the failure stays unfixed.
    if (props.needsAttention.length > 0) {
      const items: ReactElement[] = [label('Needs attention', { key: 'al', gap: space.md })];
      props.needsAttention.forEach((item, index) => {
        const last = index === props.needsAttention.length - 1;
        items.push(heading(item.title, { key: `at${index}`, gap: space.xxs }));
        items.push(
          text(item.url ? `${item.body} <a href="${item.url}">Take a look</a>.` : item.body, {
            key: `ab${index}`,
            gap: last ? space.none : space.md,
          }),
        );
      });
      rows.push(band(items, { pt: space.none, pb: space.lg, key: 'attention' }));
    } else {
      rows.push(
        band(
          [
            <Callout
              key="clear"
              tone="success"
              title="All clear"
              body="No failing builds, no expiring invites, no quota warnings."
              containerPadding="0px"
            />,
          ],
          { pt: space.none, pb: space.lg, key: 'clear' },
        ),
      );
    }

    rows.push(
      band(
        [
          divider({ gap: space.none, key: 'md' }),
          label('The numbers', { key: 'ml', gap: space.md }),
          <DataList key="metrics" rows={props.metrics.map(trendRow)} containerPadding="0px" />,
        ],
        { pt: space.none, pb: space.lg, key: 'metrics' },
      ),
    );

    if (props.highlight) {
      rows.push(
        band(
          [
            divider({ gap: space.none, key: 'hd' }),
            <Meter
              key="meter"
              percent={props.highlight.percent}
              label={props.highlight.label}
              value={props.highlight.value}
              containerPadding={`${space.md} 0px 0px 0px`}
            />,
          ],
          { pt: space.none, pb: space.lg, key: 'highlight' },
        ),
      );
    }

    rows.push(
      band(
        [
          cta({ ctx, label: 'Open dashboard', href: props.dashboardUrl, fullWidth: true, gap: space.md, key: 'c' }),
          small('Digests arrive every Monday. Change the cadence or turn them off in email preferences.', {
            key: 'cad',
            gap: space.none,
          }),
        ],
        { pt: space.none, pb: space.xxl, key: 'cta' },
      ),
    );

    rows.push(...footer(ctx, { showSocials: true }));
    return rows;
  },
});
