import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

// ============ TYPES ============

interface Trip {
  id: string;
  date: string;
  time: string;
  childName: string;
  parentName: string;
  pickupLocation: string;
  dropoffLocation: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  earnings: number;
}

interface EarningsData {
  today: number;
  week: number;
  month: number;
  pendingPayout: number;
}

interface ComplianceStatus {
  pdp: boolean;
  roadworthy: boolean;
  license: boolean;
  insurance: boolean;
  vehiclePermit: boolean;
  overallStatus: 'pending' | 'approved' | 'rejected';
}

// ============ MOCK DATA ============

const MOCK_TRIPS: Trip[] = [
  {
    id: '1',
    date: '2026-02-14',
    time: '07:30',
    childName: 'Amahle Moyo',
    parentName: 'John Moyo',
    pickupLocation: '12 Oak Street, Sandton',
    dropoffLocation: 'Sandton Primary School',
    status: 'completed',
    earnings: 150,
  },
  {
    id: '2',
    date: '2026-02-14',
    time: '14:00',
    childName: 'Lethabo Moyo',
    parentName: 'John Moyo',
    pickupLocation: 'Sandton Primary School',
    dropoffLocation: '12 Oak Street, Sandton',
    status: 'in_progress',
    earnings: 150,
  },
  {
    id: '3',
    date: '2026-02-17',
    time: '07:30',
    childName: 'Amahle Moyo',
    parentName: 'John Moyo',
    pickupLocation: '12 Oak Street, Sandton',
    dropoffLocation: 'Sandton Primary School',
    status: 'pending',
    earnings: 150,
  },
];

const MOCK_EARNINGS: EarningsData = {
  today: 300,
  week: 2100,
  month: 8500,
  pendingPayout: 2500,
};

const MOCK_COMPLIANCE: ComplianceStatus = {
  pdp: true,
  roadworthy: true,
  license: true,
  insurance: true,
  vehiclePermit: false,
  overallStatus: 'pending',
};

// ============ MAIN COMPONENT ============

export default function DriverDashboard({ navigation }: any) {
  const [refreshing, setRefreshing] = useState(false);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [earnings, setEarnings] = useState<EarningsData>(MOCK_EARNINGS);
  const [compliance, setCompliance] = useState<ComplianceStatus | null>(null);
  const [vehicleName, setVehicleName] = useState('Toyota Quantum');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Load mock trips
      setTrips(MOCK_TRIPS);
      
      // Load compliance status from storage
      const storedCompliance = await AsyncStorage.getItem('driverCompliance');
      if (storedCompliance) {
        const parsed = JSON.parse(storedCompliance);
        setCompliance({
          pdp: true,
          roadworthy: true,
          license: true,
          insurance: true,
          vehiclePermit: true,
          overallStatus: 'approved',
        });
      } else {
        setCompliance(MOCK_COMPLIANCE);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
  };

  // ============ NAVIGATION HANDLERS ============

  const navigateToCompliance = () => {
    navigation.navigate('Compliance');
  };

  const navigateToTrip = (trip: Trip) => {
    navigation.navigate('Trip');
  };

  const navigateToEarnings = () => {
    navigation.navigate('Earnings');
  };

  // ============ LOGOUT ============

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            await AsyncStorage.removeItem('userRole');
            await AsyncStorage.removeItem('userEmail');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            });
          },
        },
      ],
    );
  };

  // ============ GET STATUS COLOR ============

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'in_progress':
        return '#007749';
      case 'pending':
        return '#FF9500';
      case 'cancelled':
        return '#FF3B30';
      default:
        return '#666';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  // ============ RENDER ============

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Driver Dashboard</Text>
          <Text style={styles.headerSubtitle}>{vehicleName}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#007749']} />
        }
      >
        {/* Earnings Summary */}
        <View style={styles.earningsContainer}>
          <View style={styles.earningsMain}>
            <Text style={styles.earningsLabel}>Today's Earnings</Text>
            <Text style={styles.earningsAmount}>R{earnings.today.toLocaleString()}</Text>
          </View>
          <View style={styles.earningsRow}>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemLabel}>This Week</Text>
              <Text style={styles.earningsItemValue}>R{earnings.week.toLocaleString()}</Text>
            </View>
            <View style={styles.earningsItem}>
              <Text style={styles.earningsItemLabel}>This Month</Text>
              <Text style={styles.earningsItemValue}>R{earnings.month.toLocaleString()}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.payoutButton} onPress={navigateToEarnings}>
            <Text style={styles.payoutButtonText}>View Payout Details</Text>
            <Ionicons name="chevron-forward" size={16} color="#007749" />
          </TouchableOpacity>
        </View>

        {/* Compliance Status */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Compliance Status</Text>
            <TouchableOpacity onPress={navigateToCompliance}>
              <Text style={styles.manageText}>Manage</Text>
            </TouchableOpacity>
          </View>
          
          {compliance && (
            <View>
              <View style={[
                styles.complianceBadge,
                compliance.overallStatus === 'approved' && styles.complianceApproved,
                compliance.overallStatus === 'pending' && styles.compliancePending,
                compliance.overallStatus === 'rejected' && styles.complianceRejected,
              ]}>
                <Ionicons 
                  name={compliance.overallStatus === 'approved' ? 'checkmark-circle' : 'time-outline'} 
                  size={16} 
                  color={compliance.overallStatus === 'approved' ? '#34C759' : '#FF9500'} 
                />
                <Text style={[
                  styles.complianceBadgeText,
                  compliance.overallStatus === 'approved' && styles.complianceApprovedText,
                  compliance.overallStatus === 'pending' && styles.compliancePendingText,
                ]}>
                  {compliance.overallStatus === 'approved' ? 'Approved' : 'Pending Review'}
                </Text>
              </View>

              <View style={styles.complianceList}>
                <View style={styles.complianceItem}>
                  <Ionicons name={compliance.pdp ? 'checkmark-circle' : 'close-circle'} size={18} color={compliance.pdp ? '#34C759' : '#FF3B30'} />
                  <Text style={styles.complianceItemText}>PDP License</Text>
                </View>
                <View style={styles.complianceItem}>
                  <Ionicons name={compliance.roadworthy ? 'checkmark-circle' : 'close-circle'} size={18} color={compliance.roadworthy ? '#34C759' : '#FF3B30'} />
                  <Text style={styles.complianceItemText}>Roadworthy</Text>
                </View>
                <View style={styles.complianceItem}>
                  <Ionicons name={compliance.license ? 'checkmark-circle' : 'close-circle'} size={18} color={compliance.license ? '#34C759' : '#FF3B30'} />
                  <Text style={styles.complianceItemText}>Driver's License</Text>
                </View>
                <View style={styles.complianceItem}>
                  <Ionicons name={compliance.insurance ? 'checkmark-circle' : 'close-circle'} size={18} color={compliance.insurance ? '#34C759' : '#FF3B30'} />
                  <Text style={styles.complianceItemText}>Insurance</Text>
                </View>
                <View style={styles.complianceItem}>
                  <Ionicons name={compliance.vehiclePermit ? 'checkmark-circle' : 'close-circle'} size={18} color={compliance.vehiclePermit ? '#34C759' : '#FF3B30'} />
                  <Text style={styles.complianceItemText}>Operating Permit</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Today's Trips */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚐 Today's Trips</Text>
            <Text style={styles.tripCount}>{trips.filter(t => t.date === '2026-02-14').length} trips</Text>
          </View>
          
          {trips.filter(t => t.date === '2026-02-14').length > 0 ? (
            trips.filter(t => t.date === '2026-02-14').map((trip) => (
              <TouchableOpacity 
                key={trip.id} 
                style={styles.tripCard}
                onPress={() => navigateToTrip(trip)}
              >
                <View style={styles.tripTimeBox}>
                  <Text style={styles.tripTimeText}>{trip.time}</Text>
                </View>
                <View style={styles.tripInfo}>
                  <Text style={styles.tripChild}>{trip.childName}</Text>
                  <Text style={styles.tripRoute}>
                    {trip.pickupLocation} → {trip.dropoffLocation}
                  </Text>
                  <Text style={styles.tripParent}>Parent: {trip.parentName}</Text>
                </View>
                <View style={styles.tripRight}>
                  <View style={[
                    styles.tripStatusBadge,
                    { backgroundColor: getStatusColor(trip.status) + '20' }
                  ]}>
                    <Text style={[
                      styles.tripStatusText,
                      { color: getStatusColor(trip.status) }
                    ]}>
                      {getStatusText(trip.status)}
                    </Text>
                  </View>
                  <Text style={styles.tripEarnings}>R{trip.earnings}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noTripsCard}>
              <Ionicons name="car-sport-outline" size={32} color="#ccc" />
              <Text style={styles.noTripsText}>No trips today</Text>
            </View>
          )}
        </View>

        {/* Upcoming Trips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Upcoming Trips</Text>
          
          {trips.filter(t => t.status === 'pending').length > 0 ? (
            trips.filter(t => t.status === 'pending').map((trip) => (
              <View key={trip.id} style={styles.upcomingTripCard}>
                <View style={styles.upcomingDateBox}>
                  <Text style={styles.upcomingDay}>{new Date(trip.date).getDate()}</Text>
                  <Text style={styles.upcomingMonth}>
                    {new Date(trip.date).toLocaleString('default', { month: 'short' })}
                  </Text>
                </View>
                <View style={styles.upcomingInfo}>
                  <Text style={styles.upcomingChild}>{trip.childName}</Text>
                  <Text style={styles.upcomingTime}>{trip.time} • {trip.pickupLocation}</Text>
                </View>
                <Text style={styles.upcomingEarnings}>R{trip.earnings}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.noUpcomingText}>No upcoming trips scheduled</Text>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickActionButton} onPress={navigateToCompliance}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="document-text" size={22} color="#007749" />
            </View>
            <Text style={styles.quickActionText}>Documents</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={() => navigation.navigate('Earnings')}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="wallet" size={22} color="#007749" />
            </View>
            <Text style={styles.quickActionText}>Earnings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickActionButton} onPress={() => Alert.alert('Support', 'Contact support@scholartrack.co.za')}>
            <View style={styles.quickActionIcon}>
              <Ionicons name="headset" size={22} color="#007749" />
            </View>
            <Text style={styles.quickActionText}>Support</Text>
          </TouchableOpacity>
        </View>

        {/* Emergency Button */}
        <TouchableOpacity style={styles.emergencyButton}>
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={styles.emergencyButtonText}>Emergency / Incident Report</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#007749',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },

  // Earnings
  earningsContainer: {
    backgroundColor: '#007749',
    margin: 16,
    padding: 20,
    borderRadius: 16,
  },
  earningsMain: {
    alignItems: 'center',
  },
  earningsLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  earningsAmount: {
    color: '#fff',
    fontSize: 42,
    fontWeight: 'bold',
    marginTop: 4,
  },
  earningsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  earningsItem: {
    alignItems: 'center',
  },
  earningsItemLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
  },
  earningsItemValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 2,
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 12,
  },
  payoutButtonText: {
    color: '#fff',
    fontWeight: '500',
  },

  // Section
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  manageText: {
    color: '#007749',
    fontWeight: '500',
  },
  tripCount: {
    color: '#666',
    fontSize: 14,
  },

  // Compliance
  complianceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 16,
  },
  complianceApproved: {
    backgroundColor: '#E8F5E9',
  },
  compliancePending: {
    backgroundColor: '#FFF3E0',
  },
  complianceRejected: {
    backgroundColor: '#FFEBEE',
  },
  complianceBadgeText: {
    marginLeft: 6,
    fontWeight: '600',
    fontSize: 13,
  },
  complianceApprovedText: {
    color: '#34C759',
  },
  compliancePendingText: {
    color: '#F57C00',
  },
  complianceList: {
    gap: 10,
  },
  complianceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  complianceItemText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
  },

  // Trip Card
  tripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  tripTimeBox: {
    backgroundColor: '#002395',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  tripTimeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  tripInfo: {
    flex: 1,
    marginLeft: 14,
  },
  tripChild: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  tripRoute: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  tripParent: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  tripRight: {
    alignItems: 'flex-end',
  },
  tripStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  tripStatusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tripEarnings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007749',
  },
  noTripsCard: {
    alignItems: 'center',
    padding: 20,
  },
  noTripsText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },

  // Upcoming Trips
  upcomingTripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    marginBottom: 8,
  },
  upcomingDateBox: {
    width: 44,
    height: 44,
    backgroundColor: '#002395',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  upcomingDay: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  upcomingMonth: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  upcomingInfo: {
    flex: 1,
    marginLeft: 12,
  },
  upcomingChild: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  upcomingTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  upcomingEarnings: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007749',
  },
  noUpcomingText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 20,
  },

  // Quick Actions
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  quickActionButton: {
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    width: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },

  // Emergency Button
  emergencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  emergencyButtonText: {
    marginLeft: 10,
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  bottomPadding: {
    height: 40,
  },
});
