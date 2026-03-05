import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { driverService, Driver } from '../../lib/api';

const HireDriverScreen = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [drivers, setDrivers] = useState<Driver[]>([]);

  const fetchDrivers = async () => {
    try {
      const data = await driverService.getDrivers(true);
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

  const filteredDrivers = drivers.filter(driver => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      driver.full_name?.toLowerCase().includes(query) ||
      driver.vehicle_type?.toLowerCase().includes(query)
    );
  });

  const hireDriver = (driverName: string) => {
    Alert.alert('Request Sent', `Request sent to ${driverName}. They will contact you shortly.`, [
      { text: 'OK' }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Finding available drivers...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Hire a Driver</Text>
        <Text style={[styles.headerSubtext, { color: colors.accent }]}>Find vetted drivers near you</Text>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search by name or vehicle..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Drivers</Text>

        {filteredDrivers.length === 0 ? (
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="people-outline" size={60} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Drivers Found</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {searchQuery
                ? 'No drivers match your search. Try a different search term.'
                : 'No verified drivers are currently available. Check back later.'}
            </Text>
          </View>
        ) : (
          filteredDrivers.map((driver) => (
            <View key={driver.id} style={[styles.driverCard, { backgroundColor: colors.card }]}>
              <View style={[styles.driverAvatar, { backgroundColor: colors.primary }]}>
                <Ionicons name="person" size={30} color="#fff" />
              </View>
              <View style={styles.driverInfo}>
                <View style={styles.driverNameRow}>
                  <Text style={[styles.driverName, { color: colors.text }]}>{driver.full_name}</Text>
                  {driver.is_verified && <Ionicons name="checkmark-circle" size={16} color="#007749" />}
                </View>
                <Text style={[styles.driverSchool, { color: colors.textSecondary }]}>
                  Vehicle: {driver.vehicle_type || 'Not specified'}
                </Text>
                <View style={styles.driverMeta}>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={14} color="#FFB81C" />
                    <Text style={[styles.ratingText, { color: colors.text }]}>
                      {driver.rating ? driver.rating.toFixed(1) : 'New'}
                    </Text>
                  </View>
                  <Text style={[styles.price, { color: colors.accent }]}>Contact for pricing</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.hireButton} onPress={() => hireDriver(driver.full_name)}>
                <Text style={styles.hireButtonText}>Hire</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>How It Works</Text>
        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={styles.stepNumberText}>1</Text></View>
          <View style={styles.stepInfo}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Search Drivers</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>Find drivers serving your area</Text>
          </View>
        </View>
        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={styles.stepNumberText}>2</Text></View>
          <View style={styles.stepInfo}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Request & Connect</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>Send a request and discuss terms</Text>
          </View>
        </View>
        <View style={[styles.stepCard, { backgroundColor: colors.card }]}>
          <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}><Text style={styles.stepNumberText}>3</Text></View>
          <View style={styles.stepInfo}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>Track & Pay Monthly</Text>
            <Text style={[styles.stepDesc, { color: colors.textSecondary }]}>Real-time tracking and secure payments</Text>
          </View>
        </View>
      </View>
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
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    margin: 15, padding: 12, borderRadius: 10, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 15 },
  driverCard: {
    borderRadius: 10, padding: 15, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', elevation: 2,
  },
  driverAvatar: {
    width: 50, height: 50, borderRadius: 25,
    justifyContent: 'center', alignItems: 'center',
  },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#ffffff' },
  driverSchool: { fontSize: 13, color: '#888888', marginTop: 2 },
  driverMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  rating: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#ffffff', marginLeft: 3 },
  price: { marginLeft: 15, fontSize: 14, fontWeight: 'bold', color: '#FFB81C' },
  hireButton: { backgroundColor: '#007749', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  hireButtonText: { color: '#fff', fontWeight: 'bold' },
  stepCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 10, padding: 15, marginBottom: 10 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: '#fff', fontWeight: 'bold' },
  stepInfo: { marginLeft: 12 },
  stepTitle: { fontSize: 15, fontWeight: 'bold', color: '#ffffff' },
  stepDesc: { fontSize: 13, color: '#888888', marginTop: 2 },
  emptyContainer: { borderRadius: 10, padding: 40, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginTop: 15, marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888888', textAlign: 'center', lineHeight: 20 },
});

export default HireDriverScreen;
