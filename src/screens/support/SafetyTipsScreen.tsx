// MalumeScholarTrack SafetyTipsScreen — Design System: Dark SA Transport
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacer } from '../../ui-plugin/components';
import { spacing } from '../../ui-plugin/theme';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

const tips = [
  { icon: 'person-add', title: 'Verify Your Driver', description: 'Always check driver details before starting a trip.', color: C.accent },
  { icon: 'location', title: 'Share Your Location', description: 'Share your live location with family members during trips.', color: C.success },
  { icon: 'warning', title: 'Know Emergency Numbers', description: 'Police 10111, Ambulance 10177, Crime Stop 08600 10111.', color: C.error },
  { icon: 'chatbubbles', title: 'Communicate Openly', description: 'Maintain open communication with your driver and children.', color: C.accent },
  { icon: 'eye', title: 'Monitor Trips', description: 'Use the live tracking feature to monitor journeys.', color: C.primary },
  { icon: 'shield-checkmark', title: 'Report Suspicious Activity', description: 'Report any concerning behavior immediately.', color: C.accent },
  { icon: 'people', title: 'Establish Safe Words', description: 'Create a secret code word that your child can use if unsafe.', color: C.success },
  { icon: 'document-text', title: 'Keep Records', description: 'Save trip receipts and driver information.', color: C.accent },
];

const emergencyTips = [
  'Always buckle up when in the vehicle',
  'Know your exact pickup and dropoff locations',
  'Keep emergency contacts updated in the app',
  'Trust your instincts — if something feels wrong, act',
  'Teach children to exit only at designated stops',
];

export default function SafetyTipsScreen() {
  const insets = useSafeAreaInsets();
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    scroll: { flex: 1 },
    // HEADER
    header: {
      backgroundColor: C.surface,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      position: 'relative',
      overflow: 'hidden',
    },
    headerGlow1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,61,90,.06)' },
    headerGlow2: { position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.06)' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
    headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    headerSub: { fontFamily: 'Syne_700Bold', fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: spacing.xs },
    headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerBadgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.4)' },
    headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
    // SECTION
    section: { padding: spacing.lg },
    sectionLabel: { fontFamily: 'Syne_700Bold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.2)', marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
    // TIP CARD
    tipCard: {
      backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,.08)',
      borderRadius: 16, padding: 14, marginBottom: 8, flexDirection: 'row' as const, alignItems: 'flex-start' as const,
    },
    tipIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    tipInfo: { flex: 1, marginLeft: spacing.md },
    tipTitle: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    tipDesc: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted, marginTop: 2, lineHeight: 18 },
    // EMERGENCY CARD
    emergencyCard: {
      backgroundColor: 'rgba(255,61,90,.06)', borderWidth: 1, borderColor: 'rgba(255,61,90,.15)',
      borderRadius: 16, padding: spacing.lg,
      borderTopWidth: 2, borderTopColor: 'rgba(255,61,90,.25)',
    },
    emergencyItem: { flexDirection: 'row' as const, alignItems: 'center', marginBottom: spacing.sm },
    emergencyBullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.error, marginRight: spacing.sm },
    emergencyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.text, flex: 1, lineHeight: 20 },
    // WARNING BADGE
    warningBadge: {
      flexDirection: 'row' as const, alignItems: 'center', gap: spacing.sm,
      backgroundColor: 'rgba(255,183,0,.1)', borderWidth: 1, borderColor: 'rgba(255,183,0,.2)',
      borderRadius: 14, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    warningText: { fontFamily: 'Syne_700Bold', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' as const, color: C.accent, fontWeight: '600' },
  });

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.springify()}>
          <View style={s.header}>
            <View style={s.headerGlow1} />
            <View style={s.headerGlow2} />
            <View style={s.headerTop}>
              <View>
                <Text style={s.headerTitle}>Safety Tips</Text>
                <Text style={s.headerSub}>Stay safe with MalumeMalumeScholarTrack</Text>
              </View>
              <View style={s.headerBadge}>
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: C.success }} />
                <Text style={s.headerBadgeText}>Always Active</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Safety Tips */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Top Safety Tips</Text>
          {tips.map((tip, index) => (
            <Animated.View key={index} entering={FadeIn.delay(index * 50).springify()}>
              <View style={s.tipCard}>
                <View style={[s.tipIcon, { backgroundColor: tip.color + '15' }]}>
                  <Ionicons name={tip.icon as keyof typeof Ionicons.glyphMap} size={22} color={tip.color} />
                </View>
                <View style={s.tipInfo}>
                  <Text style={s.tipTitle}>{tip.title}</Text>
                  <Text style={s.tipDesc}>{tip.description}</Text>
                </View>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* Emergency Reminders */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Emergency Reminders</Text>
          <Animated.View entering={FadeIn.delay(200).springify()}>
            <View style={s.warningBadge}>
              <Ionicons name="warning" size={14} color={C.accent} />
              <Text style={s.warningText}>Important Safety Information</Text>
            </View>
          </Animated.View>
          <Animated.View entering={FadeIn.delay(250).springify()}>
            <View style={s.emergencyCard}>
              {emergencyTips.map((tip, index) => (
                <View key={index} style={s.emergencyItem}>
                  <View style={s.emergencyBullet} />
                  <Text style={s.emergencyText}>{tip}</Text>
                </View>
              ))}
            </View>
          </Animated.View>
        </View>

        <Spacer size="xxl" />
      </ScrollView>
    </View>
  );
}
