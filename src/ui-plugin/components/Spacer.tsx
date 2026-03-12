import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { spacing } from '../theme';

interface SpacerProps {
  size?: keyof typeof spacing;
  horizontal?: boolean;
  style?: ViewStyle;
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  horizontal = false,
  style,
}) => {
  if (horizontal) {
    return (
      <View
        style={[{ width: spacing[size] }, style]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />
    );
  }

  return (
    <View
      style={[{ height: spacing[size] }, style]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
};

export default Spacer;
