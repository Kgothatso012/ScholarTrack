import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Animated, LayoutAnimation, UIManager, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import { ratingService, DriverRatingSummary } from '../../lib/services/rating';

import { Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { ThemeColors } from '../../context/ThemeContext';

if (UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

interface Trip {
  id: string;
  scheduled_time: string;
  status: string;
  route_name: string;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface DriverUser {
  id: string;
  full_name?: string;
  phone?: string;
  email?: string;
  status?: string;
  is_verified?: boolean;
}

interface DashboardStat {
  label: string;
  value: string | number;
  positive?: boolean;
}

const DriverAppScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setTab] = useState('overview');
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, pending: 0 });
  const [currentUser, setCurrentUser] = useState<DriverUser | null>(null);
  const [ratingSummary, setRatingSummary] = useState<DriverRatingSummary | null>(null);

  const switchTab = (tab: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setTab(tab);
  };

  const loadDriverData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Please login first'); return; }

      const { data: driverData } = await supabase.from('drivers').select('*').eq('user_id', user.id).single();
      setCurrentUser(driverData);

      if (driverData) {
        const today = new Date().toISOString().split('T')[0];
        const { data: tripsData } = await supabase.from('trips').select('*').eq('driver_id', driverData.id).gte('scheduled_time', today).order('scheduled_time', { ascending: true }).limit(10);
        setTrips(tripsData || []);

        const { count: totalTrips } = await supabase.from('trips').select('*', { count: 'exact', head: true }).eq('driver_id', driverData.id);
        const { count: activeTrips } = await supabase.from('trips').select('*', { count: 'exact', head: true }).eq('driver_id', driverData.id).in('status', ['in_progress', 'active']);

        const { data: paymentsData } = await supabase.from('payments').select('*').eq('driver_id', driverData.id).order('created_at', { ascending: false }).limit(10);
        setPayments(paymentsData || []);

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(new Date().setDate(now.getDate() - 7)).toISOString();

        const todayEarnings = (paymentsData || []).filter((p: PaymentRecord) => p.status === 'completed' && p.created_at >= todayStart).reduce((sum: number, p: PaymentRecord) => sum + (p.amount || 0), 0);
        const weekEarnings = (paymentsData || []).filter((p: PaymentRecord) => p.status === 'completed' && p.created_at >= weekStart).reduce((sum: number, p: PaymentRecord) => sum + (p.amount || 0), 0);
        const pendingEarnings = (paymentsData || []).filter((p: PaymentRecord) => p.status === 'pending').reduce((sum: number, p: PaymentRecord) => sum + (p.amount || 0), 0);
        setEarnings({ today: todayEarnings, week: weekEarnings, pending: pendingEarnings });

        const totalEarnings = (paymentsData || []).filter((p: PaymentRecord) => p.status === 'completed').reduce((sum: number, p: PaymentRecord) => sum + (p.amount || 0), 0);

        setStats([
          { label: 'Total Trips', value: totalTrips || 0, positive: true },
          { label: 'Active', value: activeTrips || 0, positive: true },
          { label: 'Today', value: `R${(todayEarnings / 100).toFixed(0)}`, positive: true },
          { label: 'Total Earned', value: `R${(totalEarnings / 100).toFixed(0)}`, positive: true },
        ]);

        const rating = await ratingService.getDriverRatingSummary(driverData.id);
        setRatingSummary(rating);
      }
    } catch (error) {
      console.error('Error loading driver data:', error);
      setStats([{ label: 'Total Trips', value: 0 }, { label: 'Active', value: 0 }, { label: 'Today', value: 'R0' }, { label: 'Total Earned', value: 'R0' }]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadDriverData(); }, []);

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadDriverData(); }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => { await supabase.auth.signOut(); (window as any).logout?.(); }}
    ]);
  };

  const getTripStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) { case 'completed': return 'success'; case 'in_progress': case 'active': return 'warning'; case 'cancelled': return 'error'; default: return 'neutral'; }
  };

  const formatTripStatus = (status: string) => {
    switch (status) { case 'in_progress': return 'In Progress'; case 'active': return 'Active'; case 'scheduled': return 'Scheduled'; case 'completed': return 'Completed'; case 'cancelled': return 'Cancelled'; default: return status; }
  };

  const getPaymentVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) { case 'completed': case 'paid': return 'success'; case 'pending': return 'warning'; case 'failed': return 'error'; default: return 'neutral'; }
  };

  // ─── Styles ───
  const s = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    // HEADER
    header: {
      backgroundColor: c.primary,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      position: 'relative',
      overflow: 'hidden',
    },
    headerGlow: { position: 'absolute', top: -50, right: -30, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,184,28,0.1)' },
    headerGlow2: { position: 'absolute', bottom: -40, left: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(0,0,0,0.15)' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 },
    headerTitle: { ...typography.h2, color: c.textInverse, fontWeight: '700' },
    headerSubtext: { ...typography.bodySmall, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs },
    headerBtn: { padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: borderRadius.lg },
    headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    // TABS
    tabsOuter: { flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.xxl, padding: 4, borderWidth: 1, borderColor: 'rgba(255,184,28,0.08)' },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.xxl, gap: 6 },
    tabBtnActive: { backgroundColor: c.primary },
    tabText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.45)' },
    tabTextActive: { color: c.textInverse, fontWeight: '600' },
    // GLASS
    glass: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, overflow: 'hidden' },
    glassRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,184,28,0.2)' },
    // STATS TICKER — horizontal scrolling carousel
    statsSection: { paddingTop: spacing.md },
    statsTickerLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: spacing.lg, marginBottom: spacing.sm },
    statsTicker: { paddingLeft: spacing.md },
    statsTickerItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, paddingVertical: spacing.lg, paddingHorizontal: spacing.lg, marginRight: spacing.sm, minWidth: 120, position: 'relative', overflow: 'hidden' },
    statsTickerRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,184,28,0.15)' },
    statsTickerLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2 },
    statsTickerLabel2: { ...typography.labelSmall, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1 },
    statsTickerValue: { ...typography.h3, color: '#FFB81C', marginTop: spacing.xs, fontWeight: '700' },
    // RATING CARD
    ratingSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    ratingSectionTitle: { ...typography.labelSmall, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: spacing.sm },
    ratingGlass: { padding: spacing.lg, position: 'relative', overflow: 'hidden' },
    ratingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    ratingLeft: { flexDirection: 'row', alignItems: 'center' },
    ratingIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: 'rgba(255,184,28,0.15)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,184,28,0.3)' },
    ratingScore: { ...typography.h1, color: colors.text, marginLeft: spacing.md },
    ratingMeta: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)', marginLeft: spacing.md },
    ratingRight: { alignItems: 'flex-end' },
    ratingStatRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    // QUICK ACTIONS — horizontal scrollable pill dock
    actionsSection: { paddingTop: spacing.md },
    actionsLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: spacing.lg, marginBottom: spacing.sm },
    actionsDock: { paddingLeft: spacing.md },
    actionPill: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, paddingVertical: spacing.md, paddingHorizontal: spacing.lg, marginRight: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    actionPillIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
    actionPillText: { ...typography.label, color: colors.text },
    // SECTION
    section: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md, fontWeight: '600', letterSpacing: 0.2 },
    // LIST ITEMS — glassmorphism
    listItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,35,149,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,35,149,0.3)' },
    listInfo: { flex: 1 },
    listName: { ...typography.label, color: colors.text },
    listMeta: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)' },
    amount: { ...typography.h4, color: '#FFB81C', fontWeight: '700' },
    emptyText: { ...typography.body, color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: spacing.lg },
    loadingWrap: { flex: 1, backgroundColor: c.background, justifyContent: 'center', alignItems: 'center' },
    loadingGlass: { width: '80%', padding: spacing.xl, alignItems: 'center' },
  });

  const quickActions = [
    { name: 'Start Trip', icon: 'play-circle', color: '#007749', route: 'DriverTrips' },
    { name: 'My Trips', icon: 'bus', color: '#002395', route: 'DriverTrips' },
    { name: 'Manifest', icon: 'list', color: '#FFB81C', route: 'TripManifest' },
    { name: 'Compliance', icon: 'document-text', color: '#007749', route: 'Compliance' },
    { name: 'Vehicle', icon: 'car-sport', color: '#E03C31', route: 'VehicleChecklist' },
    { name: 'Chat', icon: 'chatbubbles', color: '#002395', route: 'Chat' },
    { name: 'History', icon: 'time', color: '#607D8B', route: 'History' },
    { name: 'Settings', icon: 'settings', color: '#607D8B', route: 'Settings' },
  ];

  if (loading) {
    return (
      <View style={[s(colors).container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[s(colors).glass, s(colors).loadingGlass]}>
          <Text style={{ ...typography.body, color: 'rgba(255,255,255,0.5)' }}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={s(colors).container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFB81C']} tintColor={'#FFB81C'} />}>
      {/* HEADER */}
      <View style={s(colors).header}>
        <View style={s(colors).headerGlow} />
        <View style={s(colors).headerGlow2} />
        <View style={s(colors).headerRow}>
          <View>
            <Text style={s(colors).headerTitle}>Driver Dashboard</Text>
            <Text style={s(colors).headerSubtext}>{currentUser?.full_name || 'Driver'} {currentUser?.is_verified ? '' : ''}</Text>
          </View>
          <View style={s(colors).headerActions}>
            <TouchableOpacity onPress={onRefresh} style={s(colors).headerBtn}><Ionicons name="refresh" size={20} color={colors.textInverse} /></TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={s(colors).headerBtn}><Ionicons name="log-out-outline" size={20} color={colors.textInverse} /></TouchableOpacity>
          </View>
        </View>
        {currentUser?.is_verified ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 6, position: 'relative', zIndex: 1 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#007749' }} />
            <Text style={{ ...typography.labelSmall, color: 'rgba(255,255,255,0.6)' }}>Verified driver</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm, gap: 6, position: 'relative', zIndex: 1 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#FFB81C' }} />
            <Text style={{ ...typography.labelSmall, color: 'rgba(255,255,255,0.6)' }}>Pending verification</Text>
          </View>
        )}
      </View>

      {/* TABS */}
      <View style={s(colors).tabsOuter}>
        {[{ key: 'overview', label: 'Overview', icon: 'grid' }, { key: 'trips', label: 'Trips', icon: 'bus' }, { key: 'earnings', label: 'Earnings', icon: 'card' }].map(t => (
          <TouchableOpacity key={t.key} onPress={() => switchTab(t.key)} style={[s(colors).tabBtn, activeTab === t.key && s(colors).tabBtnActive]}>
            <Ionicons name={t.icon as any} size={18} color={activeTab === t.key ? colors.textInverse : 'rgba(255,255,255,0.45)'} />
            <Text style={activeTab === t.key ? s(colors).tabTextActive : s(colors).tabText}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          {/* Stats — horizontal ticker carousel */}
          <View style={s(colors).statsSection}>
            <Text style={s(colors).statsTickerLabel}>Overview</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s(colors).statsTicker}>
              {stats.map((stat, index) => (
                <View key={index} style={s(colors).statsTickerItem}>
                  <View style={s(colors).statsTickerRefraction} />
                  <View style={[s(colors).statsTickerLeftBar, { backgroundColor: 'rgba(255,184,28,0.6)' }]} />
                  <Text style={s(colors).statsTickerLabel2}>{stat.label}</Text>
                  <Text style={s(colors).statsTickerValue}>{stat.value}</Text>
                </View>
              ))}
            </ScrollView>
          </View>

          {/* Rating Card */}
          {ratingSummary && (
            <View style={s(colors).ratingSection}>
              <Text style={s(colors).ratingSectionTitle}>My Rating</Text>
              <View style={s(colors).glass}>
                <View style={s(colors).glassRefraction} />
                <View style={s(colors).ratingGlass}>
                  <View style={s(colors).ratingRow}>
                    <View style={s(colors).ratingLeft}>
                      <View style={s(colors).ratingIcon}>
                        <Ionicons name="star" size={28} color="#FFB81C" />
                      </View>
                      <View>
                        <Text style={s(colors).ratingScore}>{ratingSummary.average_rating.toFixed(1)}</Text>
                        <Text style={s(colors).ratingMeta}>{ratingSummary.total_reviews} total reviews</Text>
                      </View>
                    </View>
                    <View style={s(colors).ratingRight}>
                      <View style={s(colors).ratingStatRow}>
                        <Ionicons name="thumbs-up" size={14} color="#007749" />
                        <Text style={{ ...typography.bodySmall, color: '#007749', marginLeft: 4 }}>{ratingSummary.positive_reviews} positive</Text>
                      </View>
                      <View style={s(colors).ratingStatRow}>
                        <Ionicons name="thumbs-down" size={14} color="#E03C31" />
                        <Text style={{ ...typography.bodySmall, color: '#E03C31', marginLeft: 4 }}>{ratingSummary.negative_reviews} needs work</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* Quick Actions — horizontal pill dock */}
          <View style={s(colors).actionsSection}>
            <Text style={s(colors).actionsLabel}>Quick Actions</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s(colors).actionsDock}>
              {quickActions.map((action, index) => (
                <TouchableOpacity key={index} onPress={() => navigation?.navigate?.(action.route)} style={s(colors).actionPill}>
                  <View style={[s(colors).actionPillIcon, { backgroundColor: `${action.color}20` }]}>
                    <Ionicons name={action.icon as any} size={15} color={action.color} />
                  </View>
                  <Text style={s(colors).actionPillText}>{action.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </>
      )}

      {/* ── TRIPS ── */}
      {activeTab === 'trips' && (
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>All Trips ({trips.length})</Text>
          {trips.length === 0 ? (
            <View style={[s(colors).glass, { padding: spacing.xl, alignItems: 'center' }]}>
              <Ionicons name="bus-outline" size={40} color="rgba(255,255,255,0.2)" />
              <Text style={s(colors).emptyText}>No trips found</Text>
            </View>
          ) : (
            trips.map(trip => (
              <View key={trip.id} style={s(colors).listItem}>
                <View style={s(colors).listAvatar}>
                  <Ionicons name="bus" size={20} color="#002395" />
                </View>
                <View style={s(colors).listInfo}>
                  <Text style={s(colors).listName}>{trip.route_name || 'Route'}</Text>
                  <Text style={s(colors).listMeta}>{new Date(trip.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <Badge label={formatTripStatus(trip.status)} variant={getTripStatusVariant(trip.status)} size="small" />
              </View>
            ))
          )}
        </View>
      )}

      {/* ── EARNINGS ── */}
      {activeTab === 'earnings' && (
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Recent Payments</Text>
          {payments.length === 0 ? (
            <View style={[s(colors).glass, { padding: spacing.xl, alignItems: 'center' }]}>
              <Ionicons name="card-outline" size={40} color="rgba(255,255,255,0.2)" />
              <Text style={s(colors).emptyText}>No payments found</Text>
            </View>
          ) : (
            payments.map(payment => (
              <View key={payment.id} style={s(colors).listItem}>
                <View style={[s(colors).listAvatar, { backgroundColor: 'rgba(0,119,73,0.25)', borderColor: 'rgba(0,119,73,0.3)' }]}>
                  <Ionicons name="card" size={20} color="#007749" />
                </View>
                <View style={s(colors).listInfo}>
                  <Text style={s(colors).listName}>Payment #{payment.id.substring(0, 8)}</Text>
                  <Badge label={payment.status} variant={getPaymentVariant(payment.status)} size="small" />
                </View>
                <Text style={s(colors).amount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      )}

      <Spacer size="xxl" />
    </ScrollView>
  );
};

export default DriverAppScreen;
