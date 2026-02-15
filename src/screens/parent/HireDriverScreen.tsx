import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HireDriverScreen = ({ navigation }: any) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [drivers] = useState([
    { id: 1, name: 'John Molaba', rating: 4.8, school: 'Mamelodi High', price: 'R800/mo', verified: true },
    { id: 2, name: 'Sarah Nkosi', rating: 4.9, school: 'St. Martins', price: 'R750/mo', verified: true },
    { id: 3, name: 'Mike Sithole', rating: 4.5, school: 'Pretoria East', price: 'R700/mo', verified: true },
  ]);

  const hireDriver = (driverName: string) => {
    Alert.alert('Request Sent', `Request sent to ${driverName}. They will contact you shortly.`, [
      { text: 'OK' }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚗 Hire a Driver</Text>
        <Text style={styles.headerSubtext}>Find vetted drivers near you</Text>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by school or area..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Available Drivers</Text>
        {drivers.map((driver) => (
          <View key={driver.id} style={styles.driverCard}>
            <View style={styles.driverAvatar}>
              <Ionicons name="person" size={30} color="#fff" />
            </View>
            <View style={styles.driverInfo}>
              <View style={styles.driverNameRow}>
                <Text style={styles.driverName}>{driver.name}</Text>
                {driver.verified && <Ionicons name="checkmark-circle" size={16} color="#007749" />}
              </View>
              <Text style={styles.driverSchool}>School: {driver.school}</Text>
              <View style={styles.driverMeta}>
                <View style={styles.rating}>
                  <Ionicons name="star" size={14} color="#FFB81C" />
                  <Text style={styles.ratingText}>{driver.rating}</Text>
                </View>
                <Text style={styles.price}>{driver.price}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.hireButton} onPress={() => hireDriver(driver.name)}>
              <Text style={styles.hireButtonText}>Hire</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>How It Works</Text>
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Search Drivers</Text>
            <Text style={styles.stepDesc}>Find drivers serving your child's school</Text>
          </View>
        </View>
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Request & Connect</Text>
            <Text style={styles.stepDesc}>Send a request and discuss terms</Text>
          </View>
        </View>
        <View style={styles.stepCard}>
          <View style={styles.stepNumber}><Text style={styles.stepNumberText}>3</Text></View>
          <View style={styles.stepInfo}>
            <Text style={styles.stepTitle}>Track & Pay Monthly</Text>
            <Text style={styles.stepDesc}>Real-time tracking and secure payments</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff',
    margin: 15, padding: 12, borderRadius: 10, elevation: 2,
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  driverCard: {
    backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center', elevation: 2,
  },
  driverAvatar: {
    width: 50, height: 50, borderRadius: 25, backgroundColor: '#002395',
    justifyContent: 'center', alignItems: 'center',
  },
  driverInfo: { flex: 1, marginLeft: 12 },
  driverNameRow: { flexDirection: 'row', alignItems: 'center' },
  driverName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  driverSchool: { fontSize: 13, color: '#666', marginTop: 2 },
  driverMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 5 },
  rating: { flexDirection: 'row', alignItems: 'center' },
  ratingText: { fontSize: 13, color: '#333', marginLeft: 3 },
  price: { marginLeft: 15, fontSize: 14, fontWeight: 'bold', color: '#007749' },
  hireButton: { backgroundColor: '#007749', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
  hireButtonText: { color: '#fff', fontWeight: 'bold' },
  stepCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10 },
  stepNumber: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#002395', justifyContent: 'center', alignItems: 'center' },
  stepNumberText: { color: '#fff', fontWeight: 'bold' },
  stepInfo: { marginLeft: 12 },
  stepTitle: { fontSize: 15, fontWeight: 'bold', color: '#333' },
  stepDesc: { fontSize: 13, color: '#666', marginTop: 2 },
});

export default HireDriverScreen;
