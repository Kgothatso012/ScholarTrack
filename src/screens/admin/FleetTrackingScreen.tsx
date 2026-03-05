import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

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

  useEffect(() => {
    loadDriverLocations();
    const interval = setInterval(loadDriverLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDriverLocations = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_tracking')
        .select(`
          *,
          driver:drivers(full_name, phone, vehicle_type)
        `)
        .eq('status', 'active')
        .order('last_updated', { ascending: false })
        .limit(50);

      if (error) throw error;

      const formatted = (data || []).map((d: any) => ({
        driver_id: d.driver_id,
        driver_name: d.driver?.full_name || 'Unknown',
        vehicle: d.driver?.vehicle_type || 'Vehicle',
        latitude: d.latitude,
        longitude: d.longitude,
        speed: d.speed || 0,
        status: d.status,
        last_updated: d.last_updated
      }));

      setDriverLocations(formatted);
    } catch (error) {
      console.error('Error loading drivers:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDriverLocations();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#007749';
      case 'idle': return '#FFB81C';
      case 'offline': return '#E91E63';
      default: return '#666';
    }
  };

  const getTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    return `${hours}h ago`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Fleet Tracking</Text>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Stats Bar */}
      <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: colors.primary }]}>{driverLocations.length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#007749' }]}>{driverLocations.filter(d => d.speed > 0).length}</Text>
          <Text style={styles.statLabel}>Moving</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statNumber, { color: '#FFB81C' }]}>{driverLocations.filter(d => d.speed === 0).length}</Text>
          <Text style={styles.statLabel}>Stationary</Text>
        </View>
      </View>

      {/* Map Placeholder */}
      <View style={[styles.mapPlaceholder, { backgroundColor: colors.card }]}>
        <Ionicons name="map" size={64} color={colors.textSecondary} />
        <Text style={[styles.mapText, { color: colors.textSecondary }]}>
          Live Map View
        </Text>
        <Text style={[styles.mapSubtext, { color: colors.textSecondary }]}>
          {driverLocations.length} drivers on road
        </Text>
      </View>

      {/* Driver List */}
      <ScrollView
        style={styles.driverList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
        }
      >
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Active Drivers</Text>

        {driverLocations.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No active drivers
            </Text>
          </View>
        ) : (
          driverLocations.map((driver) => (
            <TouchableOpacity
              key={driver.driver_id}
              style={[styles.driverCard, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setSelectedDriver(driver)}
            >
              <View style={styles.driverHeader}>
                <View style={[styles.driverAvatar, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="person" size={24} color={colors.primary} />
                </View>
                <View style={styles.driverInfo}>
                  <Text style={[styles.driverName, { color: colors.text }]}>{driver.driver_name}</Text>
                  <Text style={[styles.driverVehicle, { color: colors.textSecondary }]}>
                    {driver.vehicle}
                  </Text>
                </View>
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(driver.status) }]} />
              </View>

              <View style={styles.driverStats}>
                <View style={styles.statRow}>
                  <Ionicons name="speedometer" size={16} color={colors.textSecondary} />
                  <Text style={[styles.statText, { color: colors.textSecondary }]}>
                    {driver.speed} km/h
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Ionicons name="time" size={16} color={colors.textSecondary} />
                  <Text style={[styles.statText, { color: colors.textSecondary }]}>
                    {getTimeAgo(driver.last_updated)}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Ionicons name="location" size={16} color={colors.textSecondary} />
                  <Text style={[styles.statText, { color: colors.textSecondary }]}>
                    {driver.latitude.toFixed(4)}, {driver.longitude.toFixed(4)}
                  </Text>
                </View>
              </View>

              {selectedDriver?.driver_id === driver.driver_id && (
                <View style={[styles.actions, { borderTopColor: colors.border }]}>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]}>
                    <Ionicons name="call" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Call</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#007749' }]}>
                    <Ionicons name="chatbubbles" size={18} color="#fff" />
                    <Text style={styles.actionBtnText}>Message</Text>
                  </TouchableOpacity>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15 },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  refreshBtn: { padding: 5 },
  statsBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, marginHorizontal: 15, marginTop: 10, borderRadius: 12 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 2 },
  mapPlaceholder: { margin: 15, padding: 40, borderRadius: 16, alignItems: 'center' },
  mapText: { fontSize: 18, fontWeight: '600', marginTop: 15 },
  mapSubtext: { fontSize: 14, marginTop: 5 },
  driverList: { flex: 1, paddingHorizontal: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  emptyCard: { padding: 40, borderRadius: 12, alignItems: 'center' },
  emptyText: { fontSize: 14, marginTop: 10 },
  driverCard: { borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1 },
  driverHeader: { flexDirection: 'row', alignItems: 'center' },
  driverAvatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverName: { fontSize: 16, fontWeight: '600' },
  driverVehicle: { fontSize: 12, marginTop: 2 },
  statusDot: { width: 12, height: 12, borderRadius: 6 },
  driverStats: { flexDirection: 'row', marginTop: 12, gap: 20 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 12 },
  actions: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8, gap: 6 },
  actionBtnText: { color: '#fff', fontWeight: '600', fontSize: 12 }
});
