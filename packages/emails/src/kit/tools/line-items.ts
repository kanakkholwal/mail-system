import { registerTool } from '@unlayer/react-elements';
import { esc } from '../../lib/html.js';
import { hook } from '../head-css.js';
import { fonts, palette } from '../tokens.js';

export interface ItemRow {
  description: string;
  /** Second line under the description: dates worked, scope, SKU. */
  detail?: string;
  quantity: string;
  rate: string;
  amount: string;
}

export interface TotalRow {
  label: string;
  value: string;
  /** Larger and in ink. Reserve for the amount actually owed. */
  emphasis?: boolean;
  credit?: boolean;
}

type Mode = 'email' | 'web' | 'document';

/** Description takes the slack; the three money columns stay fixed. */
const COLS = ['52%', '13%', '16%', '19%'] as const;

const cellBase = 'font-size:13px;line-height:150%;padding:13px 0;vertical-align:top;';
const figureBase = `font-family:${fonts.mono.value};${cellBase}text-align:right;font-variant-numeric:tabular-nums;`;

function head(): string {
  const base = `font-family:${fonts.sans.value};font-size:10px;font-weight:700;letter-spacing:.085em;color:${palette.muted};padding:0 0 10px 0;border-bottom:1px solid ${palette.hairline};`;
  const th = (text: string, index: number, align: 'left' | 'right') =>
    `<th class="${hook.dim} ${hook.rule}" width="${COLS[index]}" align="${align}" style="${base}text-align:${align};">${text}</th>`;
  return `<thead><tr>${th('DESCRIPTION', 0, 'left')}${th('QTY', 1, 'right')}${th('RATE', 2, 'right')}${th('AMOUNT', 3, 'right')}</tr></thead>`;
}

function body(rows: ItemRow[]): string {
  const rule = `border-bottom:1px solid ${palette.hairline};`;
  return `<tbody>${rows
    .map((row) => {
      const detail = row.detail
        ? `<div class="${hook.dim}" style="font-size:12px;line-height:148%;color:${palette.muted};margin-top:3px;">${esc(row.detail)}</div>`
        : '';
      return (
        '<tr>' +
        `<td class="${hook.ink} ${hook.rule}" align="left" style="font-family:${fonts.sans.value};${cellBase}color:${palette.ink};font-weight:600;${rule}padding-right:12px;">${esc(row.description)}${detail}</td>` +
        `<td class="${hook.body} ${hook.rule}" align="right" style="${figureBase}color:${palette.body};${rule}">${esc(row.quantity)}</td>` +
        `<td class="${hook.body} ${hook.rule}" align="right" style="${figureBase}color:${palette.body};${rule}">${esc(row.rate)}</td>` +
        `<td class="${hook.ink} ${hook.rule}" align="right" style="${figureBase}color:${palette.ink};font-weight:600;${rule}">${esc(row.amount)}</td>` +
        '</tr>'
      );
    })
    .join('')}</tbody>`;
}

/**
 * Totals sit in their own right-aligned table rather than a colspan, because
 * Outlook resolves colspan widths against the wrong container and the ladder
 * drifts out of alignment with the Amount column.
 */
function totals(rows: TotalRow[], mode: Mode): string {
  const width = mode === 'email' ? '62%' : '54%';
  const inner = rows
    .map((row) => {
      const strong = row.emphasis === true;
      const pad = strong ? '13px' : '7px';
      const topRule = strong ? `border-top:1px solid ${palette.hairlineStrong};` : '';
      const labelStyle = `font-family:${fonts.sans.value};font-size:${strong ? '14px' : '13px'};font-weight:${strong ? 700 : 400};color:${strong ? palette.ink : palette.body};padding:${pad} 12px ${pad} 0;${topRule}`;
      const valueColor = row.credit === true ? palette.success : palette.ink;
      const valueStyle = `font-family:${fonts.mono.value};font-size:${strong ? '18px' : '13px'};font-weight:${strong ? 700 : 500};color:${valueColor};text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;padding:${pad} 0;${topRule}`;
      const sign = row.credit === true ? '&minus;' : '';
      const labelHook = strong ? hook.ink : hook.body;
      const valueHook = row.credit === true ? hook.pos : hook.ink;
      const ruleHook = strong ? ` ${hook.rule}` : '';
      return `<tr><td class="${labelHook}${ruleHook}" align="left" style="${labelStyle}">${esc(row.label)}</td><td class="${valueHook}${ruleHook}" align="right" style="${valueStyle}">${sign}${esc(row.value)}</td></tr>`;
    })
    .join('');
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right" width="${width}" style="border-collapse:collapse;width:${width};margin-left:auto;margin-top:14px;">${inner}</table><div style="clear:both;font-size:0;line-height:0;">&nbsp;</div>`;
}

function render(values: Record<string, unknown>, mode: Mode): string {
  const items = Array.isArray(values.rows) ? (values.rows as ItemRow[]) : [];
  const totalRows = Array.isArray(values.totals) ? (values.totals as TotalRow[]) : [];
  // table-layout:fixed stops a long description from stealing money-column width.
  const table = `<table role="table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;table-layout:fixed;">${head()}${body(items)}</table>`;
  return `<div class="bm-items">${table}${totalRows.length > 0 ? totals(totalRows, mode) : ''}</div>`;
}

export const LineItems = registerTool({
  name: 'bm-line-items',
  values: { rows: [], totals: [] },
  renderer: {
    exporters: {
      email: (values) => render(values, 'email'),
      web: (values) => render(values, 'web'),
      document: (values) => render(values, 'document'),
    },
    head: {
      /** Qty and Rate are the first columns to go when the screen narrows. */
      css: () =>
        `
@media only screen and (max-width: 620px) {
  .bm-items th:nth-child(2), .bm-items td:nth-child(2),
  .bm-items th:nth-child(3), .bm-items td:nth-child(3) { display: none !important; }
  .bm-items th:first-child, .bm-items td:first-child { width: 66% !important; }
  .bm-items th:last-child, .bm-items td:last-child { width: 34% !important; }
}`.trim(),
    },
  },
});
