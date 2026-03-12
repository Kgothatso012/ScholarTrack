import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  // Stats state
  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Query 1: Active drivers count
      const { count: activeDrivers, error: driversError } = await supabase
        .from('drivers')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Query 2: Total children/students count
      const { count: totalStudents, error: childrenError } = await supabase
        .from('children')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Query 3: Get drivers list
      const { data: driversData, error: driversListError } = await supabase
        .from('drivers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Query 4: Get payments for revenue
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      // Calculate revenue from payments
      const revenue = paymentsData
        ?.filter(p => p.status === 'completed' || p.status === 'paid')
        .reduce((sum, p) => sum + (p.amount || 0), 0) || 0;

      // Query 5: Get schools count
      const { count: schoolsCount, error: schoolsError } = await supabase
        .from('schools')
        .select('*', { count: 'exact', head: true });

      // Set stats
      setStats([
        { label: 'Active Drivers', value: activeDrivers || 0, positive: true },
        { label: 'Total Students', value: totalStudents || 0, positive: true },
        { label: 'Schools', value: schoolsCount || 0, positive: true },
        { label: 'Revenue', value: `R${(revenue / 100).toLocaleString()}`, positive: true },
      ]);

      // Set drivers
      if (driversData) {
        setDrivers(driversData.map(d => ({
          ...d,
          full_name: d.full_name || 'Unknown Driver',
        })));
      }

      // Set payments
      if (paymentsData) {
        setPayments(paymentsData);
      }

      setTotalRevenue(revenue);

    } catch (error) {
      console.error('Error loading dashboard:', error);
      // Set empty stats on error
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
    loadDashboardData();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadDashboardData();
  }, []);

  const TabButton = ({ tab, label, icon }: { tab: string; label: string; icon: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons name={icon as any} size={18} color={activeTab === tab ? colors.textInverse : colors.textSecondary} />
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const getStatusColor = (status: string, verified: boolean) => {
    if (!verified) return colors.warning;
    switch (status) {
      case 'active': return colors.success;
      case 'inactive': return colors.error;
      default: return colors.warning;
    }
  };

  const getStatusText = (status: string, verified: boolean) => {
    if (!verified) return 'Pending';
    return status || 'active';
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textInverse },
    headerSubtext: { fontSize: 13, color: colors.accent, marginTop: 5 },
    refreshBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 50 },
    loadingText: { color: colors.textSecondary, marginTop: 10 },
    tabs: { flexDirection: 'row', backgroundColor: colors.card, padding: 10, marginHorizontal: 15, marginTop: -10, borderRadius: 10, elevation: 3 },
    tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8 },
    tabButtonActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 12, color: colors.textSecondary, marginLeft: 5 },
    tabTextActive: { color: colors.textInverse },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
    statCard: { width: '48%', backgroundColor: colors.card, margin: '1%', padding: 15, borderRadius: 10, elevation: 2 },
    statLabel: { fontSize: 12, color: colors.textSecondary },
    statValue: { fontSize: 28, fontWeight: 'bold', color: colors.accent, marginVertical: 5 },
    section: { padding: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    listItem: { backgroundColor: colors.card, borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    listAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    avatarText: { color: colors.textInverse, fontWeight: 'bold', fontSize: 14 },
    listInfo: { flex: 1, marginLeft: 12 },
    listName: { fontSize: 15, fontWeight: 'bold', color: colors.text },
    listMeta: { fontSize: 12, color: colors.textSecondary },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
    statusText: { color: colors.textInverse, fontSize: 11, fontWeight: 'bold', textTransform: 'capitalize' },
    amount: { fontSize: 16, fontWeight: 'bold', color: colors.accent },
    financeCard: { backgroundColor: colors.card, borderRadius: 10, padding: 15, elevation: 2 },
    financeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
    financeLabel: { fontSize: 14, color: colors.textSecondary },
    financeValue: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    financeTotal: { borderBottomWidth: 0, paddingTop: 15 },
    financeLabelTotal: { fontSize: 16, fontWeight: 'bold', color: colors.text },
    financeValueTotal: { fontSize: 18, fontWeight: 'bold', color: colors.accent },
    exportBtn: { backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, marginTop: 15, elevation: 2 },
    exportText: { color: colors.accent, fontWeight: 'bold', marginLeft: 8 },
    emptyText: { textAlign: 'center', color: colors.textSecondary, padding: 20 },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
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
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <View style={{ flexDirection: 'row' }}>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => navigation?.navigate?.('FleetTracking')}>
              <Ionicons name="location" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshBtn} onPress={() => navigation?.navigate?.('Settings')}>
              <Ionicons name="settings-outline" size={20} color={colors.textInverse} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh}>
              <Ionicons name="refresh" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.headerSubtext}>Real-time data from database</Text>
      </View>

      <View style={styles.tabs}>
        <TabButton tab="overview" label="Overview" icon="grid" />
        <TabButton tab="drivers" label="Drivers" icon="car" />
        <TabButton tab="parents" label="Payments" icon="card" />
      </View>

      {activeTab === 'overview' && (
        <>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
              <TouchableOpacity style={[styles.listItem, { width: '48%', flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Ionicons name="person-add" size={24} color={colors.success} />
                <Text style={[styles.listName, { marginTop: 8 }]}>Add Driver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.listItem, { width: '48%', flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Ionicons name="school" size={24} color={colors.primary} />
                <Text style={[styles.listName, { marginTop: 8 }]}>Add School</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.listItem, { width: '48%', flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Ionicons name="document-text" size={24} color={colors.accent} />
                <Text style={[styles.listName, { marginTop: 8 }]}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.listItem, { width: '48%', flexDirection: 'column', alignItems: 'flex-start' }]}>
                <Ionicons name="settings" size={24} color={colors.textSecondary} />
                <Text style={[styles.listName, { marginTop: 8 }]}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {activeTab === 'drivers' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Drivers ({drivers.length})</Text>
          {drivers.length === 0 ? (
            <Text style={styles.emptyText}>No drivers found</Text>
          ) : (
            drivers.map((driver) => (
              <View key={driver.id} style={styles.listItem}>
                <View style={styles.listAvatar}>
                  <Text style={styles.avatarText}>
                    {(driver.full_name || 'D').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>{driver.full_name}</Text>
                  <Text style={styles.listMeta}>{driver.phone || 'No phone'}</Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status, driver.is_verified) }]}>
                  <Text style={styles.statusText}>{getStatusText(driver.status, driver.is_verified)}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      )}

      {activeTab === 'parents' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {payments.length === 0 ? (
            <Text style={styles.emptyText}>No payments found</Text>
          ) : (
            payments.map((payment) => (
              <View key={payment.id} style={styles.listItem}>
                <View style={styles.listAvatar}>
                  <Ionicons name="card" size={20} color={colors.textInverse} />
                </View>
                <View style={styles.listInfo}>
                  <Text style={styles.listName}>Payment #{payment.id.substring(0, 8)}</Text>
                  <Text style={styles.listMeta}>{payment.status}</Text>
                </View>
                <Text style={styles.amount}>R{((payment.amount || 0) / 100).toFixed(2)}</Text>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}
