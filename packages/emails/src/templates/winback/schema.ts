import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

export const winbackSchema = baseTemplateSchema.extend({
  /** Whole days since the last session. Drives how apologetic the copy is. */
  inactiveDays: z.number().int().min(7).max(3650),
  returnUrl: z.url(),
  /** Concrete changes shipped while they were away, newest first. */
  shipped: z.array(z.object({ title: z.string(), body: z.string() })).max(3).default([]),
  /** Their own data, so returning resumes something rather than starting over. */
  lastProject: z.object({ name: z.string(), url: z.url() }).optional(),
});

export type WinbackProps = z.infer<typeof winbackSchema>;
