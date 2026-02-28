// ScholarTrack Design System
// Consistent colors, spacing, typography for a polished app

// ============================================
// COLORS - SA-inspired palette
// ============================================
export const colors = {
  // Primary
  primary: '#000000',      // SA Blue
  primaryLight: '#0035b5',
  primaryDark: '#001a6e',
  
  // Secondary
  secondary: '#FFB81C',    // SA Gold
  secondaryLight: '#ffc94d',
  secondaryDark: '#cc9300',
  
  // Status
  success: '#007749',      // Green
  successLight: '#009960',
  warning: '#FFB81C',      // Gold/Yellow
  warningLight: '#ffc94d',
  error: '#d32f2f',        // Red
  errorLight: '#ef5350',
  
  // Neutrals
  white: '#ffffff',
  black: '#000000',
  
  // Dark mode
  dark: {
    background: '#0a0a0a',
    card: '#1a1a1a',
    text: '#ffffff',
    textSec: '#888888',
    border: '#333333',
    header: '#000000',
  },
  light: {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#333333',
    textSec: '#666666',
    border: '#e0e0e0',
    header: '#000000',
  },
};

// ============================================
// SPACING - 8pt grid system
// ============================================
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

// ============================================
// TYPOGRAPHY - Stick to 2-3 fonts
// ============================================
export const typography = {
  // Font sizes
  h1: { fontSize: 28, fontWeight: 'bold' as const },
  h2: { fontSize: 24, fontWeight: 'bold' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  bodySmall: { fontSize: 14, fontWeight: 'normal' as const },
  caption: { fontSize: 12, fontWeight: 'normal' as const },
  button: { fontSize: 16, fontWeight: '600' as const },
  
  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};

// ============================================
// BORDER RADIUS
// ============================================
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// ============================================
// SHADOWS
// ============================================
export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
};

// ============================================
// USE THEME HOOK
// ============================================
import { useColorScheme } from 'react-native';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const theme = isDark ? colors.dark : colors.light;
  
  return {
    isDark,
    colors: theme,
    // Helper to get any color
    getColor: (lightColor: string, darkColor?: string) => 
      isDark && darkColor ? darkColor : lightColor,
  };
}

// ============================================
// DEFAULT EXPORT
// ============================================
export default {
  colors,
  spacing,
  typography,
  borderRadius,
  shadows,
  useTheme,
};
