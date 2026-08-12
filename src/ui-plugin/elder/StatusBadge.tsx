import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { elderTheme as t } from './theme';

type Variant = 'success' | 'warning' | 'danger';

interface Props {
  label: string;
  variant: Variant;
}

const map = {
  success: { bg: t.colors.successLight, text: t.colors.success },
  warning: { bg: t.colors.warningLight, text: t.colors.warning },
  danger: { bg: t.colors.dangerLight, text: t.colors.danger },
};

export const StatusBadge: React.FC<Props> = ({ label, variant }) => {
  const c = map[variant];
  return (
    <View style={[s.badge, { backgroundColor: c.bg }]}>
      <View style={[s.dot, { backgroundColor: c.text }]} />
      <Text style={[s.label, { color: c.text }]}>{label}</Text>
    </View>
  );
};

const s = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: t.radius.badge,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
