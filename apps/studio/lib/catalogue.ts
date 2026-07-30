import 'server-only';
import {
  getTemplate,
  hasTemplate,
  listTemplates,
  renderTemplate,
  renderTemplateDesign,
  RenderRuleError,
  TemplateValidationError,
  type Genre,
  type RenderMode,
  type TemplateMeta,
} from '@better-mailer/emails';
import { z } from 'zod';
import type { JsonValue, SchemaNode } from './json-schema';

export const GENRE_ORDER: Genre[] = [
  'auth',
  'security',
  'billing',
  'activation',
  'engagement',
  'collaboration',
  'commerce',
  'document',
];

export interface CatalogueEntry extends TemplateMeta {
  subject: string;
  previewText: string;
}

function previewTextOf(sample: unknown): string {
  return typeof sample === 'object' && sample !== null && 'previewText' in sample
    ? String((sample as { previewText: unknown }).previewText)
    : '';
}

export function catalogue(): CatalogueEntry[] {
  return listTemplates().map((meta) => {
    const template = getTemplate(meta.key);
    return { ...meta, subject: template.subject(template.sample), previewText: previewTextOf(template.sample) };
  });
}

export function genresInUse(): Genre[] {
  const present = new Set(listTemplates().map((meta) => meta.genre));
  return GENRE_ORDER.filter((genre) => present.has(genre));
}

export function entryFor(key: string): { meta: TemplateMeta; schema: SchemaNode; sample: JsonValue } | undefined {
  if (!hasTemplate(key)) return undefined;
  const template = getTemplate(key);
  const schema = z.toJSONSchema(template.schema, { io: 'input', unrepresentable: 'any' });
  return {
    meta: { ...template.meta, modes: [...template.meta.modes] },
    // toJSONSchema hands back objects React refuses to serialise across the RSC
    // boundary, so the tree is flattened to plain data before it crosses.
    schema: JSON.parse(JSON.stringify(schema)) as SchemaNode,
    sample: JSON.parse(JSON.stringify(template.sample)) as JsonValue,
  };
}

export interface RenderOutcome {
  ok: boolean;
  subject: string;
  previewText: string;
  html: string;
  text: string;
  bytes: number;
  /** Field path to message, so the form can put each error beside its input. */
  issues: { path: string; message: string }[];
  message?: string;
}

export function render(key: string, payload: unknown, mode: RenderMode): RenderOutcome {
  const empty = { subject: '', previewText: '', html: '', text: '', bytes: 0 };
  if (!hasTemplate(key)) return { ...empty, ok: false, issues: [], message: `Unknown template "${key}".` };

  try {
    const result = renderTemplate(getTemplate(key), payload, { mode });
    return {
      ok: true,
      subject: result.subject,
      previewText: result.previewText,
      html: result.html,
      text: result.text,
      bytes: Buffer.byteLength(result.html, 'utf8'),
      issues: [],
    };
  } catch (error) {
    if (error instanceof TemplateValidationError) {
      const issues = (error.issues as { path: (string | number)[]; message: string }[]).map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      }));
      return { ...empty, ok: false, issues, message: `${issues.length} field${issues.length === 1 ? '' : 's'} need attention` };
    }
    if (error instanceof RenderRuleError) {
      return { ...empty, ok: false, issues: [], message: error.message };
    }
    throw error;
  }
}

export function designJson(key: string, payload: unknown, mode: RenderMode): unknown {
  return renderTemplateDesign(getTemplate(key), payload, mode);
}
