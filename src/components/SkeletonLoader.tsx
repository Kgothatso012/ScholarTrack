// SkeletonLoader - Animated skeleton shimmer using Reanimated
// Replaces flat grey placeholders with breathing shimmer effect
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme, ThemeColors } from '../context/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: object;
}

// Single shimmer rect — breathing opacity cycle
export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const shimmer = useSharedValue(0);

  useEffect(() => {
    shimmer.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 900 }),
        withTiming(0, { duration: 900 })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    opacity: 0.15 + interpolate(shimmer.value, [0, 1], [0, 0.55]),
  }));

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius },
        style,
        animStyle,
      ]}
    />
  );
}

// Card skeleton — image rect + two text lines
export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton height={120} style={styles.mb} />
      <Skeleton height={16} width="60%" style={styles.mb} />
      <Skeleton height={16} width="40%" />
    </View>
  );
}

// Full dashboard skeleton — stat row + list area
export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      <View style={styles.row}>
        <Skeleton height={80} width="55%" style={styles.mb} />
        <Skeleton height={80} width="43%" style={styles.mb} />
      </View>
      <Skeleton height={80} style={styles.mb} />
      <View style={styles.row}>
        <Skeleton height={100} width="48%" style={styles.mb} />
        <Skeleton height={100} width="48%" style={styles.mb} />
      </View>
      <Skeleton height={120} style={styles.mb} />
      <View style={styles.row}>
        <Skeleton height={60} width="48%" style={styles.mb} />
        <Skeleton height={60} width="48%" style={styles.mb} />
      </View>
    </View>
  );
}

// List item skeleton — avatar circle + text lines
export function SkeletonListItem() {
  return (
    <View style={styles.listItem}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.listText}>
        <Skeleton height={14} width="70%" style={styles.mb} />
        <Skeleton height={12} width="45%" />
      </View>
      <Skeleton height={24} width={60} borderRadius={12} />
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: 'rgba(255,184,28,0.22)', // SA Gold tinted shimmer
    borderRadius: 8,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  dashboard: {
    padding: 16,
    gap: 8,
  },
  listItem: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listText: {
    flex: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  mb: {
    marginBottom: 8,
  },
});
