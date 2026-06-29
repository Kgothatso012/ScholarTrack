// Fleet Tracking Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import FleetOSMMap from '../../components/FleetOSMMap';
import { supabase } from '../../lib/supabase';
import { Spacer, Badge, Card } from '../../ui-plugin/components';
import { getTheme, cards } from '../../ui-plugin/theme';

const glass = cards.glassAmber;

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface DriverLocation {
  driver_id: string;
  driver_name: string;
  vehicle?: string;
  latitude: number;
  longitude: number;
  speed: number;
  status: string;
  last_updated: string;
}

interface DriverTrackingPayload {
  driver_id: string;
  latitude: number;
  longitude: number;
  speed?: number;
  last_updated?: string;
}

export default function FleetTrackingScreen({ navigation }: Props) {
  const { colors: C } = getTheme('dark');
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);

  const DEFAULT_REGION = { latitude: -25.7479, longitude: 28.2292, latitudeDelta: 0.1, longitudeDelta: 0.1 };

  useEffect(() => {
    loadDriverLocations();
    subscribeToUpdates();
    return () => { supabase.removeAllChannels(); };
  }, []);

  const subscribeToUpdates = () => {
    supabase
      .channel('fleet-tracking')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'driver_tracking' },
        (payload) => {
          const newLoc = payload.new as DriverTrackingPayload;
          setDriverLocations(prev => prev.map(d => {
            if (d.driver_id === newLoc.driver_id) {
              return { ...d, latitude: newLoc.latitude, longitude: newLoc.longitude, speed: newLoc.speed || 0, last_updated: newLoc.last_updated || d.last_updated };
            }
            return d;
          }));
        }
      )
      .subscribe();
  };

  const loadDriverLocations = async () => {
    try {
      const { data: drivers, error } = await supabase.from('drivers').select('id, full_name, vehicle_type, status').limit(50);
      if (error) throw error;

      interface DriverBasic { id: string; full_name: string; vehicle_type?: string; status: string };
      const driversWithLocations = await Promise.all(
        (drivers as DriverBasic[] || []).map(async (driver) => {
          try {
            const { data: tracking } = await supabase.from('driver_tracking').select('latitude, longitude, speed, last_updated, status').eq('driver_id', driver.id).order('last_updated', { ascending: false }).limit(1);
            if (tracking && tracking.length > 0) {
              return { driver_id: driver.id, driver_name: driver.full_name || 'Unknown', vehicle: driver.vehicle_type || 'Vehicle', latitude: tracking[0].latitude || 0, longitude: tracking[0].longitude || 0, speed: tracking[0].speed || 0, status: tracking[0].status || driver.status || 'active', last_updated: tracking[0].last_updated };
            }
          } catch (e) { /* silent */ }
          return { driver_id: driver.id, driver_name: driver.full_name || 'Unknown', vehicle: driver.vehicle_type || 'Vehicle', latitude: 0, longitude: 0, speed: 0, status: driver.status || 'active', last_updated: new Date().toISOString() };
        })
      );

      setDriverLocations(driversWithLocations.filter(d => d.latitude !== 0 && d.longitude !== 0));
    } catch (error) { /* silent */ }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadDriverLocations(); setRefreshing(false); };

  const activeDrivers = driverLocations.filter(d => d.status === 'active').length;
  const idleDrivers = driverLocations.filter(d => d.status === 'idle').length;
  const driversWithLocation = driverLocations.filter(d => d.latitude !== 0 && d.longitude !== 0);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'DMMono_400Regular', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 6 },
    sbIcon: { fontSize: 14 },
    ltHeader: { backgroundColor: C.backgroundAlt, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.primary, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    mapContainer: { height: 260, marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: C.border },
    map: { flex: 1 },
    mapOverlay: { position: 'absolute', top: 8, right: 8, flexDirection: 'row' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.success, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.background },
    liveText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: C.background },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 10 },
    statCard: { flex: 1, paddingVertical: 18, alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '700', color: C.cyan },
    statLabel: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: C.textMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 12 },
    selectedCard: { padding: 16, marginBottom: 10 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    driverAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,229,255,.2)' },
    driverInitial: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: C.cyan },
    driverInfo: { flex: 1, marginLeft: 12 },
    driverName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    driverVehicle: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    badgeText: { fontFamily: 'Syne_700Bold', fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12 },
    detailItem: { alignItems: 'center' },
    detailValue: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: C.cyan },
    detailLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted, marginTop: 2, textTransform: 'uppercase' },
    driverCard: { ...glass, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 30 },
    emptyCard: { padding: 30, alignItems: 'center' },
    bottomPadding: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.success} /><Ionicons name="battery-full" size={14} color={C.text} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Fleet Tracking</Text><Text style={s.ltSub}>Loading...</Text></View></View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={s.emptyText}>Loading fleet...</Text>
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
          <View><Text style={s.ltTitle}>Fleet Tracking</Text><Text style={s.ltSub}>{driversWithLocation.length} vehicles on map</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.cyan} colors={[C.cyan]} />}
      >
        {/* Live Map */}
        <View style={s.mapContainer}>
          <FleetOSMMap
            drivers={driversWithLocation}
            initialRegion={DEFAULT_REGION}
            onDriverPress={(id) => {
              const driver = driversWithLocation.find(d => d.driver_id === id);
              if (driver) setSelectedDriver(driver);
            }}
          />
          <View style={s.mapOverlay}>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <Card variant='glassAmber' style={s.statCard}><Text style={s.statNumber}>{activeDrivers}</Text><Text style={s.statLabel}>Active</Text></Card>
          <Card variant='glassAmber' style={s.statCard}><Text style={s.statNumber}>{idleDrivers}</Text><Text style={s.statLabel}>Idle</Text></Card>
          <Card variant='glassAmber' style={s.statCard}><Text style={s.statNumber}>{driversWithLocation.length}</Text><Text style={s.statLabel}>On Map</Text></Card>
        </View>

        {/* Selected Driver Detail */}
        {selectedDriver && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Selected Driver</Text>
            <Card variant='glassAmber' style={s.selectedCard}>
              <View style={s.cardTopRefraction} />
              <View style={s.driverRow}>
                <View style={[s.driverAvatar, { backgroundColor: 'rgba(0,229,255,.12)' }]}>
                  <Text style={s.driverInitial}>{(selectedDriver.driver_name || 'D').substring(0, 1).toUpperCase()}</Text>
                </View>
                <View style={s.driverInfo}>
                  <Text style={s.driverName}>{selectedDriver.driver_name}</Text>
                  <Text style={s.driverVehicle}>{selectedDriver.vehicle}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: selectedDriver.status === 'active' ? C.success : C.primary }]}>
                  <Text style={s.badgeText}>{selectedDriver.status}</Text>
                </View>
              </View>
              <View style={s.detailRow}>
                <View style={s.detailItem}>
                  <Text style={s.detailValue}>{Math.round(selectedDriver.speed || 0)}</Text>
                  <Text style={s.detailLabel}>km/h</Text>
                </View>
                <View style={s.detailItem}>
                  <Text style={s.detailValue}>{selectedDriver.latitude.toFixed(4)}</Text>
                  <Text style={s.detailLabel}>Latitude</Text>
                </View>
                <View style={s.detailItem}>
                  <Text style={s.detailValue}>{selectedDriver.longitude.toFixed(4)}</Text>
                  <Text style={s.detailLabel}>Longitude</Text>
                </View>
              </View>
            </Card>
          </View>
        )}

        {/* All Drivers */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>All Drivers ({driverLocations.length})</Text>
          {driverLocations.length === 0 ? (
            <Card variant='glassAmber' style={s.emptyCard}><Text style={s.emptyText}>No drivers found</Text></Card>
          ) : (
            driverLocations.map((driver) => (
              <TouchableOpacity key={driver.driver_id} style={s.driverCard} onPress={() => setSelectedDriver(driver)} activeOpacity={0.7}>
                <View style={s.cardTopRefraction} />
                <View style={[s.driverAvatar, { backgroundColor: 'rgba(0,229,255,.08)', width: 40, height: 40, borderRadius: 20 }]}>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '800', color: C.cyan }}>{(driver.driver_name || 'D').substring(0, 1).toUpperCase()}</Text>
                </View>
                <View style={s.driverInfo}>
                  <Text style={s.driverName}>{driver.driver_name}</Text>
                  <Text style={s.driverVehicle}>{driver.vehicle} • {driver.latitude !== 0 ? 'On map' : 'No location'}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: driver.status === 'active' ? C.success : C.primary }]}>
                  <Text style={s.badgeText}>{driver.status}</Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <Spacer size="xl" />
        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
}