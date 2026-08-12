// MalumeScholarTrack ParentPaymentsChatScreen — Dark SA Transport Design
// Glassmorphism, dark theme, cyan/amber accents

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  UIManager,
  KeyboardAvoidingView,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { Card, Spacer } from '../../ui-plugin/components';
import { spacing, typography, borderRadius, cards } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };
const { colors: C } = getTheme('dark');

const glassCard = cards.glassAmber;

interface Props {
  navigation: { goBack: () => void };
}

export default function ChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.surface,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: C.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: { ...typography.h2, color: C.text },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    emptyTitle: { ...typography.h4, color: C.text, marginTop: spacing.md },
    emptyText: { ...typography.body, color: C.textMuted, textAlign: 'center', marginTop: spacing.sm },
  });
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={{ padding: spacing.xs }}>
          <Ionicons name="arrow-back" size={24} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={C.textMuted} />
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptyText}>
          Messages with your driver will appear here.
        </Text>
      </View>
    </Animated.View>
  );
}
