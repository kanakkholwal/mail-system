import { z } from 'zod';

export const HEX_COLOR = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const socialSchema = z.object({
  platform: z.enum(['x', 'linkedin', 'github', 'instagram', 'youtube', 'facebook', 'threads']),
  url: z.url(),
});

/**
 * `logoUrl` is deliberately optional. Images are blocked by default in Outlook
 * and by many Gmail users, so the header falls back to a live-text wordmark.
 */
export const brandingSchema = z.object({
  name: z.string().min(1),
  logoUrl: z.url().optional(),
  logoWidth: z.number().int().min(40).max(320).default(132),
  primaryColor: z.string().regex(HEX_COLOR).optional(),
  accentColor: z.string().regex(HEX_COLOR).optional(),
  websiteUrl: z.url(),
  supportUrl: z.url().optional(),
  socials: z.array(socialSchema).max(6).default([]),
});

export const legalSchema = z.object({
  /** Required by CAN-SPAM for any non-transactional send. */
  postalAddress: z.string().min(1),
  unsubscribeUrl: z.url().optional(),
  preferencesUrl: z.url().optional(),
  /** Rendered verbatim in the footer, so pass a localised string. */
  copyrightYear: z.number().int().min(2000).max(2200),
});

const automatedSender = z.object({
  kind: z.literal('automated'),
  replyTo: z.email().optional(),
});

/** A named human lifts reply and click rates on lifecycle mail. */
const personSender = z.object({
  kind: z.literal('person'),
  name: z.string().min(1),
  role: z.string().optional(),
  email: z.email(),
  avatarUrl: z.url().optional(),
});

export const senderSchema = z.discriminatedUnion('kind', [automatedSender, personSender]);

export const localeSchema = z.object({
  /** BCP 47, drives Intl date and currency formatting. */
  tag: z.string().min(2).default('en-US'),
  direction: z.enum(['ltr', 'rtl']).default('ltr'),
});

/**
 * Every template extends this. `previewText` is the inbox preheader and is the
 * highest-leverage open-rate control after the subject line.
 */
export const baseTemplateSchema = z.object({
  branding: brandingSchema,
  legal: legalSchema,
  sender: senderSchema.default({ kind: 'automated' }),
  locale: localeSchema.default({ tag: 'en-US', direction: 'ltr' }),
  previewText: z.string().min(1).max(140),
  recipientName: z.string().optional(),
});

export type Social = z.infer<typeof socialSchema>;
export type Branding = z.infer<typeof brandingSchema>;
export type Legal = z.infer<typeof legalSchema>;
export type Sender = z.infer<typeof senderSchema>;
export type Locale = z.infer<typeof localeSchema>;
export type BaseTemplateProps = z.infer<typeof baseTemplateSchema>;
