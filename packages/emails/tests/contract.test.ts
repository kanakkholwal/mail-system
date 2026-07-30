import { describe, expect, it } from 'vitest';
import { registry } from '../src/registry.js';
import { renderTemplate } from '../src/render.js';
import { GENRES, type AnyTemplate } from '../src/template.js';

// Payload-erased so the heterogeneous registry can be iterated.
const entries = Object.entries(registry) as [string, AnyTemplate][];

describe('registry', () => {
  it('has at least one template', () => {
    expect(entries.length).toBeGreaterThan(0);
  });

  it.each(entries)('%s: meta key matches its registry key', (key, template) => {
    expect(template.meta.key).toBe(key);
  });

  it.each(entries)('%s: declares a known genre and at least one mode', (_key, template) => {
    expect(GENRES).toContain(template.meta.genre);
    expect(template.meta.modes.length).toBeGreaterThan(0);
  });

  it.each(entries)('%s: sample payload satisfies its own schema', (_key, template) => {
    const parsed = template.schema.safeParse(template.sample);
    expect(parsed.success, JSON.stringify(parsed.error?.issues, null, 2)).toBe(true);
  });

  it.each(entries)('%s: subject is present and not truncated by inbox width', (_key, template) => {
    const subject = template.subject(template.sample);
    expect(subject.length).toBeGreaterThan(3);
    expect(subject.length).toBeLessThanOrEqual(78);
  });

  it.each(entries)('%s: preview text complements rather than repeats the subject', (_key, template) => {
    const { previewText } = template.sample as { previewText: string };
    expect(previewText.length).toBeGreaterThan(10);
    expect(previewText.toLowerCase()).not.toBe(template.subject(template.sample).toLowerCase());
  });
});

/**
 * Elements drops wrapper components and fragments from renderToJson without
 * throwing, so a template can render correct HTML while producing empty design
 * JSON. Only these assertions catch that.
 */
describe('design JSON round-trip', () => {
  const cases = entries.flatMap(([key, template]) =>
    template.meta.modes.map((mode) => ({ key, template, mode })),
  );

  it.each(cases)('$key/$mode emits non-empty rows and contents', ({ template, mode }) => {
    const { design } = renderTemplate(template, template.sample, { mode });
    expect(design.body.rows.length).toBeGreaterThan(0);
    const contents = design.body.rows.flatMap((row) => row.columns.flatMap((col) => col.contents));
    expect(contents.length).toBeGreaterThan(0);
  });

  it.each(cases)('$key/$mode every row has at least one column', ({ template, mode }) => {
    const { design } = renderTemplate(template, template.sample, { mode });
    for (const row of design.body.rows) expect(row.columns.length).toBeGreaterThan(0);
  });
});

describe('validation', () => {
  it.each(entries)('%s: rejects an empty payload', (_key, template) => {
    expect(() => renderTemplate(template, {})).toThrow();
  });

  it.each(entries)('%s: rejects an unsupported render mode', (_key, template) => {
    const unsupported = (['email', 'web', 'document'] as const).find(
      (mode) => !template.meta.modes.includes(mode),
    );
    if (!unsupported) return;
    expect(() => renderTemplate(template, template.sample, { mode: unsupported })).toThrow(/does not support/);
  });

  it.each(entries.filter(([, t]) => t.meta.requiresUnsubscribe))(
    '%s: marketing-class template refuses to render without an unsubscribe URL',
    (_key, template) => {
      const sample = template.sample as { legal: Record<string, unknown> };
      const stripped = { ...sample, legal: { ...sample.legal, unsubscribeUrl: undefined } };
      expect(() => renderTemplate(template, stripped)).toThrow(/unsubscribeUrl/);
    },
  );
});
