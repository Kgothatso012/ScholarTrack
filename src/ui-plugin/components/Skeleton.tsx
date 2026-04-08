// Skeleton Loader Component - Animated placeholder for loading states

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const { colors } = useTheme();
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

  const skeletonStyle: any = {
    width: typeof width === 'number' ? width : width,
    height,
    borderRadius,
    backgroundColor: colors.border,
    opacity,
  };

  return (
    <Animated.View
      style={[skeletonStyle, style]}
    />
  );
};

// Skeleton for list items (driver cards, etc.)
export const SkeletonListItem: React.FC = () => {
  const { colors } = useTheme();

  return (
    <View style={[styles.listItem, { backgroundColor: colors.card }]}>
      <Skeleton width={40} height={40} borderRadius={20} />
      <View style={styles.listItemContent}>
        <Skeleton width="60%" height={16} />
        <Skeleton width="40%" height={12} style={{ marginTop: 8 }} />
      </View>
      <Skeleton width={60} height={20} borderRadius={10} />
    </View>
  );
};

// Skeleton for stats cards
export const SkeletonStatCard: React.FC = () => {
  return (
    <View style={styles.statCard}>
      <Skeleton width="40%" height={12} />
      <Skeleton width="60%" height={28} style={{ marginTop: 8 }} />
    </View>
  );
};

// Skeleton for the entire dashboard
export const DashboardSkeleton: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.dashboard, { backgroundColor: colors.background }]}>
      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        {[1, 2, 3, 4].map(i => (
          <SkeletonStatCard key={i} />
        ))}
      </View>
      {/* List Items */}
      {[1, 2, 3, 4, 5].map(i => (
        <SkeletonListItem key={i} />
      ))}
    </View>
  );
};

// Skeleton for card content
export const SkeletonCard: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: colors.card }]}>
      <Skeleton width="30%" height={16} style={{ marginBottom: 12 }} />
      <Skeleton width="70%" height={14} style={{ marginBottom: 8 }} />
      <Skeleton width="50%" height={14} style={{ marginBottom: 16 }} />
      <Skeleton width="40%" height={20} borderRadius={8} />
    </View>
  );
};

// Skeleton for map placeholder
export const SkeletonMap: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.mapContainer, { backgroundColor: colors.card }]}>
      <View style={styles.mapPlaceholder}>
        <Skeleton width={60} height={60} borderRadius={30} />
        <Skeleton width="40%" height={14} style={{ marginTop: 12 }} />
      </View>
    </View>
  );
};

// Skeleton for child tracking card
export const SkeletonTrackingCard: React.FC = () => {
  const { colors } = useTheme();
  return (
    <View style={[styles.trackingCard, { backgroundColor: colors.card }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <Skeleton width={50} height={50} borderRadius={25} />
        <View style={{ marginLeft: 12, flex: 1 }}>
          <Skeleton width="60%" height={16} style={{ marginBottom: 6 }} />
          <Skeleton width="40%" height={12} />
        </View>
        <Skeleton width={70} height={24} borderRadius={12} />
      </View>
      <Skeleton width="100%" height={120} borderRadius={12} style={{ marginBottom: 12 }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Skeleton width="23%" height={60} borderRadius={8} />
        <Skeleton width="23%" height={60} borderRadius={8} />
        <Skeleton width="23%" height={60} borderRadius={8} />
        <Skeleton width="23%" height={60} borderRadius={8} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  listItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  statCard: {
    width: '48%',
    padding: 16,
    marginBottom: 8,
    borderRadius: 8,
  },
  dashboard: {
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  mapContainer: {
    height: 250,
    borderRadius: 12,
    margin: 16,
    overflow: 'hidden',
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingCard: {
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: -20,
  },
});

export default Skeleton;