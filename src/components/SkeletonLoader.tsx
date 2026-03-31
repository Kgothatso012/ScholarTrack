import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const { colors } = useTheme();
  return (
    <View
      style={[
        styles(colors).skeleton,
        { width, height, borderRadius },
        style
      ]}
    />
  );
}

export function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View style={styles(colors).card}>
      <Skeleton height={120} style={styles(colors).mb} />
      <Skeleton height={16} width="60%" style={styles(colors).mb} />
      <Skeleton height={16} width="40%" />
    </View>
  );
}

export function SkeletonDashboard() {
  const { colors } = useTheme();
  return (
    <View style={styles(colors).dashboard}>
      <Skeleton height={80} style={styles(colors).mb} />
      <Skeleton height={200} style={styles(colors).mb} />
      <View style={styles(colors).row}>
        <Skeleton height={100} width="48%" style={styles(colors).mb} />
        <Skeleton height={100} width="48%" style={styles(colors).mb} />
      </View>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  skeleton: {
    backgroundColor: '#333',
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  dashboard: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  mb: {
    marginBottom: 12,
  },
});
