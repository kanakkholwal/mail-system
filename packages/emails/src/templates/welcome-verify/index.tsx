import type { ReactElement } from 'react';
import {
  band, CodeToken, divider, fallbackLink, focusedCta, focusedHeader, focusedHeadline, focusedLede,
  focusedNote, focusedRule, footer, heading, label, small, space,
} from '../../kit/index.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { welcomeVerifySchema, type WelcomeVerifyProps } from './schema.js';

export default defineTemplate<WelcomeVerifyProps>({
  meta: {
    key: 'welcome_verify',
    name: 'Welcome and verify email',
    genre: 'auth',
    description: 'A single centred act. Everything that is not the verify button is pushed below the fold.',
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
    const rows: ReactElement[] = [focusedHeader(ctx)];

    rows.push(
      band(
        [
          // The headline always carries the action. A greeting in its place reads
          // warmer and converts worse, because the reader has to hunt for the ask.
          focusedHeadline('Confirm your email'),
          focusedLede(
            `${props.recipientName ? `${props.recipientName}, you` : 'You'} are one step from a working ${props.branding.name} workspace. Confirm this address and we will secure the account and switch on notifications.`,
          ),
          focusedCta(ctx, { label: 'Verify email address', href: props.verifyUrl }),
          focusedNote(`Expires in ${props.expiresInHours} hours. Nobody else can use this link.`),
          focusedRule(),
          fallbackLink(ctx, props.verifyUrl, { align: 'center' }),
        ],
        { pt: space.none, pb: space.xl, key: 'main' },
      ),
    );

    if (props.verifyCode) {
      rows.push(
        band(
          [
            label('Or enter this code', { align: 'center', key: 'cl', gap: space.sm }),
            <CodeToken key="code" code={props.verifyCode} groupSize={3} containerPadding="0px" />,
          ],
          { pt: space.none, pb: space.xxl, key: 'code-band' },
        ),
      );
    }

    if (props.nextSteps.length > 0) {
      const steps: ReactElement[] = [
        divider({ gap: space.none, key: 'sd' }),
        label('Once you are in', { key: 'sl', gap: space.md }),
      ];
      props.nextSteps.forEach((step, index) => {
        steps.push(heading(step.title, { key: `st${index}`, gap: space.xxs }));
        steps.push(
          small(step.body, {
            key: `sb${index}`,
            gap: index === props.nextSteps.length - 1 ? space.none : space.md,
          }),
        );
      });
      rows.push(band(steps, { pt: space.none, pb: space.xxl, key: 'steps' }));
    }

    rows.push(...footer(ctx));
    return rows;
  },
});
