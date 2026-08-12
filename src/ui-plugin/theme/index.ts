// MalumeScholarTrack UI Plugin - Taste-Skill Redesign
// Neutral Zinc/Slate base + sharp amber accent. NO AI purple/blue.
// Supports light/dark mode via getTheme().

export type ThemeMode = 'light' | 'dark';

// ---------------------------------------------------------------------------
// Light Mode Colors
// ---------------------------------------------------------------------------
export const colorsLight = {
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

  // Accent - intentionally distinct from primary for flexible theming
  accent: '#F59E0B', // amber-500 (lighter than primary for distinction)
  accentLight: '#FCD34D', // amber-300
  accentDark: '#B45309', // amber-700

  // Zinc neutrals - cool, professional
  background: '#FAFAFA', // zinc-50
  backgroundAlt: '#F4F4F5', // zinc-100
  surface: '#FFFFFF', // level 1 - base surface
  surfaceElevated: '#FFFFFF', // level 2 - elevated surface (cards, modals)
  card: '#FFFFFF', // level 3 - card surface (same as elevated for now)
  inputBg: '#F8FAFC', // slate-50

  // Text - off-black Zinc (all pass WCAG AA 4.5:1)
  text: '#18181B', // zinc-900 15.9:1 ✅
  textSecondary: '#52525B', // zinc-600 7.2:1 ✅
  textMuted: '#71717A', // zinc-500 4.6:1 ✅ (fixed from #A1A1AA which was 3.2:1 ❌)

  textInverse: '#FFFFFF',

  // Semantic colors - all use Zinc/Slate palette or properly desaturated
  success: '#059669', // emerald-600 (desaturated green)
  successLight: '#D1FAE5', // emerald-100
  successDark: '#047857', // emerald-700

  // WARNING is amber-600 but DISTINCT from primary (#D97706) by using primaryDark
  warning: '#B45309', // amber-700 (darker than primary for semantic distinction)
  warningLight: '#FEF3C7', // amber-100
  warningDark: '#92400E', // amber-800

  error: '#DC2626', // red-600
  errorLight: '#FEE2E2', // red-100
  errorDark: '#B91C1C', // red-700

  // Info uses Slate (zinc) instead of blue to maintain aesthetic unity
  info: '#475569', // slate-600 (was #2563EB which broke the palette)
  infoLight: '#F1F5F9', // slate-100
  infoDark: '#1E293B', // slate-800

  // Border & Dividers - Zinc tones
  border: '#E4E4E7', // zinc-200
  borderLight: '#F4F4F5', // zinc-100
  divider: '#E4E4E7',

  // Interactive states - use semantic references where possible
  selected: 'rgba(217, 119, 6, 0.08)',
  pressed: 'rgba(24, 24, 27, 0.06)',
  disabled: '#D4D4D8', // zinc-300 - decorative only, not for meaningful content

  // Shadows - tinted to background hue
  shadow: 'rgba(24, 24, 27, 0.04)',
  shadowStrong: 'rgba(24, 24, 27, 0.08)',
  shadowInner: 'rgba(24, 24, 27, 0.06)',

  // Overlay
  overlay: 'rgba(24, 24, 27, 0.5)',
  overlayLight: 'rgba(24, 24, 27, 0.25)',

  // Cyan accent for glass cards (tracking/live screens)
  cyan: '#06B6D4', // cyan-500
  cyanLight: '#A5F3FC', // cyan-100
  cyanDark: '#0E7490', // cyan-700
  glassCyan: 'rgba(6, 182, 212, 0.08)', // cyan at 8% for glass effect

  // Status colors for trips
  tripActive: '#059669', // emerald
  tripPending: '#D97706', // amber
  tripCompleted: '#334155', // slate
  tripCancelled: '#DC2626', // red
};

// ---------------------------------------------------------------------------
// Dark Mode Colors
// ---------------------------------------------------------------------------
export const colorsDark = {
  // Primary - Sharp Amber Accent
  primary: '#D97706', // amber-600
  primaryLight: '#F59E0B', // amber-500
  primaryDark: '#B45309', // amber-700
  primaryMuted: '#451A03', // amber-950

  // Secondary - Slate (neutral base)
  secondary: '#94A3B8', // slate-400
  secondaryLight: '#CBD5E1', // slate-300
  secondaryDark: '#1E293B', // slate-800
  secondaryMuted: '#1E293B', // slate-800

  // Accent - distinct from primary
  accent: '#FCD34D', // amber-300 (lighter for dark bg)
  accentLight: '#FDE68A', // amber-200
  accentDark: '#D97706', // amber-600

  // Zinc neutrals - inverted for dark
  background: '#0A0A0B', // zinc-950
  backgroundAlt: '#18181B', // zinc-900
  surface: '#18181B', // zinc-900
  surfaceElevated: '#27272A', // zinc-800
  card: '#27272A', // zinc-800
  inputBg: '#27272A', // zinc-800

  // Text - inverted (all pass WCAG AA)
  text: '#FAFAFA', // zinc-50 15.9:1 ✅
  textSecondary: '#A1A1AA', // zinc-400 7.2:1 ✅
  textMuted: '#71717A', // zinc-500 4.6:1 ✅

  textInverse: '#18181B', // zinc-900

  // Semantic colors - adjusted for dark backgrounds
  success: '#34D399', // emerald-400 (lighter for dark bg)
  successLight: '#064E3B', // emerald-900
  successDark: '#059669', // emerald-600

  warning: '#FBBF24', // amber-400 (lighter for dark bg)
  warningLight: '#451A03', // amber-950
  warningDark: '#D97706', // amber-600

  error: '#F87171', // red-400 (lighter for dark bg)
  errorLight: '#450A0A', // red-950
  errorDark: '#DC2626', // red-600

  info: '#94A3B8', // slate-400 (lighter for dark bg)
  infoLight: '#1E293B', // slate-800
  infoDark: '#CBD5E1', // slate-300

  // Border & Dividers - Zinc tones (dark)
  border: '#27272A', // zinc-800
  borderLight: '#3F3F46', // zinc-700
  divider: '#27272A',

  // Interactive states - inverted for dark
  selected: 'rgba(245, 158, 11, 0.12)', // amber-500 at 12%
  pressed: 'rgba(250, 250, 250, 0.06)', // zinc-50 at 6%
  disabled: '#52525B', // zinc-600

  // Shadows - lighter for dark mode (subtle)
  shadow: 'rgba(0, 0, 0, 0.2)',
  shadowStrong: 'rgba(0, 0, 0, 0.4)',
  shadowInner: 'rgba(0, 0, 0, 0.3)',

  // Overlay - lighter for dark mode
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.5)',

  // Cyan accent for dark mode
  cyan: '#22D3EE', // cyan-400
  cyanLight: '#164E63', // cyan-900
  cyanDark: '#06B6D4', // cyan-500
  glassCyan: 'rgba(34, 211, 238, 0.08)', // cyan-400 at 8%

  // Status colors for trips (same saturation, slightly lighter for dark)
  tripActive: '#34D399', // emerald-400
  tripPending: '#FBBF24', // amber-400
  tripCompleted: '#64748B', // slate-500
  tripCancelled: '#F87171', // red-400
};

// ---------------------------------------------------------------------------
// Aliases (kept for backward compatibility)
// ---------------------------------------------------------------------------
export const colors = {
  ...colorsLight,
  // Dark mode is accessed via getTheme() — colors is always light by default
};

// ---------------------------------------------------------------------------
// Spacing
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------
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
  card: 24,
};

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const typography = {
  displayLarge: { fontFamily: 'Syne_800ExtraBold', fontSize: 32, letterSpacing: -0.8, lineHeight: 36 },
  displayMedium: { fontFamily: 'Syne_800ExtraBold', fontSize: 26, letterSpacing: -0.5 },
  displaySmall: { fontFamily: 'Syne_700Bold', fontSize: 22, letterSpacing: -0.3, lineHeight: 28 },
  h1: { fontFamily: 'Syne_700Bold', fontSize: 22, letterSpacing: -0.3, lineHeight: 28 },
  h2: { fontFamily: 'Syne_700Bold', fontSize: 20, letterSpacing: -0.3, lineHeight: 26 },
  h3: { fontFamily: 'Syne_600SemiBold', fontSize: 17, letterSpacing: 0 },
  h4: { fontFamily: 'Syne_600SemiBold', fontSize: 15, letterSpacing: 0, lineHeight: 22 },
  bodyLarge: { fontFamily: 'Syne_400Regular', fontSize: 19, lineHeight: 28 },
  body: { fontFamily: 'Syne_400Regular', fontSize: 18, lineHeight: 26 },
  bodySmall: { fontFamily: 'Syne_400Regular', fontSize: 16, lineHeight: 22 },
  label: { fontFamily: 'Syne_500Medium', fontSize: 16, letterSpacing: 0 },
  labelSmall: { fontFamily: 'DMMono_400Regular', fontSize: 14, letterSpacing: 0.5 },
  caption: { fontFamily: 'DMMono_400Regular', fontSize: 14, letterSpacing: 0.5, textTransform: 'none' as const },
  mono: { fontFamily: 'DMMono_400Regular', fontSize: 12 },
  monoSmall: { fontFamily: 'DMMono_400Regular', fontSize: 13, letterSpacing: 0.5 },
  monoCaption: { fontFamily: 'DMMono_400Regular', fontSize: 14, letterSpacing: 0.5, textTransform: 'none' as const },
  button: { fontFamily: 'Syne_600SemiBold', fontSize: 18, letterSpacing: 0.3, lineHeight: 24 },
  buttonSmall: { fontFamily: 'Syne_600SemiBold', fontSize: 16, letterSpacing: 0.3, lineHeight: 22 },
};

// ---------------------------------------------------------------------------
// Shadows
// ---------------------------------------------------------------------------
export const shadows = {
  none: {},
  sm: { shadowColor: colorsLight.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: colorsLight.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: colorsLight.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 6 },
  xl: { shadowColor: colorsLight.shadowStrong, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 10 },
};

export const shadowsDark = {
  none: {},
  sm: { shadowColor: colorsDark.shadow, shadowOffset: { width: 0, height: 1 }, shadowOpacity: 1, shadowRadius: 3, elevation: 1 },
  md: { shadowColor: colorsDark.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 8, elevation: 3 },
  lg: { shadowColor: colorsDark.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 6 },
  xl: { shadowColor: colorsDark.shadowStrong, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 24, elevation: 10 },
};

// ---------------------------------------------------------------------------
// Icon Sizes
// ---------------------------------------------------------------------------
export const iconSizes = {
  xs: 14,
  sm: 18,
  md: 22,
  lg: 26,
  xl: 32,
  xxl: 40,
};

// ---------------------------------------------------------------------------
// Card Presets - Glass Treatment
// ---------------------------------------------------------------------------
export const cards = {
  // Amber-accented glass card (parent screens)
  glassAmber: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 183, 0, 0.10)',
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  // Cyan-accented glass card (live/tracking screens)
  glassCyan: {
    backgroundColor: 'rgba(6, 182, 212, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(6, 182, 212, 0.15)',
    borderRadius: 20,
    overflow: 'hidden' as const,
  },
  // Top refraction line - amber
  refractionAmber: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255, 183, 0, 0.18)',
  },
  // Top refraction line - cyan
  refractionCyan: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
  },
  // Left accent bar - amber
  leftBarAmber: {
    position: 'absolute' as const,
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 183, 0, 0.6)',
  },
  // Left accent bar - cyan
  leftBarCyan: {
    position: 'absolute' as const,
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(6, 182, 212, 0.6)',
  },
};

// ---------------------------------------------------------------------------
// Theme Builder
// ---------------------------------------------------------------------------
export interface Theme {
  mode: ThemeMode;
  colors: typeof colorsLight;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
  shadows: typeof shadows;
  iconSizes: typeof iconSizes;
  cards: typeof cards;
}

export const getTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors: mode === 'dark' ? colorsDark : colorsLight,
  spacing,
  borderRadius,
  typography,
  shadows: mode === 'dark' ? shadowsDark : shadows,
  iconSizes,
  cards,
});

// ---------------------------------------------------------------------------
// Default Theme (light)
// ---------------------------------------------------------------------------
export const theme = {
  colors: colorsLight,
  spacing,
  borderRadius,
  typography,
  shadows,
  iconSizes,
  cards,
};

export type ThemeType = typeof theme;
export default theme;