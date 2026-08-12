// MalumeScholarTrack Elder-First Theme
// One palette. Six font sizes. No decisions.

export const elderTheme = {
  colors: {
    background: '#FFFAF5',
    card: '#FFFFFF',
    primary: '#2563EB',
    primaryPressed: '#1D4ED8',
    success: '#16A34A',
    successLight: '#DCFCE7',
    danger: '#DC2626',
    dangerLight: '#FEE2E2',
    warning: '#D97706',
    warningLight: '#FEF3C7',
    text: '#171717',
    textSecondary: '#6B7280',
    textInverse: '#FFFFFF',
    border: '#E5E7EB',
    inputBg: '#F9FAFB',
    overlay: 'rgba(0,0,0,0.4)',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },

  radius: {
    card: 16,
    button: 16,
    input: 16,
    badge: 9999,
  },

  typography: {
    pageTitle: { fontSize: 24, fontWeight: '700' as const, color: '#171717' },
    cardHeading: { fontSize: 20, fontWeight: '600' as const, color: '#171717' },
    body: { fontSize: 18, fontWeight: '400' as const, color: '#171717' },
    bodySmall: { fontSize: 16, fontWeight: '400' as const, color: '#6B7280' },
    button: { fontSize: 18, fontWeight: '700' as const, color: '#FFFFFF' },
    stat: { fontSize: 36, fontWeight: '700' as const, color: '#171717' },
  },

  touch: {
    minTarget: 48,
    buttonHeight: 56,
    inputHeight: 56,
  },

  layout: {
    cardPadding: 20,
    cardGap: 16,
    screenPadding: 16,
  },
} as const;

export type ElderTheme = typeof elderTheme;
