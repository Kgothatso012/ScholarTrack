// Theme Context - Supports Dark (Black/Yellow), Blue, and Light themes
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define all possible theme colors for type safety
export type ThemeColors = {
  // Primary SA colors
  primary: string;      // Main brand color
  accent: string;       // SA Gold (#FFB81C) - stays consistent
  secondary: string;    // SA Green (#007749) for success states

  // Backgrounds
  background: string;   // Main app background
  card: string;         // Card/elevated surfaces
  inputBg: string;     // Input fields background
  surface: string;      // Secondary surfaces
  backgroundAlt: string; // Alternative backgrounds
  primaryMuted: string; // Primary color with opacity

  // Text
  text: string;         // Primary text
  textSecondary: string; // Secondary/subtle text
  textMuted: string;    // Muted/disabled text
  textInverse: string;  // Text on primary backgrounds

  // Borders & dividers
  border: string;       // Border colors
  divider: string;      // Divider lines

  // Status colors
  success: string;       // Success messages (SA Green)
  error: string;        // Error messages
  warning: string;      // Warning messages (SA Gold)
  info: string;         // Info messages (SA Blue)
  danger: string;       // Danger/alert messages (Red)

  // Interactive states
  disabled: string;
  pressed: string;
  selected: string;

  // Additional colors (used by ui-plugin theme)
  shadow: string;
  shadowStrong: string;
  overlay: string;
  overlayLight: string;
  primaryLight: string;
  primaryDark: string;
  secondaryLight: string;
  secondaryDark: string;
};

export type ThemeMode = 'dark' | 'blue' | 'light';

// Dark theme (Black/Yellow/Green) - SA Transport
const darkColors: ThemeColors = {
  primary: '#007749',      // SA Green - main brand
  accent: '#FFB81C',       // SA Gold
  secondary: '#FFB81C',    // Gold for accents

  background: '#000000',   // Pure black
  card: '#121212',         // Slightly lighter for subtle depth
  inputBg: '#1a1a1a',
  surface: '#1a1a1a',
  backgroundAlt: '#1f1f1f',
  primaryMuted: '#00774930',

  text: '#ffffff',
  textSecondary: '#a0a0a0',
  textMuted: '#707070',
  textInverse: '#ffffff',

  border: '#2a2a2a',
  divider: '#1f1f1f',

  success: '#007749',
  error: '#E03C31',
  warning: '#FFB81C',
  info: '#FFB81C',
  danger: '#E91E63',

  disabled: '#333333',
  pressed: '#ffffff15',
  selected: '#00774930',

  shadow: 'rgba(0,0,0,0.3)',
  shadowStrong: 'rgba(0,0,0,0.5)',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.25)',
  primaryLight: '#007749',
  primaryDark: '#005533',
  secondaryLight: '#FFB81C',
  secondaryDark: '#CC9600',
};

// Blue theme (SA Blue/Yellow)
const blueColors: ThemeColors = {
  primary: '#002395',      // SA Blue
  accent: '#FFB81C',       // SA Gold
  secondary: '#007749',    // SA Green

  background: '#f5f5f5',
  card: '#ffffff',
  inputBg: '#ffffff',
  surface: '#f0f0f0',
  backgroundAlt: '#e8e8e8',
  primaryMuted: '#00239520',

  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#8C8CA1',
  textInverse: '#ffffff',

  border: '#dddddd',
  divider: '#eeeeee',

  success: '#007749',
  error: '#d32f2f',
  warning: '#FFB81C',
  info: '#002395',
  danger: '#E91E63',

  disabled: '#cccccc',
  pressed: 'rgba(0,0,0,0.1)',
  selected: '#00239520',

  shadow: 'rgba(0,0,0,0.15)',
  shadowStrong: 'rgba(0,0,0,0.25)',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.25)',
  primaryLight: '#002395',
  primaryDark: '#001870',
  secondaryLight: '#007749',
  secondaryDark: '#005533',
};

// Light theme
const lightColors: ThemeColors = {
  primary: '#ffffff',
  accent: '#FFB81C',
  secondary: '#007749',

  background: '#f5f5f5',
  card: '#ffffff',
  inputBg: '#f8f8f8',
  surface: '#f0f0f0',
  backgroundAlt: '#e8e8e8',
  primaryMuted: '#00000010',

  text: '#333333',
  textSecondary: '#666666',
  textMuted: '#8C8CA1',
  textInverse: '#ffffff',

  border: '#e0e0e0',
  divider: '#eeeeee',

  success: '#007749',
  error: '#d32f2f',
  warning: '#FFB81C',
  info: '#2196f3',
  danger: '#E91E63',

  disabled: '#cccccc',
  pressed: 'rgba(0,0,0,0.1)',
  selected: '#00000010',

  shadow: 'rgba(0,0,0,0.1)',
  shadowStrong: 'rgba(0,0,0,0.2)',
  overlay: 'rgba(0,0,0,0.5)',
  overlayLight: 'rgba(0,0,0,0.25)',
  primaryLight: '#ffffff',
  primaryDark: '#cccccc',
  secondaryLight: '#007749',
  secondaryDark: '#005533',
};

// Theme context type
type ThemeContextType = {
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const themeColors: Record<ThemeMode, ThemeColors> = {
  dark: darkColors,
  blue: blueColors,
  light: lightColors,
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode, setThemeModeState] = useState<ThemeMode>('dark');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('themeMode');
        if (saved === 'dark' || saved === 'blue' || saved === 'light') {
          setThemeModeState(saved);
        } else {
          setThemeModeState('dark'); // Default to dark
        }
      } catch (error) {
        console.debug('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    try {
      setThemeModeState(mode);
      await AsyncStorage.setItem('themeMode', mode);
    } catch (error) {
      console.debug('Error saving theme:', error);
    }
  };

  const colors = themeColors[themeMode];

  if (isLoading) return null;

  return (
    <ThemeContext.Provider value={{ themeMode, colors, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for using theme
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Helper for creating themed styles
export const createThemedStyles = <T extends Record<string, any>>(
  stylesCreator: (colors: ThemeColors) => T
) => {
  return (colors: ThemeColors) => stylesCreator(colors);
};
