import type { BaseTemplateProps } from '../schema/common.js';

/**
 * Shared demo identity. Swap these values to rebrand every template at once.
 * Both colours are omitted on purpose so the samples show the system's own
 * accent; setting them is how a brand overrides it.
 */
export const demoBase: Omit<BaseTemplateProps, 'previewText'> = {
  branding: {
    name: 'Nexonauts',
    logoWidth: 132,
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
