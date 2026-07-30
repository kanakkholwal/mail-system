import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const teamInviteSchema = baseTemplateSchema.extend({
  workspaceName: z.string().min(1),
  /** Naming the inviter is the single biggest driver of invite acceptance. */
  inviter: z.object({ name: z.string().min(1), email: z.email(), avatarUrl: z.url().optional() }),
  role: z.enum(['owner', 'admin', 'member', 'viewer', 'billing']),
  acceptUrl: z.url(),
  expiresInDays: z.number().int().min(1).max(90).default(14),
  /** Social proof. Omitted rather than shown as "1 member" for a new workspace. */
  memberCount: z.number().int().min(0).optional(),
  message: z.string().max(400).optional(),
});

export type TeamInviteProps = z.infer<typeof teamInviteSchema>;
