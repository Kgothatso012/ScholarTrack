import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

interface Trip {
  id: string;
  scheduled_time: string;
  status: string;
  route_name: string;
  child_id: string;
}

export default function TripHistoryScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [trips, setTrips] = useState<any[]>([]);

  const loadTrips = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get children for this parent
      const { data: children } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', user.id);

      const childIds = children?.map((c: any) => c.id) || [];

      if (childIds.length === 0) {
        setTrips([]);
        return;
      }

      // Get trips for these children
      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .in('child_id', childIds)
        .order('scheduled_time', { ascending: false })
        .limit(50);

      setTrips(tripsData || []);
    } catch (error) {
      console.error('Error loading trips:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'delayed': return colors.warning;
      case 'in_progress': return colors.primary;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'delayed': return 'time';
      case 'in_progress': return 'bus';
      default: return 'help-circle';
    }
  };

  const filteredTrips = filter === 'all' ? trips : trips.filter((t: any) => t.status === filter);

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textInverse },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
    loadingText: { color: colors.textSecondary, marginTop: 10 },
    filters: { flexDirection: 'row', padding: 15, backgroundColor: colors.card, marginHorizontal: 15, marginTop: -10, borderRadius: 10, elevation: 3 },
    filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, marginHorizontal: 3 },
    filterActive: { backgroundColor: colors.primary },
    filterText: { color: colors.textSecondary, fontWeight: '600' },
    filterTextActive: { color: colors.textInverse },
    section: { padding: 15 },
    tripCard: { backgroundColor: colors.card, borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    tripDate: { fontSize: 12, color: colors.textSecondary },
    tripStatus: { flexDirection: 'row', alignItems: 'center' },
    tripStatusIcon: { marginRight: 4 },
    tripRoute: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    tripDetails: { flexDirection: 'row', justifyContent: 'space-between' },
    tripDetail: { flexDirection: 'row', alignItems: 'center' },
    tripDetailText: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: colors.textSecondary, marginTop: 10 },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading trips...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip History</Text>
      </View>

      <View style={styles.filters}>
        {(['all', 'completed', 'cancelled'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No trips found</Text>
          </View>
        ) : (
          filteredTrips.map((trip: any) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripDate}>
                  {new Date(trip.scheduled_time).toLocaleDateString()}
                </Text>
                <View style={styles.tripStatus}>
                  <Ionicons name={getStatusIcon(trip.status) as any} size={16} color={getStatusColor(trip.status)} style={styles.tripStatusIcon} />
                  <Text style={{ color: getStatusColor(trip.status), fontWeight: '600', fontSize: 12 }}>
                    {(trip.status || 'unknown').toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.tripRoute}>{trip.route_name || 'Route'}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>
                {new Date(trip.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <View style={styles.tripDetails}>
                <View style={styles.tripDetail}>
                  <Ionicons name="location" size={14} color={colors.textSecondary} />
                  <Text style={styles.tripDetailText}>{trip.pickup_location || 'Pickup point'}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
