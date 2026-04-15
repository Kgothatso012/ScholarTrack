// ScholarTrack UI Plugin - Taste-Skill Redesign
// Neutral Zinc/Slate base + sharp amber accent. NO AI purple/blue.

export const colors = {
  // Primary - Sharp Amber Accent (saturation < 80%)
  primary: '#D97706', // amber-600
  primaryLight: '#F59E0B', // amber-500
  primaryDark: '#B45309', // amber-700
  primaryMuted: '#FEF3C7', // amber-100

  // Secondary - Slate (neutral base)
  secondary: '#334155', // slate-700
  secondaryLight: '#64748B', // slate-500
  secondaryDark: '#1E293B', // slate-800
  secondaryMuted: '#F1F5F9', // slate-100

  // Accent - same as primary for single accent rule
  accent: '#D97706',
  accentLight: '#F59E0B',
  accentDark: '#B45309',

  // Zinc neutrals - cool, professional
  background: '#FAFAFA', // zinc-50
  backgroundAlt: '#F4F4F5', // zinc-100
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  card: '#FFFFFF',
  inputBg: '#F8FAFC', // slate-50

  // Text - off-black Zinc
  text: '#18181B', // zinc-900
  textSecondary: '#52525B', // zinc-600
  textMuted: '#A1A1AA', // zinc-400
  textInverse: '#FFFFFF',

  // Semantic colors - Zinc/Slate variants
  success: '#059669', // emerald-600 (desaturated green)
  successLight: '#D1FAE5', // emerald-100
  successDark: '#047857', // emerald-700

  warning: '#D97706', // amber-600
  warningLight: '#FEF3C7', // amber-100
  warningDark: '#B45309', // amber-700

  error: '#DC2626', // red-600
  errorLight: '#FEE2E2', // red-100
  errorDark: '#B91C1C', // red-700

  info: '#2563EB', // blue-600 (muted, not primary)
  infoLight: '#DBEAFE', // blue-100
  infoDark: '#1D4ED8', // blue-700

  // Border & Dividers - Zinc tones
  border: '#E4E4E7', // zinc-200
  borderLight: '#F4F4F5', // zinc-100
  divider: '#E4E4E7',

  // Interactive states
  selected: 'rgba(217, 119, 6, 0.08)', // amber with low opacity
  pressed: 'rgba(24, 24, 27, 0.06)', // zinc-900 with low opacity
  disabled: '#D4D4D8', // zinc-300

  // Shadows - tinted to background hue
  shadow: 'rgba(24, 24, 27, 0.04)',
  shadowStrong: 'rgba(24, 24, 27, 0.08)',
  shadowInner: 'rgba(24, 24, 27, 0.06)',

  // Overlay
  overlay: 'rgba(24, 24, 27, 0.5)',
  overlayLight: 'rgba(24, 24, 27, 0.25)',

  // Status colors for trips - muted Slate/Zinc variants
  tripActive: '#059669', // emerald
  tripPending: '#D97706', // amber
  tripCompleted: '#334155', // slate
  tripCancelled: '#DC2626', // red
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
  // Additional for premium feel
  card: 24,
};

export const typography = {
  // Display - For large headlines (tighter tracking, high weight contrast)
  displayLarge: {
    fontSize: 34,
    fontWeight: '800' as const, // Extra bold
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  displayMedium: {
    fontSize: 28,
    fontWeight: '700' as const,
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  displaySmall: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
    letterSpacing: -0.3,
  },

  // Headlines - heavier weight for hierarchy
  h1: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 28,
  },
  h2: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 26,
  },
  h3: {
    fontSize: 16,
    fontWeight: '600' as const,
    lineHeight: 24,
  },
  h4: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 22,
  },

  // Body - lighter weight for readability
  bodyLarge: {
    fontSize: 17,
    fontWeight: '400' as const,
    lineHeight: 26,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 20,
  },

  // Labels - clean, medium weight
  label: {
    fontSize: 13,
    fontWeight: '500' as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '500' as const,
    lineHeight: 16,
    letterSpacing: 0.4,
    textTransform: 'uppercase' as const,
  },

  // Caption
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    lineHeight: 14,
    letterSpacing: 0.3,
  },
  button: {
    fontSize: 15,
    fontWeight: '600' as const,
    lineHeight: 20,
    letterSpacing: 0.3,
  },
  buttonSmall: {
    fontSize: 13,
    fontWeight: '600' as const,
    lineHeight: 18,
    letterSpacing: 0.3,
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
  // Card shadow with inner border tint
  md: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
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
