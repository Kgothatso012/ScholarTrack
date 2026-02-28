// useTheme hook - Easy dark/light mode with useColorScheme
import { useColorScheme } from 'react-native';

export interface Theme {
  isDark: boolean;
  colors: {
    primary: string;
    background: string;
    card: string;
    text: string;
    textSec: string;
    border: string;
    success: string;
    warning: string;
    error: string;
    header: string;
  };
}

export function useAppTheme(): Theme {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const colors = isDark ? {
    primary: '#FFB81C',       // Yellow for dark mode
    background: '#0a0a0a',    // Dark background
    card: '#1a1a1a',        // Dark card
    text: '#ffffff',         // White text
    textSec: '#888888',     // Gray text
    border: '#333333',       // Dark border
    success: '#4CAF50',      // Green
    warning: '#FFB81C',     // Yellow
    error: '#f44336',       // Red
    header: '#000000',       // Black header
  } : {
    primary: '#000000',      // Blue for light mode
    background: '#f5f5f5',   // Light background
    card: '#ffffff',        // White card
    text: '#333333',         // Dark text
    textSec: '#666666',      // Gray text
    border: '#e0e0e0',       // Light border
    success: '#007749',     // Green
    warning: '#FFB81C',     // Yellow
    error: '#d32f2f',       // Red
    header: '#000000',       // Blue header
  };

  return { isDark, colors };
}

// Example usage in a component:
// import { useAppTheme } from '../hooks/useTheme';
//
// function MyComponent() {
//   const { isDark, colors } = useAppTheme();
//   
//   return (
//     <View style={{ backgroundColor: colors.background }}>
//       <Text style={{ color: colors.text }}>Hello!</Text>
//     </View>
//   );
// }
