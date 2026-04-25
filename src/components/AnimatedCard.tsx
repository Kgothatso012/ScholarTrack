// AnimatedCard - Smooth card animations using Reanimated
import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { getTheme } from '../ui-plugin/theme';
import Animated, {
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';

const { colors: C } = getTheme('light');

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
      style={[styles.card, style]}
    >
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: C.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
});