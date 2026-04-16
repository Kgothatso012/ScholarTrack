import React, { useEffect } from 'react';
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
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const SA_GOLD = '#FFB81C';
const SA_BLUE = '#002395';
const SA_GREEN = '#007749';

interface SplashScreenProps {
  onFinish?: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  // Logo container spring scale
  const logoScale = useSharedValue(0.6);
  const logoOpacity = useSharedValue(0);

  // Bus icon spring (press-in on load)
  const busScale = useSharedValue(0.85);
  const busRotate = useSharedValue(-8);

  // Breathing ring 1 - outer
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0.5);

  // Breathing ring 2 - mid
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0.3);

  // Breathing ring 3 - inner
  const ring3Scale = useSharedValue(1);
  const ring3Opacity = useSharedValue(0.2);

  // Gold accent bar shimmer
  const accentBarOpacity = useSharedValue(0.6);

  // Tagline letter spacing
  const taglineOpacity = useSharedValue(0);

  // SA sun rays rotation
  const raysRotation = useSharedValue(0);

  useEffect(() => {
    // Logo entrance: spring in with overshoot
    logoScale.value = withSpring(1, {
      damping: 12,
      stiffness: 100,
      mass: 0.8,
    });
    logoOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });

    // Bus icon: spring in with slight rotation
    busScale.value = withDelay(
      200,
      withSpring(1, { damping: 14, stiffness: 110, mass: 0.7 })
    );
    busRotate.value = withDelay(200, withSpring(0, { damping: 16, stiffness: 120 }));

    // Breathing rings pulse
    ring1Scale.value = withRepeat(
      withSequence(
        withTiming(1.25, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
    ring1Opacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 2200 }),
        withTiming(0.5, { duration: 2200 })
      ),
      -1,
      false
    );

    ring2Scale.value = withRepeat(
      withDelay(
        400,
        withSequence(
          withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.ease) })
        )
      ),
      -1,
      false
    );
    ring2Opacity.value = withRepeat(
      withDelay(
        400,
        withSequence(
          withTiming(0, { duration: 2000 }),
          withTiming(0.3, { duration: 2000 })
        )
      ),
      -1,
      false
    );

    ring3Scale.value = withRepeat(
      withDelay(
        800,
        withSequence(
          withTiming(1.2, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1800, easing: Easing.inOut(Easing.ease) })
        )
      ),
      -1,
      false
    );
    ring3Opacity.value = withRepeat(
      withDelay(
        800,
        withSequence(
          withTiming(0, { duration: 1800 }),
          withTiming(0.2, { duration: 1800 })
        )
      ),
      -1,
      false
    );

    // Gold accent shimmer
    accentBarOpacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1200 }),
        withTiming(0.5, { duration: 1200 })
      ),
      -1,
      true
    );

    // Rays slow rotation
    raysRotation.value = withRepeat(
      withTiming(360, { duration: 30000, easing: Easing.linear }),
      -1,
      false
    );

    // Tagline fade in
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 800 }));

    // Notify finish after animation settles
    if (onFinish) {
      const timer = setTimeout(() => {
        runOnJS(onFinish)();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Animated styles
  const logoContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const busIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: busScale.value },
      { rotate: `${busRotate.value}deg` },
    ],
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

  const accentBarStyle = useAnimatedStyle(() => ({
    opacity: accentBarOpacity.value,
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  const raysStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${raysRotation.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      {/* Background glow layers */}
      <View style={styles.bgGlowGold} />
      <View style={styles.bgGlowBlue} />
      <View style={styles.bgGlowGreen} />

      {/* SA Sun rays rotating slowly */}
      <Animated.View style={[styles.raysContainer, raysStyle]} pointerEvents="none">
        {[...Array(12)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.ray,
              {
                transform: [
                  { rotate: `${i * 30}deg` },
                  { translateY: -width * 0.35 },
                ],
              },
            ]}
          />
        ))}
      </Animated.View>

      {/* Breathing concentric rings behind logo */}
      <Animated.View style={[styles.ring, styles.ring1, ring1Style]} />
      <Animated.View style={[styles.ring, styles.ring2, ring2Style]} />
      <Animated.View style={[styles.ring, styles.ring3, ring3Style]} />

      {/* Glass logo container */}
      <Animated.View style={[styles.logoContainer, logoContainerStyle]}>
        {/* Top refraction edge */}
        <View style={styles.logoRefraction} />

        {/* SA Gold left accent bar - animated shimmer */}
        <Animated.View style={[styles.logoLeftBar, accentBarStyle]} />

        {/* Bus icon */}
        <Animated.View style={[styles.iconWrap, busIconStyle]}>
          <Ionicons name="bus" size={44} color={SA_GOLD} />
        </Animated.View>

        {/* App name */}
        <Text style={styles.appName}>ScholarTrack</Text>

        {/* SA Gold divider line */}
        <Animated.View style={[styles.dividerLine, accentBarStyle]} />

        {/* Subtitle */}
        <Text style={styles.subtitle}>Student Transport Safety</Text>

        {/* SA flag indicator dots */}
        <View style={styles.flagDots}>
          <View style={[styles.flagDot, { backgroundColor: SA_GOLD }]} />
          <View style={[styles.flagDot, { backgroundColor: SA_GREEN }]} />
          <View style={[styles.flagDot, { backgroundColor: '#002395' }]} />
          <View style={[styles.flagDot, { backgroundColor: '#E03C31' }]} />
          <View style={[styles.flagDot, { backgroundColor: '#FFFFFF' }]} />
        </View>
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineContainer, taglineStyle]}>
        <Text style={styles.taglineText}>South Africa's Trusted School Transport</Text>
      </Animated.View>

      {/* Loading dots */}
      <View style={styles.loadingDots}>
        {[0, 1, 2].map((i) => (
          <LoadingDot key={i} delay={i * 200} />
        ))}
      </View>

      {/* Bottom SA Gold accent line */}
      <Animated.View style={[styles.bottomAccent, accentBarStyle]} />
    </View>
  );
};

// Individual animated loading dot
const LoadingDot: React.FC<{ delay: number }> = ({ delay }) => {
  const dotScale = useSharedValue(0.4);

  useEffect(() => {
    const start = () => {
      dotScale.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.4, { duration: 500, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        false
      );
    };
    const timeout = setTimeout(start, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  const dotStyle = useAnimatedStyle(() => ({
    transform: [{ scale: dotScale.value }],
  }));

  return <Animated.View style={[styles.dot, dotStyle]} />;
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  // Layered radial glows
  bgGlowGold: {
    position: 'absolute',
    top: '20%',
    left: '50%',
    marginLeft: -width * 0.4,
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(255,184,28,0.06)',
  },
  bgGlowBlue: {
    position: 'absolute',
    bottom: '10%',
    right: '-20%',
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(0,35,149,0.08)',
  },
  bgGlowGreen: {
    position: 'absolute',
    top: '5%',
    right: '10%',
    width: width * 0.4,
    height: width * 0.4,
    borderRadius: width * 0.2,
    backgroundColor: 'rgba(0,119,73,0.05)',
  },
  // SA Sun rays
  raysContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -width * 0.45,
    marginLeft: -width * 0.45,
    width: width * 0.9,
    height: width * 0.9,
    borderRadius: width * 0.45,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ray: {
    position: 'absolute',
    width: 1.5,
    height: width * 0.12,
    backgroundColor: 'rgba(255,184,28,0.12)',
    borderRadius: 1,
  },
  // Breathing rings
  ring: {
    position: 'absolute',
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: SA_GOLD,
  },
  ring1: {
    width: width * 0.65,
    height: width * 0.65,
    marginLeft: -(width * 0.325),
    marginTop: -(width * 0.325),
    borderColor: 'rgba(255,184,28,0.25)',
  },
  ring2: {
    width: width * 0.5,
    height: width * 0.5,
    marginLeft: -(width * 0.25),
    marginTop: -(width * 0.25),
    borderColor: 'rgba(255,184,28,0.2)',
  },
  ring3: {
    width: width * 0.35,
    height: width * 0.35,
    marginLeft: -(width * 0.175),
    marginTop: -(width * 0.175),
    borderColor: 'rgba(255,184,28,0.15)',
  },
  // Glass logo container
  logoContainer: {
    width: width * 0.78,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,184,28,0.18)',
    borderRadius: 32,
    padding: width * 0.08,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: SA_GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 40,
    elevation: 0,
  },
  // Top refraction line
  logoRefraction: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,184,28,0.35)',
  },
  // Left gold accent bar
  logoLeftBar: {
    position: 'absolute',
    left: 0,
    top: '18%',
    bottom: '18%',
    width: 3,
    backgroundColor: SA_GOLD,
    borderRadius: 2,
  },
  // Bus icon wrapper
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(255,184,28,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,184,28,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  // App name
  appName: {
    fontSize: 30,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1.5,
    textAlign: 'center',
  },
  // Divider
  dividerLine: {
    width: 48,
    height: 2,
    backgroundColor: SA_GOLD,
    borderRadius: 1,
    marginVertical: 12,
  },
  // Subtitle
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 3,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  // SA flag dots
  flagDots: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 8,
  },
  flagDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  // Tagline
  taglineContainer: {
    marginTop: 36,
    alignItems: 'center',
  },
  taglineText: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255,255,255,0.3)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  // Loading dots
  loadingDots: {
    flexDirection: 'row',
    marginTop: 28,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SA_GOLD,
  },
  // Bottom accent
  bottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: SA_GOLD,
  },
});

export default SplashScreen;
