import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
  interpolate,
  useFrameCallback,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('dark');

const { width } = Dimensions.get('window');

// Taste-skill calibrated palette (theme tokens from dark mode)
const SA_GOLD = C.primary;
const SA_GOLD_LIGHT = C.accent;
const SA_BLUE = C.info;
const SA_GREEN = C.secondary;
const OFF_BLACK = C.background;

interface SplashScreenProps {
  onFinish?: () => void;
}

const APP_NAME = 'ScholarTrack';
const LETTERS = APP_NAME.split('');

const SPRING = {
  logo: { damping: 11, stiffness: 90, mass: 0.7 },
  bus: { damping: 13, stiffness: 110, mass: 0.6 },
  micro: { damping: 18, stiffness: 180, mass: 0.4 },
  letter: { damping: 14, stiffness: 120, mass: 0.5 },
};

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const [showFullName, setShowFullName] = useState(false);

  // Logo container spring + vertical travel
  const logoScale = useSharedValue(0.4);
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(24);

  // Bus icon: press-in spring with rotation
  const busScale = useSharedValue(0.75);
  const busRotate = useSharedValue(-14);
  const busY = useSharedValue(-12);

  // Safety pulse ring (emanates from icon)
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0);

  // Breathing rings
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0);
  const ring3Scale = useSharedValue(1);
  const ring3Opacity = useSharedValue(0);

  // Liquid shimmer sweep
  const shimmerX = useSharedValue(-1);

  // Rays rotation
  const raysRotation = useSharedValue(0);

  // Tagline stagger
  const taglineOpacity = useSharedValue(0);
  const subtitleY = useSharedValue(12);

  // Flag dots perpetual pulse
  const flagPulse = useSharedValue(1);

  // Badge pulse (safety check)
  const badgePulse = useSharedValue(1);

  // Loading text typewriter
  const loadingDots = useSharedValue(0);

  // Letter reveal
  const letterScales = LETTERS.map(() => useSharedValue(0));
  const letterOpacities = LETTERS.map(() => useSharedValue(0));

  // Edge shimmer
  const edgeShimmer = useSharedValue(0);

  useEffect(() => {
    // 1. Logo container springs in
    logoScale.value = withSpring(1, SPRING.logo);
    logoOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) });
    logoY.value = withSpring(0, { ...SPRING.logo, stiffness: 75 });

    // 2. Bus icon: press-in with overshoot + rotation reset
    busScale.value = withDelay(120, withSpring(1, SPRING.bus));
    busRotate.value = withDelay(120, withSpring(0, { ...SPRING.bus, stiffness: 95 }));
    busY.value = withDelay(120, withSpring(0, { ...SPRING.bus, stiffness: 80 }));

    // 3. Safety pulse ring emanates outward
    pulseOpacity.value = withDelay(250, withTiming(0.6, { duration: 300 }));
    pulseScale.value = withDelay(
      250,
      withRepeat(
        withSequence(
          withTiming(1.8, { duration: 1800, easing: Easing.out(Easing.ease) }),
          withTiming(1, { duration: 0 })
        ),
        -1,
        false
      )
    );
    pulseOpacity.value = withDelay(
      250,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 1800, easing: Easing.out(Easing.ease) }),
          withTiming(0.6, { duration: 0 })
        ),
        -1,
        false
      )
    );

    // 4. Rings breathe in with staggered delays
    ring1Opacity.value = withDelay(200, withTiming(0.45, { duration: 900 }));
    ring1Scale.value = withDelay(
      200,
      withRepeat(
        withSequence(
          withTiming(1.28, { duration: 2600, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    ring1Opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2600 }),
        withTiming(0.45, { duration: 2600 })
      ),
      -1,
      false
    );

    ring2Opacity.value = withDelay(400, withTiming(0.32, { duration: 900 }));
    ring2Scale.value = withDelay(
      400,
      withRepeat(
        withSequence(
          withTiming(1.35, { duration: 2300, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2300, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    ring2Opacity.value = withRepeat(
      withDelay(350, withSequence(
        withTiming(0, { duration: 2300 }),
        withTiming(0.32, { duration: 2300 })
      )),
      -1,
      false
    );

    ring3Opacity.value = withDelay(600, withTiming(0.22, { duration: 900 }));
    ring3Scale.value = withDelay(
      600,
      withRepeat(
        withSequence(
          withTiming(1.22, { duration: 1900, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      )
    );
    ring3Opacity.value = withRepeat(
      withDelay(650, withSequence(
        withTiming(0, { duration: 1900 }),
        withTiming(0.22, { duration: 1900 })
      )),
      -1,
      false
    );

    // 5. Liquid shimmer sweep
    shimmerX.value = withRepeat(
      withTiming(1, { duration: 2200, easing: Easing.linear }),
      -1,
      false
    );

    // 6. Rays slow majestic rotation
    raysRotation.value = withRepeat(
      withTiming(360, { duration: 60000, easing: Easing.linear }),
      -1,
      false
    );

    // 7. Tagline + subtitle stagger
    taglineOpacity.value = withDelay(480, withTiming(1, { duration: 650 }));
    subtitleY.value = withDelay(480, withSpring(0, { ...SPRING.bus, stiffness: 78 }));

    // 8. Flag dots perpetual micro-pulse
    flagPulse.value = withRepeat(
      withSequence(
        withSpring(1.4, { ...SPRING.micro, stiffness: 200 }),
        withSpring(1, { ...SPRING.micro, stiffness: 200 })
      ),
      -1,
      true
    );

    // 9. Safety badge pulse
    badgePulse.value = withRepeat(
      withSequence(
        withSpring(1.25, { ...SPRING.micro, stiffness: 220 }),
        withSpring(1, { ...SPRING.micro, stiffness: 220 })
      ),
      -1,
      true
    );

    // 10. Loading dots typewriter
    loadingDots.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 400 }),
        withTiming(2, { duration: 400 }),
        withTiming(3, { duration: 400 }),
        withTiming(0, { duration: 200 })
      ),
      -1,
      false
    );

    // 11. Top edge shimmer
    edgeShimmer.value = withRepeat(
      withTiming(1, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );

    // 12. Staggered letter reveal — each letter springs in
    LETTERS.forEach((_, i) => {
      const delay = 350 + i * 55;
      letterScales[i].value = withDelay(delay, withSpring(1, SPRING.letter));
      letterOpacities[i].value = withDelay(delay, withTiming(1, { duration: 300 }));
    });

    // Notify finish
    if (onFinish) {
      const timer = setTimeout(() => {
        runOnJS(onFinish)();
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, []);

  // === ANIMATED STYLES ===
  const logoContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }, { translateY: logoY.value }],
    opacity: logoOpacity.value,
  }));

  const busIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: busScale.value },
      { rotate: `${busRotate.value}deg` },
      { translateY: busY.value },
    ],
  }));

  // Safety pulse ring emanating from icon
  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmerX.value, [-1, 1], [-60, 60]);
    return { transform: [{ translateX }], opacity: 0.9 };
  });

  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));

  const subtitleStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: subtitleY.value }],
    opacity: taglineOpacity.value,
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${raysRotation.value}deg` }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgePulse.value }],
    opacity: badgePulse.value > 1.1 ? 1 : 0.8,
  }));

  // Loading dots based on counter
  const dot1Style = useAnimatedStyle(() => ({
    opacity: loadingDots.value >= 1 ? 1 : 0.25,
  }));
  const dot2Style = useAnimatedStyle(() => ({
    opacity: loadingDots.value >= 2 ? 1 : 0.25,
  }));
  const dot3Style = useAnimatedStyle(() => ({
    opacity: loadingDots.value >= 3 ? 1 : loadingDots.value > 0 ? 0.25 : 0.25,
  }));

  const edgeShimmerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(edgeShimmer.value, [0, 0.5, 1], [0.15, 0.5, 0.15]);
    return { opacity };
  });

  // Letter animated styles
  const letterStyle = (index: number) =>
    useAnimatedStyle(() => ({
      transform: [{ scale: letterScales[index].value }],
      opacity: letterOpacities[index].value,
    }));

  return (
    <View style={styles.container}>
      {/* Background glow layers */}
      <View style={styles.bgGlowGold} />
      <View style={styles.bgGlowBlue} />
      <View style={styles.bgGlowGreen} />

      {/* SA Sun rays */}
      <Animated.View style={[styles.raysContainer, raysStyle]} pointerEvents="none">
        {[...Array(16)].map((_, i) => {
          const lengths = [0.10, 0.14, 0.10, 0.12, 0.11, 0.13, 0.10, 0.12, 0.10, 0.14, 0.11, 0.12, 0.10, 0.13, 0.11, 0.12];
          return (
            <View
              key={i}
              style={[
                styles.ray,
                {
                  transform: [{ rotate: `${i * 22.5}deg` }, { translateY: -width * 0.38 }],
                  height: width * lengths[i],
                  opacity: 0.08 + (i % 3) * 0.03,
                },
              ]}
            />
          );
        })}
      </Animated.View>

      {/* Breathing concentric rings */}
      <Animated.View style={[styles.ring, styles.ring1, ring1Style]} />
      <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />
      <Animated.View style={[styles.ring, styles.ring3, ring3Style]} />

      {/* Glass logo container */}
      <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
        {/* Top edge shimmer */}
        <Animated.View style={[styles.topEdge, edgeShimmerStyle]} />

        {/* Left liquid gold bar */}
        <View style={styles.leftBar}>
          <Animated.View style={[styles.leftBarShimmer, shimmerStyle]} />
        </View>

        {/* Bus icon with glass wrap + safety badge */}
        <Animated.View style={[styles.iconWrap, busIconStyle]}>
          {/* Safety pulse ring emanates behind icon */}
          <Animated.View style={[styles.pulseRing, pulseRingStyle]} />

          <View style={styles.iconInner}>
            <Ionicons name="bus" size={40} color={SA_GOLD} />
          </View>

          {/* Safety check badge */}
          <Animated.View style={[styles.safetyBadge, badgeStyle]}>
            <Ionicons name="shield-checkmark" size={14} color={SA_GREEN} />
          </Animated.View>
        </Animated.View>

        {/* App name — staggered letter reveal */}
        <View style={styles.appNameRow}>
          {LETTERS.map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.appNameLetter,
                letterStyle(i),
                letter === ' ' && styles.appNameSpace,
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        {/* Divider with shimmer */}
        <View style={styles.dividerWrap}>
          <Animated.View style={[styles.dividerLine, shimmerStyle]} />
        </View>

        {/* Subtitle */}
        <Animated.View style={subtitleStyle}>
          <Text style={styles.subtitle}>Student Transport Safety</Text>
        </Animated.View>

        {/* SA flag dots */}
        <View style={styles.flagDots}>
          {[SA_GOLD, SA_GREEN, SA_BLUE, C.error, C.textInverse].map((color, i) => (
            <View key={i} style={[styles.flagDot, { backgroundColor: color }]} />
          ))}
        </View>

        <View style={styles.bottomRefraction} />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, taglineStyle]}>
        <Text style={styles.taglineText}>South Africa's Trusted School Transport</Text>
      </Animated.View>

      {/* Animated Loading text with dots */}
      <View style={styles.loadingRow}>
        <Text style={styles.loadingText}>Loading</Text>
        <View style={styles.loadingDots}>
          <Animated.View style={[styles.loadingDot, dot1Style]} />
          <Animated.View style={[styles.loadingDot, dot2Style]} />
          <Animated.View style={[styles.loadingDot, dot3Style]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: OFF_BLACK,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },

  bgGlowGold: {
    position: 'absolute',
    top: '22%',
    left: '50%',
    marginLeft: -width * 0.38,
    width: width * 0.76,
    height: width * 0.76,
    borderRadius: width * 0.38,
    backgroundColor: 'rgba(212,160,18,0.07)',
  },
  bgGlowBlue: {
    position: 'absolute',
    bottom: '8%',
    right: '-18%',
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: width * 0.325,
    backgroundColor: 'rgba(0,35,149,0.09)',
  },
  bgGlowGreen: {
    position: 'absolute',
    top: '4%',
    right: '8%',
    width: width * 0.38,
    height: width * 0.38,
    borderRadius: width * 0.19,
    backgroundColor: 'rgba(0,119,73,0.06)',
  },

  raysContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -width * 0.46,
    marginLeft: -width * 0.46,
    width: width * 0.92,
    height: width * 0.92,
    borderRadius: width * 0.46,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ray: {
    position: 'absolute',
    width: 1.2,
    backgroundColor: SA_GOLD,
    borderRadius: 1,
  },

  ring: { position: 'absolute', borderRadius: 9999, borderWidth: 1 },
  ring1: {
    width: width * 0.68, height: width * 0.68,
    marginLeft: -(width * 0.34), marginTop: -(width * 0.34),
    borderColor: 'rgba(212,160,18,0.22)',
  },
  ring2: {
    width: width * 0.52, height: width * 0.52,
    marginLeft: -(width * 0.26), marginTop: -(width * 0.26),
    borderColor: 'rgba(212,160,18,0.17)',
  },
  ring3: {
    width: width * 0.36, height: width * 0.36,
    marginLeft: -(width * 0.18), marginTop: -(width * 0.18),
    borderColor: 'rgba(212,160,18,0.12)',
  },

  logoContainer: {
    width: width * 0.76,
    backgroundColor: 'rgba(255,255,255,0.035)',
    borderWidth: 1,
    borderColor: 'rgba(212,160,18,0.22)',
    borderRadius: 28,
    padding: width * 0.09,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: SA_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 50,
    elevation: 0,
  },

  topEdge: {
    position: 'absolute',
    top: 0,
    left: '15%',
    right: '15%',
    height: 1.5,
    backgroundColor: SA_GOLD_LIGHT,
    borderRadius: 1,
  },

  leftBar: {
    position: 'absolute',
    left: 0,
    top: '20%',
    bottom: '20%',
    width: 3,
    backgroundColor: SA_GOLD,
    borderRadius: 2,
    overflow: 'hidden',
  },
  leftBarShimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 8,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 4,
  },

  // Bus icon + pulse ring
  iconWrap: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: 'rgba(212,160,18,0.08)',
    borderWidth: 1.2,
    borderColor: 'rgba(212,160,18,0.28)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    shadowColor: SA_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
  },

  // Safety pulse ring emanating outward
  pulseRing: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: SA_GREEN,
  },

  iconInner: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Safety check badge
  safetyBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,119,73,0.15)',
    borderWidth: 1.2,
    borderColor: 'rgba(0,119,73,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Staggered letter app name
  appNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appNameLetter: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5F5F5',
    letterSpacing: 0.5,
  },
  appNameSpace: {
    width: 8,
  },

  dividerWrap: {
    width: 52,
    height: 2,
    marginVertical: 10,
    overflow: 'hidden',
    borderRadius: 1,
    backgroundColor: 'rgba(212,160,18,0.15)',
  },
  dividerLine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: SA_GOLD_LIGHT,
    borderRadius: 1,
  },

  subtitle: {
    fontSize: 10.5,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.42)',
    letterSpacing: 3.5,
    textTransform: 'uppercase',
    textAlign: 'center',
  },

  flagDots: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 10,
  },
  flagDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  bottomRefraction: {
    position: 'absolute',
    bottom: 0,
    left: '20%',
    right: '20%',
    height: 1,
    backgroundColor: 'rgba(212,160,18,0.2)',
  },

  taglineContainer: {
    marginTop: 36,
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 10,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.26)',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
  },

  // Animated loading text
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    gap: 4,
  },
  loadingText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.28)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  loadingDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: SA_GOLD,
  },
});

export default SplashScreen;
