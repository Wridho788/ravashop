export const colors = {
  background: '#F6F4EF',
  surface: '#FFFFFF',
  surfaceMuted: '#EFEBE3',
  ink: '#1F1B16',
  muted: '#6F675E',
  border: '#E2DCD1',
  accent: '#D9572B',
  accentDark: '#B5441E',
  accentSoft: '#FBE7DE',
  success: '#2F7D4F',
  successSoft: '#E1F1E7',
  danger: '#B3261E',
  dangerSoft: '#FBE4E2',
  disabled: '#C9C2B8',
  white: '#FFFFFF',
};

export const space = {xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32};

export const radius = {sm: 10, md: 14, lg: 20, pill: 999};

/** Minimum touch target in dp (docs/TRD.md). */
export const TOUCH = 48;

export const type = {
  hero: {fontSize: 26, fontWeight: '800' as const, color: colors.ink},
  title: {fontSize: 20, fontWeight: '700' as const, color: colors.ink},
  subtitle: {fontSize: 16, fontWeight: '700' as const, color: colors.ink},
  body: {fontSize: 15, color: colors.ink},
  caption: {fontSize: 13, color: colors.muted},
  price: {fontSize: 16, fontWeight: '800' as const, color: colors.ink},
};
