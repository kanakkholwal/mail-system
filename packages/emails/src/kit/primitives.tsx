import type { ReactElement, ReactNode } from 'react';
import { Button, Column, ColumnLayouts, Divider, Heading, Image, Paragraph, Row } from '@unlayer/react-elements';
import { hook } from './head-css.js';
import { fonts, layout, palette, radius, space, type, type Dimension } from './tokens.js';
import { type Ctx, ctaColor, ctaTextColor, linkColor } from './context.js';

type Align = 'left' | 'center' | 'right';

/**
 * Elements resolves layout from a literal element tree, so every helper returns
 * a real <Row> or item element. Wrapper components and fragments are dropped by
 * renderToJson without throwing, which is why none appear in this kit.
 */

interface BandOptions {
  bg?: string;
  pt?: string;
  pb?: string;
  /** Set false for full-bleed bands such as accent rules. */
  gutter?: boolean;
  /** `sunken` recesses the band (footers) in both light and dark themes. */
  tone?: 'surface' | 'sunken';
  /** Opts out of the dark-mode flip for bands that are already dark. */
  fixed?: boolean;
  className?: string;
  key?: string;
}

function bandClasses({ gutter = true, tone = 'surface', fixed, className }: BandOptions): string {
  return [
    gutter ? hook.gutter : '',
    hook.surface,
    tone === 'sunken' ? hook.sunken : '',
    fixed ? hook.fixed : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');
}

function bandBackground({ bg, tone = 'surface' }: BandOptions): string {
  return bg ?? (tone === 'sunken' ? palette.canvas : palette.surface);
}

/**
 * Vertical padding goes on the Row and the horizontal gutter on the Column.
 * Elements zeroes row side padding under 620px, so a gutter on the Row would
 * silently collapse to zero on mobile.
 */
export function band(children: ReactNode, options: BandOptions = {}): ReactElement {
  const { pt = space.lg, pb = space.lg, gutter = true, key } = options;
  const side = gutter ? layout.gutter : '0px';
  return (
    <Row
      key={key}
      layout={ColumnLayouts.OneColumn}
      backgroundColor={bandBackground(options)}
      padding={`${pt} 0px ${pb} 0px`}
      className={bandClasses(options)}
    >
      <Column padding={`0px ${side}`}>{children}</Column>
    </Row>
  );
}

interface SplitOptions extends BandOptions {
  ratio?: 'equal' | 'wideNarrow' | 'narrowWide';
  /** Keeps both columns side by side on mobile. Use only for tiny content. */
  noStackMobile?: boolean;
  /** Horizontal space between the two columns. */
  gap?: string;
}

export function bandSplit(left: ReactNode, right: ReactNode, options: SplitOptions = {}): ReactElement {
  const { pt = space.lg, pb = space.lg, ratio = 'equal', key, noStackMobile, gap = space.md } = options;
  const layoutMap = {
    equal: ColumnLayouts.TwoEqual,
    wideNarrow: ColumnLayouts.TwoWideNarrow,
    narrowWide: ColumnLayouts.TwoNarrowWide,
  } as const;
  return (
    <Row
      key={key}
      layout={layoutMap[ratio]}
      backgroundColor={bandBackground(options)}
      padding={`${pt} 0px ${pb} 0px`}
      className={bandClasses(options)}
      {...(noStackMobile === undefined ? {} : { noStackMobile })}
    >
      <Column padding={`0px ${gap} 0px ${layout.gutter}`}>{left}</Column>
      <Column padding={`0px ${layout.gutter} 0px ${gap}`}>{right}</Column>
    </Row>
  );
}

interface TextOptions {
  align?: Align;
  color?: string;
  key?: string;
  /** Space below, applied as the item's container padding. */
  gap?: string;
  mono?: boolean;
}

const headingLevels = { display: 'h1', title: 'h1', subtitle: 'h2', heading: 'h3' } as const;

function makeHeading(
  variant: keyof typeof headingLevels,
  text: string,
  options: TextOptions = {},
): ReactElement {
  const scale = type[variant];
  const { align = 'left', color = palette.ink, gap = space.sm, key, mono } = options;
  return (
    <Heading
      key={key}
      level={headingLevels[variant]}
      text={text}
      fontFamily={mono ? fonts.mono : fonts.sans}
      fontSize={scale.fontSize}
      fontWeight={scale.fontWeight}
      lineHeight={scale.lineHeight}
      letterSpacing={scale.letterSpacing}
      color={color}
      textAlign={align}
      containerPadding={`0px 0px ${gap} 0px`}
    />
  );
}

export const display = (text: string, o?: TextOptions) => makeHeading('display', text, o);
export const title = (text: string, o?: TextOptions) => makeHeading('title', text, o);
export const subtitle = (text: string, o?: TextOptions) => makeHeading('subtitle', text, o);
export const heading = (text: string, o?: TextOptions) => makeHeading('heading', text, o);

function makeParagraph(
  variant: 'lede' | 'body' | 'bodySm' | 'caption',
  html: string,
  options: TextOptions = {},
): ReactElement {
  const scale = type[variant];
  const defaultColor = variant === 'caption' ? palette.muted : palette.body;
  const { align = 'left', color = defaultColor, gap = space.md, key, mono } = options;
  return (
    <Paragraph
      key={key}
      html={html}
      fontFamily={mono ? fonts.mono : fonts.sans}
      fontSize={scale.fontSize}
      lineHeight={scale.lineHeight}
      color={color}
      textAlign={align}
      containerPadding={`0px 0px ${gap} 0px`}
    />
  );
}

export const lede = (html: string, o?: TextOptions) => makeParagraph('lede', html, o);
export const text = (html: string, o?: TextOptions) => makeParagraph('body', html, o);
export const small = (html: string, o?: TextOptions) => makeParagraph('bodySm', html, o);
export const caption = (html: string, o?: TextOptions) => makeParagraph('caption', html, o);

export function label(value: string, options: TextOptions = {}): ReactElement {
  const { align = 'left', color = palette.muted, gap = space.xs, key } = options;
  return (
    <Paragraph
      key={key}
      html={value.toUpperCase()}
      fontFamily={fonts.sans}
      fontSize={type.label.fontSize}
      lineHeight={type.label.lineHeight}
      letterSpacing={type.label.letterSpacing}
      color={color}
      textAlign={align}
      containerPadding={`0px 0px ${gap} 0px`}
    />
  );
}

export interface CtaOptions {
  ctx: Ctx;
  label: string;
  href: string;
  /** `onSlab` is the variant for a button sitting on an ink band. */
  variant?: 'primary' | 'secondary' | 'onSlab';
  /** Full width reads as more tappable on mobile and lifts click rate. */
  fullWidth?: boolean;
  align?: Align;
  gap?: string;
  key?: string;
}

/**
 * A border with no `borderStyle` resolves to `none`, so every side sets style
 * explicitly. The secondary variant also carries a fill, because it has to still
 * read as a button in the clients that drop borders outright.
 */
function box(color: string, width = '1px') {
  return {
    borderTopWidth: width, borderTopStyle: 'solid', borderTopColor: color,
    borderRightWidth: width, borderRightStyle: 'solid', borderRightColor: color,
    borderBottomWidth: width, borderBottomStyle: 'solid', borderBottomColor: color,
    borderLeftWidth: width, borderLeftStyle: 'solid', borderLeftColor: color,
  } as const;
}

/** 14px vertical padding on 16px text clears the 44px minimum touch target. */
export function cta(options: CtaOptions): ReactElement {
  const { ctx, label: text, href, variant = 'primary', fullWidth = false, align = 'left', gap = space.md, key } = options;
  const skin = {
    primary: { bg: ctaColor(ctx), fg: ctaTextColor(ctx), hover: palette.accentHover, border: undefined },
    secondary: { bg: palette.surface, fg: palette.ink, hover: palette.raised, border: box(palette.hairlineStrong) },
    onSlab: { bg: palette.slab, fg: palette.accent, hover: palette.slabRaised, border: box(palette.slabRule) },
  }[variant];
  return (
    <Button
      key={key}
      href={href}
      text={text}
      backgroundColor={skin.bg}
      color={skin.fg}
      hoverBackgroundColor={skin.hover}
      hoverColor={skin.fg}
      fontFamily={fonts.sans}
      fontSize="16px"
      fontWeight={600}
      letterSpacing="-0.01em"
      padding="15px 30px"
      borderRadius={radius.sm}
      textAlign={align}
      containerPadding={`0px 0px ${gap} 0px`}
      {...(fullWidth ? { width: '100%' } : {})}
      {...(skin.border ? { border: skin.border } : {})}
    />
  );
}

/**
 * Some corporate gateways rewrite or strip button markup, so the destination is
 * always repeated as selectable text.
 */
export function fallbackLink(
  ctx: Ctx,
  href: string,
  options: { lead?: string; align?: Align; gap?: string } = {},
): ReactElement {
  const { lead = 'Button not working? Paste this into your browser:', align = 'left', gap = space.none } = options;
  return caption(
    `${lead}<br /><a href="${href}" style="color:${linkColor(ctx)};text-decoration:underline;word-break:break-all;">${href}</a>`,
    { align, gap },
  );
}

export function divider(
  options: { color?: string; width?: Dimension; weight?: string; gap?: string; key?: string } = {},
): ReactElement {
  const { color = palette.hairline, width = '100%', weight = '1px', gap = space.md, key } = options;
  return (
    <Divider
      key={key}
      borderTopWidth={weight}
      borderTopColor={color}
      borderTopStyle="solid"
      width={width}
      containerPadding={`${gap} 0px ${gap} 0px`}
    />
  );
}

/** Divider with a transparent rule, used purely for vertical rhythm. */
export function spacer(height: string, key?: string): ReactElement {
  return (
    <Divider
      key={key}
      borderTopWidth="0px"
      borderTopStyle="none"
      width="100%"
      containerPadding={`0px 0px ${height} 0px`}
    />
  );
}

export interface ImageOptions {
  src: string;
  alt: string;
  /** Percentage pins display width; a px value is read as the natural size. */
  width?: Dimension;
  align?: Align;
  href?: string;
  gap?: string;
  key?: string;
}

export function image(options: ImageOptions): ReactElement {
  const { src, alt, width, align = 'left', href, gap = space.md, key } = options;
  return (
    <Image
      key={key}
      src={src}
      altText={alt}
      textAlign={align}
      containerPadding={`0px 0px ${gap} 0px`}
      {...(width ? { width } : {})}
      {...(href ? { action: { name: 'web', values: { href, target: '_blank' } } } : {})}
    />
  );
}
