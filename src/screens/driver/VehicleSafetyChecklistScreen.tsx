// Vehicle Safety Checklist Screen — Design System: Dark SA Transport
// Daily inspection required by South African Transport Regulations

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

interface CheckItem {
  id: string;
  category: string;
  name: string;
  icon: string;
  checked: boolean;
  required: boolean;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
  setScreen?: (s: string) => void;
}

export default function VehicleSafetyChecklistScreen({ navigation, setScreen }: Props) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [checks, setChecks] = useState<CheckItem[]>([
    // Lights & Signals
    { id: 'headlights', category: 'Lights', name: 'Headlights (high/low beam)', icon: 'flashlight', checked: false, required: true },
    { id: 'tail_lights', category: 'Lights', name: 'Tail lights & brake lights', icon: 'bulb', checked: false, required: true },
    { id: 'turn_signals', category: 'Lights', name: 'Turn signals (front & rear)', icon: 'git-branch', checked: false, required: true },
    { id: 'hazard_lights', category: 'Lights', name: 'Hazard lights', icon: 'warning', checked: false, required: true },

    // Brakes
    { id: 'service_brake', category: 'Brakes', name: 'Service brake (foot brake)', icon: 'footsteps', checked: false, required: true },
    { id: 'parking_brake', category: 'Brakes', name: 'Parking brake (hand brake)', icon: 'hand-left', checked: false, required: true },
    { id: 'brake_lights', category: 'Brakes', name: 'Brake light switch', icon: 'flash', checked: false, required: true },

    // Tires & Wheels
    { id: 'tire_pressure', category: 'Tires', name: 'Tire pressure (all tires)', icon: 'disc', checked: false, required: true },
    { id: 'tire_tread', category: 'Tires', name: 'Tire tread depth (min 1mm)', icon: 'ellipse', checked: false, required: true },
    { id: 'spare_tire', category: 'Tires', name: 'Spare tire & jack', icon: 'construct', checked: false, required: true },

    // Emergency Equipment
    { id: 'first_aid', category: 'Emergency', name: 'First aid kit (complete)', icon: 'medkit', checked: false, required: true },
    { id: 'fire_extinguisher', category: 'Emergency', name: 'Fire extinguisher (valid)', icon: 'flame', checked: false, required: true },
    { id: 'warning_triangle', category: 'Emergency', name: 'Warning triangle', icon: 'warning', checked: false, required: true },
    { id: 'reflective_vest', category: 'Emergency', name: 'Reflective vest', icon: 'shirt', checked: false, required: true },

    // Vehicle Condition
    { id: 'mirrors', category: 'Condition', name: 'All mirrors (clean & secure)', icon: 'scan', checked: false, required: true },
    { id: 'windshield', category: 'Condition', name: 'Windshield (no cracks/chips)', icon: 'glasses', checked: false, required: true },
    { id: 'wipers', category: 'Condition', name: 'Wipers (good condition)', icon: 'water', checked: false, required: true },
    { id: 'horn', category: 'Condition', name: 'Horn (working)', icon: 'megaphone', checked: false, required: true },

    // Safety Features
    { id: 'speed_limiter', category: 'Safety', name: 'Speed limiter (80km/h)', icon: 'speedometer', checked: false, required: true },
    { id: 'door_locks', category: 'Safety', name: 'Door locks (working)', icon: 'lock-closed', checked: false, required: true },
    { id: 'emergency_exit', category: 'Safety', name: 'Emergency exit (clear)', icon: 'exit', checked: false, required: true },
    { id: 'seatbelts', category: 'Safety', name: 'Seatbelts (all working)', icon: 'accessibility', checked: false, required: true },
  ]);

  const toggleCheck = (id: string) => {
    setChecks(checks.map(c => c.id === id ? { ...c, checked: !c.checked } : c));
  };

  const resetChecks = () => {
    setChecks(checks.map(c => ({ ...c, checked: false })));
  };

  const submitChecklist = () => {
    const checkedCount = checks.filter(c => c.checked).length;
    const requiredCount = checks.filter(c => c.required).length;
    const allRequired = checks.filter(c => c.required).every(c => c.checked);

    if (allRequired) {
      Alert.alert(
        'Checklist Complete',
        `All ${requiredCount} required items checked. You may start your route.`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Incomplete',
        `Please complete all required checks (${checkedCount}/${requiredCount} done).`,
        [{ text: 'OK' }]
      );
    }
  };

  const categories = [...new Set(checks.map(c => c.category))];
  const checkedCount = checks.filter(c => c.checked).length;
  const requiredCount = checks.filter(c => c.required).length;
  const progress = Math.round((checkedCount / requiredCount) * 100);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.cyan, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(34,211,238,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    ltBack: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
    progressCard: { marginHorizontal: 16, marginTop: 16, ...glass, padding: 16 },
    progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: C.border },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: C.success },
    progressText: { fontFamily: 'Syne_700Bold', fontSize: 12, marginTop: 8, textAlign: 'center', color: C.textMuted },
    categorySection: { marginTop: 16, paddingHorizontal: 16 },
    categoryTitle: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.primary, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
    checkItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, marginBottom: 8 },
    checkItemChecked: { borderColor: 'rgba(52,211,153,.3)', backgroundColor: 'rgba(52,211,153,.06)' },
    itemIcon: { marginHorizontal: 10 },
    itemText: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 14, color: C.text },
    itemTextChecked: { color: C.success, fontWeight: '600' },
    buttonContainer: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginTop: 8, marginBottom: 16 },
    resetBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.card, paddingVertical: 15, borderRadius: 14, borderWidth: 1, borderColor: C.border, gap: 8 },
    resetBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.textMuted },
    submitBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: C.success, paddingVertical: 15, borderRadius: 14, gap: 8 },
    submitBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '700', color: C.background, letterSpacing: 1, textTransform: 'uppercase' },
    noticeBox: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 24, padding: 14, borderRadius: 14, backgroundColor: 'rgba(34,211,238,.05)', borderWidth: 1, borderColor: 'rgba(34,211,238,.15)', alignItems: 'flex-start', gap: 10 },
    noticeText: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, lineHeight: 17 },
    bottomPadding: { height: 50 },
  });

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Vehicle Safety</Text><Text style={s.ltSub}>Pre-Trip Inspection</Text></View>
          <TouchableOpacity onPress={() => Alert.alert('Emergency SOS', 'Calling emergency services...')} style={{ backgroundColor: C.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="warning" size={14} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => setRefreshing(true)}
            tintColor={C.cyan}
            colors={[C.cyan]}
          />
        }
      >
        {/* Progress */}
        <View style={s.progressCard}>
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={s.progressText}>{checkedCount}/{requiredCount} Required Checks ({progress}%)</Text>
        </View>

        {/* Categories */}
        {categories.map(category => (
          <View key={category} style={s.categorySection}>
            <Text style={s.categoryTitle}>{category}</Text>
            {checks.filter(c => c.category === category).map(item => (
              <TouchableOpacity
                key={item.id}
                style={[s.checkItem, item.checked && s.checkItemChecked]}
                onPress={() => toggleCheck(item.id)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={item.checked ? 'checkbox' : 'square-outline'}
                  size={24}
                  color={item.checked ? C.success : C.textMuted}
                />
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={20} color={item.checked ? C.success : C.textMuted} style={s.itemIcon} />
                <Text style={[s.itemText, item.checked && s.itemTextChecked]}>
                  {item.name}
                </Text>
                {item.required && (
                  <Text style={{ fontSize: 10, color: C.error, fontWeight: '600', marginLeft: 4 }}>REQ</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Buttons */}
        <View style={s.buttonContainer}>
          <TouchableOpacity style={s.resetBtn} onPress={resetChecks}>
            <Ionicons name="refresh" size={20} color={C.textMuted} />
            <Text style={s.resetBtnText}>Reset All</Text>
          </TouchableOpacity>

          <TouchableOpacity style={s.submitBtn} onPress={submitChecklist}>
            <Ionicons name="checkmark-circle" size={20} color={C.background} />
            <Text style={s.submitBtnText}>Submit Checklist</Text>
          </TouchableOpacity>
        </View>

        {/* Legal Notice */}
        <View style={s.noticeBox}>
          <Ionicons name="information-circle" size={18} color={C.cyan} />
          <Text style={s.noticeText}>
            This checklist complies with South African National Road Traffic Act (Act 93 of 1996) and Scholar Transport Regulations. Driver must complete before each trip.
          </Text>
        </View>

        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
}