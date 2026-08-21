/** Design System — Spacing, radii, typography. Échelle cohérente 4pt. */
export const spacing = {
  xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32, xxxl: 48,
} as const;

export const radius = {
  sm: 8, md: 12, lg: 16, xl: 24, pill: 999,
} as const;

export const typography = {
  // Tailles + weights ; la famille de police sera chargée via expo-font.
  display: { fontSize: 34, fontWeight: '800' as const, lineHeight: 40 },
  h1: { fontSize: 28, fontWeight: '700' as const, lineHeight: 34 },
  h2: { fontSize: 22, fontWeight: '700' as const, lineHeight: 28 },
  h3: { fontSize: 18, fontWeight: '600' as const, lineHeight: 24 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 22 },
  bodyMedium: { fontSize: 16, fontWeight: '600' as const, lineHeight: 22 },
  caption: { fontSize: 13, fontWeight: '500' as const, lineHeight: 18 },
  overline: { fontSize: 11, fontWeight: '700' as const, lineHeight: 14, letterSpacing: 1 },
} as const;

export const durations = { fast: 150, base: 250, slow: 400 } as const;
