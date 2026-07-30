import type { ReactElement } from 'react';
import { accentRule, band, brandHeader, Callout, CodeToken, cta, DataList, divider, fallbackLink, footer, label, lede, small, space, title } from '../../kit/index.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { magicLinkSchema, type MagicLinkProps } from './schema.js';

export default defineTemplate<MagicLinkProps>({
  meta: {
    key: 'magic_link',
    name: 'Magic sign-in link',
    genre: 'auth',
    description: 'Passwordless sign-in with a short expiry, a typed code fallback and request provenance.',
    modes: ['email', 'web'],
    primaryAction: 'Sign in',
    requiresUnsubscribe: false,
  },
  schema: magicLinkSchema,

  subject: (props) => `Your sign-in link for ${props.branding.name}`,

  sample: {
    ...demoBase,
    previewText: 'Tap once to sign in. The link stops working in 15 minutes.',
    signInUrl: 'https://nexonauts.com/auth/magic?token=4c1e77a09bd2f6',
    fallbackCode: 'F4RQ29',
    expiresInMinutes: 15,
    request: { device: 'Safari on iPhone', location: 'Pune, India', ipAddress: '49.36.180.22' },
  },

  build(props, ctx): ReactElement[] {
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];

    rows.push(
      band(
        [
          title(`Sign in to ${props.branding.name}`, { key: 'h' }),
          lede('No password needed. This link signs you in on this device and then stops working.', { key: 'l' }),
          cta({ ctx, label: 'Sign in', href: props.signInUrl, fullWidth: true, gap: space.sm, key: 'c' }),
          small(`Expires in <strong>${props.expiresInMinutes} minutes</strong> and works only once.`, {
            key: 'e',
            gap: space.md,
          }),
          fallbackLink(ctx, props.signInUrl),
        ],
        { pt: space.xs, pb: space.xl, key: 'main' },
      ),
    );

    if (props.fallbackCode) {
      rows.push(
        band(
          [
            divider({ gap: space.none, key: 'd' }),
            label('Signing in on another device', { key: 'cl', gap: space.sm }),
            <CodeToken key="code" code={props.fallbackCode} groupSize={3} containerPadding="0px" />,
          ],
          { pt: space.none, pb: space.lg, key: 'code' },
        ),
      );
    }

    const details = [
      props.request?.device ? { key: 'Device', value: props.request.device } : null,
      props.request?.location ? { key: 'Location', value: props.request.location } : null,
      props.request?.ipAddress ? { key: 'IP address', value: props.request.ipAddress, mono: true } : null,
    ].filter((row): row is { key: string; value: string; mono?: boolean } => row !== null);

    if (details.length > 0) {
      rows.push(
        band(
          [
            divider({ gap: space.none, key: 'dd' }),
            small('Requested from', { key: 'rh', gap: space.xs }),
            <DataList key="dl" rows={details} containerPadding="0px" />,
          ],
          { pt: space.none, pb: space.lg, key: 'provenance' },
        ),
      );
    }

    rows.push(
      band(
        [
          <Callout
            key="warn"
            tone="warning"
            title="Not you?"
            body="Ignore this email. Nobody can sign in without opening the link, and it expires on its own."
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
