import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { elderTheme as t } from '../../ui-plugin/elder';
import { Card, StatusBadge } from '../../ui-plugin/elder';
import { childrenService } from '../../lib/services/children';
import { supabase } from '../../lib/supabase';

interface Trip {
  id: string;
  trip_type: string;
  status: string;
  scheduled_time: string;
  driver_name?: string;
  child_name?: string;
  pickup_location?: string;
  dropoff_location?: string;
}

const statusMeta: Record<string, { label: string; variant: 'success' | 'warning' | 'danger' }> = {
  completed: { label: 'Completed', variant: 'success' },
  in_progress: { label: 'In progress', variant: 'success' },
  scheduled: { label: 'Scheduled', variant: 'warning' },
  cancelled: { label: 'Cancelled', variant: 'danger' },
};

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
};

const formatTime = (d: string) => {
  const date = new Date(d);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function TripsScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);

  const fetchTrips = useCallback(async () => {
    try {
      const parentId = await AsyncStorage.getItem('userId');
      if (!parentId) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('trips')
        .select('id, trip_type, status, scheduled_time, driver:driver_id(full_name), child:child_id(full_name), pickup_location, dropoff_location')
        .eq('parent_id', parentId)
        .order('scheduled_time', { ascending: false })
        .limit(20);

      if (error) throw error;

      const mapped: Trip[] = (data || []).map((t: any) => ({
        id: t.id,
        trip_type: t.trip_type || 'pickup',
        status: t.status || 'scheduled',
        scheduled_time: t.scheduled_time,
        driver_name: t.driver?.full_name,
        child_name: t.child?.full_name,
        pickup_location: t.pickup_location,
        dropoff_location: t.dropoff_location,
      }));

      setTrips(mapped);
    } catch (err) {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTrips(); }, [fetchTrips]);

  const onRefresh = () => { setRefreshing(true); fetchTrips(); };

  const today = trips.filter(t => {
    const d = new Date(t.scheduled_time);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const upcoming = trips.filter(t => {
    const d = new Date(t.scheduled_time);
    return d > new Date() && d.toDateString() !== new Date().toDateString();
  });

  const past = trips.filter(t => {
    const d = new Date(t.scheduled_time);
    return d < new Date() && d.toDateString() !== new Date().toDateString();
  });

  return (
    <View style={[ss.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={ss.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={ss.pageTitle}>Trips</Text>

        {loading ? null : trips.length === 0 ? (
          <View style={ss.emptyWrap}>
            <Ionicons name="time-outline" size={48} color={t.colors.textSecondary} />
            <Text style={ss.emptyTitle}>No trips yet</Text>
            <Text style={ss.emptyBody}>
              Your child's school transport trips will appear here.
            </Text>
          </View>
        ) : (
          <>
            {today.length > 0 && (
              <View style={ss.section}>
                <Text style={ss.sectionTitle}>Today</Text>
                {today.map((trip, i) => (
                  <Card key={trip.id} style={i > 0 ? { marginTop: t.spacing.md } : undefined}>
                    <View style={ss.tripHeader}>
                      <View style={ss.tripType}>
                        <Ionicons
                          name={trip.trip_type === 'dropoff' ? 'home-outline' : 'school-outline'}
                          size={20}
                          color={t.colors.primary}
                        />
                        <Text style={ss.tripTypeText}>
                          {trip.trip_type === 'dropoff' ? 'Drop off' : 'Pick up'}
                        </Text>
                      </View>
                      <StatusBadge
                        label={statusMeta[trip.status]?.label || trip.status}
                        variant={statusMeta[trip.status]?.variant || 'warning'}
                      />
                    </View>
                    <View style={ss.tripDetails}>
                      {trip.child_name && (
                        <View style={ss.detailRow}>
                          <Ionicons name="person-outline" size={16} color={t.colors.textSecondary} />
                          <Text style={ss.detailText}>{trip.child_name}</Text>
                        </View>
                      )}
                      {trip.driver_name && (
                        <View style={ss.detailRow}>
                          <Ionicons name="car-outline" size={16} color={t.colors.textSecondary} />
                          <Text style={ss.detailText}>{trip.driver_name}</Text>
                        </View>
                      )}
                      <View style={ss.detailRow}>
                        <Ionicons name="time-outline" size={16} color={t.colors.textSecondary} />
                        <Text style={ss.detailText}>{formatTime(trip.scheduled_time)}</Text>
                      </View>
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {upcoming.length > 0 && (
              <View style={ss.section}>
                <Text style={ss.sectionTitle}>Upcoming</Text>
                {upcoming.slice(0, 5).map((trip, i) => (
                  <Card key={trip.id} style={i > 0 ? { marginTop: t.spacing.md } : undefined}>
                    <View style={ss.tripHeader}>
                      <Text style={ss.tripDate}>{formatDate(trip.scheduled_time)}</Text>
                      <Text style={ss.tripTime}>{formatTime(trip.scheduled_time)}</Text>
                    </View>
                    <View style={ss.tripDetails}>
                      {trip.child_name && (
                        <Text style={ss.detailText}>{trip.child_name} — {trip.trip_type === 'dropoff' ? 'Drop off' : 'Pick up'}</Text>
                      )}
                    </View>
                  </Card>
                ))}
              </View>
            )}

            {past.length > 0 && (
              <View style={ss.section}>
                <Text style={ss.sectionTitle}>Recent</Text>
                {past.slice(0, 5).map((trip, i) => (
                  <Card key={trip.id} style={i > 0 ? { marginTop: t.spacing.md } : undefined}>
                    <View style={ss.tripHeader}>
                      <Text style={ss.tripDate}>{formatDate(trip.scheduled_time)}</Text>
                      <StatusBadge
                        label={statusMeta[trip.status]?.label || trip.status}
                        variant={statusMeta[trip.status]?.variant || 'warning'}
                      />
                    </View>
                  </Card>
                ))}
              </View>
            )}
          </>
        )}

        <View style={{ height: t.spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  scroll: {
    padding: t.layout.screenPadding,
    paddingBottom: 48,
  },
  pageTitle: {
    ...t.typography.pageTitle,
    marginBottom: t.layout.cardGap,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: t.spacing.xxxl,
    paddingTop: t.spacing.xxxl,
  },
  emptyTitle: {
    ...t.typography.cardHeading,
    marginTop: t.spacing.md,
  },
  emptyBody: {
    ...t.typography.bodySmall,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: t.spacing.sm,
  },
  section: {
    marginBottom: t.layout.cardGap,
  },
  sectionTitle: {
    ...t.typography.bodySmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: t.spacing.sm,
    marginLeft: t.spacing.xs,
  },
  tripHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: t.spacing.sm,
  },
  tripType: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  tripTypeText: {
    ...t.typography.body,
    fontWeight: '600',
  },
  tripDate: {
    ...t.typography.body,
    fontWeight: '600',
  },
  tripTime: {
    ...t.typography.bodySmall,
  },
  tripDetails: {
    gap: t.spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.sm,
  },
  detailText: {
    ...t.typography.bodySmall,
  },
});
