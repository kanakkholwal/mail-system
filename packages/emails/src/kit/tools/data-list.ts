import { registerTool } from '@unlayer/react-elements';
import { esc } from '../../lib/html.js';
import { fonts, palette } from '../tokens.js';

export interface DataRow {
  key: string;
  value: string;
  /** Sets the value in the mono face, for IDs, amounts and IP addresses. */
  mono?: boolean;
  tone?: 'default' | 'muted' | 'danger' | 'success';
}

const TONE_COLORS = {
  default: palette.ink,
  muted: palette.muted,
  danger: palette.danger,
  success: palette.success,
} as const;

function rows(values: Record<string, unknown>): DataRow[] {
  return Array.isArray(values.rows) ? (values.rows as DataRow[]) : [];
}

const KEY_STYLE = `font-family:${fonts.sans.value};font-size:13px;line-height:150%;color:${palette.muted};padding:9px 16px 9px 0;vertical-align:top;white-space:nowrap;`;

function valueStyle(row: DataRow): string {
  const font = row.mono ? fonts.mono.value : fonts.sans.value;
  const color = TONE_COLORS[row.tone ?? 'default'];
  return `font-family:${font};font-size:13px;line-height:150%;color:${color};padding:9px 0;vertical-align:top;font-weight:500;`;
}

/**
 * Key/value pairs for order details, device metadata and invoice headers. A
 * two-column table is the only layout that survives Outlook, so web and print
 * reuse it and differ only in rule weight.
 */
function render(values: Record<string, unknown>, ruled: boolean): string {
  const list = rows(values);
  if (list.length === 0) return '';
  const rule = ruled ? `border-bottom:1px solid ${palette.hairline};` : '';
  const body = list
    .map((row, index) => {
      const last = index === list.length - 1;
      const edge = last ? '' : rule;
      return `<tr><td style="${KEY_STYLE}${edge}">${esc(row.key)}</td><td align="right" style="${valueStyle(row)}${edge}text-align:right;">${esc(row.value)}</td></tr>`;
    })
    .join('');
  return `<table role="table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">${body}</table>`;
}

export const DataList = registerTool({
  name: 'bm-data-list',
  values: { rows: [] },
  renderer: {
    exporters: {
      email: (values) => render(values, true),
      web: (values) => render(values, true),
      /** Print omits inter-row rules; the type alignment carries the structure. */
      document: (values) => render(values, false),
    },
  },
});
