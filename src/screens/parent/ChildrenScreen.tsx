// ScholarTrack ChildrenScreen — Design System: Dark SA Transport
// Dark glassmorphism cards, cyan/amber accents, spring animations

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { childrenService } from '../../lib/api';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius, cards } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S } = getTheme('dark');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };

// ─── Spring-press wrapper ─────────────────────────────────────────────────────
const SpringTouchable = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }],
  }));
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

// ─── Breathing dot ────────────────────────────────────────────────────────────
const BreathingDot = ({ color = C.success, size = 8 }: { color?: string; size?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.5, { duration: 1600 }), withTiming(1, { duration: 1600 })), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 1600 }), withTiming(1, { duration: 1600 })), -1, false);
  }, []);
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <Animated.View style={[{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }, aStyle]} />
  );
};

// Child avatar colors for variety
const AVATAR_COLORS = [C.accent, C.primary, C.success, C.error, C.secondary];

// ─── Parametric styles (must be outside StyleSheet.create) ─────────────────────
const glassCardBase = cards.glassAmber;

const childAvatarStyle = (index: number) => ({
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] + '30',
  borderWidth: 1.5,
  borderColor: AVATAR_COLORS[index % AVATAR_COLORS.length],
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
});

const actionBtnStyle = (color: string) => ({
  ...glassCardBase,
  width: '48%' as const,
  borderRadius: borderRadius.lg,
  padding: spacing.md,
  marginBottom: spacing.sm,
  alignItems: 'center' as const,
});

const getInitials = (name: string) => (name || 'C').substring(0, 1).toUpperCase();

interface Child {
  id: string;
  name: string;
  school: string;
  grade: string;
  driver: string;
  status: 'active' | 'inactive';
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function ChildrenScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [childList, setChildList] = useState<Child[]>([]);

  const fetchChildren = useCallback(async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChildList([]);
        return;
      }

      const data = await childrenService.getChildren(user.id);
      if (data && data.length > 0) {
        setChildList(data.map((c) => ({
          id: c.id,
          name: c.full_name,
          school: c.school?.name || 'Unknown School',
          grade: c.grade || 'N/A',
          driver: c.driver?.full_name || 'Pending',
          status: c.driver ? 'active' : 'inactive',
        })));
      } else {
        setChildList([]);
      }
    } catch (error) {
      setChildList([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChildren();
  }, [fetchChildren]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchChildren();
    setRefreshing(false);
  };

  const addChild = () => {
    navigation?.navigate?.('LinkChild');
  };

  const quickActions = [
    { name: 'Track All', icon: 'map', color: C.primary, route: 'LiveTrack' },
    { name: 'Add Driver', icon: 'person-add', color: C.accent, route: 'HireDriver' },
    { name: 'Emergency', icon: 'warning', color: C.error, route: 'Emergency' },
    { name: 'Documents', icon: 'document-text', color: C.primary, route: 'ParentDocs' },
  ];

  const sectionLabelStyle = { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.25)', marginBottom: spacing.sm };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.surface,
      padding: S.lg,
      paddingTop: insets.top + S.lg,
      borderBottomWidth: 4,
      borderBottomColor: C.accent,
      position: 'relative',
      overflow: 'hidden',
    },
    headerTitle: { ...typography.h2, color: C.text },
    headerSub: { ...typography.bodySmall, color: C.textMuted, marginTop: spacing.xs },
    addBtn: {
      ...glassCardBase,
      margin: S.lg,
      padding: S.md,
      borderRadius: borderRadius.lg,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,.12)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnText: { ...typography.button, color: C.primary, marginLeft: S.sm },
    section: { padding: S.lg },
    sectionTitle: { ...typography.h3, color: C.text, marginBottom: S.md },
    childCard: {
      ...glassCardBase,
      borderRadius: borderRadius.lg,
      padding: S.md,
      marginBottom: S.md,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,183,0,.3)',
      borderColor: 'rgba(255,183,0,.12)',
      borderLeftWidth: 0,
      overflow: 'hidden',
    },
    childRow: { flexDirection: 'row' as const, alignItems: 'center' as const },
    childAvatar: undefined as any,
    childInitial: { ...typography.h4, color: C.text },
    childInfo: { flex: 1, marginLeft: S.md },
    childName: { ...typography.label, color: C.text },
    childSchool: { ...typography.bodySmall, color: C.textMuted, marginTop: 2 },
    childGrade: { ...typography.caption, color: C.textMuted },
    childStatus: { alignItems: 'flex-end' as const },
    childDriver: { ...typography.caption, color: C.textMuted, marginTop: 2 },
    actionsGrid: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, justifyContent: 'space-between' as const },
    actionBtn: undefined as any,
    actionText: { ...typography.labelSmall, color: C.text, marginTop: S.xs },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: S.xl },
    emptyText: { ...typography.body, color: C.textMuted, textAlign: 'center' },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.background },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>My Children</Text>
          <Text style={styles.headerSub}>Manage your children</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={C.primary} />
          <Text style={[styles.emptyText, { marginTop: S.md }]}>Loading children...</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Header with radial glow */}
      <View style={styles.header}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: C.accent, opacity: 0.06 }} />
        <Text style={styles.headerTitle}>My Children</Text>
        <Text style={styles.headerSub}>Manage your children</Text>
      </View>

      {/* Add Button */}
      <SpringTouchable onPress={addChild} style={styles.addBtn}>
        <Ionicons name="add-circle" size={24} color={C.primary} />
        <Text style={styles.addBtnText}>Add Child</Text>
      </SpringTouchable>

      {/* Children List */}
      <ScrollView
        style={styles.section}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[C.primary]}
            tintColor={C.primary}
          />
        }
      >
        {childList.length === 0 ? (
          <Animated.View entering={ZoomIn.duration(300)} style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color={C.textMuted} />
            <Text style={styles.emptyText}>No children added yet</Text>
            <Text style={[styles.emptyText, { marginTop: S.sm }]}>Tap "Add Child" to get started</Text>
          </Animated.View>
        ) : (
          childList.map((child, index) => (
            <Animated.View key={child.id} entering={ZoomIn.duration(300).delay(index * 60)}>
              <View style={[styles.childCard, { borderRadius: borderRadius.lg, position: 'relative' }]}>
                {/* Top refraction line */}
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
                {/* Left bar accent */}
                <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.5)' }} />
                <View style={styles.childRow}>
                  <View style={childAvatarStyle(index)}>
                    <Text style={styles.childInitial}>{getInitials(child.name)}</Text>
                  </View>
                  <View style={styles.childInfo}>
                    <Text style={styles.childName}>{child.name}</Text>
                    <Text style={styles.childSchool}>{child.school}</Text>
                    <Text style={styles.childGrade}>{child.grade}</Text>
                  </View>
                  <View style={styles.childStatus}>
                    <Badge
                      label={child.status === 'active' ? 'Active' : 'No Driver'}
                      variant={child.status === 'active' ? 'success' : 'warning'}
                      size="small"
                    />
                    {child.driver !== 'Pending' && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: S.xs }}>
                        <BreathingDot color={C.success} size={6} />
                        <Text style={styles.childDriver}>  {child.driver}</Text>
                      </View>
                    )}
                  </View>
                </View>
              </View>
            </Animated.View>
          ))
        )}

        {/* Quick Actions */}
        <Text style={sectionLabelStyle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          {quickActions.map((action, i) => (
            <SpringTouchable
              key={i}
              onPress={() => navigation?.navigate?.(action.route)}
              style={actionBtnStyle(action.color)}
            >
              <Ionicons name={action.icon as any} size={24} color={action.color} />
              <Text style={styles.actionText}>{action.name}</Text>
            </SpringTouchable>
          ))}
        </View>
      </ScrollView>
    </Animated.View>
  );
}