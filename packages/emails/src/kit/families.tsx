import type { ReactElement, ReactNode } from 'react';
import { Column, ColumnLayouts, Heading, Paragraph, Row } from '@unlayer/react-elements';
import { hook } from './head-css.js';
import { band, caption, cta, divider, label, lede, small, text } from './primitives.js';
import { fonts, layout, palette, space, type } from './tokens.js';
import { type Ctx, ctaColor } from './context.js';

/* --- Focused: auth and security --- */

/**
 * One act, centred, with nothing competing. The measure is deliberately narrow;
 * a 60ch line under a centred heading reads as a document, not as a prompt.
 */
export function focusedHeader(ctx: Ctx): ReactElement {
  const color = ctx.branding.primaryColor ?? palette.ink;
  return band(
    [
      caption(
        `<a class="${hook.invertInk}" href="${ctx.branding.websiteUrl}" style="color:${color};text-decoration:none;font-size:15px;font-weight:700;letter-spacing:-0.012em;">${ctx.branding.name}</a>`,
        { align: 'center', gap: space.none, key: 'wm' },
      ),
    ],
    { pt: space.xxxl, pb: space.none, key: 'focused-header' },
  );
}

export function focusedHeadline(value: string, key = 'fh'): ReactElement {
  return (
    <Heading
      key={key}
      level="h1"
      text={value}
      fontFamily={fonts.sans}
      fontSize={type.display.fontSize}
      fontWeight={type.display.fontWeight}
      lineHeight="118%"
      letterSpacing={type.display.letterSpacing}
      color={palette.ink}
      textAlign="center"
      containerPadding={`${space.xxl} 0px ${space.sm} 0px`}
    />
  );
}

export function focusedLede(html: string, key = 'fl'): ReactElement {
  return (
    <Paragraph
      key={key}
      html={html}
      fontFamily={fonts.sans}
      fontSize={type.lede.fontSize}
      lineHeight={type.lede.lineHeight}
      color={palette.body}
      textAlign="center"
      containerPadding={`0px 0px ${space.xl} 0px`}
    />
  );
}

/** Deliberately not full width. A centred button that stops short reads as considered. */
export function focusedCta(ctx: Ctx, options: { label: string; href: string; key?: string }): ReactElement {
  return cta({
    ctx,
    label: options.label,
    href: options.href,
    align: 'center',
    gap: space.md,
    key: options.key ?? 'fc',
  });
}

export function focusedNote(html: string, key = 'fn'): ReactElement {
  return caption(html, { align: 'center', gap: space.none, key });
}

/** Short centred rule. Closes the focused block without the weight of a full divider. */
export function focusedRule(key = 'fr'): ReactElement {
  return divider({ width: '48px', color: palette.hairlineStrong, gap: space.xl, key });
}

/**
 * Recessed full-bleed section for the detail a security email must show but
 * should not lead with. Full bleed rather than an inset card on purpose: Outlook
 * drops border-radius, and a card inside a band leaves the fill visible around
 * it, which reads as a stray grey stripe across the message.
 */
export function panel(children: ReactNode, options: { key?: string } = {}): ReactElement {
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

/* --- Ledger: billing and receipts --- */

/**
 * Brand on the left, document identity on the right, closed by a heavy rule.
 * That masthead is what makes an invoice read as a record rather than a message.
 */
export function ledgerMasthead(
  ctx: Ctx,
  options: { docType: string; docNumber: string; key?: string },
): ReactElement[] {
  const brand = ctx.branding.primaryColor ?? palette.ink;
  return [
    <Row
      key={options.key ?? 'ledger-masthead'}
      layout={ColumnLayouts.TwoEqual}
      backgroundColor={palette.surface}
      padding={`${space.xl} 0px ${space.md} 0px`}
      className={`${hook.gutter} ${hook.surface}`}
    >
      <Column padding={`0px ${space.sm} 0px ${layout.gutter}`}>
        {caption(
          `<a class="${hook.invertInk}" href="${ctx.branding.websiteUrl}" style="color:${brand};text-decoration:none;font-size:17px;font-weight:700;letter-spacing:-0.014em;">${ctx.branding.name}</a>`,
          { gap: space.none, key: 'lm-brand' },
        )}
      </Column>
      <Column padding={`0px ${layout.gutter} 0px ${space.sm}`}>
        {label(options.docType, { align: 'right', gap: space.xxs, key: 'lm-type' })}
        {caption(
          `<span style="font-family:${fonts.mono.value};font-size:14px;color:${palette.ink};letter-spacing:0.01em;">${options.docNumber}</span>`,
          { align: 'right', gap: space.none, key: 'lm-no' },
        )}
      </Column>
    </Row>,
    band([divider({ color: palette.ink, gap: space.none, key: 'lr' })], {
      pt: space.none,
      pb: space.none,
      key: 'ledger-rule',
    }),
  ];
}

/**
 * The figure is the message. Mono keeps the digits tabular so the decimal point
 * lands in the same place every time, which is the difference between a number
 * that reads as money and one that reads as text.
 */
export function ledgerAmount(options: {
  label: string;
  amount: string;
  meta?: string;
  tone?: string;
  key?: string;
}): ReactElement[] {
  const { label: name, amount, meta, tone = palette.ink, key = 'la' } = options;
  return [
    label(name, { gap: space.xs, key: `${key}-l` }),
    <Heading
      key={`${key}-a`}
      level="h1"
      text={amount}
      fontFamily={fonts.mono}
      fontSize={type.figure.fontSize}
      fontWeight={type.figure.fontWeight}
      lineHeight={type.figure.lineHeight}
      letterSpacing={type.figure.letterSpacing}
      color={tone}
      textAlign="left"
      containerPadding={`0px 0px ${meta ? space.xs : space.lg} 0px`}
    />,
    ...(meta ? [caption(meta, { gap: space.lg, key: `${key}-m` })] : []),
  ];
}

/** Section rule with a tracked label sitting on it, the way a statement divides itself. */
export function ledgerSection(name: string, key = 'ls'): ReactElement[] {
  return [
    divider({ color: palette.hairlineStrong, gap: space.md, key: `${key}-d` }),
    label(name, { gap: space.sm, key: `${key}-l` }),
  ];
}

/* --- Editorial: lifecycle, engagement and commerce --- */

/** The mark that opens every editorial template: a short heavy rule, then a tracked kicker. */
export function editorialKicker(value: string, options: { color?: string; key?: string } = {}): ReactElement[] {
  const { color = palette.muted, key = 'ek' } = options;
  return [
    <Paragraph
      key={`${key}-rule`}
      html={`<span style="display:inline-block;width:40px;height:3px;background-color:${palette.ink};line-height:3px;font-size:0;">&nbsp;</span>`}
      fontFamily={fonts.sans}
      fontSize="3px"
      lineHeight="3px"
      color={palette.ink}
      textAlign="left"
      containerPadding={`0px 0px ${space.md} 0px`}
    />,
    <Paragraph
      key={`${key}-text`}
      html={value.toUpperCase()}
      fontFamily={fonts.mono}
      fontSize={type.kicker.fontSize}
      lineHeight={type.kicker.lineHeight}
      letterSpacing={type.kicker.letterSpacing}
      color={color}
      textAlign="left"
      containerPadding={`0px 0px ${space.sm} 0px`}
    />,
  ];
}

export function editorialHeadline(value: string, key = 'eh'): ReactElement {
  return (
    <Heading
      key={key}
      level="h1"
      text={value}
      fontFamily={fonts.sans}
      fontSize={type.hero.fontSize}
      fontWeight={type.hero.fontWeight}
      lineHeight={type.hero.lineHeight}
      letterSpacing={type.hero.letterSpacing}
      color={palette.ink}
      textAlign="left"
      containerPadding={`0px 0px ${space.md} 0px`}
    />
  );
}

export function editorialLede(html: string, key = 'el'): ReactElement {
  return (
    <Paragraph
      key={key}
      html={html}
      fontFamily={fonts.sans}
      fontSize={type.ledeLg.fontSize}
      lineHeight={type.ledeLg.lineHeight}
      color={palette.body}
      textAlign="left"
      containerPadding={`0px 0px ${space.xl} 0px`}
    />
  );
}

export function editorialCta(ctx: Ctx, options: { label: string; href: string; key?: string }): ReactElement {
  return cta({ ctx, label: options.label, href: options.href, align: 'left', gap: space.md, key: options.key ?? 'ec' });
}

/**
 * Pull quote. Comment threads and testimonials both land better as a quoted
 * block with a rule than as another indistinguishable paragraph.
 */
export function pullQuote(options: { body: string; attribution?: string; key?: string }): ReactElement {
  const { body, attribution, key = 'pq' } = options;
  return (
    <Row
      key={key}
      layout={ColumnLayouts.OneColumn}
      backgroundColor={palette.surface}
      padding={`0px 0px ${space.lg} 0px`}
      className={`${hook.gutter} ${hook.surface}`}
    >
      <Column
        padding={`${space.xs} 0px ${space.xs} ${space.lg}`}
        border={{ borderLeftWidth: '3px', borderLeftStyle: 'solid', borderLeftColor: palette.ink }}
      >
        {text(`<em style="font-style:normal;color:${palette.inkSoft};">${body}</em>`, {
          gap: attribution ? space.xs : space.none,
          key: `${key}-b`,
        })}
        {attribution ? caption(attribution, { gap: space.none, key: `${key}-a` }) : null}
      </Column>
    </Row>
  );
}

/** Three tracked figures on one line. Reads as a report rather than a list. */
export function statRow(stats: { value: string; label: string }[], key = 'sr'): ReactElement {
  const layouts = { 2: ColumnLayouts.TwoEqual, 3: ColumnLayouts.ThreeEqual } as const;
  const columnLayout = stats.length === 2 ? layouts[2] : layouts[3];

  return (
    <Row
      key={key}
      layout={columnLayout}
      backgroundColor={palette.surface}
      padding={`0px 0px ${space.lg} 0px`}
      className={`${hook.gutter} ${hook.surface}`}
      noStackMobile
    >
      {stats.slice(0, 3).map((stat, index) => (
        <Column key={`c${index}`} padding={`0px ${space.sm} 0px ${index === 0 ? layout.gutter : space.none}`}>
          <Heading
            level="h3"
            text={stat.value}
            fontFamily={fonts.mono}
            fontSize="26px"
            fontWeight={600}
            lineHeight="110%"
            letterSpacing="-0.02em"
            color={palette.ink}
            textAlign="left"
            containerPadding={`0px 0px ${space.xxs} 0px`}
          />
          {label(stat.label, { gap: space.none })}
        </Column>
      ))}
    </Row>
  );
}

export { lede, small };
