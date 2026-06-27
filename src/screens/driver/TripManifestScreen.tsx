// Trip Manifest Screen — Design System: Dark SA Transport
// Required for South African Scholar Transport - Track children on each trip

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { getTheme, cards } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

const glass = cards.glassAmber;

interface Child {
  id: string;
  name: string;
  grade: string;
  pickupLocation: string;
  dropoffLocation: string;
  parentContact: string;
  onboard: boolean;
  status: 'waiting' | 'onboard' | 'dropped';
}

interface TripManifest {
  id: string;
  date: string;
  route: string;
  driver: string;
  children: Child[];
  status: 'pending' | 'in_progress' | 'completed';
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
  setScreen?: (s: string) => void;
}

export default function TripManifestScreen({ navigation, setScreen }: Props) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [manifest, setManifest] = useState<TripManifest>({
    id: 'TRIP-001',
    date: new Date().toLocaleDateString(),
    route: 'Route 7 - Pretoria East',
    driver: 'John Driver',
    status: 'in_progress',
    children: [
      { id: '1', name: 'Emma Johnson', grade: 'Grade 3', pickupLocation: '123 Maple Street', dropoffLocation: 'Pretoria East Primary', parentContact: 'Mom: 082 123 4567', onboard: true, status: 'onboard' },
      { id: '2', name: 'Liam Smith', grade: 'Grade 5', pickupLocation: '45 Oak Avenue', dropoffLocation: 'Pretoria East Primary', parentContact: 'Dad: 083 234 5678', onboard: true, status: 'onboard' },
      { id: '3', name: 'Sophia Williams', grade: 'Grade 1', pickupLocation: '78 Pine Road', dropoffLocation: 'Pretoria East Primary', parentContact: 'Mom: 084 345 6789', onboard: false, status: 'waiting' },
      { id: '4', name: 'Noah Brown', grade: 'Grade 4', pickupLocation: '12 Cedar Lane', dropoffLocation: 'Pretoria East Primary', parentContact: 'Dad: 085 456 7890', onboard: false, status: 'waiting' },
      { id: '5', name: 'Olivia Davis', grade: 'Grade 2', pickupLocation: '34 Birch Street', dropoffLocation: 'Pretoria East Primary', parentContact: 'Mom: 086 567 8901', onboard: true, status: 'dropped' },
    ],
  });

  const toggleOnboard = (childId: string) => {
    setManifest({
      ...manifest,
      children: manifest.children.map(c => {
        if (c.id === childId) {
          const newOnboard = !c.onboard;
          return { ...c, onboard: newOnboard, status: newOnboard ? 'onboard' : 'waiting' };
        }
        return c;
      }),
    });
  };

  const completeTrip = () => {
    const onboardCount = manifest.children.filter(c => c.onboard).length;
    if (onboardCount === 0) {
      Alert.alert('Error', 'No children onboard. Cannot complete trip.');
      return;
    }
    Alert.alert('Complete Trip', `Trip completed with ${onboardCount} children.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Complete', onPress: () => setManifest({ ...manifest, status: 'completed' }) },
    ]);
  };

  const onboardCount = manifest.children.filter(c => c.onboard).length;
  const waitingCount = manifest.children.filter(c => !c.onboard && c.status === 'waiting').length;

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
    infoCard: { marginHorizontal: 16, marginTop: 16, ...glass, padding: 16 },
    infoRow: { flexDirection: 'row', marginBottom: 10 },
    infoItem: { flex: 1, alignItems: 'center' },
    infoLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    infoValue: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.text, marginTop: 2 },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 10 },
    statCard: { flex: 1, ...glass, paddingVertical: 16, alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 28, fontWeight: '700', color: C.primary },
    statLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 4, letterSpacing: 0.5 },
    sectionSubtitle: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginBottom: 12 },
    childCard: { ...glass, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    childTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.1)' },
    childAvatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(217,119,6,.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(217,119,6,.2)' },
    childInitial: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: C.primary },
    childInfo: { flex: 1, marginLeft: 12 },
    childHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    childName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff' },
    childGrade: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    childLocation: { flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 4 },
    locationText: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted },
    parentContact: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted, marginTop: 3, fontWeight: '600' },
    emergencyBox: { marginHorizontal: 16, marginBottom: 16, ...glass, padding: 14, borderColor: 'rgba(248,113,113,.3)' },
    emergencyHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
    emergencyTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.error },
    emergencyText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, lineHeight: 18 },
    completeBtn: { marginHorizontal: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: C.success, gap: 10 },
    completeBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.background, letterSpacing: 0.5 },
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
          <View><Text style={s.ltTitle}>Trip Manifest</Text><Text style={s.ltSub}>{manifest.route}</Text></View>
          <TouchableOpacity onPress={() => Alert.alert('SOS', 'Emergency services...')} style={{ backgroundColor: C.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="warning" size={14} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={C.cyan} colors={[C.cyan]} />
        }
      >
        {/* Trip Info */}
        <View style={s.infoCard}>
          <View style={s.infoRow}>
            <View style={s.infoItem}>
              <Ionicons name="calendar" size={18} color={C.cyan} />
              <Text style={s.infoLabel}>Date</Text>
              <Text style={s.infoValue}>{manifest.date}</Text>
            </View>
            <View style={s.infoItem}>
              <Ionicons name="bus" size={18} color={C.cyan} />
              <Text style={s.infoLabel}>Trip ID</Text>
              <Text style={s.infoValue}>{manifest.id}</Text>
            </View>
          </View>
          <View style={s.infoRow}>
            <View style={s.infoItem}>
              <Ionicons name="person" size={18} color={C.primary} />
              <Text style={s.infoLabel}>Driver</Text>
              <Text style={s.infoValue}>{manifest.driver}</Text>
            </View>
            <View style={s.infoItem}>
              <Ionicons name="flag" size={18} color={C.primary} />
              <Text style={s.infoLabel}>Status</Text>
              <Text style={[s.infoValue, { color: manifest.status === 'completed' ? C.success : C.warning }]}>
                {manifest.status === 'in_progress' ? 'In Progress' : 'Completed'}
              </Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}><Text style={s.statNumber}>{onboardCount}</Text><Text style={s.statLabel}>Onboard</Text></View>
          <View style={s.statCard}><Text style={s.statNumber}>{waitingCount}</Text><Text style={s.statLabel}>Waiting</Text></View>
          <View style={s.statCard}><Text style={s.statNumber}>{manifest.children.length}</Text><Text style={s.statLabel}>Total</Text></View>
        </View>

        {/* Children List */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Passenger Manifest</Text>
          <Text style={s.sectionSubtitle}>Tap to mark onboard/departed</Text>
          {manifest.children.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[s.childCard, child.onboard && { borderColor: 'rgba(52,211,153,.3)', borderWidth: 1 }]}
              onPress={() => toggleOnboard(child.id)}
              activeOpacity={0.7}
            >
              <View style={s.childTopRefraction} />
              <View style={s.childAvatar}>
                <Text style={s.childInitial}>{child.name[0]}</Text>
              </View>
              <View style={s.childInfo}>
                <View style={s.childHeader}>
                  <Text style={s.childName}>{child.name}</Text>
                  <View style={[s.statusBadge, { backgroundColor: child.onboard ? C.success : C.warning }]}>
                    <Text style={s.statusText}>{child.onboard ? 'Onboard' : 'Waiting'}</Text>
                  </View>
                </View>
                <Text style={s.childGrade}>{child.grade}</Text>
                <View style={s.childLocation}>
                  <Ionicons name="location" size={11} color={C.textMuted} />
                  <Text style={s.locationText}>Pickup: {child.pickupLocation}</Text>
                </View>
                <View style={s.childLocation}>
                  <Ionicons name="flag" size={11} color={C.textMuted} />
                  <Text style={s.locationText}>Dropoff: {child.dropoffLocation}</Text>
                </View>
                <Text style={s.parentContact}>{child.parentContact}</Text>
              </View>
              <Ionicons name={child.onboard ? 'checkbox' : 'square-outline'} size={26} color={child.onboard ? C.success : C.textMuted} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Emergency Contacts */}
        <View style={s.emergencyBox}>
          <View style={s.emergencyHeader}>
            <Ionicons name="warning" size={18} color={C.error} />
            <Text style={s.emergencyTitle}>Emergency Contacts</Text>
          </View>
          <Text style={s.emergencyText}>Police: 10111  |  Ambulance: 10177  |  Scholar Transport Hotline: 0800 123 456</Text>
        </View>

        {/* Complete Button */}
        {manifest.status !== 'completed' && (
          <TouchableOpacity style={s.completeBtn} onPress={completeTrip}>
            <Ionicons name="checkmark-done-circle" size={22} color={C.background} />
            <Text style={s.completeBtnText}>Complete Trip</Text>
          </TouchableOpacity>
        )}

        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
}