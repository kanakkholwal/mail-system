import type { ReactElement } from 'react';
import {
  accentRule, band, brandHeader, Callout, cta, divider, footer, label, lede, small, space, title,
} from '../../kit/index.js';
import { dateTime } from '../../lib/format.js';
import { esc } from '../../lib/html.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { mentionNotificationSchema, type MentionNotificationProps } from './schema.js';

const KIND: Record<MentionNotificationProps['context']['kind'], string> = {
  comment: 'a comment on',
  review: 'a review of',
  task: 'a task in',
  document: 'a document in',
};

export default defineTemplate<MentionNotificationProps>({
  meta: {
    key: 'mention_notification',
    name: 'Mention notification',
    genre: 'collaboration',
    description: 'Mention alert that quotes enough of the comment to be actionable without opening the app.',
    modes: ['email', 'web'],
    primaryAction: 'Reply',
    requiresUnsubscribe: false,
  },
  schema: mentionNotificationSchema,

  subject: (props) => `${props.actor.name} mentioned you in ${props.context.title}`.slice(0, 78),

  sample: {
    ...demoBase,
    previewText: 'Ama asked whether the migration step should be split before the release.',
    actor: { name: 'Ama Boateng' },
    context: { kind: 'comment', title: 'kestrel-portal, PR #482' },
    excerpt:
      'Should we split the migration step out before the release? If it fails halfway we have no clean way back, and I would rather find that out on staging.',
    mentionedAt: '2026-07-30T09:41:00.000Z',
    replyUrl: 'https://nexonauts.com/p/kestrel-portal/pull/482#c-8812',
    alsoWaiting: 2,
    muteThreadUrl: 'https://nexonauts.com/p/kestrel-portal/pull/482/mute',
  },

  build(props, ctx): ReactElement[] {
    const locale = props.locale.tag;
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];

    rows.push(
      band(
        [
          label(dateTime(props.mentionedAt, locale), { key: 'when', gap: space.xs }),
          title(`${props.actor.name} mentioned you`, { key: 'h', gap: space.xs }),
          lede(`In ${KIND[props.context.kind]} <strong>${esc(props.context.title)}</strong>.`, { key: 'l' }),
          // Quoting the comment is the whole point. A bare "you were mentioned"
          // forces a context switch to learn whether it even needs a reply.
          <Callout key="quote" tone="neutral" body={esc(props.excerpt)} containerPadding={`0px 0px ${space.lg} 0px`} />,
          cta({ ctx, label: 'Reply', href: props.replyUrl, fullWidth: true, gap: space.none, key: 'c' }),
        ],
        { pt: space.xs, pb: space.lg, key: 'hero' },
      ),
    );

    const tail: ReactElement[] = [divider({ gap: space.none, key: 'd' })];
    if (props.alsoWaiting > 0) {
      tail.push(
        small(
          `You have <strong>${props.alsoWaiting}</strong> other unread ${props.alsoWaiting === 1 ? 'mention' : 'mentions'}.`,
          { key: 'more', gap: props.muteThreadUrl ? space.xs : space.none },
        ),
      );
    }
    if (props.muteThreadUrl) {
      tail.push(
        small(`Too noisy? <a href="${props.muteThreadUrl}">Mute this thread</a> without muting the project.`, {
          key: 'mute',
          gap: space.none,
        }),
      );
    }

    rows.push(band(tail, { pt: space.md, pb: space.xxl, key: 'tail' }));
    rows.push(...footer(ctx));
    return rows;
  },
});
