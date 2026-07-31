import type { ReactElement, ReactNode } from 'react';
import { Column, ColumnLayouts, Heading, Paragraph, Row } from '@unlayer/react-elements';
import { hook } from './head-css.js';
import { band, caption, cta, divider, small } from './primitives.js';
import { fonts, layout, palette, space, type } from './tokens.js';
import type { Ctx } from './context.js';
import { LogTable, type LogRow } from './tools/log-table.js';

/**
 * The record family: auth and security. These messages are evidence about an
 * account, so they are composed as system records — an ink masthead that states
 * what the record is, one act set large and left, and provenance kept as a log.
 * Severity is carried at the top edge, where it is legible in a preview pane
 * before a single word is read.
 */

export type Severity = 'none' | 'notice' | 'alert';

/** Elements' Paragraph takes no weight prop, so the stamp carries its own. */
function monoStamp(value: string, color: string): string {
  return `<span class="${hook.stamp}" style="font-weight:${type.stamp.fontWeight};color:${color};">${value.toUpperCase()}</span>`;
}

const SEVERITY_COLOR: Record<Exclude<Severity, 'none'>, string> = {
  notice: palette.warning,
  alert: palette.danger,
};

/**
 * Full-bleed 5px bar above the masthead. The only element in the family whose
 * colour is not fixed, because it is the one thing that must change with stakes.
 */
export function recordEdge(severity: Severity, key = 'edge'): ReactElement[] {
  if (severity === 'none') return [];
  return [
    band([divider({ color: SEVERITY_COLOR[severity], weight: '5px', gap: space.none, key: 'e' })], {
      pt: space.none,
      pb: space.none,
      gutter: false,
      fixed: true,
      bg: SEVERITY_COLOR[severity],
      key,
    }),
  ];
}

export interface MastheadOptions {
  /** The classification line. Two or three words, e.g. `SECURITY · SIGN-IN`. */
  stamp: string;
  severity?: Severity;
  key?: string;
}

/**
 * Ink slab, fixed in both themes. It stacks rather than splitting into columns:
 * a tracked stamp beside a wordmark wraps badly under 360px, and a wrapped
 * classification line is worse than no classification line.
 */
export function recordMasthead(ctx: Ctx, options: MastheadOptions): ReactElement[] {
  const { stamp, severity = 'none', key = 'masthead' } = options;
  return [
    ...recordEdge(severity),
    band(
      [
        <Paragraph
          key="stamp"
          html={monoStamp(stamp, palette.accent)}
          fontFamily={fonts.mono}
          fontSize={type.stamp.fontSize}
          lineHeight="120%"
          letterSpacing={type.stamp.letterSpacing}
          color={palette.accent}
          textAlign="left"
          containerPadding={`0px 0px ${space.sm} 0px`}
        />,
        <Heading
          key="wordmark"
          level="h2"
          text={ctx.branding.name}
          fontFamily={fonts.sans}
          fontSize="22px"
          fontWeight={600}
          lineHeight="110%"
          letterSpacing="-0.022em"
          color={palette.onDark}
          textAlign="left"
          containerPadding="0px"
        />,
      ],
      { pt: space.xl, pb: space.xl, bg: palette.slab, fixed: true, key },
    ),
  ];
}

/** Left, tight, and large enough to be the only thing competing for the first read. */
export function recordHeadline(value: string, key = 'rh'): ReactElement {
  return (
    <Heading
      key={key}
      level="h1"
      text={value}
      fontFamily={fonts.sans}
      fontSize={type.display.fontSize}
      fontWeight={type.display.fontWeight}
      lineHeight={type.display.lineHeight}
      letterSpacing={type.display.letterSpacing}
      color={palette.ink}
      textAlign="left"
      containerPadding={`${space.xxl} 0px ${space.md} 0px`}
    />
  );
}

/**
 * The mark. Always the heaviest available value — ink on paper, accent on a
 * slab — because a 3px accent bar on white is 1.3:1 and simply disappears.
 */
export function recordMark(options: { onSlab?: boolean; key?: string } = {}): ReactElement {
  const { onSlab = false, key = 'rm' } = options;
  return divider({
    color: onSlab ? palette.accent : palette.ink,
    weight: '3px',
    width: '44px',
    gap: space.none,
    key,
  });
}

export function recordLede(html: string, key = 'rl'): ReactElement {
  return (
    <Paragraph
      key={key}
      html={html}
      fontFamily={fonts.sans}
      fontSize={type.lede.fontSize}
      lineHeight={type.lede.lineHeight}
      color={palette.body}
      textAlign="left"
      containerPadding={`${space.lg} 0px ${space.xl} 0px`}
    />
  );
}

export function recordCta(
  ctx: Ctx,
  options: { label: string; href: string; variant?: 'primary' | 'secondary'; gap?: string; key?: string },
): ReactElement {
  return cta({
    ctx,
    label: options.label,
    href: options.href,
    variant: options.variant ?? 'primary',
    align: 'left',
    gap: options.gap ?? space.md,
    key: options.key ?? 'rc',
  });
}

/** The line under an action: expiry, single-use, what happens if ignored. */
export function recordNote(html: string, key = 'rn'): ReactElement {
  return caption(html, { align: 'left', gap: space.none, color: palette.muted, key });
}

/**
 * Section header for the record body: a tracked mono label sitting on a rule.
 * The rule runs the full measure so the sections read as a divided document.
 */
export function recordSection(name: string, key = 'rs'): ReactElement[] {
  return [
    divider({ color: palette.hairline, gap: space.none, key: `${key}-d` }),
    <Paragraph
      key={`${key}-l`}
      html={monoStamp(name, palette.muted)}
      fontFamily={fonts.mono}
      fontSize={type.stamp.fontSize}
      lineHeight="120%"
      letterSpacing={type.stamp.letterSpacing}
      color={palette.muted}
      textAlign="left"
      containerPadding={`${space.md} 0px ${space.md} 0px`}
    />,
  ];
}

/** Provenance. Always the same shape across the family, so it is scannable by habit. */
export function recordLog(
  rows: LogRow[],
  options: { title?: string; pb?: string; key?: string } = {},
): ReactElement {
  const { title = 'Request log', pb = space.xl, key = 'log' } = options;
  return band([...recordSection(title, `${key}-s`), <LogTable key="lt" rows={rows} containerPadding="0px" />], {
    pt: space.none,
    pb,
    key,
  });
}

/**
 * Recessed full-bleed block. Full bleed rather than an inset card: Outlook drops
 * border-radius, and a card inside a band leaves the fill showing around it,
 * which reads as a stray grey stripe across the message.
 */
export function recordPanel(children: ReactNode, options: { key?: string } = {}): ReactElement {
  const { key = 'panel' } = options;
  return (
    <Row
      key={key}
      layout={ColumnLayouts.OneColumn}
      backgroundColor={palette.canvas}
      padding={`${space.lg} 0px ${space.lg} 0px`}
      className={`${hook.gutter} ${hook.surface} ${hook.sunken}`}
      border={{
        borderTopWidth: '1px',
        borderTopStyle: 'solid',
        borderTopColor: palette.hairline,
        borderBottomWidth: '1px',
        borderBottomStyle: 'solid',
        borderBottomColor: palette.hairline,
      }}
    >
      <Column padding={`0px ${layout.gutter}`}>{children}</Column>
    </Row>
  );
}

export { small };
