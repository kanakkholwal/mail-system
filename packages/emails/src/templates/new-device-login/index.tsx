import type { ReactElement } from 'react';
import {
  band, Callout, cta, DataList, focusedHeader, focusedHeadline, focusedLede, focusedNote, focusedRule, footer,
  label, panel, space, StatusBadge,
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
    description: 'Sign-in notice that leads with the remedial action rather than a reassuring one.',
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
    const rows: ReactElement[] = [focusedHeader(ctx)];
    const { signIn, flagged } = props;

    rows.push(
      band(
        [
          <StatusBadge
            key="badge"
            tone={flagged ? 'danger' : 'info'}
            text={flagged ? 'Unusual activity' : 'New device'}
            align="center"
            containerPadding={`${space.xl} 0px ${space.sm} 0px`}
          />,
          focusedHeadline(flagged ? 'An unusual sign-in happened' : 'A new device signed in', 'h'),
          focusedLede(
            flagged
              ? 'We let it through, but it did not match your usual pattern. Check the details below.'
              : 'A routine notice. Nothing to do if you recognise the device below.',
          ),
          ...(flagged
            ? [cta({ ctx, label: 'Secure the account', href: props.secureAccountUrl, align: 'center', gap: space.md, key: 'c' })]
            : []),
          focusedNote('We send this the first time any device signs in.'),
          focusedRule(),
        ],
        { pt: space.none, pb: space.lg, key: 'main' },
      ),
    );

    rows.push(
      panel(
        [
          label('The sign-in', { key: 'sl', gap: space.sm }),
          <DataList
            key="dl"
            rows={[
              { key: 'When', value: dateTime(signIn.at, props.locale.tag) },
              { key: 'Device', value: signIn.device },
              ...(signIn.browser ? [{ key: 'Browser', value: signIn.browser }] : []),
              ...(signIn.location ? [{ key: 'Location', value: signIn.location }] : []),
              ...(signIn.ipAddress ? [{ key: 'IP address', value: signIn.ipAddress, mono: true }] : []),
            ]}
            containerPadding="0px"
          />,
        ],
        { key: 'signin-panel' },
      ),
    );

    rows.push(
      band(
        [
          <Callout
            key="note"
            tone={flagged ? 'danger' : 'neutral'}
            title="If this was not you"
            body="Change your password and sign out every other session. That revokes the intruder's access immediately."
            containerPadding={`0px 0px ${props.reviewSessionsUrl ? space.md : space.none} 0px`}
          />,
          ...(props.reviewSessionsUrl
            ? [
                cta({
                  ctx,
                  label: 'Review active sessions',
                  href: props.reviewSessionsUrl,
                  variant: 'secondary',
                  fullWidth: true,
                  gap: space.none,
                  key: 'c2',
                }),
              ]
            : []),
        ],
        { pt: space.none, pb: space.xxl, key: 'guidance' },
      ),
    );


    rows.push(...footer(ctx));
    return rows;
  },
});
