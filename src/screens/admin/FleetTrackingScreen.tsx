import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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

export default function FleetTrackingScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [driverLocations, setDriverLocations] = useState<DriverLocation[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<DriverLocation | null>(null);
  const mapRef = useRef<MapView>(null);
  const { width } = Dimensions.get('window');

  const DEFAULT_REGION = {
    latitude: -25.7479,
    longitude: 28.2292,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  useEffect(() => {
    loadDriverLocations();
    subscribeToUpdates();

    return () => {
      supabase.removeAllChannels();
    };
  }, []);

  const subscribeToUpdates = () => {
    supabase
      .channel('fleet-tracking')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'driver_tracking',
        },
        async (payload) => {
          const newLoc = payload.new as any;
          // Update the driver location in our list
          setDriverLocations(prev =>
            prev.map(d => {
              if (d.driver_id === newLoc.driver_id) {
                return {
                  ...d,
                  latitude: newLoc.latitude,
                  longitude: newLoc.longitude,
                  speed: newLoc.speed || 0,
                  last_updated: newLoc.last_updated,
                };
              }
              return d;
            })
          );
        }
      )
      .subscribe();
  };

  const loadDriverLocations = async () => {
    try {
      // Get drivers with their latest tracking data
      const { data: drivers, error } = await supabase
        .from('drivers')
        .select('id, full_name, vehicle_type, status')
        .limit(50);

      if (error) throw error;

      // Get latest location for each driver from driver_tracking
      const driversWithLocations = await Promise.all(
        (drivers || []).map(async (driver: any) => {
          try {
            const { data: tracking } = await supabase
              .from('driver_tracking')
              .select('latitude, longitude, speed, last_updated, status')
              .eq('driver_id', driver.id)
              .order('last_updated', { ascending: false })
              .limit(1);

            if (tracking && tracking.length > 0) {
              return {
                driver_id: driver.id,
                driver_name: driver.full_name || 'Unknown',
                vehicle: driver.vehicle_type || 'Vehicle',
                latitude: tracking[0].latitude || 0,
                longitude: tracking[0].longitude || 0,
                speed: tracking[0].speed || 0,
                status: tracking[0].status || driver.status || 'active',
                last_updated: tracking[0].last_updated,
              };
            }
          } catch (e) {
            console.error('Error loading tracking for driver:', e);
          }
          return {
            driver_id: driver.id,
            driver_name: driver.full_name || 'Unknown',
            vehicle: driver.vehicle_type || 'Vehicle',
            latitude: 0,
            longitude: 0,
            speed: 0,
            status: driver.status || 'active',
            last_updated: new Date().toISOString(),
          };
        })
      );

      setDriverLocations(driversWithLocations.filter(d => d.latitude !== 0 && d.longitude !== 0));

      // Center map on first driver with valid location
      const validDriver = driversWithLocations.find(d => d.latitude !== 0 && d.longitude !== 0);
      if (validDriver && mapRef.current) {
        mapRef.current.animateToRegion({
          latitude: validDriver.latitude,
          longitude: validDriver.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }, 500);
      }
    } catch (error) {
      console.error('Error loading fleet:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDriverLocations();
    setRefreshing(false);
  };

  const activeDrivers = driverLocations.filter(d => d.status === 'active').length;
  const idleDrivers = driverLocations.filter(d => d.status === 'idle').length;

  const driversWithLocation = driverLocations.filter(d => d.latitude !== 0 && d.longitude !== 0);

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    statsRow: { flexDirection: 'row', backgroundColor: colors.card, margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, elevation: 2 },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { ...typography.h2, color: colors.accent },
    statLabel: { ...typography.labelSmall, color: colors.textSecondary },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    mapContainer: { height: 250, marginHorizontal: spacing.lg, marginBottom: spacing.md, borderRadius: borderRadius.lg, overflow: 'hidden' },
    map: { flex: 1 },
    mapOverlay: { position: 'absolute', top: spacing.sm, right: spacing.sm, flexDirection: 'row' },
    liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.success, paddingHorizontal: spacing.sm, paddingVertical: spacing.xxs, borderRadius: borderRadius.full },
    liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textInverse || '#fff', marginRight: 4 },
    liveText: { ...typography.caption, color: colors.textInverse || '#fff', fontSize: 10 },
    driverCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    driverCardSelected: { borderWidth: 2, borderColor: colors.primary },
    driverAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    driverInitial: { ...typography.h4, color: colors.accent },
    driverInfo: { flex: 1, marginLeft: spacing.md },
    driverName: { ...typography.label, color: colors.text },
    driverVehicle: { ...typography.bodySmall, color: colors.textSecondary },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Loading fleet...</Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles(colors).container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Fleet Tracking</Text>
        <Text style={styles(colors).headerSubtext}>{driversWithLocation.length} vehicles on map</Text>
      </View>

      {/* Live Map */}
      <View style={styles(colors).mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles(colors).map}
          initialRegion={DEFAULT_REGION}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {driversWithLocation.map((driver) => (
            <Marker
              key={driver.driver_id}
              coordinate={{
                latitude: driver.latitude,
                longitude: driver.longitude,
              }}
              title={driver.driver_name}
              description={`${driver.vehicle} • ${Math.round(driver.speed || 0)} km/h`}
              onPress={() => setSelectedDriver(driver)}
            >
              <View style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                backgroundColor: driver.status === 'active' ? colors.success : colors.warning,
                justifyContent: 'center',
                alignItems: 'center',
                borderWidth: 3,
                borderColor: selectedDriver?.driver_id === driver.driver_id ? colors.primary : '#fff',
              }}>
                <Ionicons name="bus" size={20} color="#fff" />
              </View>
            </Marker>
          ))}
        </MapView>
        {/* Live badge */}
        <View style={styles(colors).mapOverlay}>
          <View style={styles(colors).liveBadge}>
            <View style={styles(colors).liveDot} />
            <Text style={styles(colors).liveText}>LIVE</Text>
          </View>
        </View>
      </View>

      {/* Stats */}
      <View style={styles(colors).statsRow}>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{activeDrivers}</Text>
          <Text style={styles(colors).statLabel}>Active</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{idleDrivers}</Text>
          <Text style={styles(colors).statLabel}>Idle</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{driversWithLocation.length}</Text>
          <Text style={styles(colors).statLabel}>On Map</Text>
        </View>
      </View>

      {/* Selected Driver Detail */}
      {selectedDriver && (
        <View style={styles(colors).section}>
          <Card variant="elevated" padding="large">
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <View style={styles(colors).driverAvatar}>
                <Text style={styles(colors).driverInitial}>
                  {(selectedDriver.driver_name || 'D').substring(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles(colors).driverInfo}>
                <Text style={styles(colors).driverName}>{selectedDriver.driver_name}</Text>
                <Text style={styles(colors).driverVehicle}>{selectedDriver.vehicle}</Text>
              </View>
              <Badge label={selectedDriver.status} variant={selectedDriver.status === 'active' ? 'success' : 'warning'} size="small" />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ ...typography.h4, color: colors.primary }}>{Math.round(selectedDriver.speed || 0)}</Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>km/h</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ ...typography.h4, color: colors.primary }}>
                  {selectedDriver.latitude.toFixed(4)}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>Latitude</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <Text style={{ ...typography.h4, color: colors.primary }}>
                  {selectedDriver.longitude.toFixed(4)}
                </Text>
                <Text style={{ ...typography.caption, color: colors.textSecondary }}>Longitude</Text>
              </View>
            </View>
            <Spacer size="md" />
            <Button
              title="View Full Details"
              onPress={() => navigation?.navigate?.('ManageDrivers')}
              variant="primary"
              fullWidth
            />
          </Card>
        </View>
      )}

      {/* Driver List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>All Drivers ({driverLocations.length})</Text>
        {driverLocations.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No drivers found</Text>
          </Card>
        ) : (
          driverLocations.map((driver) => (
            <Card key={driver.driver_id} variant="elevated" padding="medium">
              <TouchableOpacity
                onPress={() => setSelectedDriver(driver)}
                style={[
                  styles(colors).driverCard,
                  selectedDriver?.driver_id === driver.driver_id && styles(colors).driverCardSelected
                ]}
              >
                <View style={styles(colors).driverAvatar}>
                  <Text style={styles(colors).driverInitial}>
                    {(driver.driver_name || 'D').substring(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles(colors).driverInfo}>
                  <Text style={styles(colors).driverName}>{driver.driver_name}</Text>
                  <Text style={styles(colors).driverVehicle}>
                    {driver.vehicle} • {driver.latitude !== 0 ? 'On map' : 'No location'}
                  </Text>
                </View>
                <Badge
                  label={driver.status}
                  variant={driver.status === 'active' ? 'success' : driver.latitude !== 0 ? 'warning' : 'error'}
                  size="small"
                />
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}