import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { driverService, Driver } from '../../lib/api';

const ManageDriversScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchDrivers = async () => {
    try {
      const data = await driverService.getDrivers(false);
      setDrivers(data || []);
    } catch (error) {
      console.error('Error fetching drivers:', error);
      setDrivers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDrivers();
    setRefreshing(false);
  };

  const updateStatus = async (driverName: string, newStatus: boolean) => {
    Alert.alert('Update Status', `Change ${driverName} status to ${newStatus ? 'Active' : 'Inactive'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: async () => {
          try {
            // In real app, would call API to update status
            Alert.alert('Success', 'Driver status updated');
            fetchDrivers();
          } catch (error) {
            Alert.alert('Error', 'Failed to update status');
          }
        }
      },
    ]);
  };

  const filteredDrivers = drivers.filter(driver => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      driver.full_name?.toLowerCase().includes(query) ||
      driver.phone?.includes(query)
    );
  });

  const activeDrivers = drivers.filter(d => d.is_available).length;
  const pendingDrivers = drivers.filter(d => !d.is_verified).length;

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading drivers...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Manage Drivers</Text>
        <Text style={[styles.headerSubtext, { color: colors.accent }]}>View and manage all drivers</Text>
      </View>

      <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{drivers.length}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFB81C' }]}>{activeDrivers}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Active</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFB81C' }]}>{pendingDrivers}</Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search drivers..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.section}>
        {filteredDrivers.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="people-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Drivers Found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery ? 'No drivers match your search.' : 'No drivers registered yet.'}
            </Text>
          </View>
        ) : (
          filteredDrivers.map((driver) => (
            <View key={driver.id} style={[styles.driverCard, { backgroundColor: colors.card }]}>
              <View style={[styles.driverAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={24} color="#fff" />
              </View>
              <View style={styles.driverInfo}>
                <View style={styles.driverNameRow}>
                  <Text style={[styles.driverName, { color: colors.text }]}>{driver.full_name}</Text>
                  {driver.is_verified && <Ionicons name="checkmark-circle" size={14} color="#007749" />}
                </View>
                <Text style={[styles.driverPhone, { color: colors.textSecondary }]}>{driver.phone || 'No phone'}</Text>
                <Text style={[styles.driverSchool, { color: colors.accent }]}>
                  {driver.vehicle_type || 'No vehicle'}
                </Text>
              </View>
              <View style={styles.driverActions}>
                <View style={[styles.statusBadge, driver.is_available ? styles.activeBadge : styles.pendingBadge]}>
                  <Text style={styles.statusText}>
                    {driver.is_verified ? (driver.is_available ? 'Active' : 'Inactive') : 'Pending'}
                  </Text>
                </View>
                <View style={styles.actionBtns}>
                  <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#007749' }]}
                    onPress={() => updateStatus(driver.full_name, true)}
                  >
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      <TouchableOpacity style={styles.addBtn}>
        <Ionicons name="add" size={24} color="#fff" />
        <Text style={styles.addBtnText}>Add New Driver</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: '#888888', marginTop: 10, fontSize: 16 },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, marginTop: -10 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#FFB81C' },
  statLabel: { fontSize: 12, color: '#888888' },
  searchContainer: { flexDirection: 'row', alignItems: 'center', margin: 15, padding: 12, borderRadius: 10, elevation: 2 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  section: { padding: 15 },
  driverCard: { borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  driverAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  driverPhone: { fontSize: 13, color: '#888888', marginTop: 2 },
  driverSchool: { fontSize: 12, color: '#FFB81C', marginTop: 2 },
  driverActions: { alignItems: 'flex-end' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  activeBadge: { backgroundColor: '#007749' },
  pendingBadge: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  actionBtns: { flexDirection: 'row', marginTop: 8 },
  actionBtn: { width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginLeft: 5 },
  addBtn: { backgroundColor: '#007749', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 15, margin: 15, borderRadius: 10 },
  addBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  emptyContainer: { borderRadius: 10, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginTop: 15, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888888', textAlign: 'center', lineHeight: 20 },
});

export default ManageDriversScreen;
