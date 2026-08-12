import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { elderTheme as t } from './theme';

type Variant = 'primary' | 'danger';

interface Props {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Button: React.FC<Props> = ({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) => {
  const isPrimary = variant === 'primary';
  const bg = disabled ? t.colors.border : isPrimary ? t.colors.primary : 'transparent';
  const borderColor = isPrimary ? 'transparent' : t.colors.danger;
  const textColor = isPrimary ? t.colors.textInverse : t.colors.danger;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        s.base,
        { backgroundColor: bg, borderColor, borderWidth: isPrimary ? 0 : 2 },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {loading ? (
        <ActivityIndicator color={textColor} size="small" />
      ) : (
        <Text style={[s.label, { color: textColor }, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const s = StyleSheet.create({
  base: {
    height: t.touch.buttonHeight,
    borderRadius: t.radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  label: {
    fontSize: t.typography.button.fontSize,
    fontWeight: t.typography.button.fontWeight,
  },
});
