import { registerTool } from '@unlayer/react-elements';
import { esc } from '../../lib/html.js';
import { fonts, palette, radius } from '../tokens.js';

function parts(values: Record<string, unknown>) {
  const raw = Number(values.percent ?? 0);
  const pct = Math.max(0, Math.min(100, Number.isFinite(raw) ? raw : 0));
  // Fills stay neutral and escalate only on a real threshold, so the colour of a
  // bar always means something. A bar that is green at 12% says nothing.
  const auto = pct >= 90 ? palette.danger : pct >= 75 ? palette.warning : palette.fillNeutralStrong;
  return {
    pct,
    // Truthiness, not ??: the tool's default `color` is an empty string, which
    // ?? would happily accept and emit as `background-color:` with no value.
    tone: values.color ? esc(values.color) : auto,
    label: values.label ? esc(values.label) : '',
    value: values.value ? esc(values.value) : `${Math.round(pct)}%`,
  };
}

const CAPTION = `font-family:${fonts.sans.value};font-size:13px;line-height:150%;`;

/**
 * Usage bar built from table cells, not a div with a percentage width, because
 * Outlook's word engine ignores percentage widths on divs. Percentages on table
 * cells it honours, so the fill is a two-cell row.
 */
export const Meter = registerTool({
  name: 'bm-meter',
  values: { percent: 0, label: '', value: '', color: '' },
  renderer: {
    exporters: {
      email: (values) => {
        const { pct, tone, label, value } = parts(values);
        const rest = 100 - pct;
        const legend = label
          ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;"><tr><td align="left" style="${CAPTION}color:${palette.body};padding:0 0 7px 0;">${label}</td><td align="right" style="${CAPTION}color:${palette.ink};font-weight:600;font-family:${fonts.mono.value};padding:0 0 7px 0;">${value}</td></tr></table>`
          : '';
        const fill = pct > 0 ? `<td width="${pct}%" bgcolor="${tone}" style="background-color:${tone};height:8px;font-size:0;line-height:0;">&nbsp;</td>` : '';
        const track = rest > 0 ? `<td width="${rest}%" bgcolor="${palette.hairline}" style="background-color:${palette.hairline};height:8px;font-size:0;line-height:0;">&nbsp;</td>` : '';
        return `${legend}<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;table-layout:fixed;">${'<tr>' + fill + track + '</tr>'}</table>`;
      },
      web: (values) => {
        const { pct, tone, label, value } = parts(values);
        const legend = label
          ? `<div style="display:flex;justify-content:space-between;margin-bottom:7px;"><span style="${CAPTION}color:${palette.body};">${label}</span><span style="${CAPTION}color:${palette.ink};font-weight:600;font-family:${fonts.mono.value};">${value}</span></div>`
          : '';
        return `${legend}<div role="progressbar" aria-valuenow="${Math.round(pct)}" aria-valuemin="0" aria-valuemax="100" style="background-color:${palette.hairline};border-radius:${radius.pill};height:8px;overflow:hidden;"><div style="width:${pct}%;height:8px;background-color:${tone};border-radius:${radius.pill};"></div></div>`;
      },
      document: (values) => {
        const { pct, tone, label, value } = parts(values);
        const legend = label
          ? `<div style="${CAPTION}color:${palette.body};margin-bottom:6px;">${label} <span style="color:${palette.ink};font-weight:600;font-family:${fonts.mono.value};">${value}</span></div>`
          : '';
        return `${legend}<div style="border:1px solid ${palette.hairlineStrong};height:8px;"><div style="width:${pct}%;height:8px;background-color:${tone};"></div></div>`;
      },
    },
  },
});
