import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { driverService, Driver } from '../../lib/api';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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
          Alert.alert('Success', 'Driver status updated');
          fetchDrivers();
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

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    statsRow: { flexDirection: 'row', backgroundColor: colors.card, margin: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, elevation: 2 },
    statItem: { flex: 1, alignItems: 'center' },
    statNumber: { ...typography.h2, color: colors.accent },
    statLabel: { ...typography.labelSmall, color: colors.textSecondary },
    searchContainer: { backgroundColor: colors.card, marginHorizontal: spacing.lg, marginBottom: spacing.lg, padding: spacing.md, borderRadius: borderRadius.lg, flexDirection: 'row', alignItems: 'center' },
    searchText: { flex: 1, marginLeft: spacing.sm, ...typography.body, color: colors.text },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    driverCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, elevation: 2 },
    driverRow: { flexDirection: 'row', alignItems: 'center' },
    driverAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    driverInitial: { ...typography.h4, color: colors.accent },
    driverInfo: { flex: 1, marginLeft: spacing.md },
    driverName: { ...typography.label, color: colors.text },
    driverPhone: { ...typography.bodySmall, color: colors.textSecondary },
    driverMeta: { flexDirection: 'row', marginTop: spacing.xs },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Loading drivers...</Text>
        </Card>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles(colors).container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
    >
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Manage Drivers</Text>
        <Text style={styles(colors).headerSubtext}>{drivers.length} total drivers</Text>
      </View>

      {/* Stats */}
      <View style={styles(colors).statsRow}>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{activeDrivers}</Text>
          <Text style={styles(colors).statLabel}>Active</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{pendingDrivers}</Text>
          <Text style={styles(colors).statLabel}>Pending</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={styles(colors).statNumber}>{drivers.length}</Text>
          <Text style={styles(colors).statLabel}>Total</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles(colors).searchContainer}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <Text style={styles(colors).searchText}>Search by name or phone...</Text>
      </View>

      {/* Driver List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>All Drivers</Text>

        {filteredDrivers.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No drivers found</Text>
          </Card>
        ) : (
          filteredDrivers.map((driver, index) => (
            <Card key={index} variant="elevated" padding="medium">
              <TouchableOpacity>
                <View style={styles(colors).driverCard}>
                  <View style={styles(colors).driverRow}>
                    <View style={styles(colors).driverAvatar}>
                      <Text style={styles(colors).driverInitial}>
                        {(driver.full_name || 'D').substring(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles(colors).driverInfo}>
                      <Text style={styles(colors).driverName}>{driver.full_name || 'Driver'}</Text>
                      <Text style={styles(colors).driverPhone}>{driver.phone || 'No phone'}</Text>
                      <View style={styles(colors).driverMeta}>
                        <Badge
                          label={driver.is_verified ? 'Verified' : 'Pending'}
                          variant={driver.is_verified ? 'success' : 'warning'}
                          size="small"
                        />
                        <Spacer size="sm" horizontal />
                        <Badge
                          label={driver.is_available ? 'Available' : 'Busy'}
                          variant={driver.is_available ? 'primary' : 'neutral'}
                          size="small"
                        />
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                  </View>
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
};

export default ManageDriversScreen;