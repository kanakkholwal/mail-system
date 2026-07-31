import type { ReactElement } from 'react';
import {
  band, Callout, CodeSlab, fallbackLink, footer, recordCta, recordHeadline, recordLede, recordLog, recordMark,
  recordMasthead, recordNote, recordSection, space, type LogRow,
} from '../../kit/index.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { magicLinkSchema, type MagicLinkProps } from './schema.js';

export default defineTemplate<MagicLinkProps>({
  meta: {
    key: 'magic_link',
    name: 'Magic sign-in link',
    genre: 'auth',
    description: 'Passwordless sign-in composed as a record: one act, a short expiry, and the request kept as a log.',
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
    const rows: ReactElement[] = recordMasthead(ctx, { stamp: 'Security · Sign-in' });

    rows.push(
      band(
        [
          recordHeadline(`Sign in to ${props.branding.name}`),
          recordMark(),
          recordLede('No password needed. This link signs you in on the device that opens it, then stops working.'),
          recordCta(ctx, { label: 'Sign in', href: props.signInUrl }),
          recordNote(`Expires in ${props.expiresInMinutes} minutes · Works once · Cannot be reused`),
        ],
        { pt: space.none, pb: space.xl, key: 'act' },
      ),
    );

    // The typed code is the path for a reader whose mail client and browser are
    // on different devices, which is most people reading on a phone at a desk.
    if (props.fallbackCode) {
      rows.push(
        band(
          [
            <CodeSlab
              key="code"
              code={props.fallbackCode}
              groupSize={3}
              stamp="Signing in somewhere else? Type this instead"
              meta="Same expiry · Same single use"
              containerPadding="0px"
            />,
          ],
          { pt: space.none, pb: space.xl, gutter: false, key: 'code' },
        ),
      );
    }

    const log: LogRow[] = [
      props.request?.device ? { key: 'Device', value: props.request.device } : null,
      props.request?.location ? { key: 'Location', value: props.request.location } : null,
      props.request?.ipAddress ? { key: 'IP address', value: props.request.ipAddress } : null,
    ].filter((row): row is LogRow => row !== null);

    if (log.length > 0) rows.push(recordLog(log, { title: 'Requested from' }));

    rows.push(
      band(
        [
          ...recordSection('If this was not you'),
          <Callout
            key="warn"
            tone="warning"
            title="Do nothing and it dies on its own"
            body="Nobody can sign in without opening the link, and it expires unused. If these keep arriving, someone knows your address — that is worth a password change."
            containerPadding={`0px 0px ${space.lg} 0px`}
          />,
          fallbackLink(ctx, props.signInUrl),
        ],
        { pt: space.none, pb: space.xxl, key: 'guidance' },
      ),
    );

    rows.push(...footer(ctx));
    return rows;
  },
});
