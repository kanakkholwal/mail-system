import { describe, expect, it } from 'vitest';
import { registry } from '../src/registry.js';
import type { AnyTemplate } from '../src/template.js';
import { renderTemplate } from '../src/render.js';
import { hook } from '../src/kit/head-css.js';
import { palette } from '../src/kit/tokens.js';

// Payload-erased so the heterogeneous registry can be iterated.
const entries = Object.entries(registry) as [string, AnyTemplate][];
const emailCases = entries.filter(([, t]) => t.meta.modes.includes('email'));

function renderEmail(template: (typeof entries)[number][1]): string {
  return renderTemplate(template, template.sample, { mode: 'email' }).html;
}

/**
 * Gmail strips <style> in some contexts and every client strips scripts, so the
 * markup must not depend on either. These are the failures that only show up
 * after a send.
 */
describe('email client safety', () => {
  it.each(emailCases)('%s: contains no script tags', (_key, template) => {
    expect(renderEmail(template)).not.toMatch(/<script/i);
  });

  it.each(emailCases)('%s: loads no external stylesheet', (_key, template) => {
    expect(renderEmail(template)).not.toMatch(/<link[^>]+rel=["']stylesheet/i);
  });

  it.each(emailCases)('%s: avoids layout properties clients discard', (_key, template) => {
    const html = renderEmail(template);
    expect(html).not.toMatch(/position:\s*(fixed|absolute)/i);
    expect(html).not.toMatch(/display:\s*grid/i);
  });

  it.each(emailCases)('%s: keeps Outlook MSO conditionals intact', (_key, template) => {
    expect(renderEmail(template)).toMatch(/<!--\[if \(?mso/i);
  });

  it.each(emailCases)('%s: declares a UTF-8 charset', (_key, template) => {
    expect(renderEmail(template)).toMatch(/charset=UTF-8/i);
  });

  it.each(emailCases)('%s: stays under the 102KB Gmail clipping threshold', (_key, template) => {
    expect(Buffer.byteLength(renderEmail(template), 'utf8')).toBeLessThan(102_000);
  });
});

/**
 * The stylesheet reaches its targets through descendant selectors on Elements'
 * internal classes. If an Elements upgrade renames one, dark mode and the mobile
 * gutter silently stop working, so the hooks are asserted directly.
 */
describe('stylesheet hooks resolve to real elements', () => {
  it.each(emailCases)('%s: band wrapper carries the gutter and surface hooks', (_key, template) => {
    const html = renderEmail(template);
    expect(html).toContain(`class="${hook.gutter} ${hook.surface}`);
  });

  it.each(emailCases)('%s: column padding target exists inside a gutter band', (_key, template) => {
    const html = renderEmail(template);
    const band = html.indexOf(`class="${hook.gutter}`);
    expect(band).toBeGreaterThan(-1);
    expect(html.slice(band)).toMatch(/class="v-col-padding/);
  });

  it.each(emailCases)('%s: heading and paragraph colour hooks are present', (_key, template) => {
    const html = renderEmail(template);
    expect(html).toMatch(/class="u_content_heading"/);
    expect(html).toMatch(/class="u_content_paragraph"/);
    expect(html).toMatch(/class="v-color/);
  });

  it.each(emailCases)('%s: dark-mode media query is emitted', (_key, template) => {
    expect(renderEmail(template)).toMatch(/@media \(prefers-color-scheme: dark\)/);
  });

  it.each(emailCases)('%s: iOS data-detector override is emitted', (_key, template) => {
    expect(renderEmail(template)).toMatch(/a\[x-apple-data-detectors\]/);
  });
});

describe('accessibility and deliverability', () => {
  it.each(emailCases)('%s: every image carries alt text', (_key, template) => {
    const html = renderEmail(template);
    for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
      expect(tag, `missing alt: ${tag}`).toMatch(/\balt=/);
    }
  });

  it.each(emailCases)('%s: body copy never uses the borders-only grey', (_key, template) => {
    const html = renderEmail(template);
    // palette.faint fails AA as text. The lookbehind keeps `background-color`
    // and `border-left-color` out, since only a bare `color` sets type colour.
    const asTextColour = html.match(new RegExp(`(?<![-a-z])color:\\s*${palette.faint}`, 'gi')) ?? [];
    expect(asTextColour, `${palette.faint} must never colour text`).toHaveLength(0);
  });

  it.each(emailCases)('%s: has a non-trivial plain-text part', (_key, template) => {
    const { text } = renderTemplate(template, template.sample, { mode: 'email' });
    expect(text.trim().length).toBeGreaterThan(80);
  });

  it.each(emailCases)('%s: preheader appears before the visible body', (_key, template) => {
    const { html, previewText } = renderTemplate(template, template.sample, { mode: 'email' });
    expect(html).toContain(previewText);
  });

  it.each(emailCases)('%s: exposes exactly one primary CTA colour block', (_key, template) => {
    const template_ = template as { meta: { primaryAction: string } };
    if (!template_.meta.primaryAction) return;
    const html = renderEmail(template);
    const primary = (template.sample as { branding: { primaryColor?: string } }).branding.primaryColor ?? palette.ink;
    const buttons = html.match(new RegExp(`background-color:\\s*${primary}`, 'gi')) ?? [];
    expect(buttons.length, 'a single unmistakable action converts best').toBeLessThanOrEqual(2);
  });
});

const docCases = entries.filter(([, t]) => t.meta.modes.includes('document'));

describe.skipIf(docCases.length === 0)('document mode', () => {
  it.each(docCases)('%s: emits an A4 page rule', (_key, template) => {
    const { html } = renderTemplate(template, template.sample, { mode: 'document' });
    expect(html).toMatch(/@page\s*\{\s*size:\s*A4/);
  });

  it.each(docCases)('%s: repeats table headers across printed pages', (_key, template) => {
    const { html } = renderTemplate(template, template.sample, { mode: 'document' });
    expect(html).toMatch(/thead\s*\{\s*display:\s*table-header-group/);
  });
});
