// Centralized Theme System for ScholarTrack
// No more hardcoded hex values scattered everywhere

export const colors = {
  // Primary palette - SA Theme
  primary: '#002395',  // SA Blue
  secondary: '#007749', // SA Green
  accent: '#FFB81C',    // SA Gold
  danger: '#E03C31',     // SA Red
  textSecondary: '#666666',
  textMuted: '#8C8CA1',

  // Light mode
  light: {
    background: '#FFFFFF',
    surface: '#FFFFFF',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textSecondary: '#666666',
    textMuted: '#8C8CA1',
    border: '#EEEEEE',
    danger: '#D32F2F',
    success: '#4CAF50',
    warning: '#FF9800',
    accent: '#FFB81C',
  },
  
  // Dark mode
  dark: {
    background: '#0A0A0A',
    surface: '#1A1A1A',
    card: '#1A1A1A',
    text: '#FFFFFF',
    textSecondary: '#888888',
    textMuted: '#666666',
    border: '#333333',
    danger: '#EF5350',
    success: '#66BB6A',
    warning: '#FFA726',
    accent: '#FFB81C',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: 'bold' as const },
  h2: { fontSize: 24, fontWeight: 'bold' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  caption: { fontSize: 14, fontWeight: 'normal' as const },
  small: { fontSize: 12, fontWeight: 'normal' as const },
};

export const shadows = {
  light: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
  },
  dark: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.3,
      shadowRadius: 4,
      elevation: 3,
    },
  },
};

// Helper to get theme colors based on dark mode
export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  colors: typeof colors.light;
  spacing: typeof spacing;
  typography: typeof typography;
  shadows: typeof shadows.light;
}

export const getTheme = (mode: ThemeMode): Theme => ({
  mode,
  colors: mode === 'dark' ? colors.dark : colors.light,
  spacing,
  typography,
  shadows: mode === 'dark' ? shadows.dark : shadows.light,
});
