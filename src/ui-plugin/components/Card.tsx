import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { getTheme } from '../theme';

const { colors, borderRadius, shadows, spacing } = getTheme('dark');

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
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        };
      case 'filled':
        return {
          backgroundColor: colors.inputBg,
        };
      case 'soft':
        return {
          backgroundColor: colors.selected,
        };
      default:
        // Elevated: card with shadow + subtle inner top border tint
        return {
          backgroundColor: colors.card,
          borderTopWidth: 1,
          borderTopColor: 'rgba(24, 24, 27, 0.04)',
          ...shadows.md,
        };
    }
  };

  const cardContent = (
    <View
      style={[
        styles(colors).base,
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
        style={styles(colors).touchable}
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

const styles = (colors: typeof import('../theme').colorsDark) => StyleSheet.create({
  base: {
    borderRadius: borderRadius.xxl, // larger radius (24px) for premium feel
    overflow: 'hidden',
  },
  touchable: {
    borderRadius: borderRadius.xxl,
  },
});

export default Card;
