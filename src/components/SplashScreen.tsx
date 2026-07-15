// SplashScreen — Mobicel-safe (RN Animated, no Reanimated worklets).
// Reanimated-heavy original OOMs/initialises-fail on armv7 low-end.
// ponytail: dropped 700 lines of worklets for a 1.2s logo animation.
import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('dark');
const { width } = Dimensions.get('window');

const APP_NAME = 'ScholarTrack';

export const SplashScreen: React.FC<{ onFinish?: () => void }> = ({ onFinish }) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => onFinish?.(), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.logoWrap, { opacity, transform: [{ scale }] }]}>
        <View style={styles.busCircle}>
          <Ionicons name="bus" size={64} color={C.background} />
        </View>
        <Text style={styles.title}>{APP_NAME}</Text>
        <Text style={styles.tagline}>Student transport safety</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { alignItems: 'center' },
  busCircle: {
    width: 120, height: 120, borderRadius: 60, backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center', marginBottom: 24,
  },
  title: { fontSize: 32, fontWeight: '800', color: C.primary, letterSpacing: 1 },
  tagline: { fontSize: 14, color: C.secondary, marginTop: 8 },
});

export default SplashScreen;