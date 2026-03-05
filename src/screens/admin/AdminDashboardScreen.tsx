import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface DashboardStat {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}

interface Driver {
  id: number;
  name: string;
  status: 'active' | 'pending' | 'inactive';
  trips: number;
  rating: number;
}

interface AlertItem {
  id: number;
  type: 'info' | 'warning' | 'success';
  message: string;
  time: string;
}

export default function AdminDashboardScreen() {
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState('overview');

  const stats: DashboardStat[] = [
    { label: 'Active Drivers', value: '24', change: '+2', positive: true },
    { label: 'Total Students', value: '156', change: '+12', positive: true },
    { label: 'Schools', value: '12', change: '+1', positive: true },
    { label: 'Revenue', value: 'R124K', change: '+8%', positive: true },
    { label: 'Trips Today', value: '45', change: '-3', positive: false },
    { label: 'Pending Docs', value: '4', change: '0', positive: true },
  ];

  const drivers: Driver[] = [
    { id: 1, name: 'John Molaba', status: 'active', trips: 245, rating: 4.8 },
    { id: 2, name: 'Sarah Nkosi', status: 'active', trips: 189, rating: 4.9 },
    { id: 3, name: 'Mike Sithole', status: 'pending', trips: 56, rating: 4.2 },
    { id: 4, name: 'David Mokoena', status: 'pending', trips: 12, rating: 3.8 },
  ];

  const alerts: AlertItem[] = [
    { id: 1, type: 'warning', message: '4 driver documents pending verification', time: '10 min ago' },
    { id: 2, type: 'success', message: 'Payment processed - R45,000 collected', time: '1 hour ago' },
    { id: 3, type: 'info', message: 'New school registered - Pretoria East Primary', time: '2 hours ago' },
    { id: 4, type: 'warning', message: 'Trip delay reported on Route 7', time: '3 hours ago' },
  ];

  const recentPayments = [
    { id: 1, parent: 'Mrs. Dlamini', amount: 'R800', status: 'paid' },
    { id: 2, parent: 'Mr. Molefe', amount: 'R750', status: 'paid' },
    { id: 3, parent: 'Mrs. Khumalo', amount: 'R800', status: 'pending' },
    { id: 4, parent: 'Ms. Ndlovu', amount: 'R700', status: 'paid' },
  ];

  const TabButton = ({ tab, label, icon }: { tab: string; label: string; icon: string }) => (
    <TouchableOpacity
      style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
      onPress={() => setActiveTab(tab)}
    >
      <Ionicons name={icon as any} size={18} color={activeTab === tab ? colors.textInverse : colors.textSecondary} />
      <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'success': return colors.success;
      case 'warning': return colors.warning;
      default: return colors.primary;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'pending': return colors.warning;
      default: return colors.error;
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textInverse },
    headerSubtext: { fontSize: 13, color: colors.accent, marginTop: 5 },
    refreshBtn: { padding: 8, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 8 },
    tabs: { flexDirection: 'row', backgroundColor: colors.card, padding: 10, marginHorizontal: 15, marginTop: -10, borderRadius: 10, elevation: 3 },
    tabButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 10, borderRadius: 8 },
    tabButtonActive: { backgroundColor: colors.primary },
    tabText: { fontSize: 12, color: colors.textSecondary, marginLeft: 5 },
    tabTextActive: { color: colors.textInverse },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 10 },
    statCard: { width: '48%', backgroundColor: colors.card, margin: '1%', padding: 15, borderRadius: 10, elevation: 2 },
    statLabel: { fontSize: 12, color: colors.textSecondary },
    statValue: { fontSize: 28, fontWeight: 'bold', color: colors.accent, marginVertical: 5 },
    statChange: { fontSize: 12, fontWeight: 'bold' },
    section: { padding: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    alertCard: { backgroundColor: colors.card, borderRadius: 10, padding: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center', borderLeftWidth: 4, elevation: 2 },
    alertIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    alertInfo: { flex: 1, marginLeft: 12 },
    alertMessage: { fontSize: 14, color: colors.text },
    alertTime: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
    actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    actionBtn: { width: '48%', backgroundColor: colors.card, padding: 15, borderRadius: 10, alignItems: 'center', marginBottom: 10, elevation: 2 },
    actionText: { fontSize: 13, color: colors.text, marginTop: 8 },
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
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Admin Dashboard</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={() => Alert.alert('Refresh', 'Data refreshed!')}>
            <Ionicons name="refresh" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtext}>Web-style management panel</Text>
      </View>

      <View style={styles.tabs}>
        <TabButton tab="overview" label="Overview" icon="grid" />
        <TabButton tab="drivers" label="Drivers" icon="car" />
        <TabButton tab="parents" label="Parents" icon="people" />
        <TabButton tab="finance" label="Finance" icon="card" />
      </View>

      {activeTab === 'overview' && (
        <>
          <View style={styles.statsGrid}>
            {stats.map((stat, index) => (
              <View key={index} style={styles.statCard}>
                <Text style={styles.statLabel}>{stat.label}</Text>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={[styles.statChange, { color: stat.positive ? colors.success : colors.error }]}>
                  {stat.change}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Alerts</Text>
            {alerts.map((alert) => (
              <View key={alert.id} style={[styles.alertCard, { borderLeftColor: getAlertColor(alert.type) }]}>
                <View style={[styles.alertIcon, { backgroundColor: getAlertColor(alert.type) + '20' }]}>
                  <Ionicons
                    name={alert.type === 'success' ? 'checkmark-circle' : alert.type === 'warning' ? 'warning' : 'information-circle'}
                    size={18}
                    color={getAlertColor(alert.type)}
                  />
                </View>
                <View style={styles.alertInfo}>
                  <Text style={styles.alertMessage}>{alert.message}</Text>
                  <Text style={styles.alertTime}>{alert.time}</Text>
                </View>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="person-add" size={24} color={colors.success} />
                <Text style={styles.actionText}>Add Driver</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="school" size={24} color={colors.primary} />
                <Text style={styles.actionText}>Add School</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="document-text" size={24} color={colors.accent} />
                <Text style={styles.actionText}>Reports</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Ionicons name="settings" size={24} color={colors.textSecondary} />
                <Text style={styles.actionText}>Settings</Text>
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {activeTab === 'drivers' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>All Drivers ({drivers.length})</Text>
          {drivers.map((driver) => (
            <View key={driver.id} style={styles.listItem}>
              <View style={styles.listAvatar}>
                <Text style={styles.avatarText}>{driver.name.split(' ').map(n => n[0]).join('')}</Text>
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{driver.name}</Text>
                <Text style={styles.listMeta}>{driver.trips} trips - {driver.rating} stars</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(driver.status) }]}>
                <Text style={styles.statusText}>{driver.status}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'parents' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Payments</Text>
          {recentPayments.map((payment) => (
            <View key={payment.id} style={styles.listItem}>
              <View style={styles.listAvatar}>
                <Ionicons name="person" size={20} color={colors.textInverse} />
              </View>
              <View style={styles.listInfo}>
                <Text style={styles.listName}>{payment.parent}</Text>
                <Text style={styles.listMeta}>{payment.status}</Text>
              </View>
              <Text style={styles.amount}>{payment.amount}</Text>
            </View>
          ))}
        </View>
      )}

      {activeTab === 'finance' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Financial Overview</Text>

          <View style={styles.financeCard}>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Total Revenue (MTD)</Text>
              <Text style={styles.financeValue}>R124,500</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Collected</Text>
              <Text style={[styles.financeValue, { color: colors.accent }]}>R109,300</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Pending</Text>
              <Text style={[styles.financeValue, { color: colors.accent }]}>R15,200</Text>
            </View>
            <View style={styles.financeRow}>
              <Text style={styles.financeLabel}>Driver Payouts</Text>
              <Text style={styles.financeValue}>-R89,300</Text>
            </View>
            <View style={[styles.financeRow, styles.financeTotal]}>
              <Text style={styles.financeLabelTotal}>Net Revenue</Text>
              <Text style={styles.financeValueTotal}>R35,200</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.exportBtn}>
            <Ionicons name="download" size={20} color={colors.accent} />
            <Text style={styles.exportText}>Export Financial Report</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}
