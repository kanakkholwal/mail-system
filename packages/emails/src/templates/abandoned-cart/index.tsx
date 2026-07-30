import type { ReactElement } from 'react';
import {
  accentRule, AmountBlock, band, bandSplit, brandHeader, caption, CodeToken, cta, divider, footer,
  heading, image, label, lede, small, space, title,
} from '../../kit/index.js';
import { dateTime, money } from '../../lib/format.js';
import { round2 } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBaseMarketing } from '../../samples/common.js';
import { abandonedCartSchema, type AbandonedCartProps } from './schema.js';

export default defineTemplate<AbandonedCartProps>({
  meta: {
    key: 'abandoned_cart',
    name: 'Abandoned cart',
    genre: 'commerce',
    description: 'Cart recovery that shows the actual items, with no fabricated countdown or invented scarcity.',
    modes: ['email', 'web'],
    primaryAction: 'Return to checkout',
    requiresUnsubscribe: true,
  },
  schema: abandonedCartSchema,

  subject: (props) =>
    props.items.length === 1
      ? `${props.items[0]?.description} is still in your basket`.slice(0, 78)
      : 'Your basket is still saved',

  sample: {
    ...demoBaseMarketing,
    recipientName: 'Priya',
    previewText: 'Three items, still saved. Checkout takes about a minute.',
    locale: { tag: 'en-GB', direction: 'ltr' },
    currency: 'GBP',
    items: [
      {
        description: 'A5 hardcover sketchbook, 180gsm',
        detail: 'Natural white, dotted',
        quantity: 1,
        unitPrice: 18.75,
        imageUrl: 'https://placehold.co/240x240/E7E8EC/6A7180/png?text=Sketchbook',
        stockLeft: 3,
      },
      {
        description: 'Sakura Pigma Micron 05, black',
        detail: 'Box of 12',
        quantity: 1,
        unitPrice: 22,
        imageUrl: 'https://placehold.co/240x240/E7E8EC/6A7180/png?text=Pens',
      },
      {
        description: 'Field Notes, ruled, 3-pack',
        quantity: 2,
        unitPrice: 11.5,
        imageUrl: 'https://placehold.co/240x240/E7E8EC/6A7180/png?text=Notes',
      },
    ],
    checkoutUrl: 'https://nexonauts.com/checkout/resume?c=7f21ab',
    reservedUntil: '2026-08-01T23:59:00.000Z',
    incentive: { code: 'BACK5', description: '5% off this basket' },
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const total = round2(props.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0));
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];

    rows.push(
      band(
        [
          title(props.recipientName ? `${props.recipientName}, your basket is saved` : 'Your basket is saved', {
            key: 'h',
          }),
          lede(
            `${props.items.length === 1 ? 'One item is' : `${props.items.length} items are`} still there. Checkout picks up exactly where you stopped.`,
            { key: 'l' },
          ),
          <AmountBlock
            key="total"
            label="Basket total"
            amount={money(total, props.currency, locale)}
            {...(props.reservedUntil ? { meta: `Held until ${dateTime(props.reservedUntil, locale)}` } : {})}
            containerPadding={`0px 0px ${space.lg} 0px`}
          />,
          cta({ ctx, label: 'Return to checkout', href: props.checkoutUrl, fullWidth: true, gap: space.none, key: 'c' }),
        ],
        { pt: space.xs, pb: space.xl, key: 'hero' },
      ),
    );

    rows.push(band([divider({ gap: space.none, key: 'd' }), label('In your basket', { key: 'il', gap: space.none })], {
      pt: space.none,
      pb: space.md,
      key: 'items-head',
    }));

    // Product images carry the memory of the decision, so they earn their place
    // here in a way they do not in a transactional email.
    props.items.forEach((item, index) => {
      const last = index === props.items.length - 1;
      rows.push(
        bandSplit(
          [
            // 65% of the narrow column lands near a 100px thumbnail. At 100% the
            // image drives the row height and leaves dead space beside the text.
            ...(item.imageUrl
              ? [image({ src: item.imageUrl, alt: item.description, width: '65%', gap: space.none, key: `im${index}` })]
              : []),
          ],
          [
            heading(item.description, { key: `t${index}`, gap: space.xxs }),
            ...(item.detail ? [caption(item.detail, { key: `d${index}`, gap: space.xxs })] : []),
            caption(
              `${item.quantity} &times; ${money(item.unitPrice, props.currency, locale)}`,
              { key: `q${index}`, gap: item.stockLeft ? space.xxs : space.none },
            ),
            // Only a real stock figure, never an invented urgency line.
            ...(item.stockLeft
              ? [caption(`Only ${item.stockLeft} left`, { key: `s${index}`, gap: space.none })]
              : []),
          ],
          { ratio: 'narrowWide', pt: space.none, pb: last ? space.lg : space.md, key: `item${index}` },
        ),
      );
    });

    if (props.incentive) {
      rows.push(
        band(
          [
            divider({ gap: space.none, key: 'pd' }),
            label(props.incentive.description, { key: 'pl', gap: space.sm }),
            <CodeToken key="code" code={props.incentive.code} groupSize={5} containerPadding={`0px 0px ${space.md} 0px`} />,
            small('Apply it at checkout. No minimum spend.', { key: 'pn', gap: space.none }),
          ],
          { pt: space.none, pb: space.lg, key: 'incentive' },
        ),
      );
    }

    rows.push(
      band([small('This is the only reminder we send about this basket.', { key: 'once', gap: space.none })], {
        pt: space.none,
        pb: space.xxl,
        key: 'tail',
      }),
    );

    rows.push(...footer(ctx, { showSocials: true }));
    return rows;
  },
});
