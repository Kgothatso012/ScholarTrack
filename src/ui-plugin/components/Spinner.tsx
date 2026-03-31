import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ViewStyle } from 'react-native';
import { colors, typography, spacing } from '../theme';

type SpinnerSize = 'small' | 'medium' | 'large';
type SpinnerVariant = 'default' | 'primary' | 'inverse';

interface SpinnerProps {
  size?: SpinnerSize;
  variant?: SpinnerVariant;
  label?: string;
  fullScreen?: boolean;
  style?: ViewStyle;
}

const getSize = (spinnerSize: SpinnerSize): 'small' | 'large' | undefined => {
  switch (spinnerSize) {
    case 'small':
      return 'small';
    case 'large':
      return 'large';
    default:
      return undefined;
  }
};

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'medium',
  variant = 'default',
  label,
  fullScreen = false,
  style,
}) => {
  const getColor = () => {
    switch (variant) {
      case 'primary':
        return colors.primary;
      case 'inverse':
        return colors.textInverse;
      default:
        return colors.primary;
    }
  };

  const content = (
    <View style={[styles(colors).container, fullScreen && styles(colors).fullScreen, style]}>
      <ActivityIndicator size={getSize(size)} color={getColor()} />
      {label && (
        <Text
          style={[
            styles(colors).label,
            variant === 'inverse' && styles(colors).labelInverse,
          ]}
        >
          {label}
        </Text>
      )}
    </View>
  );

  if (fullScreen) {
    return <View style={styles(colors).overlay}>{content}</View>;
  }

  return content;
};

const styles = (colors: any) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  fullScreen: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlayLight,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  label: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  labelInverse: {
    color: colors.textInverse,
  },
});

export default Spinner;
