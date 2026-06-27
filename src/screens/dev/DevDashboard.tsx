import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { Card, Button, Spacer, SpringTouchable } from '../../ui-plugin/components';
import { spacing, typography, borderRadius, cards } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const { colors: C } = getTheme('dark');

const glassCard = cards.glassCyan;

const glassCardAmber = cards.glassAmber;

const DevDashboard = ({ navigation }: Props) => {
  const insets = useSafeAreaInsets();

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout', style: 'destructive', onPress: async () => {
          await supabase.auth.signOut();
          await AsyncStorage.multiRemove(['userRole', 'userName', 'userEmail', 'userId']);
        },
      },
    ]);
  };

  const devTools = [
    { name: 'API Console', icon: 'code-slash' as const, color: C.cyan },
    { name: 'Database', icon: 'server' as const, color: C.info },
    { name: 'Logs', icon: 'list' as const, color: C.primaryLight },
    { name: 'Settings', icon: 'settings' as const, color: C.textMuted },
    { name: 'Users', icon: 'people' as const, color: C.success },
    { name: 'Routes', icon: 'map' as const, color: C.secondary },
  ];

  const statusItems = [
    { label: 'API Status', value: 'Online', icon: 'checkmark-circle' as const, color: C.success },
    { label: 'Database', value: 'Connected', icon: 'checkmark-circle' as const, color: C.success },
    { label: 'Environment', value: 'Development', icon: 'code-slash' as const, color: C.primaryLight },
    { label: 'Realtime', value: 'Active', icon: 'flash' as const, color: C.cyan },
  ];

  const quickActions = [
    { label: 'Sync Database', icon: 'refresh' as const, color: C.cyan },
    { label: 'Export Logs', icon: 'download' as const, color: C.primaryLight },
    { label: 'Clear Cache', icon: 'trash' as const, color: C.error },
  ];

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.surface,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 4,
      borderBottomColor: C.cyan,
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 22, color: C.text },
    headerSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: C.textMuted, marginTop: 2 },
    logoutBtn: { padding: spacing.xs },
    section: { padding: spacing.lg },
    sectionLabel: {
      fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5,
      textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: spacing.md,
    },
    toolsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    toolCard: {
      ...glassCard,
      width: '47%',
      padding: spacing.lg,
      alignItems: 'center',
    },
    toolCardTop: {
      height: 1,
      width: '100%',
      backgroundColor: 'rgba(0,229,255,.15)',
    },
    toolCardInner: { alignItems: 'center', paddingTop: spacing.sm },
    toolName: { fontFamily: 'Syne_600SemiBold', fontSize: 13, color: C.text, marginTop: spacing.sm, textAlign: 'center' },
    statusCard: { ...glassCard },
    statusTop: { height: 1, backgroundColor: 'rgba(0,229,255,.15)' },
    statusRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: spacing.md, paddingHorizontal: spacing.lg, borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,.05)',
    },
    statusLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    statusIconBox: {
      width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    },
    statusLabel: { fontFamily: 'DMMono_400Regular', fontSize: 12, color: C.textSecondary },
    statusValue: { fontFamily: 'Syne_600SemiBold', fontSize: 12, color: C.text },
    actionBtn: {
      ...glassCard,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
      paddingVertical: spacing.md, marginBottom: spacing.sm,
    },
    actionBtnText: { fontFamily: 'Syne_600SemiBold', fontSize: 14, color: C.text },
    dangerBtn: {
      borderRadius: 14, paddingVertical: spacing.md, marginBottom: spacing.sm,
      backgroundColor: 'rgba(255,61,90,.10)',
      borderWidth: 1, borderColor: 'rgba(255,61,90,.15)',
    },
    dangerBtnText: { fontFamily: 'Syne_600SemiBold', fontSize: 14, color: C.error, textAlign: 'center' },
  });

  return (
    <ScrollView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerRow}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
              <Ionicons name="construct" size={20} color={C.cyan} />
              <Text style={s.headerTitle}>Dev Dashboard</Text>
            </View>
            <Text style={s.headerSub}>ScholarTrack Development Tools</Text>
          </View>
          <TouchableOpacity onPress={handleLogout} style={s.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Development Tools */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Development Tools</Text>
        <View style={s.toolsGrid}>
          {devTools.map((tool, index) => (
            <SpringTouchable
              key={index}
              onPress={() => navigation.navigate('DevDatabase' as never)}
              style={s.toolCard}
            >
              <View style={s.toolCardTop} />
              <View style={s.toolCardInner}>
                <View style={[s.statusIconBox, { backgroundColor: tool.color + '20' }]}>
                  <Ionicons name={tool.icon} size={28} color={tool.color} />
                </View>
                <Text style={s.toolName}>{tool.name}</Text>
              </View>
            </SpringTouchable>
          ))}
        </View>
      </View>

      {/* System Status */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>System Status</Text>
        <View style={s.statusCard}>
          <View style={s.statusTop} />
          {statusItems.map((item, i) => (
            <View key={i} style={s.statusRow}>
              <View style={s.statusLeft}>
                <View style={[s.statusIconBox, { backgroundColor: item.color + '20' }]}>
                  <Ionicons name={item.icon} size={16} color={item.color} />
                </View>
                <Text style={s.statusLabel}>{item.label}</Text>
              </View>
              <Text style={[s.statusValue, { color: item.color }]}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Quick Actions */}
      <View style={s.section}>
        <Text style={s.sectionLabel}>Quick Actions</Text>
        {quickActions.map((action, i) => (
          <SpringTouchable
            key={i}
            onPress={() => Alert.alert('Coming Soon', `${action.label} not yet implemented.`)}
            style={s.actionBtn}
          >
            <Ionicons name={action.icon} size={18} color={action.color} />
            <Text style={s.actionBtnText}>{action.label}</Text>
          </SpringTouchable>
        ))}
        <Spacer size="md" />
        <SpringTouchable
          onPress={() => Alert.alert('Coming Soon', 'Cache clearing not yet implemented.')}
          style={s.dangerBtn}
        >
          <Ionicons name="trash-outline" size={16} color={C.error} />
          <Text style={s.dangerBtnText}>Clear Cache</Text>
        </SpringTouchable>
      </View>

      <Spacer size="xxl" />
    </ScrollView>
  );
};

export default DevDashboard;