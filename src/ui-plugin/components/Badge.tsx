import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, typography, spacing } from '../theme';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'small' | 'medium' | 'large';
type BadgeShape = 'rounded' | 'pill' | 'square';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  shape?: BadgeShape;
  outlined?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'medium',
  shape = 'rounded',
  outlined = false,
  icon,
  style,
  testID,
}) => {
  const getBackgroundColor = () => {
    if (outlined) return 'transparent';

    switch (variant) {
      case 'secondary':
        return colors.secondary;
      case 'success':
        return colors.successLight;
      case 'warning':
        return colors.warningLight;
      case 'error':
        return colors.errorLight;
      case 'info':
        return colors.infoLight;
      case 'neutral':
        return colors.border;
      default:
        return colors.primaryMuted;
    }
  };

  const getTextColor = () => {
    if (outlined) {
      switch (variant) {
        case 'secondary':
          return colors.secondary;
        case 'success':
          return colors.success;
        case 'warning':
          return colors.warningDark;
        case 'error':
          return colors.error;
        case 'info':
          return colors.info;
        case 'neutral':
          return colors.textSecondary;
        default:
          return colors.primary;
      }
    }

    switch (variant) {
      case 'success':
        return colors.successDark;
      case 'warning':
        return colors.warningDark;
      case 'error':
        return colors.errorDark;
      case 'info':
        return colors.infoDark;
      default:
        return colors.primaryDark;
    }
  };

  const getBorderColor = () => {
    if (!outlined) return 'transparent';
    return getTextColor();
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return {
          paddingVertical: spacing.xxs,
          paddingHorizontal: spacing.sm,
        };
      case 'large':
        return {
          paddingVertical: spacing.sm,
          paddingHorizontal: spacing.lg,
        };
      default:
        return {
          paddingVertical: spacing.xs,
          paddingHorizontal: spacing.md,
        };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 14;
      default:
        return 12;
    }
  };

  const getShapeRadius = (): number => {
    switch (shape) {
      case 'pill':
        return borderRadius.full;
      case 'square':
        return borderRadius.sm;
      default:
        return borderRadius.md;
    }
  };

  return (
    <View
      style={[
        styles(colors).badge,
        getSizeStyles(),
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: outlined ? 1 : 0,
          borderRadius: getShapeRadius(),
        },
        style,
      ]}
      testID={testID}
    >
      {icon && <View style={styles(colors).icon}>{icon}</View>}
      <Text
        style={[
          styles(colors).label,
          {
            color: getTextColor(),
            fontSize: getFontSize(),
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = (colors: any) => StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: spacing.xxs,
  },
  label: {
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default Badge;
