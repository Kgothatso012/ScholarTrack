import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

// UI Plugin components
import { Card, Button, Spacer, Badge, Avatar, SearchBar, Pagination, DashboardSkeleton } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface DashboardStat {
  label: string;
  value: string | number;
  change?: string;
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

export default function AdminDashboardScreen({ navigation }: any) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [userName, setUserName] = useState('');

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [driverSearch, setDriverSearch] = useState('');
  const [driverPage, setDriverPage] = useState(1);
  const [driverSortBy, setDriverSortBy] = useState<'name' | 'status' | 'date'>('date');
  const [driverSortAsc, setDriverSortAsc] = useState(false);
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'pending' | 'completed' | 'failed'>('all');
  const [paymentPage, setPaymentPage] = useState(1);
  const DRIVERS_PER_PAGE = 10;
  const PAYMENTS_PER_PAGE = 10;

  // Filtered and sorted drivers
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

  // Paginated drivers
  const totalDriverPages = Math.ceil(filteredDrivers.length / DRIVERS_PER_PAGE);
  const paginatedDrivers = filteredDrivers.slice(
    (driverPage - 1) * DRIVERS_PER_PAGE,
    driverPage * DRIVERS_PER_PAGE
  );

  // Filtered and paginated payments
  const filteredPayments = payments.filter(p =>
    paymentFilter === 'all' || p.status === paymentFilter
  );
  const totalPaymentPages = Math.ceil(filteredPayments.length / PAYMENTS_PER_PAGE);
  const paginatedPayments = filteredPayments.slice(
    (paymentPage - 1) * PAYMENTS_PER_PAGE,
    paymentPage * PAYMENTS_PER_PAGE
  );

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const { count: activeDrivers } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalStudents } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { data: driversData } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      const { data: paymentsData } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      const revenue = paymentsData
        ?.filter(p => p.status === 'completed' || p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      const { count: schoolsCount } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      setStats([
        { label: 'Active Drivers', value: activeDrivers || 0, positive: true },
        { label: 'Total Students', value: totalStudents || 0, positive: true },
        { label: 'Schools', value: schoolsCount || 0, positive: true },
        { label: 'Revenue', value: `R${(revenue / 100).toLocaleString()}`, positive: true },
      ]);

      if (driversData) {
        setDrivers(driversData.map(d => ({
          ...d,
          full_name: d.full_name || 'Unknown Driver',
        })));
      }

      if (paymentsData) {
        setPayments(paymentsData);
      }

      setTotalRevenue(revenue);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      setStats([
        { label: 'Active Drivers', value: 0 },
        { label: 'Total Students', value: 0 },
        { label: 'Schools', value: 0 },
        { label: 'Revenue', value: 'R0' },
      ]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
    loadDashboardData();
  }, []);

  const loadUserInfo = async () => {
    const name = await AsyncStorage.getItem('userName');
    setUserName(name || '');
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
  }, []);

  const getStatusVariant = (status: string, verified: boolean): 'success' | 'warning' | 'error' | 'neutral' => {
    if (!verified) return 'warning';
    switch (status) {
      case 'active': return 'success';
      case 'inactive': return 'error';
      default: return 'neutral';
    }
  };

  const getStatusText = (status: string, verified: boolean) => {
    if (!verified) return 'Pending';
    return status || 'active';
  };

  const getPaymentVariant = (status: string): 'success' | 'warning' | 'error' | 'neutral' => {
    switch (status) {
      case 'completed': case 'paid': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'neutral';
    }
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    headerActions: { flexDirection: 'row' },
    headerBtn: { padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.md, marginLeft: spacing.xs },
    section: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    tabs: { flexDirection: 'row', backgroundColor: colors.card, padding: spacing.xs, marginHorizontal: spacing.lg, marginTop: -spacing.md, borderRadius: borderRadius.lg, elevation: 3 },
    tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.sm, borderRadius: borderRadius.md },
    tabButtonActive: { backgroundColor: colors.primary },
    tabText: { ...typography.labelSmall, color: colors.textSecondary, marginLeft: spacing.xs },
    tabTextActive: { color: colors.textInverse },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.sm },
    statCard: { width: '48%', backgroundColor: colors.card, margin: '1%', padding: spacing.md, borderRadius: borderRadius.md, elevation: 2 },
    statLabel: { ...typography.labelSmall, color: colors.textSecondary },
    statValue: { ...typography.h2, color: colors.accent, marginVertical: spacing.xs },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    quickActionCard: { width: '47%', backgroundColor: colors.card, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', elevation: 2 },
    quickActionIcon: { marginBottom: spacing.xs },
    quickActionText: { ...typography.label, color: colors.text, textAlign: 'center' },
    listItem: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    listInfo: { flex: 1, marginLeft: spacing.md },
    listName: { ...typography.label, color: colors.text },
    listMeta: { ...typography.bodySmall, color: colors.textSecondary },
    amount: { ...typography.h4, color: colors.accent },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  });

  const TabButton = ({ tab, label, icon }: { tab: string; label: string; icon: string }) => (
    <TouchableOpacity
      style={[styles(colors).tabButton, activeTab === tab && styles(colors).tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons name={icon as any} size={18} color={activeTab === tab ? colors.textInverse : colors.textSecondary} />
      <Text style={[styles(colors).tabText, activeTab === tab && styles(colors).tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const quickActions = [
    { name: 'Add Driver', icon: 'person-add', color: colors.success, route: 'ManageDrivers' },
    { name: 'Documents', icon: 'document-text', color: colors.accent, route: 'Documents' },
    { name: 'Reports', icon: 'analytics', color: colors.primary, route: 'EnhancedReports' },
    { name: 'Settings', icon: 'settings', color: colors.textSecondary, route: 'Settings' },
  ];

  if (loading) {
    return (
      <View style={[styles(colors).container, { padding: spacing.lg }]}>
        <DashboardSkeleton />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles(colors).container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.accent]}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles(colors).header}>
        <View style={styles(colors).headerTop}>
          <Text style={styles(colors).headerTitle}>Admin Dashboard</Text>
          <View style={styles(colors).headerActions}>
            <TouchableOpacity style={styles(colors).headerBtn} onPress={() => navigation?.navigate?.('FleetTracking')}>
              <Ionicons name="location" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles(colors).headerBtn} onPress={() => navigation?.navigate?.('Settings')}>
              <Ionicons name="settings-outline" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles(colors).headerBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles(colors).headerSubtext}>{userName || 'Admin'} - Real-time data</Text>
      </View>

      {/* Tabs */}
      <View style={styles(colors).tabs}>
        <TabButton tab="overview" label="Overview" icon="grid" />
        <TabButton tab="drivers" label="Drivers" icon="car" />
        <TabButton tab="parents" label="Payments" icon="card" />
      </View>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          {/* Stats Grid */}
          <View style={styles(colors).statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles(colors).statCard}>
                <Text style={styles(colors).statLabel}>{stat.label}</Text>
                <Text style={styles(colors).statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>

          {/* Quick Actions */}
          <View style={styles(colors).section}>
            <Text style={styles(colors).sectionTitle}>Quick Actions</Text>
            <View style={styles(colors).quickActionsGrid}>
              {quickActions.map((action, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles(colors).quickActionCard}
                  onPress={() => navigation?.navigate?.(action.route)}
                >
                  <View style={styles(colors).quickActionIcon}>
                    <Ionicons name={action.icon as any} size={24} color={action.color} />
                  </View>
                  <Text style={styles(colors).quickActionText}>{action.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </>
      )}

      {/* Drivers Tab */}
      {activeTab === 'drivers' && (
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>All Drivers ({filteredDrivers.length})</Text>
          <SearchBar
            value={driverSearch}
            onChangeText={setDriverSearch}
            placeholder="Search drivers..."
          />
          {/* Sort Options */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.sm }}>
            {(['name', 'status', 'date'] as const).map(sort => (
              <TouchableOpacity
                key={sort}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.full,
                  backgroundColor: driverSortBy === sort ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: driverSortBy === sort ? colors.primary : colors.border,
                  gap: 4,
                }}
                onPress={() => {
                  if (driverSortBy === sort) setDriverSortAsc(!driverSortAsc);
                  else { setDriverSortBy(sort); setDriverSortAsc(false); }
                }}
              >
                <Text style={{ ...typography.labelSmall, color: driverSortBy === sort ? colors.textInverse : colors.text }}>
                  {sort.charAt(0).toUpperCase() + sort.slice(1)}
                </Text>
                {driverSortBy === sort && (
                  <Ionicons name={driverSortAsc ? 'arrow-up' : 'arrow-down'} size={12} color={colors.textInverse} />
                )}
              </TouchableOpacity>
            ))}
          </View>
          {filteredDrivers.length === 0 ? (
            <Card variant="outlined" padding="large">
              <Text style={styles(colors).emptyText}>
                {driverSearch ? 'No drivers match your search' : 'No drivers found'}
              </Text>
            </Card>
          ) : (
            <>
              {paginatedDrivers.map((driver) => (
                <Card key={driver.id} variant="elevated" padding="medium">
                  <View style={styles(colors).listItem}>
                    <View style={styles(colors).listAvatar}>
                      <Text style={{ color: colors.textInverse, fontWeight: 'bold', fontSize: 14 }}>
                        {(driver.full_name || 'D').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles(colors).listInfo}>
                      <Text style={styles(colors).listName}>{driver.full_name}</Text>
                      <Text style={styles(colors).listMeta}>{driver.phone || 'No phone'}</Text>
                    </View>
                    <Badge
                      label={getStatusText(driver.status, driver.is_verified)}
                      variant={getStatusVariant(driver.status, driver.is_verified)}
                      size="small"
                    />
                  </View>
                </Card>
              ))}
              {totalDriverPages > 1 && (
                <Pagination
                  currentPage={driverPage}
                  totalPages={totalDriverPages}
                  onPageChange={setDriverPage}
                  itemsPerPage={DRIVERS_PER_PAGE}
                  totalItems={filteredDrivers.length}
                />
              )}
            </>
          )}
        </View>
      )}

      {/* Payments Tab */}
      {activeTab === 'parents' && (
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Recent Payments ({filteredPayments.length})</Text>
          {/* Payment Filter Chips */}
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            {(['all', 'pending', 'completed', 'failed'] as const).map(filter => (
              <TouchableOpacity
                key={filter}
                style={{
                  paddingHorizontal: spacing.md,
                  paddingVertical: spacing.xs,
                  borderRadius: borderRadius.full,
                  backgroundColor: paymentFilter === filter ? colors.primary : colors.card,
                  borderWidth: 1,
                  borderColor: paymentFilter === filter ? colors.primary : colors.border,
                }}
                onPress={() => { setPaymentFilter(filter); setPaymentPage(1); }}
              >
                <Text style={{ ...typography.labelSmall, color: paymentFilter === filter ? colors.textInverse : colors.text }}>
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {filteredPayments.length === 0 ? (
            <Card variant="outlined" padding="large">
              <Text style={styles(colors).emptyText}>No {paymentFilter === 'all' ? '' : paymentFilter} payments found</Text>
            </Card>
          ) : (
            <>
              {paginatedPayments.map((payment) => (
                <Card key={payment.id} variant="elevated" padding="medium">
                  <View style={styles(colors).listItem}>
                    <View style={styles(colors).listAvatar}>
                      <Ionicons name="card" size={20} color={colors.textInverse} />
                    </View>
                    <View style={styles(colors).listInfo}>
                      <Text style={styles(colors).listName}>Payment #{payment.id.substring(0, 8)}</Text>
                      <Badge
                        label={payment.status}
                        variant={getPaymentVariant(payment.status)}
                        size="small"
                      />
                    </View>
                    <Text style={styles(colors).amount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
                  </View>
                </Card>
              ))}
              {totalPaymentPages > 1 && (
                <Pagination
                  currentPage={paymentPage}
                  totalPages={totalPaymentPages}
                  onPageChange={setPaymentPage}
                  itemsPerPage={PAYMENTS_PER_PAGE}
                  totalItems={filteredPayments.length}
                />
              )}
            </>
          )}
        </View>
      )}

      <Spacer size="xl" />
    </ScrollView>
  );
}