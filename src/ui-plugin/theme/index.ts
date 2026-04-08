// ScholarTrack UI Plugin - SA Transport Theme
// Professional, trustworthy, safety-focused design for South African student transport

export const colors = {
  // Primary - SA Warm Green (Trust, Safety, Warmth)
  primary: '#2D7A4F',
  primaryLight: '#4A9A6F',
  primaryDark: '#1A5A38',
  primaryMuted: '#E8F2EC',

  // Secondary - SA Deep Blue (Professionalism, Trust)
  secondary: '#1E408E',
  secondaryLight: '#3A65B8',
  secondaryDark: '#0F2A5A',
  secondaryMuted: '#E8ECF4',

  // Accent - SA Warm Gold (Excellence, Warmth, Sunshine)
  accent: '#F5A623',
  accentLight: '#FFBF5C',
  accentDark: '#D4890F',

  // SA Warm Neutrals (Cream, Warm Grey, Terracotta tones)
  warm: {
    cream: '#FDF6EC',
    terracotta: '#C65D3B',
    terracottaLight: '#E07B5A',
    sage: '#7D9B76',
    sunset: '#E8A87C',
    clay: '#B86B4C',
  },

  // Neutrals - warmer tones
  background: '#FAF8F5',
  backgroundAlt: '#F5F2ED',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  inputBg: '#F9F7F4',

  // Text - Warm dark
  text: '#2C2416',
  textSecondary: '#5C5040',
  textMuted: '#8C8472',
  textInverse: '#FFFFFF',

  // Semantic colors
  success: '#2D7A4F',
  successLight: '#E8F2EC',
  successDark: '#1A5A38',

  warning: '#F5A623',
  warningLight: '#FEF3E2',
  warningDark: '#D4890F',

  error: '#C43D3D',
  errorLight: '#FCEAEA',
  errorDark: '#A62828',

  info: '#1E408E',
  infoLight: '#E8ECF4',
  infoDark: '#0F2A5A',

  // Border & Dividers
  border: '#E8E4DD',
  borderLight: '#F0EDE8',
  divider: '#E8E4DD',

  // Interactive states
  selected: '#2D7A4F20',
  pressed: 'rgba(44, 36, 22, 0.08)',
  disabled: '#C4BFB5',

  // Shadows
  shadow: 'rgba(44, 36, 22, 0.08)',
  shadowStrong: 'rgba(44, 36, 22, 0.15)',

  // Overlay
  overlay: 'rgba(44, 36, 22, 0.5)',
  overlayLight: 'rgba(44, 36, 22, 0.25)',

  // Status colors for trips
  tripActive: '#2D7A4F',
  tripPending: '#F5A623',
  tripCompleted: '#1E408E',
  tripCancelled: '#C43D3D',
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
