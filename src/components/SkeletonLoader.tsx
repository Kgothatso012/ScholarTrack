import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';

interface SkeletonProps {
  width?: DimensionValue;
  height?: DimensionValue;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  return (
    <View 
      style={[
        styles.skeleton, 
        { width, height, borderRadius },
        style
      ]} 
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton height={120} style={styles.mb} />
      <Skeleton height={16} width="60%" style={styles.mb} />
      <Skeleton height={16} width="40%" />
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      <Skeleton height={80} style={styles.mb} />
      <Skeleton height={200} style={styles.mb} />
      <View style={styles.row}>
        <Skeleton height={100} width="48%" style={styles.mb} />
        <Skeleton height={100} width="48%" style={styles.mb} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
