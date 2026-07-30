import type { ReactElement } from 'react';
import {
  accentRule, band, brandHeader, cta, divider, footer, heading, label, lede, signature, small, space,
  text, title,
} from '../../kit/index.js';
import { defineTemplate } from '../../template.js';
import { demoBaseMarketing } from '../../samples/common.js';
import { winbackSchema, type WinbackProps } from './schema.js';

export default defineTemplate<WinbackProps>({
  meta: {
    key: 'winback',
    name: 'Inactivity winback',
    genre: 'engagement',
    description:
      'Re-engagement from a named human, offering a way back into their own work rather than a generic tour.',
    modes: ['email', 'web'],
    primaryAction: 'Pick up where you left off',
    requiresUnsubscribe: true,
  },
  schema: winbackSchema,

  subject: (props) =>
    props.lastProject ? `Your ${props.lastProject.name} project is still here` : 'Still here whenever you want it',

  sample: {
    ...demoBaseMarketing,
    sender: {
      kind: 'person',
      name: 'Ama Boateng',
      role: 'Product',
      email: 'ama@nexonauts.com',
    },
    previewText: 'Three things changed since March, and your project is untouched.',
    inactiveDays: 128,
    returnUrl: 'https://nexonauts.com/app',
    shipped: [
      { title: 'Builds are about 4x faster', body: 'We rewrote the indexer, so a cold build now finishes in under a minute.' },
      { title: 'Real review comments', body: 'Threaded comments on any line, with resolve and assign.' },
      { title: 'A free tier that is actually usable', body: 'Three private projects and unlimited public ones.' },
    ],
    lastProject: { name: 'kestrel-portal', url: 'https://nexonauts.com/p/kestrel-portal' },
  },

  build(props, ctx): ReactElement[] {
    const greeting = props.recipientName ? `Hi ${props.recipientName},` : 'Hi,';
    const months = Math.round(props.inactiveDays / 30);
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];

    rows.push(
      band(
        [
          title(
            props.lastProject ? `${props.lastProject.name} is still exactly as you left it` : 'Still here whenever you want it',
            { key: 'h' },
          ),
          // No guilt, no "we miss you". State what changed and offer the way back.
          lede(
            `${greeting} it has been about ${months} months. Nothing of yours was touched, and a few things got meaningfully better.`,
            { key: 'l' },
          ),
          cta({
            ctx,
            label: props.lastProject ? 'Pick up where you left off' : 'Open the app',
            href: props.lastProject?.url ?? props.returnUrl,
            fullWidth: true,
            gap: space.none,
            key: 'c',
          }),
        ],
        { pt: space.xs, pb: space.xl, key: 'hero' },
      ),
    );

    if (props.shipped.length > 0) {
      const items: ReactElement[] = [
        divider({ gap: space.none, key: 'd' }),
        label('What changed while you were away', { key: 'sl', gap: space.md }),
      ];
      props.shipped.forEach((entry, index) => {
        items.push(heading(entry.title, { key: `st${index}`, gap: space.xxs }));
        items.push(
          text(entry.body, {
            key: `sb${index}`,
            gap: index === props.shipped.length - 1 ? space.none : space.md,
          }),
        );
      });
      rows.push(band(items, { pt: space.none, pb: space.lg, key: 'shipped' }));
    }

    rows.push(
      band(
        [
          small('If this is not useful any more, unsubscribing below is completely fine and takes one click.', {
            key: 'honest',
            gap: space.none,
          }),
        ],
        { pt: space.none, pb: space.lg, key: 'honesty' },
      ),
    );

    const sig = signature(ctx);
    if (sig) rows.push(sig);

    rows.push(...footer(ctx, { showSocials: true }));
    return rows;
  },
});
