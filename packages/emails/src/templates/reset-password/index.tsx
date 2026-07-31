import type { ReactElement } from 'react';
import {
  band, Callout, fallbackLink, footer, recordCta, recordHeadline, recordLede, recordLog, recordMark,
  recordMasthead, recordNote, recordSection, space, type LogRow,
} from '../../kit/index.js';
import { dateTime } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { resetPasswordSchema, type ResetPasswordProps } from './schema.js';

export default defineTemplate<ResetPasswordProps>({
  meta: {
    key: 'reset_password',
    name: 'Password reset',
    genre: 'auth',
    description: 'Single-action reset with the request logged underneath, so an unrequested one is recognisable as such.',
    modes: ['email', 'web'],
    primaryAction: 'Set a new password',
    requiresUnsubscribe: false,
  },
  schema: resetPasswordSchema,

  subject: () => 'Reset your password',

  sample: {
    ...demoBase,
    previewText: 'Set a new password using the link inside. It expires in 30 minutes.',
    resetUrl: 'https://nexonauts.com/auth/reset?token=8f2c1ba9d4e17c05',
    expiresInMinutes: 30,
    request: {
      device: 'Chrome on macOS',
      location: 'Bengaluru, India',
      ipAddress: '103.21.244.18',
      requestedAt: '2026-07-30T09:14:00.000Z',
    },
  },

  build(props, ctx): ReactElement[] {
    const rows: ReactElement[] = recordMasthead(ctx, { stamp: 'Security · Password reset' });

    rows.push(
      band(
        [
          recordHeadline('Reset your password'),
          recordMark(),
          recordLede(
            `${props.recipientName ? `${props.recipientName}, someone` : 'Someone'} asked to reset the password on your ${props.branding.name} account. Your current password still works until you choose a new one.`,
          ),
          recordCta(ctx, { label: 'Set a new password', href: props.resetUrl }),
          recordNote(`Expires in ${props.expiresInMinutes} minutes · Works once · Every other session is signed out`),
        ],
        { pt: space.none, pb: space.xl, key: 'act' },
      ),
    );

    if (props.request) {
      const { device, location, ipAddress, requestedAt } = props.request;
      const log: LogRow[] = [
        requestedAt ? { key: 'Requested', value: dateTime(requestedAt, props.locale.tag) } : null,
        device ? { key: 'Device', value: device } : null,
        location ? { key: 'Location', value: location } : null,
        ipAddress ? { key: 'IP address', value: ipAddress } : null,
      ].filter((row): row is LogRow => row !== null);

      if (log.length > 0) rows.push(recordLog(log, { title: 'Where the request came from' }));
    }

    rows.push(
      band(
        [
          ...recordSection('If it was not you'),
          <Callout
            key="warn"
            tone="warning"
            title="Nothing has changed yet"
            body={`A reset link on its own does not change anything. Ignore this and your password stays as it is. If they keep arriving, <a href="${props.branding.supportUrl ?? props.branding.websiteUrl}" style="color:inherit;text-decoration:underline;">tell our team</a> — someone is targeting the address.`}
            containerPadding={`0px 0px ${space.lg} 0px`}
          />,
          fallbackLink(ctx, props.resetUrl),
        ],
        { pt: space.none, pb: space.xxl, key: 'guidance' },
      ),
    );

    rows.push(...footer(ctx));
    return rows;
  },
});
