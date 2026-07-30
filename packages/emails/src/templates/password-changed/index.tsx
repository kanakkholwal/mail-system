import type { ReactElement } from 'react';
import { accentRule, band, brandHeader, Callout, cta, DataList, divider, footer, lede, space, StatusBadge, title } from '../../kit/index.js';
import { dateTime } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { passwordChangedSchema, type PasswordChangedProps } from './schema.js';

export default defineTemplate<PasswordChangedProps>({
  meta: {
    key: 'password_changed',
    name: 'Password changed',
    genre: 'security',
    description: 'Confirmation notice whose only action is the recovery path, since a legitimate change needs none.',
    modes: ['email', 'web'],
    primaryAction: 'Secure the account',
    requiresUnsubscribe: false,
  },
  schema: passwordChangedSchema,

  subject: () => 'Your password was changed',

  sample: {
    ...demoBase,
    previewText: 'Confirming the change. If it was not you, act now.',
    changedAt: '2026-07-30T11:05:00.000Z',
    secureAccountUrl: 'https://nexonauts.com/account/recover',
    device: 'Chrome on macOS',
    location: 'Bengaluru, India',
    sessionsRevoked: true,
  },

  build(props, ctx): ReactElement[] {
    const details = [
      { key: 'When', value: dateTime(props.changedAt, props.locale.tag) },
      ...(props.device ? [{ key: 'Device', value: props.device }] : []),
      ...(props.location ? [{ key: 'Location', value: props.location }] : []),
      ...(props.sessionsRevoked
        ? [{ key: 'Other sessions', value: 'Signed out', tone: 'success' as const }]
        : []),
    ];

    return [
      brandHeader(ctx),
      accentRule(ctx),
      band(
        [
          <StatusBadge key="badge" tone="success" text="Done" containerPadding={`0px 0px ${space.md} 0px`} />,
          title('Your password was changed', { key: 'h' }),
          lede(
            props.sessionsRevoked
              ? 'Your new password is active and every other signed-in device has been signed out.'
              : 'Your new password is active. Other signed-in devices stay signed in.',
            { key: 'l' },
          ),
          <DataList key="dl" rows={details} containerPadding="0px" />,
        ],
        { pt: space.xs, pb: space.lg, key: 'main' },
      ),
      band(
        [
          divider({ gap: space.none, key: 'd' }),
          <Callout
            key="warn"
            tone="danger"
            title="Did not change it?"
            body="Someone else may hold your password. Recover the account now and we will lock out every other session."
            containerPadding={`${space.md} 0px ${space.md} 0px`}
          />,
          cta({
            ctx,
            label: 'Secure the account',
            href: props.secureAccountUrl,
            fullWidth: true,
            gap: space.none,
            key: 'c',
          }),
        ],
        { pt: space.none, pb: space.xxl, key: 'recovery' },
      ),
      ...footer(ctx),
    ];
  },
});
