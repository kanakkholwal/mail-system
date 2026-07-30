import type { ReactElement } from 'react';
import { accentRule, band, brandHeader, Callout, cta, DataList, divider, fallbackLink, footer, lede, small, space, title } from '../../kit/index.js';
import { dateTime } from '../../lib/format.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { resetPasswordSchema, type ResetPasswordProps } from './schema.js';

export default defineTemplate<ResetPasswordProps>({
  meta: {
    key: 'reset_password',
    name: 'Password reset',
    genre: 'auth',
    description: 'Single-action password reset with request provenance and an expiry window.',
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
    const greeting = props.recipientName ? `Hi ${props.recipientName},` : 'Hi there,';
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];

    rows.push(
      band(
        [
          title('Reset your password', { key: 'h' }),
          lede(
            `${greeting} we received a request to reset the password on your ${props.branding.name} account. Choose a new one below.`,
            { key: 'l' },
          ),
          cta({
            ctx,
            label: 'Set a new password',
            href: props.resetUrl,
            fullWidth: true,
            gap: space.sm,
            key: 'c',
          }),
          small(
            `This link works once and expires in <strong>${props.expiresInMinutes} minutes</strong>.`,
            { key: 'e', gap: space.md },
          ),
          fallbackLink(ctx, props.resetUrl),
        ],
        { pt: space.xs, pb: space.xl, key: 'main' },
      ),
    );

    if (props.request) {
      const { device, location, ipAddress, requestedAt } = props.request;
      const detailRows = [
        requestedAt ? { key: 'Requested', value: dateTime(requestedAt, props.locale.tag) } : null,
        device ? { key: 'Device', value: device } : null,
        location ? { key: 'Location', value: location } : null,
        ipAddress ? { key: 'IP address', value: ipAddress, mono: true } : null,
      ].filter((row): row is { key: string; value: string; mono?: boolean } => row !== null);

      if (detailRows.length > 0) {
        rows.push(
          band(
            [
              divider({ gap: space.none, key: 'd' }),
              small('Where this request came from', { key: 'rh', gap: space.xs }),
              <DataList key="dl" rows={detailRows} containerPadding="0px" />,
            ],
            { pt: space.none, pb: space.lg, key: 'provenance' },
          ),
        );
      }
    }

    rows.push(
      band(
        [
          <Callout
            key="warn"
            tone="warning"
            title="Did not request this?"
            body={`Your password has not changed and no action is needed. If you keep getting these, <a href="${props.branding.supportUrl ?? props.branding.websiteUrl}" style="color:inherit;text-decoration:underline;">tell our team</a> so we can secure the account.`}
            containerPadding="0px"
          />,
        ],
        { pt: space.none, pb: space.xxl, key: 'warning' },
      ),
    );

    rows.push(...footer(ctx));
    return rows;
  },
});
