// Fleet Tracking Screen — Design System: Dark SA Transport
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { supabase } from '../../lib/supabase';
import { Spacer, Badge } from '../../ui-plugin/components';

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
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const mapRef = useRef<MapView>(null);

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
          } catch (e) { console.error('Error loading tracking:', e); }
          return { driver_id: driver.id, driver_name: driver.full_name || 'Unknown', vehicle: driver.vehicle_type || 'Vehicle', latitude: 0, longitude: 0, speed: 0, status: driver.status || 'active', last_updated: new Date().toISOString() };
        })
      );

      setDriverLocations(driversWithLocations.filter(d => d.latitude !== 0 && d.longitude !== 0));
      const validDriver = driversWithLocations.find(d => d.latitude !== 0 && d.longitude !== 0);
      if (validDriver && mapRef.current) {
        mapRef.current.animateToRegion({ latitude: validDriver.latitude, longitude: validDriver.longitude, latitudeDelta: 0.05, longitudeDelta: 0.05 }, 500);
      }
    } catch (error) { console.error('Error loading fleet:', error); }
    finally { setLoading(false); }
  };

  const onRefresh = async () => { setRefreshing(true); await loadDriverLocations(); setRefreshing(false); };

  const activeDrivers = driverLocations.filter(d => d.status === 'active').length;
  const idleDrivers = driverLocations.filter(d => d.status === 'idle').length;
  const driversWithLocation = driverLocations.filter(d => d.latitude !== 0 && d.longitude !== 0);

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'DMMono_400Regular', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 6 },
    sbIcon: { fontSize: 14 },
    ltHeader: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.amber, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    mapContainer: { height: 260, marginHorizontal: 16, marginTop: 16, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: DT.border },
    map: { flex: 1 },
    mapOverlay: { position: 'absolute', top: 8, right: 8, flexDirection: 'row' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: DT.green2, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, gap: 4 },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: DT.bg },
    liveText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: DT.bg },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 10 },
    statCard: { flex: 1, ...glass, paddingVertical: 18, alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '700', color: DT.cyan },
    statLabel: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: DT.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 12 },
    selectedCard: { ...glass, padding: 16, marginBottom: 10 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    driverAvatar: { width: 46, height: 46, borderRadius: 23, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,229,255,.2)' },
    driverInitial: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: DT.cyan },
    driverInfo: { flex: 1, marginLeft: 12 },
    driverName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: DT.white },
    driverVehicle: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 2 },
    badge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 8 },
    badgeText: { fontFamily: 'Syne_700Bold', fontSize: 9, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    detailRow: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 12 },
    detailItem: { alignItems: 'center' },
    detailValue: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: DT.cyan },
    detailLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: DT.muted, marginTop: 2, textTransform: 'uppercase' },
    driverCard: { ...glass, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.muted, textAlign: 'center', paddingVertical: 30 },
    emptyCard: { ...glass, padding: 30, alignItems: 'center' },
    bottomPadding: { height: 50 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.green2} /><Ionicons name="battery-full" size={14} color={DT.white} /></View></View>
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
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.green2} /><Ionicons name="battery-full" size={14} color={DT.white} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Fleet Tracking</Text><Text style={s.ltSub}>{driversWithLocation.length} vehicles on map</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.cyan} colors={[DT.cyan]} />}
      >
        {/* Live Map */}
        <View style={s.mapContainer}>
          <MapView ref={mapRef} provider={PROVIDER_GOOGLE} style={s.map} initialRegion={DEFAULT_REGION} showsUserLocation={true} showsMyLocationButton={true}>
            {driversWithLocation.map((driver) => (
              <Marker
                key={driver.driver_id}
                coordinate={{ latitude: driver.latitude, longitude: driver.longitude }}
                title={driver.driver_name}
                description={`${driver.vehicle} • ${Math.round(driver.speed || 0)} km/h`}
                onPress={() => setSelectedDriver(driver)}
              >
                <View style={{
                  width: 40, height: 40, borderRadius: 20,
                  backgroundColor: driver.status === 'active' ? DT.green2 : DT.amber,
                  justifyContent: 'center', alignItems: 'center',
                  borderWidth: 3, borderColor: selectedDriver?.driver_id === driver.driver_id ? DT.cyan : DT.panel,
                }}>
                  <Ionicons name="bus" size={20} color={DT.bg} />
                </View>
              </Marker>
            ))}
          </MapView>
          <View style={s.mapOverlay}>
            <View style={s.liveBadge}>
              <View style={s.liveDot} />
              <Text style={s.liveText}>LIVE</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}><Text style={s.statNumber}>{activeDrivers}</Text><Text style={s.statLabel}>Active</Text></View>
          <View style={s.statCard}><Text style={s.statNumber}>{idleDrivers}</Text><Text style={s.statLabel}>Idle</Text></View>
          <View style={s.statCard}><Text style={s.statNumber}>{driversWithLocation.length}</Text><Text style={s.statLabel}>On Map</Text></View>
        </View>

        {/* Selected Driver Detail */}
        {selectedDriver && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Selected Driver</Text>
            <View style={s.selectedCard}>
              <View style={s.cardTopRefraction} />
              <View style={s.driverRow}>
                <View style={[s.driverAvatar, { backgroundColor: 'rgba(0,229,255,.12)' }]}>
                  <Text style={s.driverInitial}>{(selectedDriver.driver_name || 'D').substring(0, 1).toUpperCase()}</Text>
                </View>
                <View style={s.driverInfo}>
                  <Text style={s.driverName}>{selectedDriver.driver_name}</Text>
                  <Text style={s.driverVehicle}>{selectedDriver.vehicle}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: selectedDriver.status === 'active' ? DT.green2 : DT.amber }]}>
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
            </View>
          </View>
        )}

        {/* All Drivers */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>All Drivers ({driverLocations.length})</Text>
          {driverLocations.length === 0 ? (
            <View style={s.emptyCard}><Text style={s.emptyText}>No drivers found</Text></View>
          ) : (
            driverLocations.map((driver) => (
              <TouchableOpacity key={driver.driver_id} style={s.driverCard} onPress={() => setSelectedDriver(driver)} activeOpacity={0.7}>
                <View style={s.cardTopRefraction} />
                <View style={[s.driverAvatar, { backgroundColor: 'rgba(0,229,255,.08)', width: 40, height: 40, borderRadius: 20 }]}>
                  <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '800', color: DT.cyan }}>{(driver.driver_name || 'D').substring(0, 1).toUpperCase()}</Text>
                </View>
                <View style={s.driverInfo}>
                  <Text style={s.driverName}>{driver.driver_name}</Text>
                  <Text style={s.driverVehicle}>{driver.vehicle} • {driver.latitude !== 0 ? 'On map' : 'No location'}</Text>
                </View>
                <View style={[s.badge, { backgroundColor: driver.status === 'active' ? DT.green2 : DT.amber }]}>
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