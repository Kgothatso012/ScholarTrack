import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relation: string;
}

export default function EmergencyScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([
    { id: 1, name: 'Mom', phone: '078 123 4567', relation: 'Family' },
    { id: 2, name: 'Dad', phone: '082 987 6543', relation: 'Family' },
    { id: 3, name: 'School', phone: '012 345 6789', relation: 'School' },
  ]);

  const callEmergency = (name: string, phone: string) => {
    Alert.alert(`Call ${name}`, `Dialing ${phone}...`);
  };

  const sosAlert = () => {
    Alert.alert(
      '🚨 SEND SOS',
      'Send emergency alert to all contacts with your location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND SOS', style: 'destructive', onPress: () => {
          Alert.alert('SOS SENT!', 'Emergency contacts notified with your location!');
        }}
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Emergency Services</Text>
        <Text style={styles.headerSub}>Quick access to emergency help</Text>
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={styles.sosButton} onPress={sosAlert}>
        <Ionicons name="warning" size={40} color="#fff" />
        <Text style={styles.sosText}>HOLD FOR SOS</Text>
        <Text style={styles.sosSub}>Sends location to all contacts</Text>
      </TouchableOpacity>

      {/* Quick Dial */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📞 Quick Dial</Text>
        
        <TouchableOpacity style={styles.quickDial} onPress={() => callEmergency('Police', '10111')}>
          <View style={[styles.dialIcon, { backgroundColor: '#1565C0' }]}>
            <Text style={styles.dialEmoji}>🚔</Text>
          </View>
          <View style={styles.dialInfo}>
            <Text style={styles.dialName}>South African Police</Text>
            <Text style={styles.dialNumber}>10111</Text>
          </View>
          <Ionicons name="call" size={24} color="#4CAF50" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickDial} onPress={() => callEmergency('Ambulance', '10177')}>
          <View style={[styles.dialIcon, { backgroundColor: '#d32f2f' }]}>
            <Text style={styles.dialEmoji}>🚑</Text>
          </View>
          <View style={styles.dialInfo}>
            <Text style={styles.dialName}>Ambulance</Text>
            <Text style={styles.dialNumber}>10177</Text>
          </View>
          <Ionicons name="call" size={24} color="#4CAF50" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickDial} onPress={() => callEmergency('Fire', '10177')}>
          <View style={[styles.dialIcon, { backgroundColor: '#FF6F00' }]}>
            <Text style={styles.dialEmoji}>🚒</Text>
          </View>
          <View style={styles.dialInfo}>
            <Text style={styles.dialName}>Fire Department</Text>
            <Text style={styles.dialNumber}>10177</Text>
          </View>
          <Ionicons name="call" size={24} color="#4CAF50" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickDial} onPress={() => callEmergency('Intl SOS', '112')}>
          <View style={[styles.dialIcon, { backgroundColor: '#7B1FA2' }]}>
            <Text style={styles.dialEmoji}>🌍</Text>
          </View>
          <View style={styles.dialInfo}>
            <Text style={styles.dialName}>International SOS</Text>
            <Text style={styles.dialNumber}>112</Text>
          </View>
          <Ionicons name="call" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👨‍👩‍👧 Emergency Contacts</Text>
          <TouchableOpacity onPress={() => Alert.alert('Add', 'Add contact...')}>
            <Ionicons name="add-circle" size={28} color="#FFB81C" />
          </TouchableOpacity>
        </View>

        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.contactAvatar}>
              <Text style={styles.contactInitial}>{contact.name[0]}</Text>
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactName}>{contact.name}</Text>
              <Text style={styles.contactPhone}>{contact.phone}</Text>
              <Text style={styles.contactRelation}>{contact.relation}</Text>
            </View>
            <TouchableOpacity style={styles.callBtn} onPress={() => callEmergency(contact.name, contact.phone)}>
              <Ionicons name="call" size={20} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Safety Tips */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💡 Safety Tips</Text>
        
        <View style={styles.tipCard}>
          <Ionicons name="shield-checkmark" size={24} color="#4CAF50" />
          <Text style={styles.tipText}>Always share your trip with a family member</Text>
        </View>
        
        <View style={styles.tipCard}>
          <Ionicons name="document-text" size={24} color="#FFB81C" />
          <Text style={styles.tipText}>Verify your driver's details before starting</Text>
        </View>
        
        <View style={styles.tipCard}>
          <Ionicons name="warning" size={24} color="#d32f2f" />
          <Text style={styles.tipText}>Trust your instincts - report anything suspicious</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#000', padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  sosButton: { backgroundColor: '#d32f2f', margin: 20, padding: 30, borderRadius: 20, alignItems: 'center', elevation: 10 },
  sosText: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  sosSub: { color: '#ffcccc', fontSize: 12, marginTop: 5 },
  section: { padding: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  quickDial: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  dialIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  dialEmoji: { fontSize: 24 },
  dialInfo: { flex: 1, marginLeft: 15 },
  dialName: { fontSize: 14, fontWeight: 'bold', color: '#000' },
  dialNumber: { fontSize: 16, fontWeight: 'bold', color: '#4CAF50' },
  contactCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  contactAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  contactInitial: { fontSize: 18, fontWeight: 'bold', color: '#FFB81C' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  contactPhone: { fontSize: 14, color: '#666' },
  contactRelation: { fontSize: 11, color: '#999' },
  callBtn: { backgroundColor: '#E8F5E9', padding: 12, borderRadius: 25 },
  tipCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  tipText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#333' },
});
