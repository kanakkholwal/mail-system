import { registerTool } from '@unlayer/react-elements';
import { esc } from '../../lib/html.js';
import { fonts, palette, radius } from '../tokens.js';

const TONES = {
  neutral: { border: palette.hairline, bg: palette.canvas, fg: palette.body, rule: palette.hairlineStrong },
  info: { border: palette.accentTint, bg: palette.accentTint, fg: palette.inkSoft, rule: palette.accent },
  success: { border: palette.successTint, bg: palette.successTint, fg: palette.inkSoft, rule: palette.success },
  warning: { border: palette.warningTint, bg: palette.warningTint, fg: palette.inkSoft, rule: palette.warning },
  danger: { border: palette.dangerTint, bg: palette.dangerTint, fg: palette.inkSoft, rule: palette.danger },
} as const;

function parts(values: Record<string, unknown>) {
  const key = (values.tone as keyof typeof TONES) in TONES ? (values.tone as keyof typeof TONES) : 'neutral';
  return {
    tone: TONES[key],
    title: values.title ? esc(values.title) : '',
    // Body is authored HTML from the template, not user input, so it passes through.
    body: String(values.body ?? ''),
  };
}

const TITLE = `font-family:${fonts.sans.value};font-size:14px;font-weight:600;line-height:145%;margin:0 0 5px 0;`;
const BODY = `font-family:${fonts.sans.value};font-size:14px;line-height:158%;margin:0;`;

/**
 * A notice block. The left keyline carries the tone rather than a coloured icon,
 * because icon fonts and SVG both fail in Outlook and an image would be blocked.
 */
export const Callout = registerTool({
  name: 'bm-callout',
  values: { tone: 'neutral', title: '', body: '' },
  renderer: {
    exporters: {
      email: (values) => {
        const { tone, title, body } = parts(values);
        const heading = title ? `<div style="${TITLE}color:${palette.ink};">${title}</div>` : '';
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;background-color:${tone.bg};"><tr><td width="3" bgcolor="${tone.rule}" style="background-color:${tone.rule};width:3px;"></td><td style="padding:14px 16px;">${heading}<div style="${BODY}color:${tone.fg};">${body}</div></td></tr></table>`;
      },
      web: (values) => {
        const { tone, title, body } = parts(values);
        const heading = title ? `<div style="${TITLE}color:${palette.ink};">${title}</div>` : '';
        return `<div style="background-color:${tone.bg};border-left:3px solid ${tone.rule};border-radius:0 ${radius.sm} ${radius.sm} 0;padding:14px 16px;">${heading}<div style="${BODY}color:${tone.fg};">${body}</div></div>`;
      },
      document: (values) => {
        const { tone, title, body } = parts(values);
        const heading = title ? `<div style="${TITLE}color:${palette.ink};">${title}</div>` : '';
        return `<div style="border:1px solid ${tone.rule};border-left-width:3px;border-radius:0 ${radius.sm} ${radius.sm} 0;padding:13px 15px;">${heading}<div style="${BODY}color:${tone.fg};">${body}</div></div>`;
      },
    },
  },
});
