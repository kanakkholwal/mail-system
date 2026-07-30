import type { ReactElement } from 'react';
import type { z } from 'zod';
import type { Ctx } from './kit/context.js';
import type { RenderMode } from './kit/tokens.js';

export const GENRES = [
  'auth',
  'security',
  'billing',
  'activation',
  'engagement',
  'collaboration',
  'commerce',
  'document',
] as const;

export type Genre = (typeof GENRES)[number];

export interface TemplateMeta {
  key: string;
  name: string;
  genre: Genre;
  description: string;
  /** Modes this template is designed for. Rendering another mode is rejected. */
  modes: readonly RenderMode[];
  /** The one action the template exists to drive. Empty for pure notices. */
  primaryAction: string;
  /**
   * True for anything a reasonable recipient could call marketing. The render
   * pipeline refuses to build these without a working unsubscribe URL.
   */
  requiresUnsubscribe: boolean;
}

export interface Template<Props> {
  meta: TemplateMeta;
  schema: z.ZodType<Props>;
  /** Realistic payload used by the studio, snapshot tests and the gallery. */
  sample: Props;
  subject: (props: Props) => string;
  /** Returns the Row list. The pipeline supplies the mode-specific shell. */
  build: (props: Props, ctx: Ctx) => ReactElement[];
}

/** Preserves the payload type through the registry without restating it. */
export function defineTemplate<Props>(template: Template<Props>): Template<Props> {
  return template;
}

/**
 * Payload-erased view of a template. `Template<Props>` is invariant in Props
 * (the schema both consumes and produces it), so a union of concrete templates
 * never unifies and the registry could not be iterated without this.
 */
// biome-ignore lint/suspicious/noExplicitAny: intentional type erasure
export type AnyTemplate = Template<any>;
