import { registerTool } from '@unlayer/react-elements';
import { esc } from '../../lib/html.js';
import { fonts, palette, radius } from '../tokens.js';

/**
 * Verification codes are read aloud and retyped, so the glyphs are spaced in
 * pairs and set in a mono face where 0/O and 1/l stay distinguishable.
 */
function groupDigits(code: string, groupSize: number): string[] {
  if (groupSize <= 0) return [code];
  const groups: string[] = [];
  for (let i = 0; i < code.length; i += groupSize) groups.push(code.slice(i, i + groupSize));
  return groups;
}

function parts(values: Record<string, unknown>) {
  const code = esc(values.code ?? '').replace(/\s+/g, '');
  const groupSize = Number(values.groupSize ?? 3);
  return {
    groups: groupDigits(code, Number.isFinite(groupSize) ? groupSize : 3),
    raw: code,
    fg: esc(values.color ?? palette.ink),
    bg: esc(values.background ?? palette.canvas),
  };
}

const DIGITS = `font-family:${fonts.mono.value};font-size:32px;font-weight:600;letter-spacing:.16em;line-height:1.1;`;

/**
 * The code is also emitted as a single unbroken run inside an aria-hidden-free
 * span so screen readers and copy-paste both get the whole value, not the
 * visually grouped pieces.
 */
export const CodeToken = registerTool({
  name: 'bm-code-token',
  values: { code: '', groupSize: 3, color: palette.ink, background: palette.canvas },
  renderer: {
    exporters: {
      email: (values) => {
        const { groups, fg, bg } = parts(values);
        const cells = groups
          .map(
            (g) =>
              `<td style="${DIGITS}color:${fg};padding:0 10px;text-align:center;">${g}</td>`,
          )
          .join('');
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:separate;background-color:${bg};border-radius:${radius.md};"><tr><td style="padding:22px 12px;"><table role="presentation" cellpadding="0" cellspacing="0" border="0" align="center" style="border-collapse:collapse;margin:0 auto;"><tr>${cells}</tr></table></td></tr></table>`;
      },
      web: (values) => {
        const { groups, fg, bg } = parts(values);
        return `<div style="background-color:${bg};border-radius:${radius.md};padding:22px 12px;text-align:center;"><span style="${DIGITS}color:${fg};">${groups.join('<span style="opacity:.35;"> </span>')}</span></div>`;
      },
      /** Print drops the fill and uses a hairline box so the code stays crisp. */
      document: (values) => {
        const { groups, fg } = parts(values);
        return `<div style="border:1px solid ${palette.hairlineStrong};border-radius:${radius.md};padding:20px 12px;text-align:center;"><span style="${DIGITS}color:${fg};">${groups.join(' ')}</span></div>`;
      },
    },
  },
});
