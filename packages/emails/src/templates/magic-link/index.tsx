import type { ReactElement } from 'react';
import {
  band, Callout, CodeToken, DataList, fallbackLink, focusedCta, focusedHeader, focusedHeadline, focusedLede,
  focusedNote, focusedRule, footer, label, panel, space,
} from '../../kit/index.js';
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
    const rows: ReactElement[] = [focusedHeader(ctx)];

    rows.push(
      band(
        [
          focusedHeadline(`Sign in to ${props.branding.name}`),
          focusedLede('No password needed. This link signs you in on this device, then stops working.'),
          focusedCta(ctx, { label: 'Sign in', href: props.signInUrl }),
          focusedNote(`Expires in ${props.expiresInMinutes} minutes and works only once.`),
          focusedRule(),
          fallbackLink(ctx, props.signInUrl, { align: 'center' }),
        ],
        { pt: space.none, pb: space.xl, key: 'main' },
      ),
    );

    if (props.fallbackCode) {
      rows.push(
        band(
          [
            label('Signing in on another device', { align: 'center', key: 'cl', gap: space.sm }),
            <CodeToken key="code" code={props.fallbackCode} groupSize={3} containerPadding="0px" />,
          ],
          { pt: space.none, pb: space.xl, key: 'code' },
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
        panel(
          [
            label('Requested from', { key: 'rh', gap: space.sm }),
            <DataList key="dl" rows={details} containerPadding="0px" />,
          ],
          { key: 'provenance' },
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
