import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, FlatList, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

const { width } = Dimensions.get('window');

interface OnboardingData {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

const onboardingData: OnboardingData[] = [
  { id: '1', title: 'Safe Student Transport', description: 'ScholarTrack ensures your children travel safely to and from school with verified drivers.', icon: 'shield-checkmark', color: '#007749' },
  { id: '2', title: 'Live Tracking', description: "Track your child's bus in real-time. Know exactly where they are at all times.", icon: 'location', color: '#002395' },
  { id: '3', title: 'Emergency Response', description: 'One-tap panic button alerts emergency services and parents instantly.', icon: 'warning', color: '#E91E63' },
];

interface Props {
  onComplete: () => void;
}

export default function OnboardingScreen({ onComplete }: Props) {
  const { colors } = useTheme();
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

  const renderItem = ({ item }: { item: OnboardingData }) => (
    <View style={styles(colors).slide}>
      <View style={[styles(colors).iconContainer, { backgroundColor: item.color + '20' }]}>
        <Ionicons name={item.icon as any} size={80} color={item.color} />
      </View>
      <Text style={styles(colors).title}>{item.title}</Text>
      <Text style={styles(colors).description}>{item.description}</Text>
    </View>
  );

  const renderDots = () => (
    <View style={styles(colors).dotsContainer}>
      {onboardingData.map((_, index) => {
        const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
        const scale = scrollX.interpolate({ inputRange, outputRange: [0.8, 1.2, 0.8], extrapolate: 'clamp' });
        return (
          <Animated.View key={index} style={[styles(colors).dot, { transform: [{ scale }] }]} />
        );
      })}
    </View>
  );

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    slide: { width, flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    iconContainer: { width: 160, height: 160, borderRadius: 80, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xxl },
    title: { ...typography.h1, color: colors.text, textAlign: 'center', marginBottom: spacing.md },
    description: { ...typography.body, color: colors.textSecondary, textAlign: 'center', paddingHorizontal: spacing.xl },
    dotsContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.xl },
    dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.textSecondary, marginHorizontal: spacing.xs },
    buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
    skipBtn: { padding: spacing.md },
    skipText: { ...typography.button, color: colors.textSecondary },
    nextBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.md },
    nextText: { ...typography.button, color: colors.textInverse },
  });

  return (
    <View style={styles(colors).container}>
      <TouchableOpacity style={styles(colors).skipBtn} onPress={handleSkip}>
        <Text style={styles(colors).skipText}>Skip</Text>
      </TouchableOpacity>

      <FlatList
        ref={flatListRef}
        data={onboardingData}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
        scrollEventThrottle={16}
      />

      {renderDots()}

      <View style={styles(colors).buttonsContainer}>
        <View />
        <TouchableOpacity style={styles(colors).nextBtn} onPress={handleNext}>
          <Text style={styles(colors).nextText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}