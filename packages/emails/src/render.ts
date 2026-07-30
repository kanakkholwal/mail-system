import { createElement, type ReactElement } from 'react';
import {
  Document,
  Email,
  Page,
  renderToHtml,
  renderToJson,
  renderToPlainText,
  type DesignJSON,
} from '@unlayer/react-elements';
import type { Ctx } from './kit/context.js';
import { headCss } from './kit/head-css.js';
import { canvasColor, contentWidth, fonts, palette, type RenderMode } from './kit/tokens.js';
import type { BaseTemplateProps } from './schema/common.js';
import type { AnyTemplate } from './template.js';

export interface RenderOptions {
  mode?: RenderMode;
  /** Overrides the template's own subject line. */
  subject?: string;
}

export interface RenderResult {
  key: string;
  mode: RenderMode;
  subject: string;
  previewText: string;
  html: string;
  /** The text/plain MIME part. Sending without one measurably hurts placement. */
  text: string;
  design: DesignJSON;
}

export class TemplateValidationError extends Error {
  constructor(
    readonly key: string,
    readonly issues: unknown,
  ) {
    super(`Invalid payload for template "${key}"`);
    this.name = 'TemplateValidationError';
  }
}

const ROOTS = { email: Email, web: Page, document: Document } as const;

/**
 * Injects the stylesheet before </head>, leaving Elements' own document shell
 * (doctype, MSO conditionals, component CSS) untouched.
 */
function injectHeadCss(html: string, mode: RenderMode): string {
  const style = `<style type="text/css" data-bm="${mode}">\n${headCss(mode)}\n</style>\n`;
  if (!html.includes('</head>')) {
    throw new Error(`injectHeadCss: no </head> in ${mode} output. Elements' shell changed.`);
  }
  return html.replace('</head>', `${style}</head>`);
}

function buildTree(template: AnyTemplate, props: BaseTemplateProps, mode: RenderMode): ReactElement {
  const ctx: Ctx = {
    mode,
    branding: props.branding,
    legal: props.legal,
    sender: props.sender,
    locale: props.locale,
  };

  const rows = template.build(props, ctx);
  return createElement(
    ROOTS[mode],
    {
      backgroundColor: canvasColor(mode),
      contentWidth: contentWidth(mode),
      contentAlign: 'center',
      fontFamily: fonts.sans,
      textColor: palette.body,
      previewText: props.previewText,
      linkStyle: {
        linkColor: props.branding.accentColor ?? palette.accent,
        linkHoverColor: props.branding.accentColor ?? palette.accentHover,
        linkUnderline: true,
        linkHoverUnderline: true,
      },
    },
    rows,
  );
}

export function renderTemplate(
  template: AnyTemplate,
  payload: unknown,
  options: RenderOptions = {},
): RenderResult {
  const mode = options.mode ?? 'email';

  if (!template.meta.modes.includes(mode)) {
    throw new Error(
      `Template "${template.meta.key}" does not support "${mode}" mode. Supported: ${template.meta.modes.join(', ')}.`,
    );
  }

  const parsed = template.schema.safeParse(payload);
  if (!parsed.success) throw new TemplateValidationError(template.meta.key, parsed.error.issues);
  const props = parsed.data as BaseTemplateProps;

  if (template.meta.requiresUnsubscribe && !props.legal.unsubscribeUrl) {
    throw new Error(
      `Template "${template.meta.key}" is marketing-class and requires legal.unsubscribeUrl.`,
    );
  }

  const tree = buildTree(template, props, mode);
  const html = injectHeadCss(
    renderToHtml(tree, {
      title: template.subject(props),
      ...(mode === 'email' ? {} : { fonts: [...fonts.webStylesheets] }),
    }),
    mode,
  );

  return {
    key: template.meta.key,
    mode,
    subject: options.subject ?? template.subject(props),
    previewText: props.previewText,
    html,
    text: renderToPlainText(tree),
    design: renderToJson(tree),
  };
}

/** Design JSON for opening a template in the Unlayer visual builder. */
export function renderTemplateDesign(
  template: AnyTemplate,
  payload: unknown,
  mode: RenderMode = 'email',
): DesignJSON {
  const parsed = template.schema.safeParse(payload);
  if (!parsed.success) throw new TemplateValidationError(template.meta.key, parsed.error.issues);
  return renderToJson(buildTree(template, parsed.data as BaseTemplateProps, mode));
}
