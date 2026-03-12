import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, borderRadius, typography, spacing } from '../theme';

type InputVariant = 'default' | 'filled' | 'outline';
type InputSize = 'small' | 'medium' | 'large';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  hint?: string;
  variant?: InputVariant;
  size?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  disabled?: boolean;
  required?: boolean;
  testID?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  variant = 'default',
  size = 'medium',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  disabled = false,
  required = false,
  testID,
  ...textInputProps
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const getBorderColor = () => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.border;
  };

  const getBackgroundColor = () => {
    if (variant === 'filled') return colors.backgroundAlt;
    return colors.surface;
  };

  const getSizeStyles = (): ViewStyle => {
    switch (size) {
      case 'small':
        return { paddingVertical: spacing.sm, paddingHorizontal: spacing.md };
      case 'large':
        return { paddingVertical: spacing.lg, paddingHorizontal: spacing.lg };
      default:
        return { paddingVertical: spacing.md, paddingHorizontal: spacing.lg };
    }
  };

  const getTextSize = (): TextStyle => {
    switch (size) {
      case 'small':
        return { fontSize: 14 };
      case 'large':
        return { fontSize: 18 };
      default:
        return { fontSize: 16 };
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 24;
      default:
        return 20;
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={styles.label}>{label}</Text>
          {required && <Text style={styles.required}>*</Text>}
        </View>
      )}

      <View
        style={[
          styles.inputContainer,
          getSizeStyles(),
          {
            borderColor: getBorderColor(),
            backgroundColor: getBackgroundColor(),
            borderRadius: borderRadius.lg,
          },
          variant === 'outline' && styles.outline,
          disabled && styles.disabled,
        ]}
      >
        {leftIcon && typeof leftIcon === 'string' ? (
          <Ionicons
            name={leftIcon as keyof typeof Ionicons.glyphMap}
            size={getIconSize()}
            color={isFocused ? colors.primary : colors.textSecondary}
            style={styles.leftIcon}
          />
        ) : (
          <View style={styles.leftIcon}>{leftIcon}</View>
        )}

        <TextInput
          {...textInputProps}
          style={[
            styles.input,
            getTextSize(),
            leftIcon ? styles.inputWithLeftIcon : undefined,
            rightIcon ? styles.inputWithRightIcon : undefined,
            inputStyle,
          ]}
          placeholderTextColor={colors.textMuted}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          editable={!disabled}
          testID={testID}
        />

        {rightIcon && (
          <TouchableOpacity
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
            style={styles.rightIcon}
          >
            {typeof rightIcon === 'string' ? (
              <Ionicons
                name={rightIcon as keyof typeof Ionicons.glyphMap}
                size={getIconSize()}
                color={colors.textSecondary}
              />
            ) : (
              rightIcon
            )}
          </TouchableOpacity>
        )}
      </View>

      {(error || hint) && (
        <Text
          style={[
            styles.helperText,
            error ? styles.errorText : styles.hintText,
          ]}
        >
          {error || hint}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    color: colors.text,
  },
  required: {
    color: colors.error,
    marginLeft: spacing.xxs,
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  outline: {
    borderWidth: 2,
  },
  disabled: {
    backgroundColor: colors.backgroundAlt,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    color: colors.text,
    padding: 0,
  },
  inputWithLeftIcon: {
    marginLeft: spacing.sm,
  },
  inputWithRightIcon: {
    marginRight: spacing.sm,
  },
  leftIcon: {
    marginRight: spacing.xs,
  },
  rightIcon: {
    padding: spacing.xs,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xs,
    marginLeft: spacing.xs,
  },
  hintText: {
    color: colors.textMuted,
  },
  errorText: {
    color: colors.error,
  },
});

export default Input;
