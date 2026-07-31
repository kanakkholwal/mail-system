import { darkPalette, layout, palette, type RenderMode } from './tokens.js';

/**
 * Band-level hooks. Elements drops `className` on item components and only keeps
 * it on Row, where it lands on an outer wrapper div, so every rule below reaches
 * the real target through a descendant selector.
 */
export const hook = {
  gutter: 'bm-gutter',
  surface: 'bm-surface',
  /** Recessed band (footers). Flips to the darker of the two dark surfaces. */
  sunken: 'bm-sunken',
  /** Opts a band out of the dark-mode flip (already dark by design). */
  fixed: 'bm-fixed',
  hideSm: 'bm-hide-sm',
  /** Inline anchor that must invert with the theme, such as the wordmark. */
  invertInk: 'bm-invert-ink',

  /**
   * Custom tools emit their own markup, so the stylesheet cannot reach them
   * through Elements' internal classes. These are the seams it uses instead.
   * Without them a DataList value stays near-black on a near-black surface.
   */
  /** Payload type (a code, a total) and the mono genre stamp. Scaled on mobile. */
  payload: 'bm-payload',
  stamp: 'bm-stamp',

  ink: 'bm-ink',
  body: 'bm-body',
  dim: 'bm-dim',
  rule: 'bm-rule',
  fill: 'bm-fill',
  fillRaised: 'bm-fill-raised',
  pos: 'bm-pos',
  warn: 'bm-warn',
  neg: 'bm-neg',
  posFill: 'bm-pos-fill',
  warnFill: 'bm-warn-fill',
  negFill: 'bm-neg-fill',
} as const;

/**
 * Elements' internal class hooks that these rules depend on. Verified against
 * @unlayer/react-elements 0.1.20 output; re-check on major upgrades.
 */
const el = {
  rowPad: '.u_row',
  colPad: '.v-col-padding',
  heading: '.u_content_heading',
  paragraph: '.u_content_paragraph',
  button: '.u_content_button',
  /** Divider puts its colour on a td border-top, not on an <hr>. */
  divider: '.u_content_divider td',
  color: '.v-color',
} as const;

const RESET = `
body { margin: 0; padding: 0; width: 100% !important; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
table { border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
img { border: 0; outline: none; text-decoration: none; -ms-interpolation-mode: bicubic; }
/* Outlook.com forces its own line-height onto the wrapper it injects. */
.ExternalClass, .ExternalClass p, .ExternalClass td, .ExternalClass div { line-height: inherit; }
`.trim();

/**
 * iOS turns dates, addresses and phone numbers into blue links, and Gmail plus
 * Outlook.com recolour anything resembling one. Both need neutralising or body
 * copy sprouts stray blue text.
 */
const AUTOLINK = `
a[x-apple-data-detectors] {
  color: inherit !important; text-decoration: none !important;
  font-size: inherit !important; font-family: inherit !important;
  font-weight: inherit !important; line-height: inherit !important;
}
#MessageViewBody a, u + #body a { color: inherit; text-decoration: none; font-size: inherit; }
`.trim();

/**
 * Elements zeroes horizontal row padding under 620px, so the gutter lives on the
 * column and is narrowed here rather than removed.
 */
function mobile(): string {
  return `
@media only screen and (max-width: 620px) {
  .${hook.gutter} ${el.colPad} {
    padding-left: ${layout.gutterMobile} !important;
    padding-right: ${layout.gutterMobile} !important;
  }
  .${hook.hideSm} { display: none !important; }
  .${el.heading} h1 { font-size: 29px !important; }
  .${el.heading} h2 { font-size: 21px !important; }
  /* Payload type is set by a custom tool, so it scales on its own hook. */
  .${hook.payload} { font-size: 40px !important; letter-spacing: .08em !important; }
  .${hook.stamp} { letter-spacing: .14em !important; }
}`.trim();
}

/**
 * Inline styles beat stylesheet rules, so every override carries !important.
 * Clients that ignore prefers-color-scheme keep the light design untouched.
 * The [style*=] selectors are the only way to tell a muted paragraph from a
 * body one, since Elements emits no per-variant class.
 */
function darkRules(): string {
  const surface = `.${hook.surface}:not(.${hook.fixed})`;
  return `
  body, .u_body { background-color: ${darkPalette.canvas} !important; }
  ${surface} ${el.rowPad}, ${surface} .u-row, ${surface} .v-row-background-image--inner {
    background-color: ${darkPalette.surface} !important;
  }
  /* Footers sit one step darker so they stay visually recessed. */
  .${hook.sunken}:not(.${hook.fixed}) ${el.rowPad}, .${hook.sunken}:not(.${hook.fixed}) .u-row,
  .${hook.sunken}:not(.${hook.fixed}) .v-row-background-image--inner {
    background-color: ${darkPalette.canvas} !important;
  }
  ${surface} ${el.heading} ${el.color} { color: ${darkPalette.ink} !important; }
  ${surface} ${el.paragraph} ${el.color} { color: ${darkPalette.body} !important; }
  ${surface} ${el.paragraph} [style*="${palette.inkSoft}"] { color: ${darkPalette.inkSoft} !important; }
  ${surface} ${el.paragraph} [style*="${palette.muted}"] { color: ${darkPalette.muted} !important; }
  ${surface} ${el.divider} { border-top-color: ${darkPalette.hairline} !important; }
  .${hook.invertInk} { color: ${darkPalette.ink} !important; }
  ${surface} ${el.button} a[style*="${palette.accent}"] {
    background-color: ${darkPalette.accent} !important; color: ${palette.onAccent} !important;
  }
  /* Ink links would vanish on a dark surface, so they take the light ink step. */
  ${surface} ${el.paragraph} a[style*="${palette.link}"] { color: ${darkPalette.link} !important; }

  /* Custom tool output. Reached by class because it is not Elements' markup. */
  ${surface} .${hook.ink} { color: ${darkPalette.ink} !important; }
  ${surface} .${hook.body} { color: ${darkPalette.body} !important; }
  ${surface} .${hook.dim} { color: ${darkPalette.muted} !important; }
  ${surface} .${hook.rule} { border-color: ${darkPalette.hairline} !important; }
  ${surface} .${hook.fill} { background-color: ${darkPalette.canvas} !important; }
  ${surface} .${hook.fillRaised} { background-color: ${darkPalette.raised} !important; }
  ${surface} .${hook.pos} { color: ${darkPalette.success} !important; }
  ${surface} .${hook.warn} { color: ${darkPalette.warning} !important; }
  ${surface} .${hook.neg} { color: ${darkPalette.danger} !important; }
  ${surface} .${hook.posFill} { background-color: ${darkPalette.successTint} !important; }
  ${surface} .${hook.warnFill} { background-color: ${darkPalette.warningTint} !important; }
  ${surface} .${hook.negFill} { background-color: ${darkPalette.dangerTint} !important; }`.trimEnd();
}

/**
 * `auto` is what a real inbox gets. The forced values exist because an iframe
 * inherits prefers-color-scheme from the OS, so a preview cannot otherwise show
 * the half the reviewer is not currently running.
 */
export type Theme = 'auto' | 'light' | 'dark';

function dark(theme: Theme): string {
  if (theme === 'light') return ':root { color-scheme: light; supported-color-schemes: light; }';
  if (theme === 'dark') {
    return `:root { color-scheme: dark; supported-color-schemes: dark; }\n${darkRules()}`.trim();
  }
  return `
:root { color-scheme: light dark; supported-color-schemes: light dark; }
@media (prefers-color-scheme: dark) {
${darkRules()}
}`.trim();
}

const PRINT = `
@page { size: A4; margin: 14mm 14mm 16mm 14mm; }
@media screen {
  html { background: #E9EBEF; }
  body { padding: 32px 16px; }
  .u_body.content {
    max-width: ${layout.documentWidth}; margin: 0 auto; border-radius: 2px;
    box-shadow: 0 1px 2px rgba(11,11,15,.08), 0 12px 32px rgba(11,11,15,.10);
  }
}
@media print {
  html, body { background: #fff !important; }
  body { padding: 0 !important; }
  .u_body.content { box-shadow: none !important; max-width: none !important; }
  .screen-only { display: none !important; }
  * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
  ${el.rowPad} { break-inside: avoid; page-break-inside: avoid; }
  thead { display: table-header-group; }
  tr, td { break-inside: avoid; page-break-inside: avoid; }
  a { text-decoration: none; color: ${palette.ink} !important; }
  .page-break { break-before: page; page-break-before: always; }
}
`.trim();

export function headCss(mode: RenderMode, theme: Theme = 'auto'): string {
  if (mode === 'document') return [RESET, PRINT].join('\n\n');
  if (mode === 'web') return [RESET, mobile(), dark(theme)].join('\n\n');
  return [RESET, AUTOLINK, mobile(), dark(theme)].join('\n\n');
}
