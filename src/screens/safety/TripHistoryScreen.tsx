// Trip History Screen — Design System: Dark SA Transport
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Spacer, SkeletonListItem, Card } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

interface Trip {
  id: string;
  scheduled_time: string;
  status: string;
  route_name: string;
  child_id: string;
}

export default function TripHistoryScreen() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');
  const [trips, setTrips] = useState<Trip[]>([]);

  const loadTrips = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: children } = await supabase.from('children').select('id').eq('parent_id', user.id);
      const childIds = children?.map((c: { id: string }) => c.id) || [];
      if (childIds.length === 0) { setTrips([]); return; }

      const { data: tripsData } = await supabase
        .from('trips')
        .select('*')
        .in('child_id', childIds)
        .order('scheduled_time', { ascending: false })
        .limit(50);

      setTrips(tripsData || []);
    } catch (error) { /* silent */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadTrips(); }, []);
  const onRefresh = useCallback(async () => { setRefreshing(true); await loadTrips(); }, []);
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return C.success;
      case 'cancelled': return C.error;
      case 'delayed': return C.accent;
      case 'in_progress': return C.accent;
      default: return C.textMuted;
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

  const now = new Date();
  

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },




    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.accent, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,229,255,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    filters: { flexDirection: 'row', marginHorizontal: 16, marginTop: 16, padding: 6 },
    filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 12, marginHorizontal: 3 },
    filterActive: { backgroundColor: C.accent },
    filterText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '600', color: C.textMuted },
    filterTextActive: { color: C.background },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    tripCard: { padding: 14, marginBottom: 10 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    tripDate: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff', textTransform: 'uppercase' },
    tripRoute: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text, marginBottom: 8 },
    tripDetails: { flexDirection: 'row', justifyContent: 'space-between' },
    tripDetail: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    tripDetailText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted },
    emptyState: { padding: 40, alignItems: 'center' },
    emptyIcon: { marginBottom: 12 },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, marginTop: 12 },
    bottomPadding: { height: 50 },
  });

  const FilterButton = ({ label, value }: { label: string; value: typeof filter }) => (
    <TouchableOpacity
      style={[s.filterBtn, filter === value && s.filterActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[s.filterText, filter === value && s.filterTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={s.container}>

        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Trip History</Text><Text style={s.ltSub}>All trips</Text></View></View>
        <View style={{ flex: 1, padding: 16 }}>
          {[0, 1, 2, 3, 4].map(i => <SkeletonListItem key={i} />)}
        </View>
      </View>
    );
  }

  return (
    <View style={s.container}>





      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Trip History</Text><Text style={s.ltSub}>All trips</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.accent} colors={[C.accent]} />}
      >
        {/* Filters */}
        <Card variant='glassAmber' style={s.filters}>
          <FilterButton label="All" value="all" />
          <FilterButton label="Completed" value="completed" />
          <FilterButton label="Cancelled" value="cancelled" />
        </Card>

        {/* Trips List */}
        <View style={s.section}>
          {filteredTrips.length === 0 ? (
            <Card variant='glassAmber' style={s.emptyState}>
              <View style={s.emptyIcon}><Ionicons name="bus-outline" size={44} color={C.textMuted} /></View>
              <Text style={s.emptyText}>No trips found</Text>
            </Card>
          ) : (
            filteredTrips.map((trip) => (
              <Card key={trip.id} variant='glassAmber' style={s.tripCard}>
                <View style={s.cardTopRefraction} />
                <View style={s.tripHeader}>
                  <Text style={s.tripDate}>{formatDate(trip.scheduled_time)} at {formatTime(trip.scheduled_time)}</Text>
                  <View style={[s.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                    <Text style={s.statusText}>{getStatusLabel(trip.status)}</Text>
                  </View>
                </View>
                <Text style={s.tripRoute}>{trip.route_name || 'Route Trip'}</Text>
                <View style={s.tripDetails}>
                  <View style={s.tripDetail}>
                    <Ionicons name="person" size={13} color={C.textMuted} />
                    <Text style={s.tripDetailText}>Child: {trip.child_id?.substring(0, 8)}</Text>
                  </View>
                  <View style={s.tripDetail}>
                    <Ionicons name="location" size={13} color={C.textMuted} />
                    <Text style={s.tripDetailText}>{trip.status}</Text>
                  </View>
                </View>
              </Card>
            ))
          )}
        </View>

        <Spacer size="xl" />
        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
}