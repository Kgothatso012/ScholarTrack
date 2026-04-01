import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
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
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDriverLocations();
  }, []);

  const loadDriverLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('drivers')
        .select('id, full_name, vehicle_type, status')
        .limit(20);

      if (error) throw error;

      const formatted = (data || []).map((d: any) => ({
        driver_id: d.id,
        driver_name: d.full_name || 'Unknown',
        vehicle: d.vehicle_type || 'Vehicle',
        latitude: 0,
        longitude: 0,
        speed: 0,
        status: d.status || 'active',
        last_updated: new Date().toISOString()
      }));

      setDriverLocations(formatted);
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

  const styles = (colors: any) => StyleSheet.create({
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
    mapPlaceholder: { height: 200, backgroundColor: colors.card, borderRadius: borderRadius.lg, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
    driverCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
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
        <Text style={styles(colors).headerSubtext}>{driverLocations.length} drivers</Text>
      </View>

      {/* Map Placeholder */}
      <View style={styles(colors).section}>
        <Card variant="elevated" padding="large">
          <View style={styles(colors).mapPlaceholder}>
            <Ionicons name="map" size={48} color={colors.primary} />
            <Text style={{ ...typography.h4, color: colors.text, marginTop: spacing.sm }}>Live Map View</Text>
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>All vehicles tracked in real-time</Text>
          </View>
        </Card>
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
          <Text style={styles(colors).statNumber}>{driverLocations.length}</Text>
          <Text style={styles(colors).statLabel}>Total</Text>
        </View>
      </View>

      {/* Driver List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Active Drivers</Text>
        {driverLocations.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No drivers found</Text>
          </Card>
        ) : (
          driverLocations.map((driver) => (
            <Card key={driver.driver_id} variant="elevated" padding="medium">
              <TouchableOpacity onPress={() => setSelectedDriver(driver)}>
                <View style={styles(colors).driverCard}>
                  <View style={styles(colors).driverAvatar}>
                    <Text style={styles(colors).driverInitial}>
                      {(driver.driver_name || 'D').substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles(colors).driverInfo}>
                    <Text style={styles(colors).driverName}>{driver.driver_name}</Text>
                    <Text style={styles(colors).driverVehicle}>{driver.vehicle}</Text>
                  </View>
                  <Badge label={driver.status} variant={driver.status === 'active' ? 'success' : 'warning'} size="small" />
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}