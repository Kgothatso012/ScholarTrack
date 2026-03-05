// ScholarTrack Design System - Login Theme (Black/Gold)

export const colors = {
  primary: '#000000',
  primaryLight: '#1a1a1a',
  primaryDark: '#000000',
  secondary: '#FFB81C',
  secondaryLight: '#ffc94d',
  secondaryDark: '#cc9300',
  success: '#007749',
  successLight: '#009960',
  warning: '#FFB81C',
  warningLight: '#ffc94d',
  error: '#d32f2f',
  errorLight: '#ef5350',
  white: '#ffffff',
  black: '#000000',
  background: '#000000',
  card: '#1a1a1a',
  surface: '#1a1a1a',
  text: '#ffffff',
  textSecondary: '#888888',
  textMuted: '#666666',
  border: '#333333',
  borderLight: '#444444',
  accent: '#FFB81C',
  accentLight: '#FFB81C',
  dark: {
    background: '#000000',
    card: '#1a1a1a',
    text: '#ffffff',
    textSec: '#888888',
    border: '#333333',
    header: '#000000',
  },
  light: {
    background: '#f5f5f5',
    card: '#ffffff',
    text: '#1a1a1a',
    textSec: '#666666',
    border: '#e0e0e0',
    header: '#000000',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };
export const borderRadius = { sm: 8, md: 12, lg: 16, xl: 24, full: 9999 };
export const typography = {
  h1: { fontSize: 28, fontWeight: 'bold' as const },
  h2: { fontSize: 24, fontWeight: 'bold' as const },
  h3: { fontSize: 20, fontWeight: '600' as const },
  h4: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 16, fontWeight: 'normal' as const },
  bodySmall: { fontSize: 14, fontWeight: 'normal' as const },
  caption: { fontSize: 12, fontWeight: 'normal' as const },
  button: { fontSize: 16, fontWeight: 'bold' as const },
};
export const shadows = {
  card: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  button: { shadowColor: '#FFB81C', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
};

export default { colors, spacing, borderRadius, typography, shadows };
