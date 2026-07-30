import type { ReactElement } from 'react';
import { accentRule, band, brandHeader, CodeToken, cta, divider, fallbackLink, footer, heading, label, lede, small, space, text, title } from '../../kit/index.js';
import { defineTemplate } from '../../template.js';
import { demoBase } from '../../samples/common.js';
import { welcomeVerifySchema, type WelcomeVerifyProps } from './schema.js';

export default defineTemplate<WelcomeVerifyProps>({
  meta: {
    key: 'welcome_verify',
    name: 'Welcome and verify email',
    genre: 'auth',
    description: 'Activation-focused welcome that leads with one verify action, then sets up first steps.',
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
    const greeting = props.recipientName ? `Welcome, ${props.recipientName}.` : 'Welcome.';
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];

    rows.push(
      band(
        [
          title(`${greeting} Confirm your email`, { key: 'h' }),
          lede(
            `You are one step from a working ${props.branding.name} workspace. Confirm this address so we can secure your account and turn on notifications.`,
            { key: 'l' },
          ),
          cta({
            ctx,
            label: 'Verify email address',
            href: props.verifyUrl,
            fullWidth: true,
            gap: space.sm,
            key: 'c',
          }),
          small(`The link expires in <strong>${props.expiresInHours} hours</strong>.`, { key: 'e', gap: space.md }),
          fallbackLink(ctx, props.verifyUrl),
        ],
        { pt: space.xs, pb: space.xl, key: 'main' },
      ),
    );

    if (props.verifyCode) {
      rows.push(
        band(
          [
            divider({ gap: space.none, key: 'd' }),
            label('Or enter this code', { key: 'cl', gap: space.sm }),
            <CodeToken key="code" code={props.verifyCode} groupSize={3} containerPadding="0px" />,
          ],
          { pt: space.none, pb: space.lg, key: 'code-band' },
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
          text(step.body, {
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
