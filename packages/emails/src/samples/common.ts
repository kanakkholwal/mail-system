import type { BaseTemplateProps } from '../schema/common.js';

/** Shared demo identity. Swap these values to rebrand every template at once. */
export const demoBase: Omit<BaseTemplateProps, 'previewText'> = {
  branding: {
    name: 'Nexonauts',
    logoWidth: 132,
    primaryColor: '#0B0B0F',
    accentColor: '#1F4BF5',
    websiteUrl: 'https://nexonauts.com',
    supportUrl: 'https://nexonauts.com/help',
    socials: [
      { platform: 'x', url: 'https://x.com/nexonauts' },
      { platform: 'github', url: 'https://github.com/nexonauts' },
      { platform: 'linkedin', url: 'https://linkedin.com/company/nexonauts' },
    ],
  },
  legal: {
    postalAddress: 'Nexonauts, 14 Brunel Yard, Bengaluru 560095, India',
    preferencesUrl: 'https://nexonauts.com/settings/notifications',
    copyrightYear: 2026,
  },
  sender: { kind: 'automated', replyTo: 'support@nexonauts.com' },
  locale: { tag: 'en-US', direction: 'ltr' },
  recipientName: 'Priya',
};

/** Marketing-class templates additionally need a working unsubscribe URL. */
export const demoBaseMarketing: Omit<BaseTemplateProps, 'previewText'> = {
  ...demoBase,
  legal: { ...demoBase.legal, unsubscribeUrl: 'https://nexonauts.com/unsubscribe?t=demo' },
};
