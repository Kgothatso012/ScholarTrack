import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, Child, Trip } from '../../lib/supabase';
import { useTheme } from '../../context/ThemeContext';

const ParentDashboard = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<Child[]>([]);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const email = await AsyncStorage.getItem('userEmail');
      setUserEmail(email || '');

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      const { data: childrenData, error: childrenError } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (childrenError) throw childrenError;
      setChildren(childrenData || []);

      if (childrenData && childrenData.length > 0) {
        const childIds = childrenData.map((c: Child) => c.id);

        const { data: tripsData, error: tripsError } = await supabase
          .from('trips')
          .select('*')
          .in('child_id', childIds)
          .order('scheduled_time', { ascending: true })
          .limit(5);

        if (!tripsError) {
          setTrips(tripsData || []);
        }
      }
    } catch (error: any) {
      console.error('Error loading data:', error);
      setChildren([]);
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return colors.primary;
      case 'in_progress': return colors.success;
      case 'completed': return colors.textSecondary;
      case 'cancelled': return colors.error;
      default: return colors.textSecondary;
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-ZA', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' });
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    centered: { justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: colors.textSecondary },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 40 },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    logoutBtn: { padding: 5 },
    headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textInverse },
    headerSubtext: { fontSize: 14, color: colors.accent, marginTop: 5 },
    quickActions: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: colors.card, marginTop: -20, marginHorizontal: 20, borderRadius: 10, elevation: 3 },
    actionCard: { alignItems: 'center', padding: 15 },
    actionText: { marginTop: 5, fontSize: 12, color: colors.text, fontWeight: '600' },
    section: { padding: 20 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    seeAll: { color: colors.accent, fontWeight: '600' },
    emptyState: { alignItems: 'center', padding: 30, backgroundColor: colors.card, borderRadius: 10 },
    emptyText: { marginTop: 10, color: colors.textSecondary, fontSize: 14 },
    addButton: { marginTop: 15, backgroundColor: colors.success, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    addButtonText: { color: colors.textInverse, fontWeight: '600' },
    childCard: { backgroundColor: colors.card, borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', elevation: 2 },
    childInfo: { flex: 1 },
    childName: { fontSize: 16, fontWeight: 'bold', color: colors.accent },
    childSchool: { fontSize: 14, color: colors.textSecondary, marginTop: 3 },
    childStatus: { alignItems: 'flex-end' },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, fontSize: 12, fontWeight: 'bold', color: colors.textInverse },
    statusActive: { backgroundColor: colors.success },
    statusInactive: { backgroundColor: colors.textSecondary },
    tripCard: { backgroundColor: colors.card, borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    tripInfo: { flex: 1, marginLeft: 10 },
    tripTitle: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    tripSubtitle: { fontSize: 12, color: colors.textSecondary },
    tripRight: { alignItems: 'flex-end' },
    tripTime: { fontSize: 16, fontWeight: 'bold', color: colors.accent, marginBottom: 5 },
    linkCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: 10, padding: 15, marginBottom: 10 },
    linkText: { flex: 1, marginLeft: 15, fontSize: 16, color: colors.text },
  });

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles.loadingText}>Loading your data...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Parent Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtext}>{userEmail || 'Welcome back!'}</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Live')}>
          <Ionicons name="map" size={24} color={colors.success} />
          <Text style={styles.actionText}>Track Child</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Hire')}>
          <Ionicons name="person-add" size={24} color={colors.primary} />
          <Text style={styles.actionText}>Hire Driver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => navigation.navigate('Emergency')}>
          <Ionicons name="warning" size={24} color={colors.error} />
          <Text style={styles.actionText}>Emergency</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Children</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Children')}>
            <Text style={styles.seeAll}>Add Child +</Text>
          </TouchableOpacity>
        </View>

        {children.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No children added yet</Text>
            <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('Children')}>
              <Text style={styles.addButtonText}>Add Your First Child</Text>
            </TouchableOpacity>
          </View>
        ) : (
          children.map((child) => (
            <View key={child.id} style={styles.childCard}>
              <View style={styles.childInfo}>
                <Text style={styles.childName}>{child.full_name}</Text>
                <Text style={styles.childSchool}>{child.grade ? `Grade: ${child.grade}` : 'School not set'}</Text>
              </View>
              <View style={styles.childStatus}>
                <Text style={[styles.statusBadge, child.status === 'active' ? styles.statusActive : styles.statusInactive]}>
                  {child.status === 'active' ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Trips</Text>

        {trips.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No upcoming trips</Text>
          </View>
        ) : (
          trips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <Ionicons
                name={trip.dropoff_location ? 'home' : 'school'}
                size={20}
                color={trip.dropoff_location ? colors.success : colors.primary}
              />
              <View style={styles.tripInfo}>
                <Text style={styles.tripTitle}>
                  {trip.dropoff_location ? 'Drop off' : 'Pick up'} - {formatDate(trip.scheduled_time)}
                </Text>
                <Text style={styles.tripSubtitle}>
                  {trip.pickup_location || 'Location not set'}
                </Text>
              </View>
              <View style={styles.tripRight}>
                <Text style={styles.tripTime}>{formatTime(trip.scheduled_time)}</Text>
                <Text style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                  {getTripStatus(trip)}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Links</Text>
        <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Payments')}>
          <Ionicons name="card" size={24} color={colors.primary} />
          <Text style={styles.linkText}>View Payments</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkCard} onPress={() => navigation.navigate('Support')}>
          <Ionicons name="help-circle" size={24} color={colors.primary} />
          <Text style={styles.linkText}>Get Support</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ParentDashboard;
