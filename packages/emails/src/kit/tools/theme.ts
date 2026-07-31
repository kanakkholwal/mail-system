import { hook } from '../head-css.js';
import { palette } from '../tokens.js';

/**
 * Tools emit inline colours, which dark mode cannot override on its own. Mapping
 * the colour back to a class gives the stylesheet something to target.
 */
export function inkClass(color: string): string {
  switch (color) {
    case palette.success:
      return hook.pos;
    case palette.warning:
      return hook.warn;
    case palette.danger:
      return hook.neg;
    case palette.muted:
      return hook.dim;
    case palette.body:
      return hook.body;
    default:
      return hook.ink;
  }
}

export function fillClass(color: string): string {
  switch (color) {
    case palette.successTint:
      return hook.posFill;
    case palette.warningTint:
      return hook.warnFill;
    case palette.dangerTint:
      return hook.negFill;
    case palette.raised:
      return hook.fillRaised;
    default:
      return hook.fill;
  }
}
