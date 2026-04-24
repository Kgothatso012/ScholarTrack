// ScholarTrack OnboardingScreen — Design System: Dark SA Transport
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList, Animated } from 'react-native';
import AnimatedReanimated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeIn, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Spacer } from '../../ui-plugin/components';
import { spacing } from '../../ui-plugin/theme';

const { width } = Dimensions.get('window');

const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#007749',
  green2: '#00e676',
  blue: '#002395',
  red: '#ff3d5a',
  muted: '#4a6a8a',
  white: '#e8f4ff',
};

interface OnboardingData {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

const onboardingData: OnboardingData[] = [
  {
    id: '1',
    title: 'Safe Student Transport',
    description: 'ScholarTrack ensures your children travel safely to and from school with verified, trusted drivers.',
    icon: 'shield-checkmark',
    color: DT.green2,
    bgColor: 'rgba(0,230,118,.12)',
    borderColor: 'rgba(0,230,118,.25)',
  },
  {
    id: '2',
    title: 'Live Bus Tracking',
    description: "Track your child's bus in real-time. Know exactly where they are at all times.",
    icon: 'location',
    color: DT.blue,
    bgColor: 'rgba(0,35,149,.2)',
    borderColor: 'rgba(0,35,149,.4)',
  },
  {
    id: '3',
    title: 'Emergency Response',
    description: 'One-tap panic button alerts emergency services and parents instantly when needed.',
    icon: 'warning',
    color: DT.red,
    bgColor: 'rgba(255,61,90,.12)',
    borderColor: 'rgba(255,61,90,.25)',
  },
];

// Breathing dot
const BreathingDot = ({ color = DT.green2, size = 8 }: { color?: string; size?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.5, { duration: 1600, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 1600, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <View style={{ width: size + 10, height: size + 10, justifyContent: 'center', alignItems: 'center' }}>
      <AnimatedReanimated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, ringStyle]} />
      <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, backgroundColor: color }} />
    </View>
  );
};

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex(currentIndex + 1);
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem('onboardingComplete', 'true');
    } catch (e) {
      // Error saving onboarding state
    }
    onComplete();
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    // HEADER
    header: {
      paddingTop: insets.top + spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    brand: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    brandDot: { color: DT.cyan },
    skipBtn: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' },
    skipText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase' },
    // SLIDE
    slide: { width, flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    iconWrap: {
      width: 140, height: 140, borderRadius: 36,
      justifyContent: 'center', alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,.04)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,.08)',
      marginBottom: spacing.xxl,
      shadowColor: DT.cyan, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.15, shadowRadius: 40, elevation: 4,
    },
    title: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '800', color: DT.white, textAlign: 'center', marginBottom: spacing.md, letterSpacing: -0.5 },
    description: { fontFamily: 'Syne_700Bold', fontSize: 14, color: DT.muted, textAlign: 'center', paddingHorizontal: spacing.xl, lineHeight: 22 },
    // DOTS
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
    dot: { height: 6, borderRadius: 3, marginHorizontal: 4 },
    dotActive: { backgroundColor: DT.cyan, width: 24 },
    dotInactive: { backgroundColor: 'rgba(255,255,255,.12)', width: 6 },
    // BOTTOM
    bottomArea: {
      paddingHorizontal: spacing.xl,
      paddingBottom: insets.bottom + spacing.xl,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    backBtn: {
      width: 48, height: 48, borderRadius: 16,
      backgroundColor: 'rgba(255,255,255,.06)', borderWidth: 1, borderColor: 'rgba(255,255,255,.08)',
      justifyContent: 'center', alignItems: 'center',
    },
    nextBtn: {
      backgroundColor: DT.cyan, borderRadius: 16, height: 52, paddingHorizontal: spacing.xl,
      justifyContent: 'center', alignItems: 'center',
      flexDirection: 'row', gap: 8,
      shadowColor: DT.cyan, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    nextBtnText: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '700', color: DT.bg },
    pageIndicator: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    pageText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted },
    pageActive: { color: DT.cyan, fontWeight: '700' },
  });

  const renderItem = ({ item, index }: { item: OnboardingData; index: number }) => (
    <View style={s.slide}>
      <AnimatedReanimated.View
        entering={FadeIn.delay(index * 100).springify()}
        style={s.iconWrap}
      >
        <Ionicons name={item.icon as any} size={64} color={item.color} />
      </AnimatedReanimated.View>
      <AnimatedReanimated.View entering={FadeIn.delay(index * 100 + 150).springify()}>
        <Text style={s.title}>{item.title}</Text>
      </AnimatedReanimated.View>
      <AnimatedReanimated.View entering={FadeIn.delay(index * 100 + 200).springify()}>
        <Text style={s.description}>{item.description}</Text>
      </AnimatedReanimated.View>
    </View>
  );

  const renderDots = () => (
    <View style={s.dotsContainer}>
      {onboardingData.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const opacity = scrollX.interpolate({ inputRange, outputRange: [0.3, 1, 0.3], extrapolate: 'clamp' });
        const width2 = scrollX.interpolate({ inputRange, outputRange: [6, 24, 6], extrapolate: 'clamp' });
        return (
          <Animated.View
            key={index}
            style={[{ height: 6, borderRadius: 3, marginHorizontal: 4, opacity, width: width2 }]}
          />
        );
      })}
    </View>
  );

  const isLast = currentIndex === onboardingData.length - 1;

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.brand}>Scholar<span style={s.brandDot}>Track</span></Text>
        <TouchableOpacity onPress={handleSkip} style={s.skipBtn}>
          <Text style={s.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        scrollEventThrottle={16}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      {renderDots()}

      {/* Bottom Actions */}
      <View style={s.bottomArea}>
        <TouchableOpacity
          onPress={currentIndex > 0 ? () => { flatListRef.current?.scrollToIndex({ index: currentIndex - 1 }); setCurrentIndex(currentIndex - 1); } : handleSkip}
          style={s.backBtn}
        >
          <Ionicons name={currentIndex > 0 ? 'arrow-back' : 'close'} size={20} color={DT.muted} />
        </TouchableOpacity>

        <View style={s.pageIndicator}>
          <Text style={s.pageText}>
            <Text style={s.pageActive}>{currentIndex + 1}</Text>
            <Text style={s.pageText}> / {onboardingData.length}</Text>
          </Text>
        </View>

        <TouchableOpacity onPress={handleNext} style={s.nextBtn}>
          <Text style={s.nextBtnText}>{isLast ? 'Get Started' : 'Next'}</Text>
          {!isLast && <Ionicons name="arrow-forward" size={18} color={DT.bg} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}
