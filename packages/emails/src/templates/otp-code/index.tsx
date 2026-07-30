import type { ReactElement } from 'react';
import { accentRule, band, brandHeader, Callout, CodeToken, footer, lede, small, space, title } from '../../kit/index.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { otpCodeSchema, type OtpCodeProps } from './schema.js';

const PURPOSE: Record<OtpCodeProps['purpose'], { title: string; lede: string }> = {
  sign_in: { title: 'Your sign-in code', lede: 'Enter this code to finish signing in.' },
  confirm_payment: { title: 'Confirm your payment', lede: 'Enter this code to authorise the payment you started.' },
  change_email: { title: 'Confirm your new email', lede: 'Enter this code to move your account to this address.' },
  delete_account: { title: 'Confirm account deletion', lede: 'Enter this code to permanently delete your account.' },
};

export default defineTemplate<OtpCodeProps>({
  meta: {
    key: 'otp_code',
    name: 'One-time passcode',
    genre: 'auth',
    description: 'Code-first layout with no competing link, and the authorised action named to blunt relay phishing.',
    modes: ['email', 'web'],
    primaryAction: '',
    requiresUnsubscribe: false,
  },
  schema: otpCodeSchema,

  subject: (props) => `${props.code} is your ${props.branding.name} code`,

  sample: {
    ...demoBase,
    previewText: 'Enter the code below to finish signing in. It lasts 10 minutes.',
    code: '481902',
    expiresInMinutes: 10,
    purpose: 'sign_in',
  },

  build(props, ctx): ReactElement[] {
    const copy = PURPOSE[props.purpose];
    const destructive = props.purpose === 'delete_account';

    return [
      brandHeader(ctx),
      accentRule(ctx),
      // No button anywhere: a code email with a clickable link teaches users to
      // click links in code emails, which is exactly the phishing vector.
      band(
        [
          title(copy.title, { key: 'h' }),
          lede(copy.lede, { key: 'l' }),
          <CodeToken key="code" code={props.code} groupSize={3} containerPadding={`0px 0px ${space.md} 0px`} />,
          small(`This code expires in <strong>${props.expiresInMinutes} minutes</strong>.`, {
            key: 'e',
            gap: space.none,
          }),
        ],
        { pt: space.xs, pb: space.xl, key: 'main' },
      ),
      band(
        [
          <Callout
            key="warn"
            tone={destructive ? 'danger' : 'warning'}
            title="Never share this code"
            body={`Our team will never ask you for it. If you did not ask to ${destructive ? 'delete your account' : 'sign in'}, ignore this email and your account stays as it is.`}
            containerPadding="0px"
          />,
        ],
        { pt: space.none, pb: space.xxl, key: 'warning' },
      ),
      ...footer(ctx),
    ];
  },
});
