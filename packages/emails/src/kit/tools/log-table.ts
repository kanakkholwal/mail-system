import { registerTool } from '@unlayer/react-elements';
import { esc } from '../../lib/html.js';
import { hook } from '../head-css.js';
import { fonts, palette, type } from '../tokens.js';

export interface LogRow {
  key: string;
  value: string;
  /** Marks the row that triggered the notice: accent gutter rule and ink value. */
  flagged?: boolean;
}

function rows(values: Record<string, unknown>): LogRow[] {
  return Array.isArray(values.rows) ? (values.rows as LogRow[]) : [];
}

const KEY = `font-family:${fonts.mono.value};font-size:${type.logKey.fontSize};font-weight:${type.logKey.fontWeight};letter-spacing:${type.logKey.letterSpacing};line-height:${type.logKey.lineHeight};`;
const VALUE = `font-family:${fonts.mono.value};font-size:${type.logValue.fontSize};font-weight:${type.logValue.fontWeight};letter-spacing:${type.logValue.letterSpacing};line-height:${type.logValue.lineHeight};`;

/**
 * Provenance as a record, not as a key/value card. Both columns are left-aligned
 * on a fixed key width so the values form a single edge — that alignment is what
 * makes it read as a log rather than as another detail list.
 */
function render(values: Record<string, unknown>, ruleColor: string | null): string {
  const list = rows(values);
  if (list.length === 0) return '';

  const body = list
    .map((row, index) => {
      const first = index === 0;
      const rule = ruleColor && !first ? `border-top:1px solid ${ruleColor};` : '';
      const ruleHook = ruleColor && !first ? ` ${hook.rule}` : '';
      const pad = `padding:${first ? '0' : '10px'} 0 10px 0;`;
      const gutter = row.flagged
        ? `<td width="3" bgcolor="${palette.danger}" style="width:3px;background-color:${palette.danger};"></td><td width="13" style="width:13px;"></td>`
        : `<td width="16" style="width:16px;"></td>`;
      return (
        `<tr>${gutter}` +
        `<td class="${hook.dim}${ruleHook}" width="132" valign="top" style="${KEY}${pad}${rule}width:132px;color:${palette.muted};white-space:nowrap;">${esc(row.key).toUpperCase()}</td>` +
        `<td class="${row.flagged ? hook.neg : hook.ink}${ruleHook}" valign="top" style="${VALUE}${pad}${rule}color:${row.flagged ? palette.dangerText : palette.ink};">${esc(row.value)}</td>` +
        `</tr>`
      );
    })
    .join('');

  return `<table role="table" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-collapse:collapse;width:100%;">${body}</table>`;
}

export const LogTable = registerTool({
  name: 'bm-log-table',
  values: { rows: [] },
  renderer: {
    exporters: {
      email: (values) => render(values, palette.hairline),
      web: (values) => render(values, palette.hairline),
      /** Print drops the inter-row rules; the column edge already carries it. */
      document: (values) => render(values, null),
    },
  },
});
