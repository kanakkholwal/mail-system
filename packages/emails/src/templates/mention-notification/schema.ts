import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const mentionNotificationSchema = baseTemplateSchema.extend({
  actor: z.object({ name: z.string().min(1), avatarUrl: z.url().optional() }),
  /** Where it happened, so the notice is legible without opening the app. */
  context: z.object({ kind: z.enum(['comment', 'review', 'task', 'document']), title: z.string().min(1) }),
  /** The comment itself. Trimmed to keep the email skimmable. */
  excerpt: z.string().min(1).max(600),
  mentionedAt: z.iso.datetime(),
  replyUrl: z.url(),
  /** Other unread mentions, so one email can stand in for several. */
  alsoWaiting: z.number().int().nonnegative().default(0),
  muteThreadUrl: z.url().optional(),
});

export type MentionNotificationProps = z.infer<typeof mentionNotificationSchema>;
