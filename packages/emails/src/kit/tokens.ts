export type RenderMode = 'email' | 'web' | 'document';

/**
 * Email clients strip @font-face (Outlook desktop ignores it, Gmail removes it),
 * so every stack starts with fonts already on the device. Inter Tight only ever
 * arrives on web and document renders, where a linked stylesheet is honoured.
 */
export const fonts = {
  sans: {
    label: 'Inter Tight',
    value:
      "'Inter Tight', Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  },
  mono: {
    label: 'Geist Mono',
    value: "'Geist Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  },
  webStylesheets: [
    { url: 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&display=swap' },
  ],
} as const;

export const palette = {
  ink: '#0B0B0F',
  inkSoft: '#2A2D36',
  /** 8.2:1 on white. */
  body: '#4A4F5A',
  /** 4.9:1 on white, the lightest value allowed for text. */
  muted: '#6A7180',
  /** Borders and dividers only. Fails AA as text. */
  faint: '#AEB4BF',

  hairline: '#E7E8EC',
  hairlineSoft: '#F0F1F4',
  /** Heavier rule for table headers and print boxes. */
  hairlineStrong: '#D3D7DF',
  surface: '#FFFFFF',
  canvas: '#F7F7F9',
  raised: '#FBFBFC',

  accent: '#1F4BF5',
  accentHover: '#1839C4',
  accentTint: '#EEF2FE',

  success: '#0E7C5A',
  successTint: '#E8F6F0',
  warning: '#9A5B00',
  warningTint: '#FEF6E7',
  danger: '#C0293F',
  dangerTint: '#FDEEF0',

  onDark: '#FFFFFF',
  onDarkMuted: '#A8ADB8',
} as const;

/** Overrides for the clients that honour prefers-color-scheme (Apple Mail, iOS). */
export const darkPalette = {
  ink: '#F4F5F7',
  body: '#C3C8D2',
  muted: '#949BA8',
  hairline: '#2B2E36',
  surface: '#16181D',
  canvas: '#0D0E11',
  accent: '#7D96FF',
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

export const radius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  pill: '999px',
} as const;

/**
 * Negative tracking at display sizes is what separates a designed heading from a
 * default one. Body holds at 16px so mobile Safari does not auto-zoom.
 */
export const type = {
  display: { fontSize: '30px', fontWeight: 700, lineHeight: '120%', letterSpacing: '-0.021em' },
  title: { fontSize: '24px', fontWeight: 700, lineHeight: '126%', letterSpacing: '-0.017em' },
  subtitle: { fontSize: '19px', fontWeight: 600, lineHeight: '132%', letterSpacing: '-0.011em' },
  heading: { fontSize: '16px', fontWeight: 600, lineHeight: '142%', letterSpacing: '-0.005em' },
  lede: { fontSize: '17px', fontWeight: 400, lineHeight: '158%' },
  body: { fontSize: '16px', fontWeight: 400, lineHeight: '162%' },
  bodySm: { fontSize: '14px', fontWeight: 400, lineHeight: '158%' },
  caption: { fontSize: '13px', fontWeight: 400, lineHeight: '152%' },
  label: { fontSize: '11px', fontWeight: 700, lineHeight: '120%', letterSpacing: '0.085em' },
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

export const tokens = { fonts, palette, darkPalette, space, radius, type, layout } as const;
