import type { ReactElement } from 'react';
import {
  band, Callout, footer, LogTable, recordCta, recordHeadline, recordLede, recordMark, recordMasthead, recordNote,
  recordSection, space, type LogRow,
} from '../../kit/index.js';
import { dateTime } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { newDeviceLoginSchema, type NewDeviceLoginProps } from './schema.js';

export default defineTemplate<NewDeviceLoginProps>({
  meta: {
    key: 'new_device_login',
    name: 'New device sign-in alert',
    genre: 'security',
    description: 'Leads with the evidence rather than a headline, because the reader arrives asking one question: was that me?',
    modes: ['email', 'web'],
    primaryAction: 'Secure the account',
    requiresUnsubscribe: false,
  },
  schema: newDeviceLoginSchema,

  subject: (props) => (props.flagged ? 'Unusual sign-in to your account' : 'New sign-in to your account'),

  sample: {
    ...demoBase,
    previewText: 'A new device signed in from Jakarta. Lock it down if that was not you.',
    secureAccountUrl: 'https://nexonauts.com/settings/security',
    reviewSessionsUrl: 'https://nexonauts.com/settings/sessions',
    signIn: {
      device: 'Windows 11 desktop',
      browser: 'Edge 141',
      location: 'Jakarta, Indonesia',
      ipAddress: '103.94.122.7',
      at: '2026-07-30T04:22:00.000Z',
    },
    flagged: true,
  },

  build(props, ctx): ReactElement[] {
    const { signIn, flagged } = props;

    // Location is what marks a sign-in unusual, so it is the row that carries
    // the flag. Flagging every row would flag nothing.
    const log: LogRow[] = [
      { key: 'When', value: dateTime(signIn.at, props.locale.tag) },
      { key: 'Device', value: signIn.device },
      ...(signIn.browser ? [{ key: 'Browser', value: signIn.browser }] : []),
      ...(signIn.location ? [{ key: 'Location', value: signIn.location, flagged }] : []),
      ...(signIn.ipAddress ? [{ key: 'IP address', value: signIn.ipAddress, flagged }] : []),
    ];

    return [
      ...recordMasthead(ctx, {
        stamp: flagged ? 'Security · Unusual sign-in' : 'Security · New device',
        severity: flagged ? 'alert' : 'notice',
      }),

      // Evidence first. The reader opened this to check one thing, and a headline
      // above the log only delays the answer they came for.
      band(
        [...recordSection('The sign-in', 'ev'), <LogTable key="lt" rows={log} containerPadding="0px" />],
        { pt: space.xl, pb: space.xl, key: 'evidence' },
      ),

      band(
        [
          recordHeadline(flagged ? 'Was that you?' : 'A new device signed in'),
          recordMark(),
          recordLede(
            flagged
              ? 'We let it through, but the location does not match anywhere you usually sign in from. If you do not recognise it, lock the account down now.'
              : 'A routine notice. Nothing to do if you recognise the device above — we send one the first time any device signs in.',
          ),
          ...(flagged
            ? [
                recordCta(ctx, { label: 'Lock the account down', href: props.secureAccountUrl }),
                recordNote('Changes your password and signs out every other session, including this one.'),
              ]
            : []),
        ],
        { pt: space.none, pb: space.xl, key: 'verdict' },
      ),

      band(
        [
          ...recordSection('If it was not you'),
          <Callout
            key="note"
            tone={flagged ? 'danger' : 'neutral'}
            title="Change the password, then revoke the sessions"
            body="A password change alone leaves an intruder signed in on their own device. Revoking sessions is what actually removes them."
            containerPadding={`0px 0px ${props.reviewSessionsUrl ? space.lg : space.none} 0px`}
          />,
          ...(props.reviewSessionsUrl
            ? [
                recordCta(ctx, {
                  label: 'Review active sessions',
                  href: props.reviewSessionsUrl,
                  variant: flagged ? 'secondary' : 'primary',
                  gap: space.none,
                  key: 'c2',
                }),
              ]
            : []),
        ],
        { pt: space.none, pb: space.xxl, key: 'guidance' },
      ),

      ...footer(ctx),
    ];
  },
});
