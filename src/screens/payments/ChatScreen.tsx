// ScholarTrack ParentPaymentsChatScreen — Dark SA Transport Design
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
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };
const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#00e676',
  red: '#ff3d5a',
  white: '#ffffff',
  text: '#9bbdd4',
  muted: '#4a6a8a',
};

const glassCard = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
};

interface Props {
  navigation: { goBack: () => void };
}

export default function ChatScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    header: {
      backgroundColor: DT.bg2,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: DT.border,
      flexDirection: 'row',
      alignItems: 'center',
    },
    headerTitle: { ...typography.h2, color: DT.white },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
    emptyTitle: { ...typography.h4, color: DT.white, marginTop: spacing.md },
    emptyText: { ...typography.body, color: DT.muted, textAlign: 'center', marginTop: spacing.sm },
  });

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation?.goBack?.()} style={{ padding: spacing.xs }}>
          <Ionicons name="arrow-back" size={24} color={DT.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={DT.muted} />
        <Text style={styles.emptyTitle}>No Messages Yet</Text>
        <Text style={styles.emptyText}>
          Messages with your driver will appear here.
        </Text>
      </View>
    </Animated.View>
  );
}
