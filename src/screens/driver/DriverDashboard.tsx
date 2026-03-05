import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';
import { tripService, paymentService, Driver, Trip, Payment } from '../../lib/api';

const DriverDashboard = ({ navigation }: any) => {
  const { colors } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Real data from API
  const [driverId, setDriverId] = useState<string | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [earnings, setEarnings] = useState({ today: 0, week: 0, month: 0 });
  const [routeData, setRouteData] = useState({ vehicle: '', routeName: '', students: 0, school: '', startTime: '' });

  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const userId = await AsyncStorage.getItem('userId');
      const driverIdFromStorage = await AsyncStorage.getItem('driverId');

      if (!userId) {
        setError('Please log in again');
        setLoading(false);
        return;
      }

      const dId = driverIdFromStorage || userId;
      setDriverId(dId);

      // Fetch trips
      const tripsData = await tripService.getTripsForDriver(dId);
      setTrips(tripsData || []);

      // Fetch payments
      const paymentsData = await paymentService.getPaymentsForDriver(dId);
      setPayments(paymentsData || []);

      // Calculate earnings
      const paidPayments = (paymentsData || []).filter(p => p.status === 'paid');
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const todayEarnings = paidPayments
        .filter(p => p.paid_at && p.paid_at.startsWith(todayStr))
        .reduce((sum, p) => sum + p.amount, 0);
      const weekEarnings = paidPayments
        .filter(p => p.paid_at && p.paid_at >= weekAgo)
        .reduce((sum, p) => sum + p.amount, 0);
      const monthEarnings = paidPayments
        .filter(p => p.paid_at && p.paid_at >= monthAgo)
        .reduce((sum, p) => sum + p.amount, 0);

      setEarnings({
        today: todayEarnings,
        week: weekEarnings,
        month: monthEarnings
      });

      // Set route data if there's a trip
      if (tripsData && tripsData.length > 0) {
        const nextTrip = tripsData.find(t => t.status === 'scheduled' || t.status === 'in_progress');
        if (nextTrip) {
          setRouteData({
            vehicle: 'Your Vehicle',
            routeName: nextTrip.pickup_location || 'Route',
            students: tripsData.length,
            school: nextTrip.dropoff_location || 'School',
            startTime: nextTrip.pickup_time || '--:--'
          });
        }
      }
    } catch (err: any) {
      console.error('Error fetching driver data:', err);
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        (window as any).logout();
      }}
    ]);
  };

  // Empty state component
  if (!loading && trips.length === 0 && payments.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <Text style={styles.headerTitle}>Driver Dashboard</Text>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
              <Ionicons name="log-out-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="car-outline" size={80} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>No Trips Yet</Text>
          <Text style={styles.emptyText}>
            You don't have any assigned trips yet. Trips will appear here once parents assign their children to your route.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Compliance')}>
              <Ionicons name="document-text" size={24} color="#007749" />
              <Text style={styles.actionText}>Compliance</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Earnings')}>
              <Ionicons name="cash" size={24} color="#FFB81C" />
              <Text style={styles.actionText}>Earnings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading your dashboard...</Text>
      </View>
    );
  }

  const paidCount = payments.filter(p => p.status === 'paid').length;
  const pendingCount = payments.filter(p => p.status === 'pending').length;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Driver Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        {routeData.routeName ? (
          <Text style={styles.headerSubtext}>{routeData.vehicle} - {routeData.routeName}</Text>
        ) : null}
      </View>

      {/* Quick Stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.card }]}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>R{earnings.today}</Text>
          <Text style={styles.statLabel}>Today's Earned</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Total Trips</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{payments.length}</Text>
          <Text style={styles.statLabel}>Payments</Text>
        </View>
      </View>

      {/* Route Info */}
      {routeData.routeName ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Route</Text>
          <View style={[styles.routeCard, { backgroundColor: colors.card }]}>
            <View style={styles.routeRow}>
              <Ionicons name="navigate" size={20} color="#007749" />
              <View style={styles.routeInfo}>
                <Text style={[styles.routeName, { color: colors.text }]}>{routeData.routeName}</Text>
                <Text style={[styles.routeTime, { color: colors.textSecondary }]}>Start: {routeData.startTime}</Text>
              </View>
            </View>
            <View style={styles.routeRow}>
              <Ionicons name="school" size={20} color="#002395" />
              <View style={styles.routeInfo}>
                <Text style={[styles.routeName, { color: colors.text }]}>{routeData.school}</Text>
                <Text style={[styles.routeTime, { color: colors.textSecondary }]}>{routeData.students} students</Text>
              </View>
            </View>
          </View>
        </View>
      ) : null}

      {/* Payment Status */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Status</Text>
          <View style={[styles.paymentBadge, { backgroundColor: '#007749' }]}>
            <Text style={styles.paymentBadgeText}>{paidCount}/{payments.length} Paid</Text>
          </View>
        </View>

        {payments.length > 0 ? (
          <>
            <View style={styles.paymentSummary}>
              <View style={[styles.paymentStat, { backgroundColor: '#00774920' }]}>
                <Text style={[styles.paymentStatNum, { color: '#FFB81C' }]}>{paidCount}</Text>
                <Text style={[styles.paymentStatLabel, { color: colors.textSecondary }]}>Paid</Text>
              </View>
              <View style={[styles.paymentStat, { backgroundColor: '#FFB81C20' }]}>
                <Text style={[styles.paymentStatNum, { color: '#FFB81C' }]}>{pendingCount}</Text>
                <Text style={[styles.paymentStatLabel, { color: colors.textSecondary }]}>Pending</Text>
              </View>
              <View style={[styles.paymentStat, { backgroundColor: '#00239520' }]}>
                <Text style={[styles.paymentStatNum, { color: '#FFB81C' }]}>R{earnings.today}</Text>
                <Text style={[styles.paymentStatLabel, { color: colors.textSecondary }]}>Collected</Text>
              </View>
            </View>

            {payments.slice(0, 5).map((payment) => (
              <View
                key={payment.id}
                style={[styles.paymentCard, { backgroundColor: colors.card }, payment.status === 'pending' && styles.paymentPending]}
              >
                <View style={styles.paymentLeft}>
                  <View style={[styles.avatar, payment.status === 'paid' ? styles.avatarPaid : styles.avatarPending]}>
                    <Ionicons name="person" size={18} color="#fff" />
                  </View>
                  <View>
                    <Text style={[styles.paymentParent, { color: colors.text }]}>Parent Payment</Text>
                    <Text style={[styles.paymentStudent, { color: colors.textSecondary }]}>{payment.month}</Text>
                  </View>
                </View>
                <View style={styles.paymentRight}>
                  <Text style={styles.paymentAmount}>R{payment.amount}</Text>
                  <View style={[styles.statusBadge, payment.status === 'paid' ? styles.badgePaid : styles.badgePending]}>
                    <Text style={styles.statusText}>
                      {payment.status === 'paid' ? 'Paid' : 'Pending'}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </>
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons name="cash-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No payments yet</Text>
          </View>
        )}
      </View>

      {/* Trips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your Trips</Text>
        {trips.length > 0 ? (
          trips.slice(0, 10).map((trip) => (
            <View key={trip.id} style={[styles.tripCard, { backgroundColor: colors.card }]}>
              <View style={styles.tripTimeBox}>
                <Text style={styles.tripTime}>
                  {trip.pickup_time ? new Date(trip.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </Text>
                <Text style={[styles.tripType, { color: colors.textSecondary }]}>
                  {trip.status === 'completed' ? 'Done' : trip.status === 'in_progress' ? 'Active' : 'Scheduled'}
                </Text>
              </View>
              <View style={styles.tripInfo}>
                <Text style={[styles.tripName, { color: colors.text }]}>{trip.pickup_location || 'Pickup'}</Text>
                <Text style={[styles.tripStudents, { color: colors.textSecondary }]}>{trip.dropoff_location || 'Dropoff'}</Text>
              </View>
              <View style={[styles.tripStatus, trip.status === 'completed' ? styles.tripCompleted : trip.status === 'in_progress' ? styles.tripActive : styles.tripPending]}>
                <Text style={styles.tripStatusText}>
                  {trip.status === 'completed' ? 'Done' : trip.status === 'in_progress' ? 'Active' : 'Upcoming'}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons name="bus-outline" size={40} color={colors.textSecondary} />
            <Text style={[styles.emptyCardText, { color: colors.textSecondary }]}>No trips assigned yet</Text>
          </View>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Compliance')}>
            <Ionicons name="document-text" size={24} color="#007749" />
            <Text style={[styles.actionText, { color: colors.text }]}>Compliance</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Trip')}>
            <Ionicons name="navigate" size={24} color="#002395" />
            <Text style={[styles.actionText, { color: colors.text }]}>Start Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card }]} onPress={() => navigation.navigate('Earnings')}>
            <Ionicons name="cash" size={24} color="#FFB81C" />
            <Text style={[styles.actionText, { color: colors.text }]}>Earnings</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card }]} onPress={() => Alert.alert('Help', 'Contact support: 0800 123 456')}>
            <Ionicons name="call" size={24} color="#d32f2f" />
            <Text style={[styles.actionText, { color: colors.text }]}>Emergency</Text>
          </TouchableOpacity>
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
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { padding: 5 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 13, color: '#FFB81C', marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, marginTop: -15, marginHorizontal: 15, borderRadius: 12, elevation: 3 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#FFB81C' },
  statLabel: { fontSize: 12, color: '#888888', marginTop: 3 },
  section: { padding: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 12 },
  paymentBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  paymentBadgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  paymentSummary: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 15 },
  paymentStat: { padding: 12, borderRadius: 10, alignItems: 'center', flex: 1, marginHorizontal: 4 },
  paymentStatNum: { fontSize: 20, fontWeight: 'bold' },
  paymentStatLabel: { fontSize: 11, color: '#888888', marginTop: 3 },
  paymentCard: { borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  paymentPending: { borderLeftWidth: 3, borderLeftColor: '#FFB81C' },
  paymentLeft: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 10 },
  avatarPaid: { backgroundColor: '#007749' },
  avatarPending: { backgroundColor: '#FFB81C' },
  paymentParent: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  paymentStudent: { fontSize: 12, color: '#888888' },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 14, fontWeight: 'bold', color: '#FFB81C' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, marginTop: 4 },
  badgePaid: { backgroundColor: '#007749' },
  badgePending: { backgroundColor: '#FFB81C' },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  routeCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 },
  routeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  routeInfo: { marginLeft: 12 },
  routeName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  routeTime: { fontSize: 12, color: '#888888' },
  tripCard: { borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  tripTimeBox: { alignItems: 'center', marginRight: 12 },
  tripTime: { fontSize: 14, fontWeight: 'bold', color: '#FFB81C' },
  tripType: { fontSize: 11, color: '#888888' },
  tripInfo: { flex: 1 },
  tripName: { fontSize: 14, fontWeight: 'bold', color: '#ffffff' },
  tripStudents: { fontSize: 12, color: '#888888' },
  tripStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  tripCompleted: { backgroundColor: '#007749' },
  tripActive: { backgroundColor: '#002395' },
  tripPending: { backgroundColor: '#FFB81C' },
  tripStatusText: { color: '#fff', fontSize: 11, fontWeight: 'bold' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionBtn: { width: '48%', borderRadius: 10, padding: 15, alignItems: 'center', marginBottom: 10, elevation: 2 },
  actionText: { fontSize: 13, color: '#ffffff', marginTop: 5, fontWeight: '600' },
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginTop: 20, marginBottom: 10 },
  emptyText: { fontSize: 14, color: '#888888', textAlign: 'center', lineHeight: 20 },
  emptyCard: { borderRadius: 10, padding: 30, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyCardText: { fontSize: 14, marginTop: 10 },
});

export default DriverDashboard;
