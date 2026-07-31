import type { ReactElement } from 'react';
import { Column, ColumnLayouts, Image, Row } from '@unlayer/react-elements';
import { hook } from './head-css.js';
import { caption, image } from './primitives.js';
import { layout, palette, space } from './tokens.js';

export interface HeroOptions {
  src: string;
  /** Carries the message on its own: a third of clients block images by default. */
  alt: string;
  href?: string;
  /** Shown while the image is blocked or still loading. */
  fallback?: string;
  key?: string;
}

/**
 * Full-bleed photograph. The band keeps a fill behind it so a blocked image
 * lands as a deliberate colour field with alt text, not a white gap above the
 * headline. Nothing load-bearing ever sits inside the picture, because text
 * baked into an image disappears with it.
 */
export function hero(options: HeroOptions): ReactElement {
  const { src, alt, href, fallback = palette.imageFallback, key = 'hero' } = options;
  return (
    <Row
      key={key}
      layout={ColumnLayouts.OneColumn}
      backgroundColor={palette.surface}
      padding="0px"
      className={hook.surface}
    >
      {/* The fill sits on the column, not the row: Unlayer paints a row background
          on a full-width wrapper, so it would bleed past the body edges. */}
      <Column padding="0px" backgroundColor={fallback}>
        <Image
          src={src}
          altText={alt}
          width="100%"
          textAlign="center"
          containerPadding="0px"
          {...(href ? { action: { name: 'web', values: { href, target: '_blank' } } } : {})}
        />
      </Column>
    </Row>
  );
}

export interface FigureOptions {
  src: string;
  alt: string;
  caption?: string;
  href?: string;
  gap?: string;
  key?: string;
}

/** Inset image with an optional credit line, for content inside the gutter. */
export function figure(options: FigureOptions): ReactElement[] {
  const { src, alt, caption: note, href, gap = space.lg, key = 'figure' } = options;
  return [
    image({
      src,
      alt,
      width: '100%',
      align: 'center',
      gap: note ? space.xs : gap,
      key: `${key}-img`,
      ...(href ? { href } : {}),
    }),
    ...(note ? [caption(note, { gap, key: `${key}-cap` })] : []),
  ];
}

/**
 * Elements sizes images from the source, so a 2x asset must be pinned to its
 * display width or it renders at double size on desktop.
 */
export function thumbnail(options: { src: string; alt: string; width?: string; gap?: string; key?: string }): ReactElement {
  const { src, alt, width = '100%', gap = space.none, key } = options;
  return image({ src, alt, width: width as `${number}%`, align: 'left', gap, ...(key ? { key } : {}) });
}

/** Half-bleed split: photograph on one side, copy on the other. Stacks on mobile. */
export function heroSplit(
  media: { src: string; alt: string },
  copy: ReactElement[],
  options: { reverse?: boolean; key?: string; pt?: string; pb?: string } = {},
): ReactElement {
  const { reverse = false, key = 'hero-split', pt = space.none, pb = space.none } = options;
  const picture = (
    <Image
      key="m"
      src={media.src}
      altText={media.alt}
      width="100%"
      textAlign="center"
      containerPadding="0px"
    />
  );

  return (
    <Row
      key={key}
      layout={ColumnLayouts.TwoEqual}
      backgroundColor={palette.surface}
      padding={`${pt} 0px ${pb} 0px`}
      className={`${hook.gutter} ${hook.surface}`}
    >
      <Column padding="0px">{reverse ? copy : [picture]}</Column>
      <Column padding={`${space.lg} ${layout.gutter}`}>{reverse ? [picture] : copy}</Column>
    </Row>
  );
}
