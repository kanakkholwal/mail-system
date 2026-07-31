import type { Branding, Legal, Locale, Sender } from '../schema/common.js';
import { palette, readableOn, type RenderMode } from './tokens.js';

/**
 * Threaded explicitly through every partial. Elements injects `mode` at render
 * time, but partials are plain factories that build the tree beforehand, so
 * they need it passed in.
 */
export interface Ctx {
  mode: RenderMode;
  branding: Branding;
  legal: Legal;
  sender: Sender;
  locale: Locale;
}

/**
 * The single primary action is the accent, and the accent is nothing else.
 * A brand may substitute its own, which is the one place a caller overrides it.
 */
export function ctaColor(ctx: Ctx): string {
  return ctx.branding.primaryColor ?? palette.accent;
}

/** Derived, never configured: a brand picks a fill, not the text that sits on it. */
export function ctaTextColor(ctx: Ctx): string {
  return readableOn(ctaColor(ctx));
}

/** Links are ink and underlined. The accent is a fill, and 1.3:1 as text on white. */
export function linkColor(ctx: Ctx): string {
  return ctx.branding.accentColor ?? palette.link;
}

export function isPrint(ctx: Ctx): boolean {
  return ctx.mode === 'document';
}
