import type { ReactElement } from 'react';
import {
  band, Callout, cta, DataList, focusedHeader, focusedHeadline, focusedLede, focusedRule, footer, label, panel,
  space, StatusBadge,
} from '../../kit/index.js';
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
      focusedHeader(ctx),
      band(
        [
          <StatusBadge
            key="badge"
            tone="success"
            text="Done"
            align="center"
            containerPadding={`${space.xl} 0px ${space.sm} 0px`}
          />,
          focusedHeadline('Your password was changed'),
          focusedLede(
            props.sessionsRevoked
              ? 'The new password is active and every other signed-in device has been signed out.'
              : 'The new password is active. Other signed-in devices stay signed in.',
          ),
          focusedRule(),
        ],
        { pt: space.none, pb: space.none, key: 'main' },
      ),
      panel(
        [
          label('What changed', { key: 'wl', gap: space.sm }),
          <DataList key="dl" rows={details} containerPadding="0px" />,
        ],
        { key: 'detail-panel' },
      ),
      band(
        [
          <Callout
            key="warn"
            tone="danger"
            title="Did not change it?"
            body="Someone else may hold your password. Recover the account now and we will lock out every other session."
            containerPadding={`0px 0px ${space.md} 0px`}
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
