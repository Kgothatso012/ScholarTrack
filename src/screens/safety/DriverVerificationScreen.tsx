// Driver Verification Screen — Design System: Dark SA Transport
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacer } from '../../ui-plugin/components';

// ─── Design Tokens ───────────────────────────────────────────────────────────
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
  dim: '#2e4a6e',
  muted: '#4a6a8a',
  text: '#9bbdd4',
  white: '#e8f4ff',
};

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

interface Driver {
  id: number;
  name: string;
  photo: string;
  rating: number;
  trips: number;
  verified: { id: boolean; license: boolean; criminal: boolean; vehicle: boolean };
  status: 'active' | 'pending' | 'suspended';
  phone: string;
  vehicle: string;
  route: string;
  price: string;
}

export default function DriverVerificationScreen() {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const drivers: Driver[] = [
    { id: 1, name: 'Mr. John Molaba', photo: 'JM', rating: 4.8, trips: 245, verified: { id: true, license: true, criminal: true, vehicle: true }, status: 'active', phone: '078 123 4567', vehicle: 'Toyota Quantum (White)', route: 'Mamelodi Morning', price: 'R800/mo' },
    { id: 2, name: 'Mrs. Sarah Nkosi', photo: 'SN', rating: 4.9, trips: 189, verified: { id: true, license: true, criminal: true, vehicle: true }, status: 'active', phone: '082 987 6543', vehicle: 'Toyota Hiace (Silver)', route: 'Mamelodi Afternoon', price: 'R750/mo' },
    { id: 3, name: 'Mr. Mike Sithole', photo: 'MS', rating: 4.7, trips: 156, verified: { id: true, license: true, criminal: true, vehicle: false }, status: 'pending', phone: '071 234 5678', vehicle: 'Ford Transit (Blue)', route: 'Sunnyside', price: 'R700/mo' },
  ];

  const selectDriver = (driver: Driver) => { setSelectedDriver(selectedDriver?.id === driver.id ? null : driver); };

  const verifyDriver = (driverId: number) => {
    Alert.alert('Verify Driver', 'Mark this driver as verified?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Verify', onPress: () => Alert.alert('Success', 'Driver verified!') },
    ]);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return DT.green2;
      case 'pending': return DT.amber;
      case 'suspended': return DT.red;
      default: return DT.amber;
    }
  };

  const getStatusLabel = (status: string) => status.charAt(0).toUpperCase() + status.slice(1);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.amber, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: DT.white, marginBottom: 12, letterSpacing: 0.5 },
    driverCard: { ...glass, padding: 16, marginBottom: 10, borderColor: DT.border },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    driverAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(255,183,0,.3)' },
    driverInitial: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: DT.amber },
    driverInfo: { flex: 1, marginLeft: 12 },
    driverName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: DT.white },
    driverMeta: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 3 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    verifyList: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: DT.border },
    verifyItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 10 },
    verifyText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted, flex: 1 },
    verifyLabel: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.dim },
    verifyBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 4 },
    verifyBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '700', color: DT.bg, letterSpacing: 0.5 },
    driverExtra: { marginTop: 8, gap: 6 },
    extraRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    extraText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.dim },
    bottomPadding: { height: 50 },
  });

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Driver Verification</Text><Text style={s.ltSub}>Verify driver credentials</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={DT.amber} colors={[DT.amber]} />}
      >
        {/* Drivers List */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Pending Verification ({drivers.length})</Text>
          {drivers.map((driver) => (
            <TouchableOpacity key={driver.id} style={s.driverCard} onPress={() => selectDriver(driver)} activeOpacity={0.8}>
              <View style={s.cardTopRefraction} />
              <View style={s.driverRow}>
                <View style={[s.driverAvatar, { backgroundColor: 'rgba(255,183,0,.12)' }]}>
                  <Text style={s.driverInitial}>{driver.photo}</Text>
                </View>
                <View style={s.driverInfo}>
                  <Text style={s.driverName}>{driver.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, gap: 6 }}>
                    <Ionicons name="star" size={13} color={DT.amber} />
                    <Text style={s.driverMeta}>{driver.rating} ({driver.trips} trips)</Text>
                  </View>
                </View>
                <View style={[s.statusBadge, { backgroundColor: getStatusColor(driver.status) }]}>
                  <Text style={s.statusText}>{getStatusLabel(driver.status)}</Text>
                </View>
              </View>

              {selectedDriver?.id === driver.id && (
                <View style={s.verifyList}>
                  <View style={s.verifyItem}>
                    <Ionicons name={driver.verified.id ? 'checkmark-circle' : 'close-circle'} size={18} color={driver.verified.id ? DT.green2 : DT.red} />
                    <Text style={s.verifyText}>ID Verified</Text>
                    <Text style={s.verifyLabel}>{driver.verified.id ? 'Valid' : 'Missing'}</Text>
                  </View>
                  <View style={s.verifyItem}>
                    <Ionicons name={driver.verified.license ? 'checkmark-circle' : 'close-circle'} size={18} color={driver.verified.license ? DT.green2 : DT.red} />
                    <Text style={s.verifyText}>License Verified</Text>
                    <Text style={s.verifyLabel}>{driver.verified.license ? 'Valid' : 'Missing'}</Text>
                  </View>
                  <View style={s.verifyItem}>
                    <Ionicons name={driver.verified.criminal ? 'checkmark-circle' : 'close-circle'} size={18} color={driver.verified.criminal ? DT.green2 : DT.red} />
                    <Text style={s.verifyText}>Criminal Check</Text>
                    <Text style={s.verifyLabel}>{driver.verified.criminal ? 'Clear' : 'Pending'}</Text>
                  </View>
                  <View style={s.verifyItem}>
                    <Ionicons name={driver.verified.vehicle ? 'checkmark-circle' : 'close-circle'} size={18} color={driver.verified.vehicle ? DT.green2 : DT.red} />
                    <Text style={s.verifyText}>Vehicle Verified</Text>
                    <Text style={s.verifyLabel}>{driver.verified.vehicle ? 'Approved' : 'Pending'}</Text>
                  </View>

                  <View style={s.driverExtra}>
                    <View style={s.extraRow}>
                      <Ionicons name="car" size={12} color={DT.dim} />
                      <Text style={s.extraText}>{driver.vehicle}</Text>
                    </View>
                    <View style={s.extraRow}>
                      <Ionicons name="location" size={12} color={DT.dim} />
                      <Text style={s.extraText}>{driver.route} • {driver.price}</Text>
                    </View>
                    <View style={s.extraRow}>
                      <Ionicons name="call" size={12} color={DT.dim} />
                      <Text style={s.extraText}>{driver.phone}</Text>
                    </View>
                  </View>

                  {driver.status === 'pending' && (
                    <TouchableOpacity style={[s.verifyBtn, { backgroundColor: DT.green2, marginTop: 12 }]} onPress={() => verifyDriver(driver.id)}>
                      <Text style={s.verifyBtnText}>Verify Driver</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Spacer size="xl" />
        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
}