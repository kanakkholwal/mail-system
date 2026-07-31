import type { ReactElement } from 'react';
import { Menu, Social } from '@unlayer/react-elements';
import { band, bandSplit, caption, divider, image, label, small } from './primitives.js';
import { fonts, palette, space, type } from './tokens.js';
import { hook } from './head-css.js';
import { type Ctx, isPrint, linkColor } from './context.js';

/**
 * The wordmark is live text by default. Outlook blocks images and many Gmail
 * users never load them, so a logo-as-image header renders as a blank gap.
 * Pass `branding.logoUrl` only when a hosted asset is genuinely wanted.
 */
export function brandHeader(ctx: Ctx, options: { align?: 'left' | 'center' } = {}): ReactElement {
  const { align = 'left' } = options;
  const { branding } = ctx;
  const mark = branding.logoUrl
    ? image({
        src: branding.logoUrl,
        alt: branding.name,
        width: `${branding.logoWidth}px`,
        align,
        href: branding.websiteUrl,
        gap: space.none,
        key: 'logo',
      })
    : wordmark(ctx, align);

  return band([mark], { pt: space.xl, pb: space.lg, key: 'brand-header' });
}

function wordmark(ctx: Ctx, align: 'left' | 'center'): ReactElement {
  const color = palette.ink;
  return caption(
    `<a class="${hook.invertInk}" href="${ctx.branding.websiteUrl}" style="color:${color};text-decoration:none;font-size:17px;font-weight:600;letter-spacing:-0.02em;">${ctx.branding.name}</a>`,
    { align, gap: space.none, key: 'wordmark' },
  );
}

/**
 * Full-bleed masthead rule. Deliberately a hairline rather than the brand colour:
 * a near-black line at full width overpowers the headline beneath it.
 */
export function accentRule(_ctx: Ctx): ReactElement {
  return band([divider({ color: palette.hairline, gap: space.none, key: 'r' })], {
    pt: space.none,
    pb: space.none,
    gutter: false,
    key: 'accent-rule',
  });
}

/**
 * A named human in the signature lifts reply and click rates, so a person
 * sender renders as a real sign-off rather than a generic team line.
 */
export function signature(ctx: Ctx): ReactElement | null {
  if (ctx.sender.kind !== 'person') return null;
  const { name, role } = ctx.sender;
  const roleLine = role ? `<br /><span style="color:${palette.muted};">${role}, ${ctx.branding.name}</span>` : '';
  return band([small(`${name}${roleLine}`, { gap: space.none, key: 'sig' })], {
    pt: space.none,
    pb: space.xl,
    key: 'signature',
  });
}

export interface FooterOptions {
  /**
   * Off by default. Social links pull attention away from the one action a
   * transactional email exists to drive, so only marketing templates opt in.
   */
  showSocials?: boolean;
  /** Adds a "view in browser" link, omitted from print. */
  webViewUrl?: string;
}

export function footer(ctx: Ctx, options: FooterOptions = {}): ReactElement[] {
  const { branding, legal } = ctx;
  const rows: ReactElement[] = [];
  const link = (href: string, text: string) =>
    `<a href="${href}" style="color:${palette.muted};text-decoration:underline;">${text}</a>`;

  if (options.showSocials === true && branding.socials.length > 0 && !isPrint(ctx)) {
    rows.push(
      band(
        [
          <Social
            key="social"
            icons={branding.socials.map((s) => ({ name: socialName(s.platform), url: s.url }))}
            iconType="squared"
            iconSize={22}
            spacing={12}
            align="left"
            containerPadding="0px"
          />,
        ],
        { pt: space.lg, pb: space.none, tone: 'sunken', key: 'footer-social' },
      ),
    );
  }

  const legalLinks = [
    options.webViewUrl && !isPrint(ctx) ? link(options.webViewUrl, 'View in browser') : '',
    branding.supportUrl ? link(branding.supportUrl, 'Support') : '',
    legal.preferencesUrl ? link(legal.preferencesUrl, 'Email preferences') : '',
    legal.unsubscribeUrl ? link(legal.unsubscribeUrl, 'Unsubscribe') : '',
  ].filter(Boolean);

  rows.push(
    band(
      [
        divider({ gap: space.none, key: 'fd' }),
        caption(
          [
            legalLinks.length > 0 ? `${legalLinks.join(' &nbsp;·&nbsp; ')}<br /><br />` : '',
            `${legal.postalAddress}<br />`,
            `&copy; ${legal.copyrightYear} ${branding.name}. All rights reserved.`,
          ].join(''),
          { gap: space.none, key: 'legal' },
        ),
      ],
      { pt: space.lg, pb: space.xl, tone: 'sunken', key: 'footer-legal' },
    ),
  );

  return rows;
}

/** Elements matches its bundled icon set by name, not by slug. */
function socialName(platform: string): string {
  const map: Record<string, string> = {
    x: 'X',
    linkedin: 'LinkedIn',
    github: 'GitHub',
    instagram: 'Instagram',
    youtube: 'YouTube',
    facebook: 'Facebook',
    threads: 'Threads',
  };
  return map[platform] ?? platform;
}

export function navMenu(ctx: Ctx, items: { text: string; href: string }[]): ReactElement {
  return band(
    [
      <Menu
        key="nav"
        items={items}
        layout="horizontal"
        align="left"
        fontFamily={fonts.sans}
        fontSize={type.caption.fontSize}
        linkColor={linkColor(ctx)}
        separator=""
        padding="0px 14px 0px 0px"
        containerPadding="0px"
      />,
    ],
    { pt: space.none, pb: space.lg, key: 'nav-menu' },
  );
}
