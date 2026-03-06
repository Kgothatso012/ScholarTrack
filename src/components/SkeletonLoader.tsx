import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 4, style }: SkeletonProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        { width, height, borderRadius, opacity },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <Skeleton width={60} height={60} borderRadius={30} />
      <View style={styles.cardContent}>
        <Skeleton width="70%" height={16} />
        <Skeleton width="50%" height={12} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

export function SkeletonList({ count = 3 }: { count?: number }) {
  return (
    <View style={styles.list}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonCard key={index} />
      ))}
    </View>
  );
}

export function SkeletonDashboard() {
  return (
    <View style={styles.dashboard}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <Skeleton width={150} height={24} />
        <Skeleton width={80} height={16} style={{ marginTop: 8 }} />
      </View>

      {/* Quick actions skeleton */}
      <View style={styles.quickActions}>
        {[1, 2, 3].map((i) => (
          <View key={i} style={styles.actionItem}>
            <Skeleton width={48} height={48} borderRadius={24} />
            <Skeleton width={50} height={12} style={{ marginTop: 8 }} />
          </View>
        ))}
      </View>

      {/* Section skeleton */}
      <View style={styles.section}>
        <Skeleton width={120} height={20} />
        <SkeletonList count={2} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#333333',
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  list: {
    marginTop: 15,
  },
  dashboard: {
    padding: 20,
  },
  header: {
    backgroundColor: '#111',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
  },
  actionItem: {
    alignItems: 'center',
  },
  section: {
    marginTop: 20,
  },
});
