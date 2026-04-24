// Admin Dashboard Screen — Design System: Dark SA Transport
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
  withSpring,
  FadeIn,
} from 'react-native-reanimated';

import { Spacer, Badge } from '../../ui-plugin/components';
import { SearchBar, Pagination } from '../../ui-plugin/components';

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

const SPRING = { damping: 15, stiffness: 150 };

// Shimmer skeleton rect
const SkeletonRect = ({ width, height, br = 16 }: { width: number | string; height: number; br?: number }) => {
  const shimmer = useSharedValue(0);
  useEffect(() => { shimmer.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1, false); }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: 0.15 + interpolate(shimmer.value, [0, 1], [0, 0.55]) }));
  return <Animated.View style={[{ backgroundColor: 'rgba(255,184,28,0.22)', borderRadius: br, width: width as any, height }, animStyle]} />;
};

// Spring press wrapper
const SpringTouchable = ({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: object }) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }] }));
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

interface DashboardStat {
  label: string;
  value: string | number;
  positive?: boolean;
}

interface Driver {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  is_verified: boolean;
  created_at: string;
}

interface Payment {
  id: string;
  amount: number;
  status: string;
  parent_id: string;
  created_at: string;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function AdminDashboardScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userName, setUserName] = useState('');

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [driverSearch, setDriverSearch] = useState('');
  const [driverPage, setDriverPage] = useState(1);
  const [driverSortBy, setDriverSortBy] = useState<'name' | 'status' | 'date'>('date');
  const [driverSortAsc, setDriverSortAsc] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [paymentPage, setPaymentPage] = useState(1);
  const DRIVERS_PER_PAGE = 10;
  const PAYMENTS_PER_PAGE = 10;

  const filteredDrivers = drivers
    .filter(driver =>
      (driver.full_name || '').toLowerCase().includes(driverSearch.toLowerCase()) ||
      (driver.phone || '').toLowerCase().includes(driverSearch.toLowerCase())
    )
    .sort((a, b) => {
      let cmp = 0;
      if (driverSortBy === 'name') cmp = (a.full_name || '').localeCompare(b.full_name || '');
      else if (driverSortBy === 'status') cmp = (a.status || '').localeCompare(b.status || '');
      else cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
      return driverSortAsc ? cmp : -cmp;
    });

  const totalDriverPages = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE);
  const paginatedDrivers = filteredDrivers.slice((driverPage - 1) * DRIVERS_PER_PAGE, driverPage * DRIVERS_PER_PAGE);

  const filteredPayments = payments.filter(p => paymentFilter === 'all' || p.status === paymentFilter);
  const totalPaymentPages = Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice((paymentPage - 1) * PAYMENTS_PER_PAGE, paymentPage * PAYMENTS_PER_PAGE);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const { count: activeDrivers } = await supabase.from('drivers').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: totalStudents } = await supabase.from('children').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { data: driversData } = await supabase.from('drivers').select('*').order('created_at', { ascending: false }).limit(20);
      const { data: paymentsData } = await supabase.from('payments').select('*').order('created_at', { ascending: false }).limit(10);
      const revenue = paymentsData?.filter(p => p.status === 'completed' || p.status === 'paid').reduce((sum, p) => sum + (p.amount || 0), 0) || 0;
      const { count: schoolsCount } = await supabase.from('schools').select('*', { count: 'exact', head: true });

      setStats([
        { label: 'Active Drivers', value: activeDrivers || 0, positive: true },
        { label: 'Total Students', value: totalStudents || 0, positive: true },
        { label: 'Schools', value: schoolsCount || 0, positive: true },
        { label: 'Revenue', value: `R${((revenue || 0) / 100).toLocaleString()}`, positive: true },
      ]);
      if (driversData) setDrivers(driversData.map(d => ({ ...d, full_name: d.full_name || 'Unknown Driver' })));
      if (paymentsData) setPayments(paymentsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
      setStats([{ label: 'Active Drivers', value: 0 }, { label: 'Total Students', value: 0 }, { label: 'Schools', value: 0 }, { label: 'Revenue', value: 'R0' }]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { loadUserInfo(); loadDashboardData(); }, []);

  const loadUserInfo = async () => { const name = await AsyncStorage.getItem('userName'); setUserName(name || ''); };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadDashboardData(); }, []);

  const switchTab = (tab: string) => { setActiveTab(tab); };

  const getStatusVariant = (status: string, verified: boolean): 'success' | 'warning' | 'error' | 'neutral' => {
    if (!verified) return 'warning';
    switch (status) { case 'active': return 'success'; case 'inactive': return 'error'; default: return 'neutral'; }
  };

  const getStatusText = (status: string, verified: boolean) => { if (!verified) return 'Pending'; return status || 'active'; };

  const getPaymentVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) { case 'completed': case 'paid': return 'success'; case 'pending': return 'warning'; case 'failed': return 'error'; default: return 'neutral'; }
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'DMMono_400Regular', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 6 },
    sbIcon: { fontSize: 14 },
    header: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.amber, borderBottomLeftRadius: 0, borderBottomRightRadius: 0, position: 'relative', overflow: 'hidden' },
    headerGlow1: { position: 'absolute', top: -50, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,184,28,.08)' },
    headerGlow2: { position: 'absolute', bottom: -40, left: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(0,119,73,.2)' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 },
    headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    headerSubtext: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.65)', marginTop: 4 },
    headerBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', marginLeft: 8 },
    tabsOuter: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, backgroundColor: 'rgba(255,255,255,.04)', borderRadius: 16, padding: 4, borderWidth: 1, borderColor: 'rgba(255,184,28,.08)' },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 12, gap: 6 },
    tabBtnActive: { backgroundColor: DT.amber },
    tabText: { fontFamily: 'Syne_600SemiBold', fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,.45)' },
    tabTextActive: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.bg },
    section: { paddingHorizontal: 16, paddingTop: 16 },
    sectionLabel: { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.25)', marginBottom: 12 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: DT.white, marginBottom: 12, letterSpacing: 0.5 },
    statCardOuter: { width: '50%', paddingHorizontal: 4, paddingVertical: 4 },
    statCard: { ...glass, paddingVertical: 18, paddingHorizontal: 16, position: 'relative', overflow: 'hidden' },
    statTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    statLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    statLabel: { fontFamily: 'DMMono_400Regular', fontSize: 10, color: 'rgba(255,255,255,.45)', textTransform: 'uppercase', letterSpacing: 1.2 },
    statValue: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '700', color: DT.amber, marginTop: 4 },
    statCardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    statCardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingTop: 12 },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap' },
    quickCardOuter: { width: '50%', paddingHorizontal: 4, paddingVertical: 4 },
    quickCardInner: { ...glass, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    quickIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    quickText: { fontFamily: 'Syne_600SemiBold', fontSize: 13, fontWeight: '600', color: DT.white },
    searchWrap: { marginBottom: 12 },
    sortRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    sortChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, gap: 4 },
    sortChipText: { fontFamily: 'DMMono_400Regular', fontSize: 11, fontWeight: '600' },
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    filterChipText: { fontFamily: 'DMMono_400Regular', fontSize: 11, fontWeight: '600' },
    listItem: { ...glass, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', position: 'relative', overflow: 'hidden' },
    listTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    listLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    listAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,35,149,.3)' },
    listInitial: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: DT.blue },
    listInfo: { flex: 1, marginLeft: 12 },
    listName: { fontFamily: 'Syne_600SemiBold', fontSize: 14, fontWeight: '600', color: DT.white },
    listMeta: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: DT.muted, marginTop: 2 },
    amount: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: DT.amber },
    emptyGlass: { ...glass, padding: 30, alignItems: 'center' },
    emptyIcon: { marginBottom: 12 },
    emptyTitle: { fontFamily: 'Syne_600SemiBold', fontSize: 14, fontWeight: '600', color: DT.white, textAlign: 'center', marginBottom: 6 },
    emptyText: { fontFamily: 'DMMono_400Regular', fontSize: 12, color: DT.muted, textAlign: 'center' },
    bottomPadding: { height: 50 },
  });

  const quickActions = [
    { name: 'Add Driver', icon: 'person-add', color: DT.green2, route: 'ManageDrivers' },
    { name: 'Documents', icon: 'document-text', color: DT.blue, route: 'Documents' },
    { name: 'Reports', icon: 'analytics', color: DT.amber, route: 'EnhancedReports' },
    { name: 'Settings', icon: 'settings', color: DT.muted, route: 'Settings' },
  ];

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.green2} /><Ionicons name="battery-full" size={14} color={DT.white} /></View></View>
        <View style={s.header}>
          <View style={s.headerGlow1} />
          <View style={s.headerGlow2} />
          <View style={s.headerRow}>
            <View>
              <SkeletonRect width={160} height={24} br={8} />
              <SkeletonRect width={120} height={14} br={8} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0, 1, 2].map(i => <SkeletonRect key={i} width={36} height={36} br={12} />)}
            </View>
          </View>
        </View>
        <View style={s.tabsOuter}>
          {[0, 1, 2].map(i => <SkeletonRect key={i} width={'33%'} height={36} br={12} />)}
        </View>
        <View style={s.statsGrid}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={s.statCardOuter}>
              <View style={s.statCard}>
                <View style={s.statCardTopRefraction} />
                <View style={s.statCardLeftBar} />
                <SkeletonRect width={80} height={10} br={8} />
                <SkeletonRect width={100} height={26} br={8} />
              </View>
            </View>
          ))}
        </View>
        <View style={s.section}>
          <Text style={s.sectionLabel}>Quick Actions</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            {[0, 1, 2, 3].map(i => <SkeletonRect key={i} width={'25%'} height={72} br={20} />)}
          </View>
        </View>
        <Spacer size="xl" />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.amber} colors={[DT.amber]} />} showsVerticalScrollIndicator={false}>
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View>
      </View>

      {/* Header */}
      <View style={s.header}>
        <View style={s.headerGlow1} />
        <View style={s.headerGlow2} />
        <View style={s.headerRow}>
          <View>
            <Text style={s.headerTitle}>Admin Dashboard</Text>
            <Text style={s.headerSubtext}>{userName || 'Admin'} — Real-time data</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {[{ icon: 'location', route: 'FleetTracking' }, { icon: 'settings-outline', route: 'Settings' }, { icon: 'refresh', action: 'refresh' }].map((btn, i) => (
              <TouchableOpacity key={i} style={s.headerBtn} onPress={() => btn.action === 'refresh' ? onRefresh() : navigation.navigate(btn.route as string)}>
                <Ionicons name={btn.icon as keyof typeof Ionicons.glyphMap} size={18} color={DT.white} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabsOuter}>
        {[{ tab: 'overview', label: 'Overview', icon: 'grid' }, { tab: 'drivers', label: 'Drivers', icon: 'car' }, { tab: 'payments', label: 'Payments', icon: 'card' }].map(t => (
          <TouchableOpacity key={t.tab} onPress={() => switchTab(t.tab)} style={[s.tabBtn, activeTab === t.tab && s.tabBtnActive]}>
            <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={16} color={activeTab === t.tab ? DT.bg : 'rgba(255,255,255,.45)'} />
            <Text style={activeTab === t.tab ? s.tabTextActive : s.tabText}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'overview' && (
        <>
          {/* Stats */}
          <View style={s.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={s.statCardOuter}>
                <View style={s.statCard}>
                  <View style={s.statCardTopRefraction} />
                  <View style={[s.statCardLeftBar, { backgroundColor: stat.positive !== false ? 'rgba(255,183,0,.6)' : 'rgba(255,61,90,.6)' }]} />
                  <Text style={s.statLabel}>{stat.label}</Text>
                  <Text style={s.statValue}>{stat.value}</Text>
                </View>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Quick Actions</Text>
            <View style={s.quickGrid}>
              <View style={{ width: '52%' }}>
                <SpringTouchable onPress={() => navigation.navigate(quickActions[0].route)} style={s.quickCardInner}>
                  <View style={[s.quickIconWrap, { backgroundColor: `${quickActions[0].color}20`, borderColor: `${quickActions[0].color}40` }]}>
                    <Ionicons name={quickActions[0].icon as keyof typeof Ionicons.glyphMap} size={20} color={quickActions[0].color} />
                  </View>
                  <Text style={s.quickText}>{quickActions[0].name}</Text>
                </SpringTouchable>
              </View>
              {quickActions.slice(1).map((action, index) => (
                <Animated.View key={index} entering={FadeIn.delay(index * 60).springify()} style={{ width: '48%' }}>
                  <SpringTouchable onPress={() => navigation.navigate(action.route)} style={s.quickCardInner}>
                    <View style={[s.quickIconWrap, { backgroundColor: `${action.color}20`, borderColor: `${action.color}40` }]}>
                      <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={20} color={action.color} />
                    </View>
                    <Text style={s.quickText}>{action.name}</Text>
                  </SpringTouchable>
                </Animated.View>
              ))}
            </View>
          </View>
        </>
      )}

      {activeTab === 'drivers' && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>All Drivers ({filteredDrivers.length})</Text>
          <View style={s.searchWrap}>
            <SearchBar value={driverSearch} onChangeText={setDriverSearch} placeholder="Search drivers..." />
          </View>
          <View style={s.sortRow}>
            {(['name', 'status', 'date'] as const).map(sort => (
              <TouchableOpacity
                key={sort}
                style={{ ...s.sortChip, backgroundColor: driverSortBy === sort ? DT.amber : DT.panel, borderColor: driverSortBy === sort ? DT.amber : DT.border }}
                onPress={() => { if (driverSortBy === sort) setDriverSortAsc(!driverSortAsc); else { setDriverSortBy(sort); setDriverSortAsc(false); }}}
              >
                <Text style={{ ...s.sortChipText, color: driverSortBy === sort ? DT.bg : DT.text }}>{sort.charAt(0).toUpperCase() + sort.slice(1)}</Text>
                {driverSortBy === sort && <Ionicons name={driverSortAsc ? 'arrow-up' : 'arrow-down'} size={12} color={DT.bg} />}
              </TouchableOpacity>
            ))}
          </View>

          {filteredDrivers.length === 0 ? (
            <View style={s.emptyGlass}>
              <Ionicons name="car-outline" size={52} color={DT.dim} style={s.emptyIcon} />
              <Text style={s.emptyTitle}>{driverSearch ? 'No drivers match your search' : 'No drivers yet'}</Text>
              <Text style={s.emptyText}>{driverSearch ? 'Try a different search term' : 'Add your first driver to get started'}</Text>
            </View>
          ) : (
            <>
              {paginatedDrivers.map((driver, index) => (
                <Animated.View key={driver.id} entering={FadeIn.delay(index * 60).springify()} style={s.listItem}>
                  <View style={s.listTopRefraction} />
                  <View style={s.listLeftBar} />
                  <View style={[s.listAvatar, { backgroundColor: 'rgba(0,35,149,.15)' }]}>
                    <Text style={s.listInitial}>{(driver.full_name || 'D').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={s.listInfo}>
                    <Text style={s.listName}>{driver.full_name}</Text>
                    <Text style={s.listMeta}>{driver.phone || 'No phone'}</Text>
                  </View>
                  <Badge label={getStatusText(driver.status, driver.is_verified)} variant={getStatusVariant(driver.status, driver.is_verified)} size="small" />
                </Animated.View>
              ))}
              {totalDriverPages > 1 && <Pagination currentPage={driverPage} totalPages={totalDriverPages} onPageChange={setDriverPage} itemsPerPage={DRIVERS_PER_PAGE} totalItems={filteredDrivers.length} />}
            </>
          )}
        </View>
      )}

      {activeTab === 'payments' && (
        <View style={s.section}>
          <Text style={s.sectionLabel}>Recent Payments ({filteredPayments.length})</Text>
          <View style={s.filterRow}>
            {(['all', 'pending', 'completed', 'failed'] as const).map(filter => (
              <TouchableOpacity
                key={filter}
                style={{ ...s.filterChip, backgroundColor: paymentFilter === filter ? DT.blue : DT.panel, borderColor: paymentFilter === filter ? DT.blue : DT.border }}
                onPress={() => { setPaymentFilter(filter); setPaymentPage(1); }}
              >
                <Text style={{ ...s.filterChipText, color: paymentFilter === filter ? DT.white : DT.text }}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredPayments.length === 0 ? (
            <View style={s.emptyGlass}>
              <Ionicons name="card-outline" size={48} color={DT.muted} style={s.emptyIcon} />
              <Text style={s.emptyTitle}>No {paymentFilter === 'all' ? '' : paymentFilter} payments</Text>
              <Text style={s.emptyText}>Payments will appear here once recorded</Text>
            </View>
          ) : (
            <>
              {paginatedPayments.map((payment, index) => (
                <Animated.View key={payment.id} entering={FadeIn.delay(index * 60).springify()} style={s.listItem}>
                  <View style={s.listTopRefraction} />
                  <View style={s.listLeftBar} />
                  <View style={[s.listAvatar, { backgroundColor: 'rgba(0,119,73,.15)', borderColor: 'rgba(0,119,73,.3)' }]}>
                    <Ionicons name="card" size={20} color={DT.green2} />
                  </View>
                  <View style={s.listInfo}>
                    <Text style={s.listName}>Payment #{payment.id.substring(0, 8)}</Text>
                    <Badge label={payment.status} variant={getPaymentVariant(payment.status)} size="small" />
                  </View>
                  <Text style={s.amount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
                </Animated.View>
              ))}
              {totalPaymentPages > 1 && <Pagination currentPage={paymentPage} totalPages={totalPaymentPages} onPageChange={setPaymentPage} itemsPerPage={PAYMENTS_PER_PAGE} totalItems={filteredPayments.length} />}
            </>
          )}
        </View>
      )}

      <Spacer size="xl" />
      <View style={s.bottomPadding} />
    </ScrollView>
  );
}