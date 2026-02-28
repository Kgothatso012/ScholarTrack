// Theme Context - Best practice for dark/light mode
import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define all possible theme colors for type safety
export type ThemeColors = {
  // Primary SA colors
  primary: string;      // SA Blue (#000000) or Black in dark mode
  accent: string;       // SA Gold (#FFB81C) - stays consistent
  secondary: string;    // SA Green (#007749) for success states
  
  // Backgrounds
  background: string;   // Main app background
  card: string;         // Card/elevated surfaces
  inputBg: string;     // Input fields background
  
  // Text
  text: string;         // Primary text
  textSecondary: string; // Secondary/subtle text
  textInverse: string;  // Text on primary backgrounds
  
  // Borders & dividers
  border: string;       // Border colors
  divider: string;      // Divider lines
  
  // Status colors
  success: string;       // Success messages (SA Green)
  error: string;        // Error messages
  warning: string;      // Warning messages (SA Gold)
  info: string;         // Info messages (SA Blue)
  
  // Interactive states
  disabled: string;
  pressed: string;
  selected: string;
};

// Light theme (default)
const lightColors: ThemeColors = {
  primary: '#000000',      // SA Blue
  accent: '#FFB81C',       // SA Gold
  secondary: '#007749',    // SA Green
  
  background: '#f5f5f5',
  card: '#ffffff',
  inputBg: '#ffffff',
  
  text: '#333333',
  textSecondary: '#666666',
  textInverse: '#ffffff',
  
  border: '#dddddd',
  divider: '#eeeeee',
  
  success: '#007749',
  error: '#d32f2f',
  warning: '#FFB81C',
  info: '#000000',
  
  disabled: '#cccccc',
  pressed: 'rgba(0,0,0,0.1)',
  selected: '#00000020',
};

// Dark theme
const darkColors: ThemeColors = {
  primary: '#000000',      // Black in dark mode
  accent: '#FFB81C',       // SA Gold stays vibrant
  secondary: '#4caf50',    // Lighter green for dark mode
  
  background: '#0a0a0a',
  card: '#1a1a1a',
  inputBg: '#0a0a0a',
  
  text: '#ffffff',
  textSecondary: '#888888',
  textInverse: '#000000',
  
  border: '#333333',
  divider: '#222222',
  
  success: '#4caf50',
  error: '#f44336',
  warning: '#FFB81C',
  info: '#000000',
  
  disabled: '#444444',
  pressed: 'rgba(255,255,255,0.1)',
  selected: '#FFB81C20',
};

// Theme context type
type ThemeContextType = {
  darkMode: boolean;
  colors: ThemeColors;
  toggleTheme: (value: boolean) => Promise<void>;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
};

// Create context
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Provider component
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const saved = await AsyncStorage.getItem('darkMode');
        setDarkMode(saved === 'dark');
      } catch (error) {
        console.log('Error loading theme:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadTheme();
  }, []);

  const toggleTheme = async (value: boolean) => {
    try {
      setDarkMode(value);
      await AsyncStorage.setItem('darkMode', value ? 'dark' : 'light');
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  };

  const colors = darkMode ? darkColors : lightColors;

  if (isLoading) return null;

  return (
    <ThemeContext.Provider value={{ darkMode, colors, toggleTheme, setDarkMode }}>
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
