import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  View,
} from 'react-native';
import { colors, borderRadius, typography, shadows, spacing } from '../theme';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
type ButtonSize = 'small' | 'medium' | 'large';
type ButtonShape = 'rounded' | 'pill' | 'square';

interface ButtonProps {
  title?: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  shape?: ButtonShape;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
  testID?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  shape = 'rounded',
  disabled = false,
  loading = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  accessibilityLabel,
  testID,
}) => {
  const getShape = () => {
    switch (shape) {
      case 'pill':
        return borderRadius.full;
      case 'square':
        return borderRadius.sm;
      default:
        return borderRadius.lg;
    }
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
      case 'large':
        return { paddingVertical: spacing.lg, paddingHorizontal: spacing.xxl };
      default:
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.xl };
    }
  };

  const getTextSize = (): TextStyle => {
    switch (size) {
      case 'small':
        return typography.buttonSmall;
      case 'large':
        return { ...typography.button, fontSize: 18 };
      default:
        return typography.button;
    }
  };

  const getVariantStyles = (): ViewStyle => {
    if (disabled) {
      return {
        backgroundColor: colors.border,
      };
    }

    switch (variant) {
      case 'secondary':
        return {
          backgroundColor: colors.secondary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
        };
      case 'danger':
        return {
          backgroundColor: colors.error,
        };
      default:
        return {
          backgroundColor: colors.primary,
        };
    }
  };

  const getTextColor = (): string => {
    if (disabled) {
      return colors.textMuted;
    }

    switch (variant) {
      case 'secondary':
        return colors.text;
      case 'outline':
      case 'ghost':
        return colors.primary;
      default:
        return colors.textInverse;
    }
  };

  const getLoadingColor = (): string => {
    if (variant === 'outline' || variant === 'ghost') {
      return colors.primary;
    }
    return colors.textInverse;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        styles.base,
        getSizeStyles(),
        getVariantStyles(),
        { borderRadius: getShape() },
        fullWidth && styles.fullWidth,
        style,
      ]}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      testID={testID}
    >
      {loading ? (
        <ActivityIndicator color={getLoadingColor()} size="small" />
      ) : (
        <View style={styles.content}>
          {icon && iconPosition === 'left' && (
            <View style={styles.iconLeft}>{icon}</View>
          )}
          {title && (
            <Text
              style={[
                getTextSize(),
                { color: getTextColor() },
                icon ? styles.textWithIcon : undefined,
                textStyle,
              ]}
            >
              {title}
            </Text>
          )}
          {icon && iconPosition === 'right' && (
            <View style={styles.iconRight}>{icon}</View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...shadows.md,
  },
  fullWidth: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconLeft: {
    marginRight: spacing.sm,
  },
  iconRight: {
    marginLeft: spacing.sm,
  },
  textWithIcon: {
    marginHorizontal: spacing.xs,
  },
});

export default Button;
