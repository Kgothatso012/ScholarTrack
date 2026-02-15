import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Trip {
  id: number;
  date: string;
  route: string;
  school: string;
  time: string;
  status: 'completed' | 'cancelled' | 'delayed';
  driver: string;
  students: number;
  duration: string;
  distance: string;
}

export default function TripHistoryScreen() {
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  const trips: Trip[] = [
    {
      id: 1,
      date: '2026-02-15',
      route: 'Mamelodi Morning',
      school: 'Mamelodi High',
      time: '06:30 - 07:15',
      status: 'completed',
      driver: 'Mr. John Molaba',
      students: 8,
      duration: '45 min',
      distance: '12 km',
    },
    {
      id: 2,
      date: '2026-02-14',
      route: 'Mamelodi Morning',
      school: 'Mamelodi High',
      time: '06:30 - 07:20',
      status: 'delayed',
      driver: 'Mr. John Molaba',
      students: 7,
      duration: '50 min',
      distance: '12 km',
    },
    {
      id: 3,
      date: '2026-02-13',
      route: 'Mamelodi Morning',
      school: 'Mamelodi High',
      time: '06:30 - 07:15',
      status: 'completed',
      driver: 'Mr. John Molaba',
      students: 8,
      duration: '45 min',
      distance: '12 km',
    },
    {
      id: 4,
      date: '2026-02-12',
      route: 'Mamelodi Morning',
      school: 'Mamelodi High',
      time: '06:30 - 07:15',
      status: 'completed',
      driver: 'Mr. John Molaba',
      students: 8,
      duration: '45 min',
      distance: '12 km',
    },
    {
      id: 5,
      date: '2026-02-11',
      route: 'Mamelodi Morning',
      school: 'Mamelodi High',
      time: 'Cancelled',
      status: 'cancelled',
      driver: 'Mrs. Sarah Nkosi',
      students: 0,
      duration: '-',
      distance: '-',
    },
    {
      id: 6,
      date: '2026-02-10',
      route: 'Mamelodi Morning',
      school: 'Mamelodi High',
      time: '06:30 - 07:15',
      status: 'completed',
      driver: 'Mr. John Molaba',
      students: 8,
      duration: '45 min',
      distance: '12 km',
    },
  ];

  const filteredTrips = filter === 'all' ? trips : trips.filter(t => t.status === filter);

  const completedCount = trips.filter(t => t.status === 'completed').length;
  const cancelledCount = trips.filter(t => t.status === 'cancelled').length;
  const delayedCount = trips.filter(t => t.status === 'delayed').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#007749';
      case 'cancelled': return '#d32f2f';
      case 'delayed': return '#FFB81C';
      default: return '#666';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'delayed': return 'warning';
      default: return 'help-circle';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Trip History</Text>
        <Text style={styles.headerSubtext}>All past trips</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <TouchableOpacity 
          style={[styles.statCard, filter === 'all' && styles.statCardActive]} 
          onPress={() => setFilter('all')}
        >
          <Text style={styles.statNumber}>{trips.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statCard, filter === 'completed' && styles.statCardActive]} 
          onPress={() => setFilter('completed')}
        >
          <Text style={[styles.statNumber, { color: '#007749' }]}>{completedCount}</Text>
          <Text style={styles.statLabel}>Completed</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.statCard, filter === 'cancelled' && styles.statCardActive]} 
          onPress={() => setFilter('cancelled')}
        >
          <Text style={[styles.statNumber, { color: '#d32f2f' }]}>{cancelledCount}</Text>
          <Text style={styles.statLabel}>Cancelled</Text>
        </TouchableOpacity>
      </View>

      {/* Trip List */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          {filter === 'all' ? 'All Trips' : filter === 'completed' ? 'Completed Trips' : 'Cancelled Trips'}
        </Text>
        
        {filteredTrips.map((trip) => (
          <View key={trip.id} style={styles.tripCard}>
            <View style={styles.tripHeader}>
              <View style={styles.tripDate}>
                <Text style={styles.tripDay}>{new Date(trip.date).getDate()}</Text>
                <Text style={styles.tripMonth}>{new Date(trip.date).toLocaleString('default', { month: 'short' })}</Text>
              </View>
              <View style={styles.tripInfo}>
                <Text style={styles.tripRoute}>{trip.route}</Text>
                <Text style={styles.tripSchool}>{trip.school}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(trip.status) }]}>
                <Ionicons name={getStatusIcon(trip.status) as any} size={12} color="#fff" />
                <Text style={styles.statusText}>{trip.status}</Text>
              </View>
            </View>

            <View style={styles.tripDetails}>
              <View style={styles.detailItem}>
                <Ionicons name="time" size={14} color="#666" />
                <Text style={styles.detailText}>{trip.time}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="person" size={14} color="#666" />
                <Text style={styles.detailText}>{trip.driver}</Text>
              </View>
              <View style={styles.detailItem}>
                <Ionicons name="people" size={14} color="#666" />
                <Text style={styles.detailText}>{trip.students} students</Text>
              </View>
            </View>

            <View style={styles.tripStats}>
              <View style={styles.statItem}>
                <Ionicons name="speedometer" size={14} color="#002395" />
                <Text style={styles.statText}>{trip.duration}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="navigate" size={14} color="#002395" />
                <Text style={styles.statText}>{trip.distance}</Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Monthly Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Monthly Summary</Text>
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>This Month</Text>
            <Text style={styles.summaryValue}>{completedCount} trips</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>On-time Rate</Text>
            <Text style={styles.summaryValue}>{(completedCount / (completedCount + delayedCount) * 100).toFixed(0)}%</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Most Used Route</Text>
            <Text style={styles.summaryValue}>Mamelodi Morning</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 13, color: '#FFB81C', marginTop: 5 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#fff', marginTop: -15, marginHorizontal: 15, borderRadius: 12, elevation: 3 },
  statCard: { alignItems: 'center', paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10 },
  statCardActive: { backgroundColor: '#e3f2fd' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#002395' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 3 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  tripCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2 },
  tripHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  tripDate: { width: 50, height: 50, backgroundColor: '#e3f2fd', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  tripDay: { fontSize: 20, fontWeight: 'bold', color: '#002395' },
  tripMonth: { fontSize: 11, color: '#002395', textTransform: 'uppercase' },
  tripInfo: { flex: 1, marginLeft: 12 },
  tripRoute: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  tripSchool: { fontSize: 13, color: '#666', marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold', marginLeft: 4, textTransform: 'capitalize' },
  tripDetails: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  detailItem: { flexDirection: 'row', alignItems: 'center', width: '50%', marginBottom: 5 },
  detailText: { fontSize: 13, color: '#666', marginLeft: 6 },
  tripStats: { flexDirection: 'row', justifyContent: 'space-around' },
  statItem: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: 13, color: '#002395', fontWeight: 'bold', marginLeft: 5 },
  summaryCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 14, fontWeight: 'bold', color: '#333' },
});
