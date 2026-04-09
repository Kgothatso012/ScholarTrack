// AnimatedCard - Smooth card animations using Reanimated
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { colors as themeColors } from '../lib/theme';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

type ThemeColors = typeof themeColors;

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  index?: number;
}

export function AnimatedCard({ children, style, index = 0 }: AnimatedCardProps) {
  return (
    <Animated.View
      entering={FadeIn.delay(index * 50).springify()}
      exiting={FadeOut}
      style={[styles(themeColors).card, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});