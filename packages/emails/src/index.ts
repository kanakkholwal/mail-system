export { getTemplate, hasTemplate, listByGenre, listTemplates, registry, type TemplateKey } from './registry.js';
export {
  renderTemplate,
  renderTemplateDesign,
  TemplateValidationError,
  type RenderOptions,
  type RenderResult,
} from './render.js';
export { defineTemplate, GENRES, type AnyTemplate, type Genre, type Template, type TemplateMeta } from './template.js';
export {
  baseTemplateSchema,
  brandingSchema,
  legalSchema,
  localeSchema,
  senderSchema,
  socialSchema,
  type BaseTemplateProps,
  type Branding,
  type Legal,
  type Locale,
  type Sender,
  type Social,
} from './schema/common.js';
export { demoBase, demoBaseMarketing } from './samples/common.js';
export type { RenderMode } from './kit/tokens.js';
