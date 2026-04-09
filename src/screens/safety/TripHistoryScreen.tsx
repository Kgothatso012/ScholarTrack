import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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
  const [trips, setTrips] = useState<Trip[]>([]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: children } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', user.id);

      const childIds = children?.map((c: { id: string }) => c.id) || [];
      if (childIds.length === 0) {
        setTrips([]);
        return;
      }

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

  const getStatusVariant = (status: string): 'success' | 'error' | 'warning' | 'neutral' | 'info' => {
    switch (status) {
      case 'completed': return 'success';
      case 'cancelled': return 'error';
      case 'delayed': return 'warning';
      case 'in_progress': return 'info';
      default: return 'neutral';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      case 'delayed': return 'Delayed';
      case 'in_progress': return 'In Progress';
      default: return status;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  const filteredTrips = filter === 'all' ? trips : trips.filter((t: Trip) => t.status === filter);

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.md },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xxl },
    loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
    filters: { flexDirection: 'row', backgroundColor: colors.card, marginHorizontal: spacing.lg, marginTop: -spacing.md, padding: spacing.sm, borderRadius: borderRadius.lg, elevation: 3 },
    filterBtn: { flex: 1, paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md, marginHorizontal: spacing.xs },
    filterActive: { backgroundColor: colors.primary },
    filterText: { ...typography.labelSmall, color: colors.textSecondary },
    filterTextActive: { color: colors.textInverse },
    section: { padding: spacing.lg },
    tripCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, elevation: 2 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
    tripDate: { ...typography.caption, color: colors.textSecondary },
    tripRoute: { ...typography.label, color: colors.text, marginBottom: spacing.xs },
    tripDetails: { flexDirection: 'row', justifyContent: 'space-between' },
    tripDetail: { flexDirection: 'row', alignItems: 'center' },
    tripDetailText: { ...typography.caption, color: colors.textSecondary, marginLeft: spacing.xs },
    emptyState: { alignItems: 'center', padding: spacing.xxl },
    emptyText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  });

  const FilterButton = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity
      style={[styles(colors).filterBtn, filter === value && styles(colors).filterActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles(colors).filterText, filter === value && styles(colors).filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles(colors).container, styles(colors).loadingContainer]}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).loadingText}>Loading trips...</Text>
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
        <Text style={styles(colors).headerTitle}>Trip History</Text>
      </View>

      {/* Filters */}
      <View style={styles(colors).filters}>
        <FilterButton label="All" value="all" />
        <FilterButton label="Completed" value="completed" />
        <FilterButton label="Cancelled" value="cancelled" />
      </View>

      {/* Trips List */}
      <View style={styles(colors).section}>
        {filteredTrips.length === 0 ? (
          <Card variant="outlined" padding="large">
            <View style={styles(colors).emptyState}>
              <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
              <Text style={styles(colors).emptyText}>No trips found</Text>
            </View>
          </Card>
        ) : (
          filteredTrips.map((trip) => (
            <Card key={trip.id} variant="elevated" padding="medium">
              <View style={styles(colors).tripCard}>
                <View style={styles(colors).tripHeader}>
                  <Text style={styles(colors).tripDate}>{formatDate(trip.scheduled_time)} at {formatTime(trip.scheduled_time)}</Text>
                  <Badge label={getStatusLabel(trip.status)} variant={getStatusVariant(trip.status)} size="small" />
                </View>
                <Text style={styles(colors).tripRoute}>{trip.route_name || 'Route Trip'}</Text>
                <View style={styles(colors).tripDetails}>
                  <View style={styles(colors).tripDetail}>
                    <Ionicons name="person" size={14} color={colors.textSecondary} />
                    <Text style={styles(colors).tripDetailText}>Child ID: {trip.child_id?.substring(0, 8)}</Text>
                  </View>
                  <View style={styles(colors).tripDetail}>
                    <Ionicons name="location" size={14} color={colors.textSecondary} />
                    <Text style={styles(colors).tripDetailText}>{trip.status}</Text>
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}