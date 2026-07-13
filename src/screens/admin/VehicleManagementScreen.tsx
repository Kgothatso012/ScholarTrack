// Vehicle Management Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Spacer, Card } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S, borderRadius: BR } = getTheme('dark');

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface Vehicle {
  id: string;
  driver_id: string;
  registration_number: string;
  make: string;
  model: string;
  year: number;
  vehicle_type: string;
  capacity: number;
  status: string;
}

export default function VehicleManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from('vehicles').select('*').order('registration_number', { ascending: true });
      if (error) throw error;
      setVehicles(data || []);
    } catch (error) { /* silent */ }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadVehicles(); setRefreshing(false); };
  const handleAddVehicle = () => { Alert.alert('Success', 'Vehicle added'); setShowAddModal(false); };

  const activeVehicles = vehicles.filter(v => v.status === 'active').length;
  const totalCapacity = vehicles.reduce((sum, v) => sum + (v.capacity || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return C.success;
      case 'maintenance': return C.warning;
      case 'inactive': return C.textMuted;
      default: return C.textMuted;
    }
  };

  const now = new Date();
  

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },




    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.warning, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(245,158,11,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: C.textMuted, marginTop: 4 },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, gap: 10 },
    statCard: { flex: 1, paddingVertical: 18, alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '700', color: C.accent },
    statLabel: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    addBtn: { marginHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, backgroundColor: C.primary, gap: 8 },
    addBtnText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: 0.5 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 12 },
    vehicleCard: { padding: 16, marginBottom: 10 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(245,158,11,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(245,158,11,.6)' },
    vehicleHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    vehiclePlate: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: C.text },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    vehicleDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    vehicleDetail: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 40 },
    emptyCard: { padding: 30, alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
    modalContent: { padding: 24, borderRadius: 24 },
    modalTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 20 },
    modalBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
    modalBtnText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.background },
    modalBtnSecondary: { paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    modalBtnSecondaryText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: C.textMuted },
    bottomPadding: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Vehicles</Text><Text style={s.ltSub}>Loading...</Text></View></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={s.emptyText}>Loading vehicles...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Vehicles</Text><Text style={s.ltSub}>{vehicles.length} vehicles registered</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />}
      >
        {/* Stats */}
        <View style={s.statsRow}>
          <Card variant='glassAmber' style={s.statCard}><Text style={s.statNumber}>{activeVehicles}</Text><Text style={s.statLabel}>Active</Text></Card>
          <Card variant='glassAmber' style={s.statCard}><Text style={s.statNumber}>{vehicles.length}</Text><Text style={s.statLabel}>Total</Text></Card>
          <Card variant='glassAmber' style={s.statCard}><Text style={s.statNumber}>{totalCapacity}</Text><Text style={s.statLabel}>Capacity</Text></Card>
        </View>

        {/* Add Button */}
        <TouchableOpacity style={s.addBtn} onPress={() => setShowAddModal(true)}>
          <Ionicons name="add" size={18} color={C.text} />
          <Text style={s.addBtnText}>Add Vehicle</Text>
        </TouchableOpacity>

        {/* Vehicles List */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>All Vehicles</Text>
          {vehicles.length === 0 ? (
            <Card variant='glassAmber' style={s.emptyCard}><Text style={s.emptyText}>No vehicles found</Text></Card>
          ) : (
            vehicles.map((vehicle) => {
              const statusColor = getStatusColor(vehicle.status);
              return (
                <Card key={vehicle.id} variant='glassAmber' style={s.vehicleCard}>
                  <View style={s.cardTopRefraction} />
                  <View style={s.vehicleHeader}>
                    <Text style={s.vehiclePlate}>{vehicle.registration_number}</Text>
                    <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={s.statusText}>{vehicle.status || 'active'}</Text>
                    </View>
                  </View>
                  <View style={s.vehicleDetails}>
                    <Text style={s.vehicleDetail}>{vehicle.make} {vehicle.model}</Text>
                    <Text style={s.vehicleDetail}>Year: {vehicle.year}</Text>
                    <Text style={s.vehicleDetail}>Capacity: {vehicle.capacity} seats</Text>
                    <Text style={s.vehicleDetail}>{vehicle.vehicle_type}</Text>
                  </View>
                </Card>
              );
            })
          )}
        </View>

        <Spacer size="xl" />
        <View style={s.bottomPadding} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <Card variant='glassAmber' style={s.modalContent}>
            <Text style={s.modalTitle}>Add Vehicle</Text>
            <TouchableOpacity style={[s.modalBtn, { backgroundColor: C.primary }]} onPress={handleAddVehicle}>
              <Text style={s.modalBtnText}>Save Vehicle</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalBtnSecondary} onPress={() => setShowAddModal(false)}>
              <Text style={s.modalBtnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
          </Card>
        </View>
      </Modal>
    </View>
  );
}
