import { registerTool } from '@unlayer/react-elements';
import { esc } from '../../lib/html.js';
import { fonts, palette } from '../tokens.js';

/** Text takes the AA-passing step; the saturated hue stays on the fill and border. */
const TONES = {
  neutral: { fg: palette.body, bg: palette.canvas, border: palette.hairline },
  success: { fg: palette.successText, bg: palette.successTint, border: palette.success },
  warning: { fg: palette.warningText, bg: palette.warningTint, border: palette.warning },
  danger: { fg: palette.dangerText, bg: palette.dangerTint, border: palette.danger },
  info: { fg: palette.accent, bg: palette.accentTint, border: palette.accent },
} as const;

export type BadgeTone = keyof typeof TONES;

const TYPE = `font-family:${fonts.sans.value};font-size:11px;font-weight:700;letter-spacing:.085em;line-height:1;white-space:nowrap;`;

function parts(values: Record<string, unknown>) {
  const key = (values.tone as BadgeTone) in TONES ? (values.tone as BadgeTone) : 'neutral';
  return {
    tone: TONES[key],
    text: esc(values.text ?? '').toUpperCase(),
    align: values.align === 'right' || values.align === 'center' ? String(values.align) : 'left',
  };
}

/**
 * Outlook drops border-radius and mishandles padded divs, so the email build is
 * a one-cell table that degrades to a clean rectangle. Print adds a hairline so
 * the pill survives being printed with backgrounds disabled.
 */
export const StatusBadge = registerTool({
  name: 'bm-status-badge',
  values: { tone: 'neutral', text: '', align: 'left' },
  renderer: {
    exporters: {
      email: (values) => {
        const { tone, text, align } = parts(values);
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="${align}" style="border-collapse:collapse;"><tr><td bgcolor="${tone.bg}" style="background-color:${tone.bg};border-radius:999px;padding:7px 13px;${TYPE}color:${tone.fg};">${text}</td></tr></table>`;
      },
      web: (values) => {
        const { tone, text, align } = parts(values);
        return `<div style="text-align:${align};"><span style="display:inline-block;background-color:${tone.bg};color:${tone.fg};border-radius:999px;padding:7px 13px;${TYPE}">${text}</span></div>`;
      },
      document: (values) => {
        const { tone, text, align } = parts(values);
        return `<div style="text-align:${align};"><span style="display:inline-block;background-color:${tone.bg};color:${tone.fg};border:1px solid ${tone.border};border-radius:999px;padding:6px 12px;${TYPE}">${text}</span></div>`;
      },
    },
  },
});
