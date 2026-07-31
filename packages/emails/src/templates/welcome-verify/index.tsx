import type { ReactElement } from 'react';
import {
  band, bandSplit, CodeSlab, fallbackLink, footer, heading, palette, recordCta, recordHeadline, recordLede,
  recordMark, recordMasthead, recordNote, recordSection, small, space, text as bodyText,
} from '../../kit/index.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { welcomeVerifySchema, type WelcomeVerifyProps } from './schema.js';

/**
 * Steps are indexed with a mono numeral in its own column. The index is what
 * turns three paragraphs into a sequence the reader can resume later.
 */
function step(index: number, title: string, body: string, last: boolean): ReactElement {
  const numeral = bodyText(
    `<span style="font-family:'Geist Mono',ui-monospace,Menlo,Consolas,monospace;font-size:22px;font-weight:600;color:${palette.muted};letter-spacing:-0.02em;">${String(index + 1).padStart(2, '0')}</span>`,
    { gap: space.none, key: 'n' },
  );
  return bandSplit(
    [numeral],
    [heading(title, { gap: space.xxs, key: 't' }), small(body, { gap: space.none, key: 'b' })],
    {
      ratio: 'narrowWide',
      noStackMobile: true,
      gap: space.xs,
      pt: space.none,
      pb: last ? space.xl : space.lg,
      key: `step-${index}`,
    },
  );
}

export default defineTemplate<WelcomeVerifyProps>({
  meta: {
    key: 'welcome_verify',
    name: 'Welcome and verify email',
    genre: 'auth',
    description: 'One act above the fold, then an indexed sequence of what the account is actually for.',
    modes: ['email', 'web'],
    primaryAction: 'Verify email address',
    requiresUnsubscribe: false,
  },
  schema: welcomeVerifySchema,

  subject: (props) => `Confirm your email to finish setting up ${props.branding.name}`,

  sample: {
    ...demoBase,
    previewText: 'One click confirms your address and unlocks your workspace.',
    verifyUrl: 'https://nexonauts.com/auth/verify?token=b71fd0c9ae4425f3',
    verifyCode: 'K7M2QP',
    expiresInHours: 24,
    nextSteps: [
      { title: 'Connect your first project', body: 'Point us at a repository and we index it in under a minute.' },
      { title: 'Invite a teammate', body: 'Workspaces with two or more people ship roughly twice as often.' },
    ],
  },

  build(props, ctx): ReactElement[] {
    const rows: ReactElement[] = recordMasthead(ctx, { stamp: 'Account · Verify address' });

    rows.push(
      band(
        [
          // The headline carries the act. A greeting in its place reads warmer and
          // converts worse, because the reader has to hunt for the ask.
          recordHeadline('Confirm your email'),
          recordMark(),
          recordLede(
            `${props.recipientName ? `${props.recipientName}, you` : 'You'} are one step from a working ${props.branding.name} workspace. Confirming this address secures the account and switches on notifications.`,
          ),
          recordCta(ctx, { label: 'Verify email address', href: props.verifyUrl }),
          recordNote(`Expires in ${props.expiresInHours} hours · Nobody else can use this link`),
        ],
        { pt: space.none, pb: space.xl, key: 'act' },
      ),
    );

    if (props.verifyCode) {
      rows.push(
        band(
          [
            <CodeSlab
              key="code"
              code={props.verifyCode}
              groupSize={3}
              stamp="Or type this code into the app"
              meta={`Same ${props.expiresInHours}-hour window`}
              containerPadding="0px"
            />,
          ],
          { pt: space.none, pb: space.xl, gutter: false, key: 'code' },
        ),
      );
    }

    if (props.nextSteps.length > 0) {
      rows.push(
        band([...recordSection('Once you are in', 'st')], { pt: space.none, pb: space.md, key: 'steps-head' }),
      );
      props.nextSteps.forEach((s, index) => {
        rows.push(step(index, s.title, s.body, index === props.nextSteps.length - 1));
      });
    }

    rows.push(
      band([fallbackLink(ctx, props.verifyUrl)], { pt: space.none, pb: space.xxl, key: 'fallback' }),
    );

    rows.push(...footer(ctx));
    return rows;
  },
});
