import { registerTool } from '@unlayer/react-elements';
import { esc } from '../../lib/html.js';
import { hook } from '../head-css.js';
import { fonts, palette, radius, type } from '../tokens.js';

/**
 * Codes are read aloud and retyped, so glyphs are grouped and set in a mono face
 * where 0/O and 1/l stay distinguishable. The value is emitted as one text run,
 * so copy-paste and screen readers get the whole code, not the visual groups.
 * Gaps are non-breaking: HTML collapses a run of plain spaces back to one.
 */
function group(code: string, size: number): string {
  if (size <= 0) return code;
  return (code.match(new RegExp(`.{1,${size}}`, 'g')) ?? [code]).join('&nbsp;&nbsp;');
}

function parts(values: Record<string, unknown>) {
  const size = Number(values.groupSize ?? 3);
  const code = esc(values.code ?? '').replace(/\s+/g, '');
  return {
    code: group(code, Number.isFinite(size) ? size : 3),
    stamp: esc(values.stamp ?? '').toUpperCase(),
    meta: esc(values.meta ?? '').toUpperCase(),
  };
}

const STAMP = `font-family:${fonts.mono.value};font-size:${type.stamp.fontSize};font-weight:${type.stamp.fontWeight};letter-spacing:${type.stamp.letterSpacing};line-height:120%;`;
const PAYLOAD = `font-family:${fonts.mono.value};font-size:${type.mega.fontSize};font-weight:600;letter-spacing:.12em;line-height:110%;white-space:nowrap;`;

/**
 * The code is the message, so it is the largest thing on the page and it sits on
 * a full-bleed ink slab rather than in a grey pill. Ink is fixed in both themes:
 * a code that changes colour between clients is a code people distrust.
 */
export const CodeSlab = registerTool({
  name: 'bm-code-slab',
  values: { code: '', groupSize: 3, stamp: '', meta: '' },
  renderer: {
    exporters: {
      email: (values) => {
        const { code, stamp, meta } = parts(values);
        const head = stamp
          ? `<div style="${STAMP}color:${palette.onDarkMuted};padding:0 0 18px 0;">${stamp}</div>`
          : '';
        const foot = meta
          ? `<div style="${STAMP}color:${palette.onDarkMuted};padding:20px 0 0 0;">${meta}</div>`
          : '';
        // A 3px accent bar rather than a rule: it is the one signal on the slab.
        const mark = `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;"><tr><td height="3" width="44" bgcolor="${palette.accent}" style="width:44px;height:3px;line-height:3px;font-size:0;">&nbsp;</td></tr></table>`;
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${palette.slab}" style="border-collapse:collapse;width:100%;background-color:${palette.slab};"><tr><td style="padding:38px 40px 40px 40px;">${head}<div class="${hook.payload}" style="${PAYLOAD}color:${palette.accent};padding:0 0 20px 0;">${code}</div>${mark}${foot}</td></tr></table>`;
      },
      web: (values) => {
        const { code, stamp, meta } = parts(values);
        const head = stamp ? `<div style="${STAMP}color:${palette.onDarkMuted};margin:0 0 18px;">${stamp}</div>` : '';
        const foot = meta ? `<div style="${STAMP}color:${palette.onDarkMuted};margin:20px 0 0;">${meta}</div>` : '';
        return `<div style="background-color:${palette.slab};border-radius:${radius.md};padding:38px 40px 40px;">${head}<div class="${hook.payload}" style="${PAYLOAD}color:${palette.accent};margin:0 0 20px;">${code}</div><div style="width:44px;height:3px;background-color:${palette.accent};"></div>${foot}</div>`;
      },
      /** Print drops the ink fill and keeps the code as the only heavy mark. */
      document: (values) => {
        const { code, stamp, meta } = parts(values);
        const head = stamp ? `<div style="${STAMP}color:${palette.muted};margin:0 0 14px;">${stamp}</div>` : '';
        const foot = meta ? `<div style="${STAMP}color:${palette.muted};margin:16px 0 0;">${meta}</div>` : '';
        return `<div style="border:1px solid ${palette.hairlineStrong};border-left-width:3px;padding:26px 28px;">${head}<div style="${PAYLOAD}color:${palette.ink};">${code}</div>${foot}</div>`;
      },
    },
  },
});
