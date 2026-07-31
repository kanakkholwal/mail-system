import type { ReactElement } from 'react';
import {
  band, Callout, CodeSlab, footer, recordLede, recordMasthead, recordNote, recordSection, space,
} from '../../kit/index.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { otpCodeSchema, type OtpCodeProps } from './schema.js';

/**
 * Each purpose names the act being authorised. A code email that says only
 * "here is your code" authorises whatever the phisher is doing on the other end.
 */
const PURPOSE: Record<OtpCodeProps['purpose'], { stamp: string; act: string; lede: string }> = {
  sign_in: {
    stamp: 'Security · One-time code',
    act: 'sign in',
    lede: 'Type this code into the sign-in screen you already have open.',
  },
  confirm_payment: {
    stamp: 'Security · Payment authorisation',
    act: 'authorise a payment',
    lede: 'Type this code to authorise the payment you started. It authorises a charge — nothing else.',
  },
  change_email: {
    stamp: 'Security · Address change',
    act: 'move your account',
    lede: 'Type this code to move your account to this address. Your old address stops receiving mail.',
  },
  delete_account: {
    stamp: 'Security · Deletion',
    act: 'delete your account',
    lede: 'Type this code to permanently delete your account. This cannot be undone.',
  },
};

export default defineTemplate<OtpCodeProps>({
  meta: {
    key: 'otp_code',
    name: 'One-time passcode',
    genre: 'auth',
    description: 'Code set as the payload of the page on an ink slab, with no link anywhere and the authorised act named.',
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
      ...recordMasthead(ctx, { stamp: copy.stamp, severity: destructive ? 'alert' : 'none' }),

      // The code carries the message, so nothing precedes it but the masthead and
      // nothing anywhere in this email is clickable: a code mail that trains the
      // reader to click is the exact vector a code exists to close.
      band(
        [
          <CodeSlab
            key="code"
            code={props.code}
            groupSize={3}
            stamp="Enter this code"
            meta={`Expires in ${props.expiresInMinutes} minutes · Single use`}
            containerPadding="0px"
          />,
        ],
        { pt: space.xl, pb: space.xl, gutter: false, key: 'payload' },
      ),

      band(
        [
          ...recordSection('What it does'),
          recordLede(copy.lede),
          recordNote(`Requested for: ${copy.act}. ${props.branding.name} staff will never ask you to read it out.`),
        ],
        { pt: space.none, pb: space.xl, key: 'meaning' },
      ),

      band(
        [
          <Callout
            key="warn"
            tone={destructive ? 'danger' : 'warning'}
            title={destructive ? 'Did not ask to delete your account?' : 'Did not ask to sign in?'}
            body={`Ignore this email and the code expires unused. ${destructive ? 'Nothing is deleted without it.' : 'Nothing changes without it.'} If codes keep arriving, someone knows your address — change your password.`}
            containerPadding="0px"
          />,
        ],
        { pt: space.none, pb: space.xxl, key: 'warning' },
      ),

      ...footer(ctx),
    ];
  },
});
