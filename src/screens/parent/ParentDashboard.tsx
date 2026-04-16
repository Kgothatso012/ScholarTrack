import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Child, Trip } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';
import { cacheService } from '../../lib/cache';
import { ThemeColors } from '../../context/ThemeContext';

import { Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const CACHE_TTL = 2 * 60 * 1000;

interface DashboardStat {
  label: string;
  value: string | number;
  positive?: boolean;
}

interface PaymentRecord {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

const SPRING = { useNativeDriver: true, toValue: 1, friction: 8, tension: 100 };

const ParentDashboard = ({ navigation }: Props) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [userName, setUserName] = useState('');

  // Animation values initialized once
  const statAnims = [
    useRef<Animated.Value>(new Animated.Value(0)),
    useRef<Animated.Value>(new Animated.Value(0)),
    useRef<Animated.Value>(new Animated.Value(0)),
    useRef<Animated.Value>(new Animated.Value(0)),
  ];
  const quickAnims = [
    useRef<Animated.Value>(new Animated.Value(0)),
    useRef<Animated.Value>(new Animated.Value(0)),
    useRef<Animated.Value>(new Animated.Value(0)),
    useRef<Animated.Value>(new Animated.Value(0)),
  ];

  const loadData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const email = await AsyncStorage.getItem('userEmail');
      const name = await AsyncStorage.getItem('userName');
      setUserEmail(email || '');
      setUserName(name || '');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Please login first'); return; }

      if (!forceRefresh) {
        const cachedChildren = await cacheService.get<Child[]>('parent_children_' + user.id);
        const cachedTrips = await cacheService.get<Trip[]>('parent_trips_' + user.id);
        if (cachedChildren) {
          setChildren(cachedChildren);
          setTrips(cachedTrips || []);
          setLoading(false);
          fetchFreshData(user.id);
          return;
        }
      }
      await fetchFreshData(user.id);
    } catch (error) {
      console.error('Error loading data:', error);
      setStats([
        { label: 'Children', value: 0, positive: true },
        { label: 'Trips Today', value: 0, positive: true },
        { label: 'Active', value: 0, positive: true },
        { label: 'Pending', value: 0, positive: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreshData = async (userId: string) => {
    try {
      const { data: childrenData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId);

      if (childrenData) {
        setChildren(childrenData);
        await cacheService.set('parent_children_' + userId, childrenData, CACHE_TTL);

        if (childrenData.length > 0) {
          const childIds = childrenData.map((c: Child) => c.id);
          const today = new Date().toISOString().split('T')[0];

          const { data: tripsData } = await supabase
            .from('trips')
            .select('*')
            .in('child_id', childIds)
            .gte('scheduled_time', today)
            .order('scheduled_time', { ascending: true })
            .limit(20);

          setTrips(tripsData || []);
          await cacheService.set('parent_trips_' + userId, tripsData || [], CACHE_TTL);

          const activeTrips = (tripsData || []).filter((t: Trip) => t.status === 'in_progress').length;

          const { data: paymentsData } = await supabase
            .from('payments')
            .select('*')
            .in('child_id', childIds)
            .order('created_at', { ascending: false })
            .limit(10);

          const pendingPayments = (paymentsData || []).filter((p: PaymentRecord) => p.status === 'pending').length;

          setStats([
            { label: 'Children', value: childrenData.length, positive: true },
            { label: 'Trips Today', value: (tripsData || []).length, positive: true },
            { label: 'Active', value: activeTrips, positive: activeTrips > 0 },
            { label: 'Pending', value: pendingPayments, positive: pendingPayments === 0 },
          ]);
        } else {
          setStats([
            { label: 'Children', value: 0, positive: true },
            { label: 'Trips Today', value: 0, positive: true },
            { label: 'Active', value: 0, positive: true },
            { label: 'Pending', value: 0, positive: true },
          ]);
        }
      }
    } catch (error) {
      console.error('Error fetching fresh data:', error);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Stagger entrance animations when data loads
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await supabase.auth.signOut();
        (window as any).logout();
      }}
    ]);
  };

  const getTripStatus = (trip: Trip) => {
    switch (trip.status) {
      case 'scheduled': return 'Scheduled';
      case 'in_progress': return 'On route';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getStatusVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'in_progress': case 'active': return 'success';
      case 'scheduled': return 'warning';
      case 'completed': return 'neutral';
      case 'cancelled': return 'error';
      default: return 'neutral';
    }
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string | undefined) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  const quickActions = [
    { name: 'Track Bus', icon: 'map', color: '#007749', route: 'LiveTrack' },
    { name: 'My Children', icon: 'people', color: '#002395', route: 'Children' },
    { name: 'Hire Driver', icon: 'person-add', color: '#FFB81C', route: 'HireDriver' },
    { name: 'Emergency', icon: 'warning', color: '#E03C31', route: 'Emergency' },
    { name: 'Payments', icon: 'card', color: '#FFB81C', route: 'Payments' },
    { name: 'History', icon: 'time', color: '#607D8B', route: 'History' },
  ];

  // ─── Styles ───
  const s = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    // HEADER
    header: {
      backgroundColor: c.secondary,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      position: 'relative',
      overflow: 'hidden',
    },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 },
    headerTitle: { ...typography.h2, color: c.textInverse, fontWeight: '700' },
    headerSubtext: { ...typography.bodySmall, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs },
    headerBtn: { padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: borderRadius.lg },
    headerGlow1: { position: 'absolute', top: -40, right: -40, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,184,28,0.08)' },
    headerGlow2: { position: 'absolute', bottom: -60, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,119,73,0.15)' },
    statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, position: 'relative', zIndex: 1 },
    // TABS
    tabsOuter: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginTop: spacing.md,
      backgroundColor: 'rgba(255,255,255,0.04)',
      borderRadius: borderRadius.xxl,
      padding: 4,
      borderWidth: 1,
      borderColor: 'rgba(255,184,28,0.08)',
    },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.xxl, gap: 6 },
    tabBtnActive: { backgroundColor: c.secondary },
    tabText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.45)' },
    tabTextActive: { color: c.textInverse, fontWeight: '600' },
    // STATS GRID — asymmetric 55/45 bento
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xs, paddingTop: spacing.md },
    // GLASS SURFACE — liquid glassmorphism with SA Gold refraction
    glass: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(255,184,28,0.12)',
      borderRadius: borderRadius.xxl,
      overflow: 'hidden',
      shadowColor: '#FFB81C',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.08,
      shadowRadius: 32,
      elevation: 0,
    },
    glassRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,184,28,0.2)' },
    // STAT CARD — left liquid bar instead of border-top
    statCard: { paddingVertical: spacing.lg, paddingHorizontal: spacing.md },
    statLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.2 },
    statValue: { ...typography.h2, color: '#FFB81C', marginTop: spacing.xs, fontWeight: '700' },
    statLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2 },
    // LIVE TRACK HERO
    heroGlass: { flexDirection: 'row', padding: spacing.lg, alignItems: 'center' },
    heroTextGroup: { flex: 1 },
    heroLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1 },
    heroTitle: { ...typography.h3, color: c.textInverse, marginTop: spacing.xs, fontWeight: '700' },
    heroSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)', marginTop: spacing.xs },
    heroBtn: { backgroundColor: 'rgba(0,119,73,0.3)', paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderRadius: borderRadius.xxl, borderWidth: 1, borderColor: 'rgba(0,119,73,0.5)' },
    heroBtnText: { ...typography.labelSmall, color: '#007749', fontWeight: '600' },
    // QUICK ACTIONS
    sectionLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', letterSpacing: 1.2, marginLeft: spacing.lg, marginBottom: spacing.sm },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4 },
    quickCard: { width: '50%', paddingHorizontal: 4, paddingVertical: 4 },
    quickCardInner: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    quickIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    quickText: { ...typography.label, color: c.text, flex: 1 },
    // TRIP/CHILD LIST
    listSection: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    emptyGlass: { padding: spacing.xl, alignItems: 'center' },
    emptyIcon: { color: 'rgba(255,255,255,0.2)' },
    emptyText: { ...typography.bodySmall, color: 'rgba(255,255,255,0.4)', marginTop: spacing.md, textAlign: 'center' },
    listItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    listAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    listInfo: { flex: 1 },
    listName: { ...typography.label, color: c.text, fontWeight: '600' },
    listMeta: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)' },
    // BREATHING DOT
    dotWrap: { width: 12, height: 12, justifyContent: 'center', alignItems: 'center' },
    dotRing: { position: 'absolute', width: 12, height: 12, borderRadius: 6 },
    dotCore: { position: 'absolute', width: 8, height: 8, borderRadius: 4 },
    // LOADING
    loadingGlass: { width: '80%', padding: spacing.xl, alignItems: 'center' },
  });

  if (loading) {
    return (
      <View style={[s(colors).container, { justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[s(colors).glass, s(colors).loadingGlass]}>
          <Text style={{ ...typography.body, color: 'rgba(255,255,255,0.5)' }}>Loading dashboard...</Text>
        </View>
      </View>
    );
  }

  const isLive = trips.some(t => t.status === 'in_progress');

  return (
    <ScrollView
      style={s(colors).container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFB81C']} tintColor={'#FFB81C'} />}
    >
      {/* HEADER */}
      <View style={s(colors).header}>
        <View style={s(colors).headerGlow1} />
        <View style={s(colors).headerGlow2} />
        <View style={s(colors).headerRow}>
          <View>
            <Text style={s(colors).headerTitle}>ScholarTrack</Text>
            <Text style={s(colors).headerSubtext}>{userName || userEmail || 'Welcome back'}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            {[
              { icon: 'refresh', onPress: onRefresh },
              { icon: 'settings-outline', onPress: () => navigation?.navigate?.('Settings') },
              { icon: 'log-out-outline', onPress: handleLogout },
            ].map((btn, i) => (
              <TouchableOpacity key={i} onPress={btn.onPress} style={s(colors).headerBtn}>
                <Ionicons name={btn.icon as any} size={18} color={colors.textInverse} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <View style={s(colors).statusRow}>
          <View style={s(colors).dotWrap}>
            <Animated.View style={[s(colors).dotRing, { backgroundColor: isLive ? '#007749' : '#555', opacity: isLive ? 0.3 : 0.5 }]} />
            <Animated.View style={[s(colors).dotCore, { backgroundColor: isLive ? '#007749' : '#666' }]} />
          </View>
          <Text style={{ ...typography.labelSmall, color: 'rgba(255,255,255,0.6)', marginLeft: spacing.sm }}>
            {isLive ? 'Live tracking active' : 'All systems normal'}
          </Text>
        </View>
      </View>

      {/* TABS */}
      <View style={s(colors).tabsOuter}>
        {[
          { key: 'overview', label: 'Overview', icon: 'grid' },
          { key: 'children', label: 'Children', icon: 'people' },
          { key: 'trips', label: 'Trips', icon: 'bus' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setActiveTab(tab.key); }}
            style={[s(colors).tabBtn, activeTab === tab.key && s(colors).tabBtnActive]}
          >
            <Ionicons name={tab.icon as any} size={15} color={activeTab === tab.key ? colors.textInverse : 'rgba(255,255,255,0.45)'} />
            <Text style={activeTab === tab.key ? s(colors).tabTextActive : s(colors).tabText}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── OVERVIEW ── */}
      {activeTab === 'overview' && (
        <>
          {/* Stats — asymmetric bento 55/45 */}
          <View style={s(colors).statsGrid}>
            {stats.map((stat, index) => {
              const wide = index < 2;
              return (
                <View
                  key={index}
                  style={{ width: wide ? '55%' : '43%', paddingHorizontal: 4, paddingVertical: 4 }}
                >
                  <View style={s(colors).glass}>
                    <View style={s(colors).glassRefraction} />
                    {/* Left liquid bar — replaces border-top accent */}
                    <View style={[s(colors).statLeftBar, { backgroundColor: stat.positive !== false ? 'rgba(255,184,28,0.6)' : 'rgba(224,60,49,0.6)' }]} />
                    <View style={s(colors).statCard}>
                      <Text style={s(colors).statLabel}>{stat.label}</Text>
                      <Text style={s(colors).statValue}>{stat.value}</Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Live Track Hero */}
          <View style={{ paddingHorizontal: spacing.xs, paddingTop: spacing.sm }}>
            <View style={s(colors).glass}>
              <View style={s(colors).glassRefraction} />
              <View style={s(colors).heroGlass}>
                <View style={s(colors).heroTextGroup}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
                    <View style={s(colors).dotWrap}>
                      <Animated.View style={[s(colors).dotRing, { backgroundColor: isLive ? '#007749' : '#555', opacity: isLive ? 0.3 : 0.5 }]} />
                      <Animated.View style={[s(colors).dotCore, { backgroundColor: isLive ? '#007749' : '#666' }]} />
                    </View>
                    <Text style={s(colors).heroLabel}>Live Tracking</Text>
                  </View>
                  <Text style={s(colors).heroTitle}>
                    {isLive ? `${trips.filter(t => t.status === 'in_progress').length} bus${trips.filter(t => t.status === 'in_progress').length > 1 ? 'es' : ''} on route` : 'No active trips'}
                  </Text>
                  <Text style={s(colors).heroSub}>Tap to view real-time location</Text>
                </View>
                <TouchableOpacity onPress={() => navigation?.navigate?.('LiveTrack')} style={s(colors).heroBtn}>
                  <Text style={s(colors).heroBtnText}>Track</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Quick Actions — 2-col bento */}
          <View style={{ paddingHorizontal: spacing.xs, paddingTop: spacing.sm }}>
            <Text style={s(colors).sectionLabel}>Quick Actions</Text>
            <View style={s(colors).quickGrid}>
              {quickActions.slice(0, 4).map((action, index) => (
                  <View key={index} style={s(colors).quickCard}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => navigation?.navigate?.(action.route)}
                      style={s(colors).quickCardInner}
                    >
                      <View style={[s(colors).quickIconWrap, { backgroundColor: `${action.color}20`, borderColor: `${action.color}40` }]}>
                        <Ionicons name={action.icon as any} size={20} color={action.color} />
                      </View>
                      <Text style={s(colors).quickText}>{action.name}</Text>
                    </TouchableOpacity>
                  </View>
                ))}
            </View>
          </View>

          {/* Recent Trips */}
          <View style={s(colors).listSection}>
            <Text style={s(colors).sectionLabel}>Recent Trips</Text>
            {trips.length === 0 ? (
              <View style={[s(colors).glass, s(colors).emptyGlass]}>
                <Ionicons name="bus-outline" size={40} style={s(colors).emptyIcon as any} />
                <Text style={s(colors).emptyText}>No upcoming trips</Text>
              </View>
            ) : (
              trips.slice(0, 3).map((trip, index) => {
                const isDropoff = !!trip.dropoff_location;
                const iconColor = isDropoff ? '#007749' : '#002395';
                const iconBg = isDropoff ? 'rgba(0,119,73,0.25)' : 'rgba(0,35,149,0.25)';
                const iconBorder = isDropoff ? 'rgba(0,119,73,0.3)' : 'rgba(0,35,149,0.3)';
                return (
                  <View key={trip.id} style={s(colors).listItem}>
                    <View style={[s(colors).listAvatar, { backgroundColor: iconBg, borderColor: iconBorder }]}>
                      <Ionicons name={isDropoff ? 'home' : 'school'} size={18} color={iconColor} />
                    </View>
                    <View style={s(colors).listInfo}>
                      <Text style={s(colors).listName}>{isDropoff ? 'Drop off' : 'Pick up'}</Text>
                      <Text style={s(colors).listMeta}>{formatDate(trip.scheduled_time)} at {formatTime(trip.scheduled_time)}</Text>
                    </View>
                    <Badge label={getTripStatus(trip)} variant={getStatusVariant(trip.status)} size="small" />
                  </View>
                );
              })
            )}
          </View>
        </>
      )}

      {/* ── CHILDREN ── */}
      {activeTab === 'children' && (
        <View style={s(colors).listSection}>
          <Text style={s(colors).sectionLabel}>My Children ({children.length})</Text>
          {children.length === 0 ? (
            <View style={[s(colors).glass, s(colors).emptyGlass]}>
              <Ionicons name="people-outline" size={40} style={s(colors).emptyIcon as any} />
              <Text style={s(colors).emptyText}>No children added yet</Text>
              <Spacer size="md" />
              <TouchableOpacity
                onPress={() => navigation.navigate('Children')}
                style={s(colors).heroBtn}
              >
                <Text style={s(colors).heroBtnText}>Add Child</Text>
              </TouchableOpacity>
            </View>
          ) : (
            children.map((child) => (
              <View key={child.id} style={s(colors).listItem}>
                <View style={[s(colors).listAvatar, { backgroundColor: 'rgba(0,35,149,0.25)', borderColor: 'rgba(0,35,149,0.3)' }]}>
                  <Text style={{ ...typography.label, color: '#002395', fontWeight: '700' }}>
                    {(child.full_name || 'C').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={s(colors).listInfo}>
                  <Text style={s(colors).listName}>{child.full_name}</Text>
                  <Text style={s(colors).listMeta}>{child.grade ? `Grade ${child.grade}` : 'School not set'}</Text>
                </View>
                <Badge label={child.status === 'active' ? 'Active' : 'Inactive'} variant={child.status === 'active' ? 'success' : 'neutral'} size="small" />
              </View>
            ))
          )}
        </View>
      )}

      {/* ── TRIPS ── */}
      {activeTab === 'trips' && (
        <View style={s(colors).listSection}>
          <Text style={s(colors).sectionLabel}>All Trips ({trips.length})</Text>
          {trips.length === 0 ? (
            <View style={[s(colors).glass, s(colors).emptyGlass]}>
              <Ionicons name="bus-outline" size={40} style={s(colors).emptyIcon as any} />
              <Text style={s(colors).emptyText}>No trips found</Text>
            </View>
          ) : (
            trips.map((trip) => {
              const isDropoff = !!trip.dropoff_location;
              const iconColor = isDropoff ? '#007749' : '#002395';
              const iconBg = isDropoff ? 'rgba(0,119,73,0.25)' : 'rgba(0,35,149,0.25)';
              const iconBorder = isDropoff ? 'rgba(0,119,73,0.3)' : 'rgba(0,35,149,0.3)';
              return (
                <View key={trip.id} style={s(colors).listItem}>
                  <View style={[s(colors).listAvatar, { backgroundColor: iconBg, borderColor: iconBorder }]}>
                    <Ionicons name={isDropoff ? 'home' : 'school'} size={18} color={iconColor} />
                  </View>
                  <View style={s(colors).listInfo}>
                    <Text style={s(colors).listName}>{isDropoff ? 'Drop off' : 'Pick up'}</Text>
                    <Text style={s(colors).listMeta}>{formatDate(trip.scheduled_time)} at {formatTime(trip.scheduled_time)}</Text>
                  </View>
                  <Badge label={getTripStatus(trip)} variant={getStatusVariant(trip.status)} size="small" />
                </View>
              );
            })
          )}
        </View>
      )}

      <Spacer size="xxl" />
    </ScrollView>
  );
};

// Helper: fade-in from Animated.Value
const FadeInCustom = (anim: Animated.Value) => ({
  left: 0,
  right: 0,
  opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] }),
  transform: [{
    translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }),
  }],
});

export default ParentDashboard;
