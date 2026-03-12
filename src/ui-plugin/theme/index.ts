// ScholarTrack UI Plugin - SA Transport Theme
// Professional, trustworthy, safety-focused design for South African student transport

export const colors = {
  // Primary - SA Green (Trust, Safety)
  primary: '#007749',
  primaryLight: '#00995F',
  primaryDark: '#005A37',
  primaryMuted: '#E8F5EE',

  // Secondary - SA Blue (Professionalism)
  secondary: '#002395',
  secondaryLight: '#0033C7',
  secondaryDark: '#00196E',
  secondaryMuted: '#E8ECF4',

  // Accent - SA Gold (Excellence)
  accent: '#FFB81C',
  accentLight: '#FFCF5C',
  accentDark: '#E6A600',

  // Neutrals
  background: '#F5F5F5',
  backgroundAlt: '#EEEEEE',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',

  // Text - Dark professional
  text: '#1A1A2E',
  textSecondary: '#4A4A68',
  textMuted: '#8C8CA1',
  textInverse: '#FFFFFF',

  // Semantic colors
  success: '#007749',
  successLight: '#E8F5EE',
  successDark: '#005A37',

  warning: '#FFB81C',
  warningLight: '#FFF5E0',
  warningDark: '#E6A600',

  error: '#E03C31',
  errorLight: '#FDEDED',
  errorDark: '#C42B23',

  info: '#002395',
  infoLight: '#E8ECF4',
  infoDark: '#00196E',

  // Border & Dividers
  border: '#E0E0E0',
  borderLight: '#EEEEEE',
  divider: '#E0E0E0',

  // Shadows
  shadow: 'rgba(26, 26, 46, 0.08)',
  shadowStrong: 'rgba(26, 26, 46, 0.15)',

  // Overlay
  overlay: 'rgba(26, 26, 46, 0.5)',
  overlayLight: 'rgba(26, 26, 46, 0.25)',

  // Status colors for trips
  tripActive: '#007749',
  tripPending: '#FFB81C',
  tripCompleted: '#002395',
  tripCancelled: '#E03C31',
};

export const spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const borderRadius = {
  none: 0,
  sm: 6,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  full: 9999,
  round: 9999,
};

export const typography = {
  // Display - For large headlines
  displayLarge: {
    fontSize: 34,
    fontWeight: '700' as const,
    lineHeight: 42,
    letterSpacing: -0.5,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 36,
    letterSpacing: -0.3,
  },
  displaySmall: {
    fontSize: 24,
    fontWeight: '600' as const,
    lineHeight: 32,
    letterSpacing: -0.2,
  },

  // Headlines
  h1: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  h2: {
    fontSize: 20,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h4: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 22,
  },

  // Body
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 18,
  },

  // Labels
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    lineHeight: 20,
    letterSpacing: 0.1,
  },
  labelSmall: {
    fontSize: 12,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.2,
  },

  // Caption
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.2,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
};

export const shadows = {
  none: {},
  sm: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 1,
  },
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 5,
  },
  xl: {
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 8,
  },
};

export const iconSizes = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  xxl: 40,
};

export const theme = {
  colors,
  spacing,
  borderRadius,
  typography,
  shadows,
  iconSizes,
};

export type Theme = typeof theme;
export default theme;
