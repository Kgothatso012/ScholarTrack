import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AdminDashboard = ({ navigation }: any) => {
  const adminTools = [
    { name: 'Drivers', icon: 'car', count: 24, color: '#007749' },
    { name: 'Parents', icon: 'people', count: 156, color: '#002395' },
    { name: 'Schools', icon: 'school', count: 12, color: '#FFB81C' },
    { name: 'Trips', icon: 'navigate', count: 89, color: '#666' },
    { name: 'Payments', icon: 'card', color: '#007749' },
    { name: 'Reports', icon: 'document-text', color: '#002395' },
  ];

  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        (window as any).logout();
        (window as any).logout();
      }}
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>🏫 Admin Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>School Transport Management</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>24</Text>
          <Text style={styles.statLabel}>Active Drivers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>156</Text>
          <Text style={styles.statLabel}>Students</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>12</Text>
          <Text style={styles.statLabel}>Schools</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Management</Text>
        <View style={styles.grid}>
          {adminTools.map((tool, index) => (
            <TouchableOpacity key={index} style={styles.card}>
              <View style={[styles.iconContainer, { backgroundColor: tool.color + '20' }]}>
                <Ionicons name={tool.icon as any} size={28} color={tool.color} />
              </View>
              <Text style={styles.cardText}>{tool.name}</Text>
              {tool.count && <Text style={styles.cardCount}>{tool.count}</Text>}
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityCard}>
          <View style={styles.activityRow}>
            <Ionicons name="person-add" size={20} color="#007749" />
            <Text style={styles.activityText}>New driver registered</Text>
            <Text style={styles.activityTime}>2h ago</Text>
          </View>
          <View style={styles.activityRow}>
            <Ionicons name="car" size={20} color="#002395" />
            <Text style={styles.activityText}>Trip completed - Route 7</Text>
            <Text style={styles.activityTime}>4h ago</Text>
          </View>
          <View style={styles.activityRow}>
            <Ionicons name="card" size={20} color="#FFB81C" />
            <Text style={styles.activityText}>Payment received</Text>
            <Text style={styles.activityTime}>5h ago</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="person-add" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Add Driver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Ionicons name="school" size={20} color="#002395" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Manage Schools</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  logoutBtn: { padding: 5 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtitle: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  statsContainer: { flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#fff', marginTop: -20, marginHorizontal: 20, borderRadius: 10, elevation: 4 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#002395' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '48%', backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 15, alignItems: 'center', elevation: 2 },
  iconContainer: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  cardText: { fontSize: 14, fontWeight: '600', color: '#333' },
  cardCount: { fontSize: 12, color: '#666', marginTop: 5 },
  activityCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 },
  activityRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#eee' },
  activityText: { flex: 1, fontSize: 14, color: '#333', marginLeft: 10 },
  activityTime: { fontSize: 12, color: '#999' },
  actionButton: { backgroundColor: '#007749', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10, marginBottom: 10 },
  actionButtonText: { color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 10 },
  secondaryButton: { backgroundColor: '#fff', borderWidth: 2, borderColor: '#002395' },
  secondaryButtonText: { color: '#002395' },
});

export default AdminDashboard;
