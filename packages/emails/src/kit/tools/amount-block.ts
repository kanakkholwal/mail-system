import { registerTool } from '@unlayer/react-elements';
import { esc } from '../../lib/html.js';
import { fonts, palette, radius } from '../tokens.js';

function parts(values: Record<string, unknown>) {
  return {
    label: esc(values.label ?? ''),
    amount: esc(values.amount ?? ''),
    meta: values.meta ? esc(values.meta) : '',
    fg: esc(values.color ?? palette.ink),
    bg: esc(values.background ?? palette.canvas),
  };
}

const LABEL = `font-family:${fonts.sans.value};font-size:11px;font-weight:700;letter-spacing:.085em;color:${palette.muted};`;
const AMOUNT = `font-family:${fonts.mono.value};font-size:34px;font-weight:700;letter-spacing:-0.02em;line-height:1.08;font-variant-numeric:tabular-nums;`;
const META = `font-family:${fonts.sans.value};font-size:13px;line-height:150%;color:${palette.muted};`;

/**
 * The single number a billing email exists to communicate. Set in tabular mono
 * so the decimal lands where the eye expects it.
 */
export const AmountBlock = registerTool({
  name: 'bm-amount-block',
  values: { label: '', amount: '', meta: '', color: palette.ink, background: palette.canvas },
  renderer: {
    exporters: {
      email: (values) => {
        const { label, amount, meta, fg, bg } = parts(values);
        const metaRow = meta ? `<div style="${META}margin-top:6px;">${meta}</div>` : '';
        return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;background-color:${bg};"><tr><td style="padding:20px 22px;"><div style="${LABEL}margin-bottom:9px;">${label}</div><div style="${AMOUNT}color:${fg};">${amount}</div>${metaRow}</td></tr></table>`;
      },
      web: (values) => {
        const { label, amount, meta, fg, bg } = parts(values);
        const metaRow = meta ? `<div style="${META}margin-top:6px;">${meta}</div>` : '';
        return `<div style="background-color:${bg};border-radius:${radius.md};padding:20px 22px;"><div style="${LABEL}margin-bottom:9px;">${label}</div><div style="${AMOUNT}color:${fg};">${amount}</div>${metaRow}</div>`;
      },
      document: (values) => {
        const { label, amount, meta, fg } = parts(values);
        const metaRow = meta ? `<div style="${META}margin-top:6px;">${meta}</div>` : '';
        return `<div style="border:1px solid ${palette.hairlineStrong};border-radius:${radius.md};padding:18px 20px;"><div style="${LABEL}margin-bottom:8px;">${label}</div><div style="${AMOUNT}color:${fg};">${amount}</div>${metaRow}</div>`;
      },
    },
  },
});
