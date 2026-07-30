import type { ReactElement } from 'react';
import { accentRule, band, brandHeader, Callout, cta, DataList, divider, footer, lede, small, space, StatusBadge, title } from '../../kit/index.js';
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
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];
    const { signIn, flagged } = props;

    rows.push(
      band(
        [
          <StatusBadge
            key="badge"
            tone={flagged ? 'danger' : 'info'}
            text={flagged ? 'Unusual activity' : 'New device'}
            containerPadding={`0px 0px ${space.md} 0px`}
          />,
          title(flagged ? 'An unusual sign-in happened' : 'A new device signed in', { key: 'h' }),
          lede(
            flagged
              ? 'We let this sign-in through but it did not match your usual pattern. Review it now.'
              : 'This is a routine notice. No action is needed if you recognise the device below.',
            { key: 'l' },
          ),
          <DataList
            key="dl"
            rows={[
              { key: 'When', value: dateTime(signIn.at, props.locale.tag) },
              { key: 'Device', value: signIn.device },
              ...(signIn.browser ? [{ key: 'Browser', value: signIn.browser }] : []),
              ...(signIn.location ? [{ key: 'Location', value: signIn.location }] : []),
              ...(signIn.ipAddress ? [{ key: 'IP address', value: signIn.ipAddress, mono: true }] : []),
            ]}
            containerPadding={`0px 0px ${space.lg} 0px`}
          />,
          cta({
            ctx,
            label: 'Secure the account',
            href: props.secureAccountUrl,
            fullWidth: true,
            gap: props.reviewSessionsUrl ? space.xs : space.none,
            key: 'c',
          }),
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
        { pt: space.xs, pb: space.xl, key: 'main' },
      ),
    );

    rows.push(
      band(
        [
          divider({ gap: space.none, key: 'd' }),
          <Callout
            key="note"
            tone={flagged ? 'danger' : 'neutral'}
            title="If this was not you"
            body="Change your password and sign out every other session. That revokes the intruder's access immediately."
            containerPadding={`${space.md} 0px ${space.lg} 0px`}
          />,
          small('We send this whenever a device signs in for the first time.', {
            key: 'why',
            gap: space.none,
          }),
        ],
        { pt: space.none, pb: space.xxl, key: 'guidance' },
      ),
    );

    rows.push(...footer(ctx));
    return rows;
  },
});
