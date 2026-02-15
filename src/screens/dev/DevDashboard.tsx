import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DevDashboard = ({ navigation }: any) => {
  
  const handleLogout = async () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        (window as any).logout();
        (window as any).logout();
      }}
    ]);
  };
  const devTools = [
    { name: 'API Console', icon: 'code-slash', color: '#007749' },
    { name: 'Database', icon: 'server', color: '#002395' },
    { name: 'Logs', icon: 'list', color: '#FFB81C' },
    { name: 'Settings', icon: 'settings', color: '#666' },
    { name: 'Users', icon: 'people', color: '#007749' },
    { name: 'Routes', icon: 'map', color: '#002395' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>🛠️ Dev Dashboard</Text>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.headerSubtitle}>ScholarTrack Development Tools</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Development Tools</Text>
        <View style={styles.grid}>
          {devTools.map((tool, index) => (
            <TouchableOpacity key={index} style={styles.card}>
              <Ionicons name={tool.icon as keyof typeof Ionicons.glyphMap} size={32} color={tool.color} />
              <Text style={styles.cardText}>{tool.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>System Status</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>API Status</Text>
            <Text style={styles.statusValue}>🟢 Online</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Database</Text>
            <Text style={styles.statusValue}>🟢 Connected</Text>
          </View>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Environment</Text>
            <Text style={styles.statusValue}>Development</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="refresh" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Sync Database</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]}>
          <Ionicons name="download" size={20} color="#002395" />
          <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>Export Logs</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#002395',
    padding: 20,
    paddingTop: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoutBtn: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFB81C',
    marginTop: 5,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    marginBottom: 15,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardText: {
    marginTop: 10,
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusLabel: {
    fontSize: 14,
    color: '#666',
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  actionButton: {
    backgroundColor: '#007749',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#002395',
  },
  secondaryButtonText: {
    color: '#002395',
  },
});

export default DevDashboard;
