import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, shadows } from '../theme';

type IconButtonVariant = 'default' | 'primary' | 'secondary' | 'ghost' | 'danger';
type IconButtonSize = 'small' | 'medium' | 'large';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  variant?: IconButtonVariant;
  size?: IconButtonSize;
  disabled?: boolean;
  outlined?: boolean;
  style?: ViewStyle;
  accessibilityLabel: string;
  testID?: string;
}

const getSize = (buttonSize: IconButtonSize): number => {
  switch (buttonSize) {
    case 'small':
      return 32;
    case 'large':
      return 52;
    default:
      return 44;
  }
};

const getIconSize = (buttonSize: IconButtonSize): number => {
  switch (buttonSize) {
    case 'small':
      return 18;
    case 'large':
      return 28;
    default:
      return 22;
  }
};

export const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  variant = 'default',
  size = 'medium',
  disabled = false,
  outlined = false,
  style,
  accessibilityLabel,
  testID,
}) => {
  const buttonSize = getSize(size);
  const iconSize = getIconSize(size);

  const getBackgroundColor = (): string => {
    if (disabled) return colors.border;

    if (outlined || variant === 'ghost') return 'transparent';

    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'secondary':
        return colors.secondary;
      case 'danger':
        return colors.error;
      default:
        return colors.card;
    }
  };

  const getIconColor = (): string => {
    if (disabled) return colors.textMuted;

    if (outlined || variant === 'ghost') {
      switch (variant) {
        case 'primary':
          return colors.primary;
        case 'secondary':
          return colors.secondary;
        case 'danger':
          return colors.error;
        default:
          return colors.textSecondary;
      }
    }

    switch (variant) {
      case 'primary':
      case 'secondary':
      case 'danger':
        return colors.textInverse;
      default:
        return colors.text;
    }
  };

  const getBorderColor = (): string => {
    if (outlined) {
      if (disabled) return colors.border;
      switch (variant) {
        case 'primary':
          return colors.primary;
        case 'secondary':
          return colors.secondary;
        case 'danger':
          return colors.error;
        default:
          return colors.border;
      }
    }
    return 'transparent';
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
      style={[
        styles(colors).button,
        {
          width: buttonSize,
          height: buttonSize,
          borderRadius: buttonSize / 2,
          backgroundColor: getBackgroundColor(),
          borderWidth: outlined ? 1.5 : 0,
          borderColor: getBorderColor(),
        },
        variant === 'default' && !outlined && shadows.sm,
        style,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      testID={testID}
    >
      <Ionicons name={icon} size={iconSize} color={getIconColor()} />
    </TouchableOpacity>
  );
};

const styles = (colors: any) => StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default IconButton;
