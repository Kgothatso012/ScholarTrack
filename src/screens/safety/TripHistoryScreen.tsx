import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface Trip {
  id: number;
  date: string;
  route: string;
  school: string;
  time: string;
  status: 'completed' | 'cancelled' | 'delayed';
  driver: string;
  students: number;
}

export default function TripHistoryScreen() {
  const { colors } = useTheme();
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  const trips: Trip[] = [
    { id: 1, date: '2026-02-15', route: 'Mamelodi Morning', school: 'Mamelodi High', time: '06:30 - 07:15', status: 'completed', driver: 'Mr. John Molaba', students: 8 },
    { id: 2, date: '2026-02-14', route: 'Mamelodi Morning', school: 'Mamelodi High', time: '06:30 - 07:20', status: 'delayed', driver: 'Mr. John Molaba', students: 7 },
    { id: 3, date: '2026-02-13', route: 'Mamelodi Morning', school: 'Mamelodi High', time: '06:30 - 07:15', status: 'completed', driver: 'Mr. John Molaba', students: 8 },
    { id: 4, date: '2026-02-12', route: 'Mamelodi Morning', school: 'Mamelodi High', time: '06:30 - 07:15', status: 'cancelled', driver: 'Mr. John Molaba', students: 0 },
    { id: 5, date: '2026-02-11', route: 'Mamelodi Morning', school: 'Mamelodi High', time: '06:30 - 07:15', status: 'completed', driver: 'Mr. John Molaba', students: 8 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'cancelled': return colors.error;
      case 'delayed': return colors.warning;
      default: return colors.textSecondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return 'checkmark-circle';
      case 'cancelled': return 'close-circle';
      case 'delayed': return 'time';
      default: return 'help-circle';
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textInverse },
    filters: { flexDirection: 'row', padding: 15, backgroundColor: colors.card, marginHorizontal: 15, marginTop: -10, borderRadius: 10, elevation: 3 },
    filterBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 8, marginHorizontal: 3 },
    filterActive: { backgroundColor: colors.primary },
    filterText: { color: colors.textSecondary, fontWeight: '600' },
    filterTextActive: { color: colors.textInverse },
    section: { padding: 15 },
    tripCard: { backgroundColor: colors.card, borderRadius: 12, padding: 15, marginBottom: 10, elevation: 2 },
    tripHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    tripDate: { fontSize: 12, color: colors.textSecondary },
    tripStatus: { flexDirection: 'row', alignItems: 'center' },
    tripStatusIcon: { marginRight: 4 },
    tripRoute: { fontSize: 16, fontWeight: 'bold', color: colors.text, marginBottom: 4 },
    tripDetails: { flexDirection: 'row', justifyContent: 'space-between' },
    tripDetail: { flexDirection: 'row', alignItems: 'center' },
    tripDetailText: { fontSize: 12, color: colors.textSecondary, marginLeft: 4 },
    emptyState: { alignItems: 'center', padding: 40 },
    emptyText: { color: colors.textSecondary, marginTop: 10 },
  });

  const filteredTrips = filter === 'all' ? trips : trips.filter(t => t.status === filter);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trip History</Text>
      </View>

      <View style={styles.filters}>
        {(['all', 'completed', 'cancelled'] as const).map((f) => (
          <TouchableOpacity key={f} style={[styles.filterBtn, filter === f && styles.filterActive]} onPress={() => setFilter(f)}>
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>{f.charAt(0).toUpperCase() + f.slice(1)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        {filteredTrips.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="bus-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>No trips found</Text>
          </View>
        ) : (
          filteredTrips.map((trip) => (
            <View key={trip.id} style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripDate}>{trip.date}</Text>
                <View style={styles.tripStatus}>
                  <Ionicons name={getStatusIcon(trip.status) as any} size={16} color={getStatusColor(trip.status)} style={styles.tripStatusIcon} />
                  <Text style={{ color: getStatusColor(trip.status), fontWeight: '600', fontSize: 12 }}>{trip.status.toUpperCase()}</Text>
                </View>
              </View>
              <Text style={styles.tripRoute}>{trip.route}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginBottom: 10 }}>{trip.school} - {trip.time}</Text>
              <View style={styles.tripDetails}>
                <View style={styles.tripDetail}>
                  <Ionicons name="person" size={14} color={colors.textSecondary} />
                  <Text style={styles.tripDetailText}>{trip.driver}</Text>
                </View>
                <View style={styles.tripDetail}>
                  <Ionicons name="people" size={14} color={colors.textSecondary} />
                  <Text style={styles.tripDetailText}>{trip.students} students</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
