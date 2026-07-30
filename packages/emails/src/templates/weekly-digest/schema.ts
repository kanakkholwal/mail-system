import { z } from 'zod';
import { baseTemplateSchema } from '../../schema/common.js';

const trendSchema = z.object({
  label: z.string().min(1),
  value: z.string().min(1),
  /** Direction relative to the previous period. `flat` prints no arrow. */
  direction: z.enum(['up', 'down', 'flat']).default('flat'),
  delta: z.string().optional(),
  /** True when a rise is bad, such as error rate. Decouples colour from arrow. */
  inverse: z.boolean().default(false),
});

export const weeklyDigestSchema = baseTemplateSchema.extend({
  periodStart: z.iso.date(),
  periodEnd: z.iso.date(),
  dashboardUrl: z.url(),
  metrics: z.array(trendSchema).min(1).max(6),
  /** Items needing attention. An empty list renders a genuine empty state. */
  needsAttention: z.array(z.object({ title: z.string(), body: z.string(), url: z.url().optional() })).max(4).default([]),
  highlight: z.object({ label: z.string(), percent: z.number().min(0).max(100), value: z.string() }).optional(),
});

export type WeeklyDigestProps = z.infer<typeof weeklyDigestSchema>;
export type DigestTrend = z.infer<typeof trendSchema>;
