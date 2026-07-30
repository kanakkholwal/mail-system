import {
  getTemplate,
  hasTemplate,
  listTemplates,
  renderTemplate,
  renderTemplateDesign,
  type AnyTemplate,
  type RenderMode,
  type TemplateMeta,
} from '@better-mailer/emails';
import { Hono } from 'hono';
import { z } from 'zod';
import type { AppEnv, Deps } from '../context.js';
import { HttpError } from '../errors.js';
import { renderModeSchema } from '../schema.js';

function resolve(key: string): AnyTemplate {
  if (!hasTemplate(key)) {
    throw new HttpError(404, 'not_found', `Unknown template "${key}".`, {
      available: listTemplates().map((meta) => meta.key),
    });
  }
  return getTemplate(key);
}

function mode(raw: string | undefined): RenderMode {
  const parsed = renderModeSchema.safeParse(raw ?? 'email');
  if (!parsed.success) {
    throw new HttpError(400, 'bad_request', 'Query "mode" must be email, web or document.');
  }
  return parsed.data;
}

/** Input mapping, so a field with a default reads as optional to the caller. */
export function payloadJsonSchema(template: AnyTemplate): unknown {
  return z.toJSONSchema(template.schema, { io: 'input', unrepresentable: 'any' });
}

function describe(meta: TemplateMeta): Record<string, unknown> {
  return {
    ...meta,
    marketingClass: meta.requiresUnsubscribe,
    hasPrimaryAction: meta.primaryAction !== '',
  };
}

export function templateRoutes(_deps: Deps): Hono<AppEnv> {
  const routes = new Hono<AppEnv>();

  routes.get('/', (c) => {
    const genre = c.req.query('genre');
    const wanted = c.req.query('mode');
    const withSchema = c.req.query('schema') === '1';

    let metas = listTemplates();
    if (genre) metas = metas.filter((meta) => meta.genre === genre);
    if (wanted) {
      const asMode = mode(wanted);
      metas = metas.filter((meta) => meta.modes.includes(asMode));
    }

    return c.json({
      count: metas.length,
      templates: metas.map((meta) => ({
        ...describe(meta),
        ...(withSchema ? { payloadSchema: payloadJsonSchema(getTemplate(meta.key)) } : {}),
      })),
    });
  });

  routes.get('/:key', (c) => {
    const template = resolve(c.req.param('key'));
    return c.json({
      ...describe(template.meta),
      subject: template.subject(template.sample),
      payloadSchema: payloadJsonSchema(template),
      sample: template.sample,
    });
  });

  routes.get('/:key/preview', (c) => {
    const template = resolve(c.req.param('key'));
    const rendered = renderTemplate(template, template.sample, { mode: mode(c.req.query('mode')) });
    c.header('content-type', 'text/html; charset=utf-8');
    c.header('x-content-type-options', 'nosniff');
    c.header('cache-control', 'no-store');
    return c.body(rendered.html);
  });

  routes.get('/:key/text', (c) => {
    const template = resolve(c.req.param('key'));
    const rendered = renderTemplate(template, template.sample, { mode: mode(c.req.query('mode')) });
    c.header('content-type', 'text/plain; charset=utf-8');
    return c.body(rendered.text);
  });

  /** Design JSON opens the sample straight in the Unlayer visual builder. */
  routes.get('/:key/design', (c) => {
    const template = resolve(c.req.param('key'));
    return c.json(renderTemplateDesign(template, template.sample, mode(c.req.query('mode'))));
  });

  return routes;
}
