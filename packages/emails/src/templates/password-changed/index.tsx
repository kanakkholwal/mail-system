import type { ReactElement } from 'react';
import {
  band, Callout, footer, LogTable, recordCta, recordHeadline, recordLede, recordMark, recordMasthead, recordNote,
  recordSection, space, type LogRow,
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
    description: 'A receipt for a change already made. Its only action is the recovery path, because a legitimate change needs none.',
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
    const log: LogRow[] = [
      { key: 'When', value: dateTime(props.changedAt, props.locale.tag) },
      ...(props.device ? [{ key: 'Device', value: props.device }] : []),
      ...(props.location ? [{ key: 'Location', value: props.location }] : []),
      {
        key: 'Other sessions',
        value: props.sessionsRevoked ? 'Signed out' : 'Still signed in',
        flagged: !props.sessionsRevoked,
      },
    ];

    return [
      ...recordMasthead(ctx, { stamp: 'Security · Password changed', severity: 'notice' }),

      band(
        [
          recordHeadline('Your password was changed'),
          recordMark(),
          recordLede(
            props.sessionsRevoked
              ? 'The new password is active and every other signed-in device has been signed out. Nothing else to do.'
              : 'The new password is active. Other devices you were already signed in on stay signed in.',
          ),
          recordNote('This is a record. It is sent on every password change and cannot be turned off.'),
        ],
        { pt: space.none, pb: space.xl, key: 'confirm' },
      ),

      band(
        [...recordSection('The change', 'ch'), <LogTable key="lt" rows={log} containerPadding="0px" />],
        { pt: space.none, pb: space.xl, key: 'record' },
      ),

      band(
        [
          ...recordSection('If you did not change it'),
          <Callout
            key="warn"
            tone="danger"
            title="Someone else holds your password"
            body="Recovering the account now resets it again and locks out every other session. The longer the wait, the more they can change."
            containerPadding={`0px 0px ${space.lg} 0px`}
          />,
          recordCta(ctx, { label: 'Recover the account', href: props.secureAccountUrl, gap: space.none }),
        ],
        { pt: space.none, pb: space.xxl, key: 'recovery' },
      ),

      ...footer(ctx),
    ];
  },
});
