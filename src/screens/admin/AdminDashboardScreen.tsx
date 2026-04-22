import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
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
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { SearchBar, Pagination } from '../../ui-plugin/components';

const SA_GOLD = '#FFB81C';
const SPRING = { damping: 15, stiffness: 150 };

// Shimmer skeleton rect
const SkeletonRect = ({ width, height, style }: { width: number | string; height: number; style?: object }) => {
  const shimmer = useSharedValue(0);
  useEffect(() => { shimmer.value = withRepeat(withSequence(withTiming(1, { duration: 900 }), withTiming(0, { duration: 900 })), -1, false); }, []);
  const animStyle = useAnimatedStyle(() => ({ opacity: 0.15 + interpolate(shimmer.value, [0, 1], [0, 0.55]) }));
  return <Animated.View style={[{ backgroundColor: 'rgba(255,184,28,0.22)', borderRadius: borderRadius.lg, width, height }, style, animStyle]} />;
};

// Spring press wrapper
const SpringTouchable = ({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: object }) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }],
  }));
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

const AdminDashboardScreen = ({ navigation }: Props) => {
  const { colors } = useTheme();
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

  const switchTab = (tab: string) => {
    // Spring tab transition — Reanimated worklets handle the animation thread
    setActiveTab(tab);
  };

  const getStatusVariant = (status: string, verified: boolean): 'success' | 'warning' | 'error' | 'neutral' => {
    if (!verified) return 'warning';
    switch (status) { case 'active': return 'success'; case 'inactive': return 'error'; default: return 'neutral'; }
  };

  const getStatusText = (status: string, verified: boolean) => { if (!verified) return 'Pending'; return status || 'active'; };

  const getPaymentVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) { case 'completed': case 'paid': return 'success'; case 'pending': return 'warning'; case 'failed': return 'error'; default: return 'neutral'; }
  };

  // Styles
  const s = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    header: { backgroundColor: c.secondary, padding: spacing.lg, paddingTop: insets.top + spacing.lg, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, position: 'relative', overflow: 'hidden' },
    headerGlow1: { position: 'absolute', top: -50, right: -30, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,184,28,0.08)' },
    headerGlow2: { position: 'absolute', bottom: -40, left: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(0,119,73,0.2)' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 },
    headerTitle: { ...typography.h2, color: c.textInverse, fontWeight: '700' },
    headerSubtext: { ...typography.bodySmall, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs },
    headerBtn: { padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: borderRadius.lg, marginLeft: spacing.xs },
    tabsOuter: { flexDirection: 'row', marginHorizontal: spacing.md, marginTop: spacing.md, backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: borderRadius.xxl, padding: 4, borderWidth: 1, borderColor: 'rgba(255,184,28,0.08)' },
    tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, borderRadius: borderRadius.xxl, gap: 6 },
    tabBtnActive: { backgroundColor: c.secondary },
    tabText: { ...typography.labelSmall, color: 'rgba(255,255,255,0.45)' },
    tabTextActive: { color: c.textInverse, fontWeight: '600' },
    glass: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, overflow: 'hidden' },
    glassRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,184,28,0.2)' },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.xs, paddingTop: spacing.md },
    statCard: { paddingVertical: spacing.lg, paddingHorizontal: spacing.md, position: 'relative', overflow: 'hidden' },
    statLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2 },
    statLabel: { ...typography.labelSmall, color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: 1.2 },
    statValue: { ...typography.h2, color: '#FFB81C', marginTop: spacing.xs, fontWeight: '700' },
    section: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
    sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md, fontWeight: '600', letterSpacing: 0.2 },
    quickGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 4 },
    quickCardInner: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    quickIconWrap: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    quickText: { ...typography.label, color: colors.text },
    listItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(0,35,149,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,35,149,0.3)' },
    listInfo: { flex: 1 },
    listName: { ...typography.label, color: colors.text, fontWeight: '600' },
    listMeta: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)' },
    amount: { ...typography.h4, color: '#FFB81C', fontWeight: '700' },
    sortRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.sm },
    sortChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, gap: 4 },
    filterRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    filterChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1 },
    emptyGlass: { padding: spacing.xl, alignItems: 'center' },
    emptyText: { ...typography.body, color: 'rgba(255,255,255,0.45)', textAlign: 'center' },
    emptyTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.xs, textAlign: 'center' },
  });

  const quickActions = [
    { name: 'Add Driver', icon: 'person-add', color: '#007749', route: 'ManageDrivers' },
    { name: 'Documents', icon: 'document-text', color: '#002395', route: 'Documents' },
    { name: 'Reports', icon: 'analytics', color: '#FFB81C', route: 'EnhancedReports' },
    { name: 'Settings', icon: 'settings', color: '#607D8B', route: 'Settings' },
  ];

  if (loading) {
    return (
      <View style={s(colors).container}>
        {/* Header skeleton */}
        <View style={s(colors).header}>
          <View style={s(colors).headerGlow1} />
          <View style={s(colors).headerGlow2} />
          <View style={s(colors).headerRow}>
            <View>
              <SkeletonRect width={160} height={24} style={{ marginBottom: 8 }} />
              <SkeletonRect width={120} height={14} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {[0, 1, 2].map(i => <SkeletonRect key={i} width={36} height={36} style={{ borderRadius: 12 }} />)}
            </View>
          </View>
        </View>
        {/* Tabs skeleton */}
        <View style={s(colors).tabsOuter}>
          {[0, 1, 2].map(i => <SkeletonRect key={i} width={'33%'} height={36} style={{ borderRadius: borderRadius.xxl }} />)}
        </View>
        {/* Stats skeleton */}
        <View style={s(colors).statsGrid}>
          {[0, 1, 2, 3].map(i => (
            <View key={i} style={{ width: i < 2 ? '55%' : '43%', paddingHorizontal: 4, paddingVertical: 4 }}>
              <View style={s(colors).glass}>
                <View style={s(colors).glassRefraction} />
                <View style={[s(colors).statLeftBar, { backgroundColor: 'rgba(255,184,28,0.3)' }]} />
                <View style={s(colors).statCard}>
                  <SkeletonRect width={80} height={10} style={{ marginBottom: 8 }} />
                  <SkeletonRect width={100} height={28} />
                </View>
              </View>
            </View>
          ))}
        </View>
        {/* Quick actions skeleton */}
        <View style={s(colors).section}>
          <SkeletonRect width={120} height={18} style={{ marginBottom: 12 }} />
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {[0, 1, 2, 3].map(i => <SkeletonRect key={i} width={'24%'} height={72} style={{ borderRadius: borderRadius.xxl }} />)}
          </View>
        </View>
        <Spacer size="xl" />
      </View>
    );
  }

  return (
    <ScrollView style={s(colors).container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FFB81C']} tintColor={'#FFB81C'} />}>
      {/* HEADER */}
      <View style={s(colors).header}>
        <View style={s(colors).headerGlow1} />
        <View style={s(colors).headerGlow2} />
        <View style={s(colors).headerRow}>
          <View>
            <Text style={s(colors).headerTitle}>Admin Dashboard</Text>
            <Text style={s(colors).headerSubtext}>{userName || 'Admin'} — Real-time data</Text>
          </View>
          <View style={{ flexDirection: 'row' }}>
            {[{ icon: 'location', route: 'FleetTracking' }, { icon: 'settings-outline', route: 'Settings' }, { icon: 'refresh', action: 'refresh' }].map((btn, i) => (
              <TouchableOpacity key={i} style={s(colors).headerBtn} onPress={() => btn.action === 'refresh' ? onRefresh() : navigation?.navigate?.(btn.route as string)}>
                <Ionicons name={btn.icon as keyof typeof Ionicons.glyphMap} size={20} color={colors.textInverse} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* TABS */}
      <View style={s(colors).tabsOuter}>
        {[{ tab: 'overview', label: 'Overview', icon: 'grid' }, { tab: 'drivers', label: 'Drivers', icon: 'car' }, { tab: 'payments', label: 'Payments', icon: 'card' }].map(t => (
          <TouchableOpacity key={t.tab} onPress={() => switchTab(t.tab)} style={[s(colors).tabBtn, activeTab === t.tab && s(colors).tabBtnActive]}>
            <Ionicons name={t.icon as keyof typeof Ionicons.glyphMap} size={18} color={activeTab === t.tab ? colors.textInverse : 'rgba(255,255,255,0.45)'} />
            <Text style={activeTab === t.tab ? s(colors).tabTextActive : s(colors).tabText}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === 'overview' && (
        <>
          {/* Stats — asymmetric bento: first 2 wide, last 2 narrow */}
          <View style={s(colors).statsGrid}>
            {stats.map((stat, index) => {
              const wide = index < 2;
              return (
                <View key={index} style={{ width: wide ? '55%' : '43%', paddingHorizontal: 4, paddingVertical: 4 }}>
                  <View style={s(colors).glass}>
                    <View style={s(colors).glassRefraction} />
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

          {/* Quick Actions — asymmetric bento */}
          <View style={s(colors).section}>
            <Text style={s(colors).sectionTitle}>Quick Actions</Text>
            <View style={s(colors).quickGrid}>
              <View style={{ width: '52%', paddingHorizontal: 4, paddingVertical: 4 }}>
                <SpringTouchable onPress={() => navigation?.navigate?.(quickActions[0].route)} style={s(colors).quickCardInner}>
                  <View style={[s(colors).quickIconWrap, { backgroundColor: `${quickActions[0].color}20`, borderColor: `${quickActions[0].color}40` }]}>
                    <Ionicons name={quickActions[0].icon as keyof typeof Ionicons.glyphMap} size={22} color={quickActions[0].color} />
                  </View>
                  <Text style={s(colors).quickText}>{quickActions[0].name}</Text>
                </SpringTouchable>
              </View>
              {quickActions.slice(1).map((action, index) => (
                <Animated.View
                  key={index}
                  entering={FadeIn.delay(index * 60).springify()}
                  style={{ width: '48%', paddingHorizontal: 4, paddingVertical: 4 }}
                >
                  <SpringTouchable onPress={() => navigation?.navigate?.(action.route)} style={s(colors).quickCardInner}>
                    <View style={[s(colors).quickIconWrap, { backgroundColor: `${action.color}20`, borderColor: `${action.color}40` }]}>
                      <Ionicons name={action.icon as keyof typeof Ionicons.glyphMap} size={22} color={action.color} />
                    </View>
                    <Text style={s(colors).quickText}>{action.name}</Text>
                  </SpringTouchable>
                </Animated.View>
              ))}
            </View>
          </View>
        </>
      )}

      {activeTab === 'drivers' && (
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>All Drivers ({filteredDrivers.length})</Text>
          <SearchBar value={driverSearch} onChangeText={setDriverSearch} placeholder="Search drivers..." />
          <View style={s(colors).sortRow}>
            {(['name', 'status', 'date'] as const).map(sort => (
              <TouchableOpacity
                key={sort}
                style={{ ...s(colors).sortChip, backgroundColor: driverSortBy === sort ? colors.primary : 'rgba(255,255,255,0.05)', borderColor: driverSortBy === sort ? colors.primary : 'rgba(255,184,28,0.12)' }}
                onPress={() => { if (driverSortBy === sort) setDriverSortAsc(!driverSortAsc); else { setDriverSortBy(sort); setDriverSortAsc(false); }}}
              >
                <Text style={{ ...typography.labelSmall, color: driverSortBy === sort ? colors.textInverse : colors.text }}>{sort.charAt(0).toUpperCase() + sort.slice(1)}</Text>
                {driverSortBy === sort && <Ionicons name={driverSortAsc ? 'arrow-up' : 'arrow-down'} size={12} color={colors.textInverse} />}
              </TouchableOpacity>
            ))}
          </View>

          {filteredDrivers.length === 0 ? (
            <View style={[s(colors).glass, s(colors).emptyGlass]}>
              <Ionicons name="car-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={s(colors).emptyTitle}>{driverSearch ? 'No drivers match your search' : 'No drivers yet'}</Text>
              <Text style={s(colors).emptyText}>{driverSearch ? 'Try a different search term' : 'Add your first driver to get started'}</Text>
            </View>
          ) : (
            <>
              {paginatedDrivers.map((driver, index) => (
                <Animated.View
                  key={driver.id}
                  entering={FadeIn.delay(index * 60).springify()}
                  style={s(colors).listItem}
                >
                  <View style={s(colors).listAvatar}>
                    <Text style={{ color: '#002395', fontWeight: 'bold', fontSize: 14 }}>{(driver.full_name || 'D').split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={s(colors).listInfo}>
                    <Text style={s(colors).listName}>{driver.full_name}</Text>
                    <Text style={s(colors).listMeta}>{driver.phone || 'No phone'}</Text>
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
        <View style={s(colors).section}>
          <Text style={s(colors).sectionTitle}>Recent Payments ({filteredPayments.length})</Text>
          <View style={s(colors).filterRow}>
            {(['all', 'pending', 'completed', 'failed'] as const).map(filter => (
              <TouchableOpacity
                key={filter}
                style={{ ...s(colors).filterChip, backgroundColor: paymentFilter === filter ? colors.primary : 'rgba(255,255,255,0.05)', borderColor: paymentFilter === filter ? colors.primary : 'rgba(255,184,28,0.12)' }}
                onPress={() => { setPaymentFilter(filter); setPaymentPage(1); }}
              >
                <Text style={{ ...typography.labelSmall, color: paymentFilter === filter ? colors.textInverse : colors.text }}>{filter.charAt(0).toUpperCase() + filter.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredPayments.length === 0 ? (
            <View style={[s(colors).glass, s(colors).emptyGlass]}>
              <Ionicons name="card-outline" size={48} color="rgba(255,255,255,0.2)" />
              <Text style={s(colors).emptyTitle}>No {paymentFilter === 'all' ? '' : paymentFilter} payments</Text>
              <Text style={s(colors).emptyText}>Payments will appear here once recorded</Text>
            </View>
          ) : (
            <>
              {paginatedPayments.map((payment, index) => (
                <Animated.View
                  key={payment.id}
                  entering={FadeIn.delay(index * 60).springify()}
                  style={s(colors).listItem}
                >
                  <View style={[s(colors).listAvatar, { backgroundColor: 'rgba(0,119,73,0.25)', borderColor: 'rgba(0,119,73,0.3)' }]}>
                    <Ionicons name="card" size={20} color="#007749" />
                  </View>
                  <View style={s(colors).listInfo}>
                    <Text style={s(colors).listName}>Payment #{payment.id.substring(0, 8)}</Text>
                    <Badge label={payment.status} variant={getPaymentVariant(payment.status)} size="small" />
                  </View>
                  <Text style={s(colors).amount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
                </Animated.View>
              ))}
              {totalPaymentPages > 1 && <Pagination currentPage={paymentPage} totalPages={totalPaymentPages} onPageChange={setPaymentPage} itemsPerPage={PAYMENTS_PER_PAGE} totalItems={filteredPayments.length} />}
            </>
          )}
        </View>
      )}

      <Spacer size="xl" />
    </ScrollView>
  );
};

export default AdminDashboardScreen;
