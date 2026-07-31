import type { Branding, Legal, Locale, Sender } from '../schema/common.js';
import { palette, type RenderMode } from './tokens.js';

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

export function linkColor(ctx: Ctx): string {
  return ctx.branding.accentColor ?? palette.accent;
}

export function isPrint(ctx: Ctx): boolean {
  return ctx.mode === 'document';
}
