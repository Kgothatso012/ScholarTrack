import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { elderTheme as t } from './theme';

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export const Card: React.FC<Props> = ({ children, style }) => (
  <View style={[s.card, style]}>{children}</View>
);

const s = StyleSheet.create({
  card: {
    backgroundColor: t.colors.card,
    borderRadius: t.radius.card,
    padding: t.layout.cardPadding,
    borderWidth: 1,
    borderColor: t.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
