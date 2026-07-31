export type RenderMode = 'email' | 'web' | 'document';

/**
 * Resolved to sRGB hex once here: email has no custom properties (Outlook drops
 * them) and no oklch, so nothing downstream approximates a colour per template.
 */

export const fonts = {
  sans: {
    label: 'Geist',
    value: "Geist, 'Geist Variable', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  mono: {
    label: 'Geist Mono',
    value: "'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  },
  /** Only web and document renders can load a face; email clients strip @font-face. */
  webStylesheets: [
    { url: 'https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap' },
  ],
} as const;

/**
 * Ink, paper, and one signal. The neutral ramp is five distinct steps because a
 * two-value ramp — which is what this system shipped with — renders every line
 * of every email at the same optical distance and reads as a wireframe.
 */
export const palette = {
  /** Warm paper, not grey. The cast is what separates it from a default canvas. */
  canvas: '#FAF9F6',
  surface: '#FFFFFF',
  raised: '#F4F2ED',

  /** The four text steps, measured on `surface`. Each is a real step, not an alias. */
  /** 18.9:1 — headlines, figures, the values that carry meaning. */
  ink: '#0F0F10',
  /** 11.0:1 — subheads and emphasis inside body copy. */
  inkSoft: '#3A3A3E',
  /** 6.8:1 — body copy. */
  body: '#5A5A61',
  /** 4.85:1 on surface, 4.57:1 on canvas — captions, log keys, legal. */
  muted: '#6F6F77',

  /** Borders only. 2.9:1, deliberately below text minimum so it cannot be misused. */
  faint: '#A8A6A0',
  hairline: '#E4E2DC',
  hairlineSoft: '#EFEDE7',
  /** 3.4:1. Boundaries that identify a control, such as a secondary button. */
  hairlineStrong: '#8A8880',

  /**
   * Ink slabs. `slab` is the masthead ground; `slabRaised` separates blocks
   * sitting on it. Both are fixed — they never flip in dark mode.
   */
  slab: '#0F0F10',
  slabRaised: '#1C1C1F',
  slabRule: '#2E2E33',

  /**
   * The one signal. 14.7:1 against ink, which is why it is only ever a fill or
   * knocked-out type on a slab. It is 1.3:1 on white — never set it as text on
   * a light ground; `link` exists for that.
   */
  accent: '#C9F24D',
  accentHover: '#B7E035',
  accentTint: '#F2FBD5',
  /** Foreground for anything sitting on `accent`. */
  onAccent: '#0F0F10',

  /** Body links are ink and underlined. A coloured link would be a second signal. */
  link: '#0F0F10',

  /**
   * Status marks. The saturated value is for fills, rules and badges; the `*Text`
   * step is the AA-passing variant, because the raw hue fails 4.5:1 as body text.
   */
  success: '#00A63E',
  successText: '#00802F',
  successTint: '#E4F7EA',
  warning: '#F0790B',
  warningText: '#B84E00',
  warningTint: '#FDEEDC',
  danger: '#E5484D',
  dangerText: '#CE2C31',
  dangerTint: '#FDE8E8',

  /** Meter and progress fills stay neutral and only escalate on a real threshold. */
  fillNeutral: '#C6C4BD',
  fillNeutralStrong: '#6F6F77',

  onDark: '#FFFFFF',
  onDarkMuted: '#8E8E96',

  imageFallback: '#EDEBE5',
} as const;

/** The dark half of the same system, not an inversion of the light half. */
export const darkPalette = {
  canvas: '#0B0B0C',
  /** Lighter than `slab` on purpose, so a fixed ink slab still reads as a slab. */
  surface: '#1A1A1D',
  raised: '#232327',
  ink: '#F4F3F0',
  inkSoft: '#C8C7C2',
  body: '#A1A0A8',
  muted: '#84838B',
  hairline: '#33333A',
  hairlineSoft: '#2A2A30',
  accent: '#C9F24D',
  accentTint: '#22290F',
  link: '#D7D6D2',
  success: '#3DD68C',
  successTint: '#0E2419',
  warning: '#FFA057',
  warningTint: '#2E1A0B',
  danger: '#FF6369',
  dangerTint: '#2C1517',
  fillNeutral: '#4A4A52',
} as const;

/**
 * Relative luminance, used to pick a readable foreground when a brand overrides
 * the accent with a colour of unknown lightness.
 */
function luminance(hex: string): number {
  const value = hex.replace('#', '');
  const full = value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const channels = [0, 2, 4].map((i) => {
    const c = parseInt(full.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0]! + 0.7152 * channels[1]! + 0.0722 * channels[2]!;
}

/** Ink on a light fill, white on a dark one. The 0.45 pivot maximises the worse ratio. */
export function readableOn(background: string): string {
  return luminance(background) > 0.45 ? palette.onAccent : palette.onDark;
}

export const space = {
  none: '0px',
  xxs: '4px',
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '40px',
  xxxl: '56px',
} as const;

export const radius = {
  none: '0px',
  sm: '6px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  pill: '100px',
} as const;

/**
 * The ramp carries real contrast: `mega` is five steps above `body`, so a code
 * or a total can dominate a message instead of merely topping it. Headings are
 * semibold with tight tracking; body copy runs relaxed on the muted steps.
 */
export const type = {
  /** Payload type. A one-time code or a total, set as the subject of the page. */
  mega: { fontSize: '56px', fontWeight: 600, lineHeight: '100%', letterSpacing: '-0.03em' },
  hero: { fontSize: '44px', fontWeight: 600, lineHeight: '100%', letterSpacing: '-0.028em' },
  figure: { fontSize: '40px', fontWeight: 600, lineHeight: '104%', letterSpacing: '-0.02em' },
  display: { fontSize: '34px', fontWeight: 600, lineHeight: '104%', letterSpacing: '-0.025em' },
  title: { fontSize: '28px', fontWeight: 600, lineHeight: '112%', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '20px', fontWeight: 600, lineHeight: '128%', letterSpacing: '-0.02em' },
  heading: { fontSize: '17px', fontWeight: 600, lineHeight: '136%', letterSpacing: '-0.015em' },
  ledeLg: { fontSize: '18px', fontWeight: 400, lineHeight: '160%' },
  lede: { fontSize: '17px', fontWeight: 400, lineHeight: '160%' },
  body: { fontSize: '16px', fontWeight: 400, lineHeight: '162%' },
  bodySm: { fontSize: '14px', fontWeight: 400, lineHeight: '158%' },
  caption: { fontSize: '13px', fontWeight: 400, lineHeight: '152%' },
  /** Eyebrow. Leads a section that has a header. */
  kicker: { fontSize: '11px', fontWeight: 600, lineHeight: '120%', letterSpacing: '0.18em' },
  /** Microlabel. */
  label: { fontSize: '10px', fontWeight: 700, lineHeight: '120%', letterSpacing: '0.16em' },
  /** Mono genre stamp on an ink slab, and the key column of a log. */
  stamp: { fontSize: '11px', fontWeight: 600, lineHeight: '120%', letterSpacing: '0.22em' },
  logKey: { fontSize: '11px', fontWeight: 500, lineHeight: '140%', letterSpacing: '0.1em' },
  logValue: { fontSize: '13px', fontWeight: 500, lineHeight: '140%', letterSpacing: '0.01em' },
} as const;

export const layout = {
  /** 600px is the widest an email renders before the Outlook reading pane clips. */
  emailWidth: '600px',
  webWidth: '680px',
  /** A4 at 96dpi less 2x14mm print margins. */
  documentWidth: '689px',
  gutter: '40px',
  gutterMobile: '24px',
} as const;

/** Elements pins dimensions to these literal shapes rather than plain strings. */
export type Dimension = number | `${number}px` | `${number}%`;

export function contentWidth(mode: RenderMode): `${number}px` {
  if (mode === 'email') return layout.emailWidth;
  return mode === 'web' ? layout.webWidth : layout.documentWidth;
}

/** Page fills waste toner, so document mode drops to white and leans on hairlines. */
export function canvasColor(mode: RenderMode): string {
  return mode === 'document' ? palette.surface : palette.canvas;
}

/**
 * Purpose drives art direction. A receipt, a sign-in alert and a winback email
 * should not look like siblings, so each genre resolves to one composition.
 */
export const FAMILIES = ['record', 'ledger', 'editorial'] as const;
export type Family = (typeof FAMILIES)[number];

export const tokens = { fonts, palette, darkPalette, space, radius, type, layout } as const;
