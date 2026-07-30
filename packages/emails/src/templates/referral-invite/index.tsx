import type { ReactElement } from 'react';
import {
  accentRule, band, brandHeader, CodeToken, cta, DataList, divider, fallbackLink, footer, label, lede,
  Meter, small, space, title,
} from '../../kit/index.js';
import { defineTemplate } from '../../template.js';
import { demoBaseMarketing } from '../../samples/common.js';
import { referralInviteSchema, type ReferralInviteProps } from './schema.js';

export default defineTemplate<ReferralInviteProps>({
  meta: {
    key: 'referral_invite',
    name: 'Referral invite',
    genre: 'engagement',
    description: 'Referral ask that states both rewards concretely and shows the programme cap rather than hiding it.',
    modes: ['email', 'web'],
    primaryAction: 'Share your link',
    requiresUnsubscribe: true,
  },
  schema: referralInviteSchema,

  subject: (props) => `Give a friend ${props.rewardForFriend}`.slice(0, 78),

  sample: {
    ...demoBaseMarketing,
    previewText: 'They get two months free, you get one. Same link, no forms.',
    referralUrl: 'https://nexonauts.com/r/PRIYA-8QK2',
    referralCode: 'PRIYA8QK2',
    rewardForYou: 'one month free',
    rewardForFriend: 'two months free',
    progress: { referred: 3, cap: 12 },
    termsUrl: 'https://nexonauts.com/legal/referrals',
  },

  build(props, ctx): ReactElement[] {
    const rows: ReactElement[] = [brandHeader(ctx), accentRule(ctx)];
    const capped = props.progress ? props.progress.referred >= props.progress.cap : false;

    rows.push(
      band(
        [
          title(`Give ${props.rewardForFriend}, get ${props.rewardForYou}`, { key: 'h' }),
          lede(
            `Anyone who signs up through your link gets ${props.rewardForFriend}. Once they stay past their first month, you get ${props.rewardForYou} credited automatically.`,
            { key: 'l' },
          ),
          ...(capped
            ? []
            : [
                cta({
                  ctx,
                  label: 'Share your link',
                  href: props.referralUrl,
                  fullWidth: true,
                  gap: space.sm,
                  key: 'c',
                }),
                fallbackLink(ctx, props.referralUrl, 'Or copy your link:'),
              ]),
        ],
        { pt: space.xs, pb: space.xl, key: 'hero' },
      ),
    );

    rows.push(
      band(
        [
          divider({ gap: space.none, key: 'd' }),
          label('Your code', { key: 'cl', gap: space.sm }),
          <CodeToken key="code" code={props.referralCode} groupSize={5} containerPadding={`0px 0px ${space.md} 0px`} />,
          small('Works anywhere: a message, a talk, a README.', { key: 'cn', gap: space.none }),
        ],
        { pt: space.none, pb: space.lg, key: 'code' },
      ),
    );

    // A capped programme that hides its cap is a dark pattern, so it is shown.
    if (props.progress) {
      const pct = Math.round((props.progress.referred / props.progress.cap) * 100);
      rows.push(
        band(
          [
            divider({ gap: space.none, key: 'pd' }),
            label('Your progress', { key: 'pl', gap: space.md }),
            <Meter
              key="meter"
              percent={pct}
              label={`${props.progress.referred} of ${props.progress.cap} rewarded referrals`}
              value={`${props.progress.referred}/${props.progress.cap}`}
              containerPadding={`0px 0px ${space.md} 0px`}
            />,
            small(
              capped
                ? 'You have reached the cap for this programme. Thank you, genuinely.'
                : `The programme is capped at ${props.progress.cap} rewarded referrals per account.`,
              { key: 'pn', gap: space.none },
            ),
          ],
          { pt: space.none, pb: space.lg, key: 'progress' },
        ),
      );
    }

    if (props.termsUrl) {
      rows.push(
        band(
          [
            <DataList
              key="terms"
              rows={[
                { key: 'Reward for them', value: props.rewardForFriend },
                { key: 'Reward for you', value: props.rewardForYou },
                { key: 'Credited', value: 'After their first paid month' },
              ]}
              containerPadding={`0px 0px ${space.md} 0px`}
            />,
            small(`Full terms are on the <a href="${props.termsUrl}">referral programme page</a>.`, {
              key: 't',
              gap: space.none,
            }),
          ],
          { pt: space.none, pb: space.xxl, key: 'terms' },
        ),
      );
    }

    rows.push(...footer(ctx, { showSocials: true }));
    return rows;
  },
});
