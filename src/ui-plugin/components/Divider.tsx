import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors, borderRadius, typography, spacing } from '../theme';

type DividerOrientation = 'horizontal' | 'vertical';
type DividerVariant = 'solid' | 'dashed' | 'dotted';

interface DividerProps {
  orientation?: DividerOrientation;
  variant?: DividerVariant;
  color?: string;
  thickness?: number;
  spacing?: number;
  label?: string;
  style?: ViewStyle;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  variant = 'solid',
  color = colors.border,
  thickness = 1,
  spacing: spacingValue = spacing.lg,
  label,
  style,
}) => {
  const isHorizontal = orientation === 'horizontal';

  const getBorderStyle = (): ViewStyle => {
    if (variant === 'dashed') {
      return {
        borderStyle: 'dashed' as const,
        borderWidth: thickness,
        borderColor: color,
      };
    }
    if (variant === 'dotted') {
      return {
        borderStyle: 'dotted' as const,
        borderWidth: thickness,
        borderColor: color,
      };
    }
    return {
      backgroundColor: color,
      height: thickness,
    };
  };

  if (label) {
    return (
      <View style={[styles(colors).labeledContainer, style]}>
        <View
          style={[
            styles(colors).line,
            !isHorizontal && styles(colors).verticalLine,
            getBorderStyle(),
            { flex: 1 },
          ]}
        />
        <Text style={[styles(colors).label, { color }]}>{label}</Text>
        <View
          style={[
            styles(colors).line,
            !isHorizontal && styles(colors).verticalLine,
            getBorderStyle(),
            { flex: 1 },
          ]}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        isHorizontal ? styles(colors).horizontal : styles(colors).vertical,
        getBorderStyle(),
        isHorizontal
          ? { marginVertical: spacingValue }
          : { marginHorizontal: spacingValue },
        style,
      ]}
    />
  );
};

const styles = (colors: any) => StyleSheet.create({
  horizontal: {
    width: '100%',
  },
  vertical: {
    height: '100%',
    width: 1,
  },
  labeledContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  line: {
    height: 1,
  },
  verticalLine: {
    width: 1,
    height: '100%',
  },
  label: {
    ...typography.labelSmall,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});

export default Divider;
