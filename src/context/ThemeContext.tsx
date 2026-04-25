// Theme Context - Supports Dark (Black/Yellow), Blue, and Light themes
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getTheme } from '../ui-plugin/theme';

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

// Theme context type
type ThemeContextType = {
  themeMode: ThemeMode;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => Promise<void>;
};

const themeColors: Record<ThemeMode, ThemeColors> = {
  dark: { ...getTheme('dark').colors, danger: getTheme('dark').colors.error },
  // Blue mode maps to ui-plugin dark palette (SA Blue/Yellow feel)
  blue: { ...getTheme('dark').colors, danger: getTheme('dark').colors.error },
  light: { ...getTheme('light').colors, danger: getTheme('light').colors.error },
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
