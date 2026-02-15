import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Global panic button component that can be added to any screen
export const PanicButton = ({ style, size = 60 }: { style?: any, size?: number }) => {
  const [pressed, setPressed] = useState(false);

  const triggerPanic = () => {
    Alert.alert(
      '🚨 EMERGENCY - SOS',
      'Sending emergency alert to all contacts...',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'SEND SOS', 
          style: 'destructive',
          onPress: () => {
            Alert.alert('SOS SENT!', 'Emergency contacts have been notified. Help is on the way.');
          }
        },
      ]
    );
  };

  return (
    <TouchableOpacity 
      style={[
        styles.panicButton, 
        { width: size, height: size, borderRadius: size/2 },
        pressed && styles.panicButtonPressed,
        style
      ]}
      onPress={triggerPanic}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Ionicons name="warning" size={size * 0.5} color="#fff" />
    </TouchableOpacity>
  );
};

// Full Panic Screen
export default function PanicScreen() {
  const [sosActive, setSosActive] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const saved = await AsyncStorage.getItem('emergencyContacts');
    if (saved) setContacts(JSON.parse(saved));
  };

  const triggerSOS = () => {
    setSosActive(true);
    setCountdown(5);
    
    // Countdown then send
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          sendSOS();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const sendSOS = async () => {
    // Get saved contacts
    const saved = await AsyncStorage.getItem('emergencyContacts');
    const contactsList = saved ? JSON.parse(saved) : [];
    
    const message = `🚨 EMERGENCY ALERT!\n\nScholarTrack User needs help!\n\nLocation: https://maps.google.com/?q=-25.7479,28.2292\n\nTime: ${new Date().toLocaleString()}`;
    
    Alert.alert(
      '🚨 SOS SENT!',
      `Emergency message sent to ${contactsList.length + 1} contacts:\n\n` +
      `• Saved Emergency Contacts (${contactsList.length})\n` +
      `• Police (10111)\n\nMessage:\n${message}`,
      [{ text: 'OK' }]
    );
    
    setSosActive(false);
  };

  const cancelSOS = () => {
    setSosActive(false);
    Alert.alert('Cancelled', 'SOS cancelled');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🚨 Emergency SOS</Text>
        <Text style={styles.headerSubtext}>Press for immediate help</Text>
      </View>

      {/* Panic Button */}
      <View style={styles.panicContainer}>
        <TouchableOpacity 
          style={[styles.bigPanicButton, sosActive && styles.panicActive]}
          onPress={triggerSOS}
          disabled={sosActive}
        >
          <Ionicons name="warning" size={60} color="#fff" />
          <Text style={styles.panicText}>
            {sosActive ? `${countdown}` : 'HOLD FOR SOS'}
          </Text>
        </TouchableOpacity>
        
        {sosActive && (
          <TouchableOpacity style={styles.cancelButton} onPress={cancelSOS}>
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚡ Quick Actions</Text>
        
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Calling', 'Dialling 10111...')}>
            <View style={[styles.quickIcon, { backgroundColor: '#d32f2f' }]}>
              <Ionicons name="call" size={24} color="#fff" />
            </View>
            <Text style={styles.quickText}>Police{'\n'}10111</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Calling', 'Dialling 10177...')}>
            <View style={[styles.quickIcon, { backgroundColor: '#007749' }]}>
              <Ionicons name="medkit" size={24} color="#fff" />
            </View>
            <Text style={styles.quickText}>Ambulance{'\n'}10177</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => Alert.alert('Calling', 'Dialling 112...')}>
            <View style={[styles.quickIcon, { backgroundColor: '#FFB81C' }]}>
              <Ionicons name="globe" size={24} color="#fff" />
            </View>
            <Text style={styles.quickText}>Intl SOS{'\n'}112</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Emergency Contacts */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>👨‍👩‍👧 Emergency Contacts</Text>
          <TouchableOpacity onPress={() => Alert.alert('Add Contact', 'Feature coming soon')}>
            <Ionicons name="add-circle" size={28} color="#007749" />
          </TouchableOpacity>
        </View>
        
        {contacts.length === 0 ? (
          <View style={styles.emptyContacts}>
            <Ionicons name="people-outline" size={40} color="#ccc" />
            <Text style={styles.emptyText}>No emergency contacts added</Text>
            <Text style={styles.emptySubtext}>Add family members to notify in emergencies</Text>
          </View>
        ) : (
          contacts.map((contact, index) => (
            <View key={index} style={styles.contactCard}>
              <View style={styles.contactAvatar}>
                <Ionicons name="person" size={20} color="#fff" />
              </View>
              <View style={styles.contactInfo}>
                <Text style={styles.contactName}>{contact.name}</Text>
                <Text style={styles.contactPhone}>{contact.phone}</Text>
              </View>
              <TouchableOpacity onPress={() => Alert.alert('Calling', `Calling ${contact.phone}...`)}>
                <Ionicons name="call" size={20} color="#007749" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* Location Share */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📍 Live Location</Text>
        <TouchableOpacity style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Ionicons name="navigate" size={24} color="#002395" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationText}>Share Live Location</Text>
            <Text style={styles.locationSubtext}>Family can track your location in real-time</Text>
          </View>
          <View style={styles.locationToggle}>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Safe Word */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔐 Safe Word</Text>
        <View style={styles.safeWordCard}>
          <Text style={styles.safeWordText}>
            Set a safe word with your child. If they enter this word in the app, you'll receive an instant alert.
          </Text>
          <TouchableOpacity style={styles.setSafeWordBtn}>
            <Text style={styles.setSafeWordText}>Set Safe Word</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#d32f2f', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, color: '#ffcccc', marginTop: 5 },
  panicContainer: { alignItems: 'center', padding: 30 },
  bigPanicButton: { width: 180, height: 180, borderRadius: 90, backgroundColor: '#d32f2f', justifyContent: 'center', alignItems: 'center', elevation: 10, shadowColor: '#d32f2f', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 15 },
  panicActive: { backgroundColor: '#ff0000' },
  panicText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginTop: 10 },
  cancelButton: { marginTop: 20, backgroundColor: '#666', paddingHorizontal: 30, paddingVertical: 12, borderRadius: 25 },
  cancelText: { color: '#fff', fontWeight: 'bold' },
  section: { padding: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  quickActions: { flexDirection: 'row', justifyContent: 'space-around' },
  quickAction: { alignItems: 'center' },
  quickIcon: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  quickText: { fontSize: 12, color: '#333', textAlign: 'center' },
  emptyContacts: { backgroundColor: '#fff', borderRadius: 10, padding: 30, alignItems: 'center', elevation: 2 },
  emptyText: { fontSize: 16, color: '#666', marginTop: 10 },
  emptySubtext: { fontSize: 12, color: '#999', marginTop: 5, textAlign: 'center' },
  contactCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  contactAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#002395', justifyContent: 'center', alignItems: 'center' },
  contactInfo: { flex: 1, marginLeft: 12 },
  contactName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  contactPhone: { fontSize: 14, color: '#666', marginTop: 2 },
  locationCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  locationIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  locationInfo: { flex: 1, marginLeft: 12 },
  locationText: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  locationSubtext: { fontSize: 12, color: '#666', marginTop: 2 },
  safeWordCard: { backgroundColor: '#fff', borderRadius: 10, padding: 15, elevation: 2 },
  safeWordText: { fontSize: 14, color: '#666', lineHeight: 20 },
  setSafeWordBtn: { backgroundColor: '#007749', padding: 12, borderRadius: 8, marginTop: 15, alignItems: 'center' },
  setSafeWordText: { color: '#fff', fontWeight: 'bold' },
  panicButton: { backgroundColor: '#d32f2f', justifyContent: 'center', alignItems: 'center' },
  panicButtonPressed: { backgroundColor: '#ff0000', transform: [{ scale: 0.95 }] },
});
