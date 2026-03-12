import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { colors, borderRadius, shadows, spacing } from '../theme';

type CardVariant = 'elevated' | 'outlined' | 'filled' | 'soft';
type CardPadding = 'none' | 'small' | 'medium' | 'large';

interface CardProps {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  onPress?: () => void;
  style?: ViewStyle;
  elevatedStyle?: ViewStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'elevated',
  padding = 'medium',
  onPress,
  style,
  elevatedStyle,
  accessibilityLabel,
  testID,
}) => {
  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return spacing.sm;
      case 'large':
        return spacing.xxl;
      default:
        return spacing.lg;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    switch (variant) {
      case 'outlined':
        return {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.backgroundAlt,
        };
      case 'soft':
        return {
          backgroundColor: colors.primaryMuted,
        };
      default:
        return {
          backgroundColor: colors.surface,
          ...shadows.md,
        };
    }
  };

  const cardContent = (
    <View
      style={[
        styles.base,
        getVariantStyles(),
        { padding: getPadding() },
        elevatedStyle,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.touchable}
        accessibilityLabel={accessibilityLabel}
        accessibilityRole="button"
        testID={testID}
      >
        {cardContent}
      </TouchableOpacity>
    );
  }

  return cardContent;
};

const styles = StyleSheet.create({
  base: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  touchable: {
    borderRadius: borderRadius.xl,
  },
});

export default Card;
