import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge, Avatar } from '../../ui-plugin/components';
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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [stats, setStats] = useState<DashboardStat[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);

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
    loadDashboardData();
  }, []);

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
    headerTitle: { ...typography.h1, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    headerActions: { flexDirection: 'row' },
    headerBtn: { padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: borderRadius.md, marginLeft: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    tabs: { flexDirection: 'row', backgroundColor: colors.surface, padding: spacing.sm, marginHorizontal: spacing.lg, marginTop: -spacing.md, borderRadius: borderRadius.lg, elevation: 3 },
    tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.sm, borderRadius: borderRadius.md },
    tabButtonActive: { backgroundColor: colors.primary },
    tabText: { ...typography.labelSmall, color: colors.textSecondary, marginLeft: spacing.xs },
    tabTextActive: { color: colors.textInverse },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: spacing.sm },
    statCard: { width: '48%', backgroundColor: colors.surface, margin: '1%', padding: spacing.md, borderRadius: borderRadius.md, elevation: 2 },
    statLabel: { ...typography.labelSmall, color: colors.textSecondary },
    statValue: { ...typography.displayMedium, color: colors.accent, marginVertical: spacing.xs },
    quickActionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    quickActionCard: { width: '48%', backgroundColor: colors.surface, padding: spacing.md, marginBottom: spacing.sm, borderRadius: borderRadius.md, elevation: 2 },
    quickActionIcon: { marginBottom: spacing.xs },
    quickActionText: { ...typography.label, color: colors.text },
    listItem: { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
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
    { name: 'Add School', icon: 'school', color: colors.primary, route: 'FleetTracking' },
    { name: 'Reports', icon: 'document-text', color: colors.accent, route: 'AdminReports' },
    { name: 'Settings', icon: 'settings', color: colors.textSecondary, route: 'Settings' },
  ];

  if (loading) {
    return (
      <View style={[styles(colors).container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Loading dashboard...</Text>
        </Card>
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
        <Text style={styles(colors).headerSubtext}>Real-time data from database</Text>
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
              <Card key={index} variant="elevated" padding="medium">
                <View style={styles(colors).statCard}>
                  <Text style={styles(colors).statLabel}>{stat.label}</Text>
                  <Text style={styles(colors).statValue}>{stat.value}</Text>
                </View>
              </Card>
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
          <Text style={styles(colors).sectionTitle}>All Drivers ({drivers.length})</Text>
          {drivers.length === 0 ? (
            <Card variant="outlined" padding="large">
              <Text style={styles(colors).emptyText}>No drivers found</Text>
            </Card>
          ) : (
            drivers.map((driver) => (
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
            ))
          )}
        </View>
      )}

      {/* Payments Tab */}
      {activeTab === 'parents' && (
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Recent Payments</Text>
          {payments.length === 0 ? (
            <Card variant="outlined" padding="large">
              <Text style={styles(colors).emptyText}>No payments found</Text>
            </Card>
          ) : (
            payments.map((payment) => (
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
            ))
          )}
        </View>
      )}

      <Spacer size="xl" />
    </ScrollView>
  );
}