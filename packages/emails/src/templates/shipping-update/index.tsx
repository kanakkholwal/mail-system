import type { ReactElement } from 'react';
import {
  accentRule, band, brandHeader, Callout, cta, DataList, divider, fallbackLink, footer, lede, small,
  space, StatusBadge, title,
} from '../../kit/index.js';
import { date, dateTime } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { shippingUpdateSchema, type ShippingUpdateProps } from './schema.js';

type Status = ShippingUpdateProps['status'];

const STATUS: Record<Status, { badge: string; tone: 'success' | 'info' | 'warning' | 'danger'; title: string }> = {
  dispatched: { badge: 'Dispatched', tone: 'info', title: 'Your order is on its way' },
  in_transit: { badge: 'In transit', tone: 'info', title: 'Your parcel is moving' },
  out_for_delivery: { badge: 'Out for delivery', tone: 'info', title: 'Arriving today' },
  delivered: { badge: 'Delivered', tone: 'success', title: 'Your order arrived' },
  delayed: { badge: 'Delayed', tone: 'warning', title: 'Your parcel is running late' },
  exception: { badge: 'Needs attention', tone: 'danger', title: 'There is a problem with your delivery' },
};

export default defineTemplate<ShippingUpdateProps>({
  meta: {
    key: 'shipping_update',
    name: 'Shipping update',
    genre: 'commerce',
    description: 'One template covering the whole delivery lifecycle, with the state driving copy and tone.',
    modes: ['email', 'web'],
    primaryAction: 'Track parcel',
    requiresUnsubscribe: false,
  },
  schema: shippingUpdateSchema,

  subject: (props) => `Order ${props.orderNumber}: ${STATUS[props.status].badge.toLowerCase()}`,

  sample: {
    ...demoBase,
    previewText: 'Royal Mail has it. Expected Tuesday 4 August.',
    locale: { tag: 'en-GB', direction: 'ltr' },
    orderNumber: 'NX-88213',
    status: 'in_transit',
    carrier: 'Royal Mail',
    trackingNumber: 'RM418820447GB',
    trackingUrl: 'https://track.royalmail.com/RM418820447GB',
    expectedOn: '2026-08-04',
    itemCount: 4,
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const state = STATUS[props.status];
    const delivered = props.status === 'delivered';
    const problem = props.status === 'delayed' || props.status === 'exception';

    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];

    rows.push(
      band(
        [
          <StatusBadge key="badge" tone={state.tone} text={state.badge} containerPadding={`0px 0px ${space.md} 0px`} />,
          title(state.title, { key: 'h' }),
          lede(
            delivered && props.deliveredAt
              ? `Delivered ${dateTime(props.deliveredAt, locale)}. If anything is missing or damaged, tell us and we will sort it.`
              : props.expectedOn
                ? `Expected <strong>${date(props.expectedOn, locale)}</strong>. ${props.carrier} has the parcel and tracking is live.`
                : `${props.carrier} has the parcel.`,
            { key: 'l' },
          ),
          <DataList
            key="dl"
            rows={[
              { key: 'Order', value: props.orderNumber, mono: true },
              { key: 'Carrier', value: props.carrier },
              { key: 'Tracking', value: props.trackingNumber, mono: true },
              { key: 'Items', value: String(props.itemCount), mono: true },
              ...(delivered
                ? []
                : props.expectedOn
                  ? [{ key: 'Expected', value: date(props.expectedOn, locale) }]
                  : []),
            ]}
            containerPadding={`0px 0px ${space.lg} 0px`}
          />,
          cta({
            ctx,
            label: delivered ? 'View order' : 'Track parcel',
            href: props.trackingUrl,
            fullWidth: true,
            gap: space.sm,
            key: 'c',
          }),
          fallbackLink(ctx, props.trackingUrl),
        ],
        { pt: space.xs, pb: space.xl, key: 'hero' },
      ),
    );

    if (problem) {
      rows.push(
        band(
          [
            <Callout
              key="issue"
              tone={props.status === 'exception' ? 'danger' : 'warning'}
              title={props.status === 'exception' ? 'What went wrong' : 'Why it is late'}
              body={
                props.reason ??
                'The carrier has not given us a reason yet. We are chasing it and will email you as soon as that changes.'
              }
              containerPadding="0px"
            />,
          ],
          { pt: space.none, pb: space.lg, key: 'issue' },
        ),
      );
    }

    rows.push(
      band(
        [
          divider({ gap: space.none, key: 'd' }),
          small('Tracking can take a few hours to show movement after a scan.', { key: 'n', gap: space.none }),
        ],
        { pt: space.md, pb: space.xxl, key: 'tail' },
      ),
    );

    rows.push(...footer(ctx));
    return rows;
  },
});
