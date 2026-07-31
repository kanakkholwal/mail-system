export type RenderMode = 'email' | 'web' | 'document';

/**
 * Every value below is the Recast design system resolved to sRGB hex. Email has
 * no custom properties (Outlook ignores them) and no oklch, so the tokens are
 * converted once here rather than approximated per template.
 * Source: packages/design/src/index.css.
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
 * Colour is budgeted 60/30/10: canvas, structure, then `accent` alone. The accent
 * is reserved for the one primary action, links and focus. It is never a tint.
 */
export const palette = {
  /** 60 — the page ground. */
  canvas: '#F9F8F7',
  /** 30 — surfaces and structure. */
  surface: '#FFFFFF',
  raised: '#FAFAFA',

  /** 17.4:1 on surface. Headings, amounts, the values that carry meaning. */
  ink: '#1A1A1A',
  inkSoft: '#1A1A1A',
  /** 4.83:1 on surface, 4.56:1 on canvas. Body copy and microlabels. */
  body: '#6B7280',
  muted: '#6B7280',

  hairline: '#E1E1E1',
  /** Section dividers. The system asks for a low border, not a solid rule. */
  hairlineSoft: '#EDEDED',
  /** 3.64:1. Boundaries that identify a control, such as a secondary button. */
  hairlineStrong: '#868686',
  /** Never text. Borders and dividers only. */
  faint: '#868686',

  /** 10 — the single accent. 5.77:1 as text on surface and as white on itself. */
  accent: '#2A5CDA',
  accentHover: '#1442BE',
  accentTint: '#E6F2FF',

  /**
   * Status marks. The saturated value is for fills, rules and badges; the `*Text`
   * step is the AA-passing variant, because the raw hue fails 4.5:1 as body text
   * (destructive 3.76:1, warning 2.58:1, success 3.01:1 on white).
   */
  success: '#00AD00',
  successText: '#008900',
  successTint: '#E5F8E3',
  warning: '#FF7B3D',
  warningText: '#CE4C00',
  warningTint: '#FFEBDF',
  danger: '#EF4444',
  dangerText: '#DE3136',
  dangerTint: '#FFE9E6',

  /** Meter and progress fills stay neutral and only escalate on a real threshold. */
  fillNeutral: '#B7B7B7',
  fillNeutralStrong: '#717171',

  onDark: '#FFFFFF',
  onDarkMuted: '#8C8C8C',

  imageFallback: '#EBEBEB',
} as const;

/** The dark half of the same system, not an inversion of the light half. */
export const darkPalette = {
  canvas: '#0D0D0D',
  surface: '#262626',
  raised: '#1F1F1F',
  ink: '#F0F0F0',
  body: '#8C8C8C',
  muted: '#8C8C8C',
  hairline: '#333333',
  hairlineSoft: '#2E2E2E',
  accent: '#6C9BFE',
  accentTint: '#131E37',
  success: '#00A400',
  successTint: '#122510',
  warning: '#E86421',
  warningTint: '#31180D',
  danger: '#FB504E',
  dangerTint: '#321614',
  fillNeutral: '#555555',
} as const;

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

/** --radius 0.75rem and its steps, resolved to px. */
export const radius = {
  sm: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  pill: '100px',
} as const;

/**
 * Headings are semibold with -0.02em tracking, never bold. Body copy runs at the
 * relaxed leading the system specifies and sits on the muted tone.
 */
export const type = {
  hero: { fontSize: '40px', fontWeight: 600, lineHeight: '102%', letterSpacing: '-0.02em' },
  figure: { fontSize: '40px', fontWeight: 600, lineHeight: '104%', letterSpacing: '-0.02em' },
  display: { fontSize: '32px', fontWeight: 600, lineHeight: '106%', letterSpacing: '-0.02em' },
  title: { fontSize: '28px', fontWeight: 600, lineHeight: '112%', letterSpacing: '-0.02em' },
  subtitle: { fontSize: '20px', fontWeight: 600, lineHeight: '128%', letterSpacing: '-0.02em' },
  heading: { fontSize: '18px', fontWeight: 600, lineHeight: '136%', letterSpacing: '-0.02em' },
  ledeLg: { fontSize: '18px', fontWeight: 400, lineHeight: '162%' },
  lede: { fontSize: '17px', fontWeight: 400, lineHeight: '162%' },
  body: { fontSize: '16px', fontWeight: 400, lineHeight: '162%' },
  bodySm: { fontSize: '14px', fontWeight: 400, lineHeight: '158%' },
  caption: { fontSize: '13px', fontWeight: 400, lineHeight: '152%' },
  /** Eyebrow. Leads a section that has a header. */
  kicker: { fontSize: '11px', fontWeight: 600, lineHeight: '120%', letterSpacing: '0.18em' },
  /** Microlabel. */
  label: { fontSize: '10px', fontWeight: 700, lineHeight: '120%', letterSpacing: '0.16em' },
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
 * Purpose drives art direction. A receipt and a winback email should not look
 * like siblings, so each genre resolves to one of three compositions.
 */
export const FAMILIES = ['focused', 'ledger', 'editorial'] as const;
export type Family = (typeof FAMILIES)[number];

export const tokens = { fonts, palette, darkPalette, space, radius, type, layout } as const;
