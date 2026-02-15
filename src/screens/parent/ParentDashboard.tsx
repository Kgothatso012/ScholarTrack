import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const ParentDashboard = ({ navigation }: any) => {
  const [children] = useState([
    { id: 1, name: 'Thato', school: 'Mamelodi High', status: 'On route', driver: 'Mr. Molaba' },
    { id: 2, name: 'Lesego', school: 'St. Martins Primary', status: 'At school', driver: 'Pending' },
  ]);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👨‍👩‍👧 Parent Dashboard</Text>
        <Text style={styles.headerSubtext}>Welcome back!</Text>
      </View>

      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Track', 'Opening map...')}>
          <Ionicons name="map" size={24} color="#007749" />
          <Text style={styles.actionText}>Track Child</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionCard} onPress={() => Alert.alert('Emergency', 'Contacting emergency services...')}>
          <Ionicons name="warning" size={24} color="#d32f2f" />
          <Text style={styles.actionText}>Emergency</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>My Children</Text>
        {children.map((child) => (
          <View key={child.id} style={styles.childCard}>
            <View style={styles.childInfo}>
              <Text style={styles.childName}>{child.name}</Text>
              <Text style={styles.childSchool}>{child.school}</Text>
            </View>
            <View style={styles.childStatus}>
              <Text style={[styles.statusBadge, child.status === 'On route' ? styles.statusActive : styles.statusAtSchool]}>
                {child.status}
              </Text>
              <Text style={styles.driverName}>Driver: {child.driver}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Upcoming Trips</Text>
        <View style={styles.tripCard}>
          <Ionicons name="school" size={20} color="#002395" />
          <View style={styles.tripInfo}>
            <Text style={styles.tripTitle}>Morning - Mon, 15 Feb</Text>
            <Text style={styles.tripSubtitle}>Drop off at school</Text>
          </View>
          <Text style={styles.tripTime}>07:30</Text>
        </View>
        <View style={styles.tripCard}>
          <Ionicons name="home" size={20} color="#007749" />
          <View style={styles.tripInfo}>
            <Text style={styles.tripTitle}>Afternoon - Mon, 15 Feb</Text>
            <Text style={styles.tripSubtitle}>Pick up from school</Text>
          </View>
          <Text style={styles.tripTime}>14:30</Text>
        </View>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtext: {
    fontSize: 14,
    color: '#FFB81C',
    marginTop: 5,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#fff',
    marginTop: -20,
    marginHorizontal: 20,
    borderRadius: 10,
    elevation: 3,
  },
  actionCard: {
    alignItems: 'center',
    padding: 15,
  },
  actionText: {
    marginTop: 5,
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
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
  childCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    elevation: 2,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#002395',
  },
  childSchool: {
    fontSize: 14,
    color: '#666',
    marginTop: 3,
  },
  childStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusActive: {
    backgroundColor: '#007749',
  },
  statusAtSchool: {
    backgroundColor: '#002395',
  },
  driverName: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  tripCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  tripInfo: {
    flex: 1,
    marginLeft: 10,
  },
  tripTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  tripSubtitle: {
    fontSize: 12,
    color: '#666',
  },
  tripTime: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#002395',
  },
});

export default ParentDashboard;
