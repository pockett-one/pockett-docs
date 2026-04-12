/**
 * Design tokens from Google Stitch project **"firma redesign"**
 * (`projects/17756292360646189722`) — creative direction *The Institutional Curator*.
 *
 * Kinetic / “Institution Edition” surfaces use **Kinetic Institution Edition** tokens;
 * see `config/kinetic-institution.ts` + `components/kinetic/*`.
 *
 * Source: Stitch `designTheme.namedColors` + design markdown (Newsreader / Inter / Space Grotesk).
 */
export const STITCH_FIRMA_PROJECT_TITLE = 'firma redesign' as const

export const STITCH_COLORS = {
  primary: '#041627',
  primaryContainer: '#1a2b3c',
  secondary: '#0060a9',
  /** Brighter shell so #fff cards read crisp */
  surface: '#fafbfb',
  surfaceContainerLow: '#f5f6f6',
  surfaceContainer: '#f0f1f1',
  surfaceContainerHigh: '#e6e9e8',
  surfaceContainerHighest: '#e0e3e2',
  surfaceLowest: '#ffffff',
  onSurface: '#181c1c',
  onSurfaceVariant: '#44474c',
  outlineVariant: '#c4c6cd',
  /** Alert / security highlights — use sparingly per design system */
  accentAmber: '#d35400',
} as const

/** Ambient shadow from Stitch design doc (on-surface tint, not pure black) */
export const STITCH_FLOATING_SHADOW =
  '0px 20px 40px rgba(24, 28, 28, 0.06)' as const
