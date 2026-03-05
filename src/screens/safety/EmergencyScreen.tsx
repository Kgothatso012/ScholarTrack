import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relation: string;
}

export default function EmergencyScreen() {
  const { colors } = useTheme();
  const [contacts] = useState<EmergencyContact[]>([
    { id: 1, name: 'Mom', phone: '078 123 4567', relation: 'Family' },
    { id: 2, name: 'Dad', phone: '082 987 6543', relation: 'Family' },
    { id: 3, name: 'School', phone: '012 345 6789', relation: 'School' },
  ]);

  const callEmergency = (name: string, phone: string) => {
    Alert.alert(`Call ${name}`, `Dialing ${phone}...`);
  };

  const sosAlert = () => {
    Alert.alert(
      'SEND SOS',
      'Send emergency alert to all contacts with your location?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND SOS', style: 'destructive', onPress: () => {
          Alert.alert('SOS SENT!', 'Emergency contacts notified with your location!');
        }}
      ]
    );
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: 20, paddingTop: 10 },
    headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textInverse },
    headerSub: { fontSize: 14, color: colors.accent, marginTop: 5 },
    sosButton: { backgroundColor: colors.error, margin: 20, padding: 30, borderRadius: 20, alignItems: 'center', elevation: 10 },
    sosText: { color: colors.textInverse, fontSize: 20, fontWeight: 'bold', marginTop: 10 },
    sosSub: { color: colors.textInverse, opacity: 0.8, fontSize: 12, marginTop: 5 },
    section: { padding: 15 },
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
    sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginBottom: 15 },
    quickDial: { backgroundColor: colors.card, borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    dialIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    dialEmoji: { fontSize: 24 },
    dialInfo: { flex: 1, marginLeft: 15 },
    dialName: { fontSize: 14, fontWeight: 'bold', color: colors.text },
    dialNumber: { fontSize: 16, fontWeight: 'bold', color: colors.success },
    contactCard: { backgroundColor: colors.card, borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    contactAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    contactInitial: { fontSize: 18, fontWeight: 'bold', color: colors.accent },
    contactInfo: { flex: 1, marginLeft: 12 },
    contactName: { fontSize: 15, fontWeight: 'bold', color: colors.text },
    contactPhone: { fontSize: 14, color: colors.textSecondary },
    contactRelation: { fontSize: 11, color: colors.textSecondary },
    callBtn: { backgroundColor: colors.selected, padding: 12, borderRadius: 25 },
    tipCard: { backgroundColor: colors.card, borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    tipText: { flex: 1, marginLeft: 12, fontSize: 14, color: colors.text },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Emergency Services</Text>
        <Text style={styles.headerSub}>Quick access to emergency help</Text>
      </View>

      <TouchableOpacity style={styles.sosButton} onPress={sosAlert}>
        <Ionicons name="warning" size={40} color={colors.textInverse} />
        <Text style={styles.sosText}>HOLD FOR SOS</Text>
        <Text style={styles.sosSub}>Sends location to all contacts</Text>
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Dial</Text>

        <TouchableOpacity style={styles.quickDial} onPress={() => callEmergency('Police', '10111')}>
          <View style={[styles.dialIcon, { backgroundColor: '#1565C0' }]}>
            <Text style={styles.dialEmoji}>P</Text>
          </View>
          <View style={styles.dialInfo}>
            <Text style={styles.dialName}>South African Police</Text>
            <Text style={styles.dialNumber}>10111</Text>
          </View>
          <Ionicons name="call" size={24} color={colors.success} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickDial} onPress={() => callEmergency('Ambulance', '10177')}>
          <View style={[styles.dialIcon, { backgroundColor: colors.error }]}>
            <Text style={styles.dialEmoji}>A</Text>
          </View>
          <View style={styles.dialInfo}>
            <Text style={styles.dialName}>Ambulance</Text>
            <Text style={styles.dialNumber}>10177</Text>
          </View>
          <Ionicons name="call" size={24} color={colors.success} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickDial} onPress={() => callEmergency('Fire', '10177')}>
          <View style={[styles.dialIcon, { backgroundColor: '#FF6F00' }]}>
            <Text style={styles.dialEmoji}>F</Text>
          </View>
          <View style={styles.dialInfo}>
            <Text style={styles.dialName}>Fire Department</Text>
            <Text style={styles.dialNumber}>10177</Text>
          </View>
          <Ionicons name="call" size={24} color={colors.success} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Emergency Contacts</Text>
          <TouchableOpacity onPress={() => Alert.alert('Add', 'Add contact...')}>
            <Ionicons name="add-circle" size={28} color={colors.accent} />
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
              <Ionicons name="call" size={20} color={colors.success} />
            </TouchableOpacity>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Safety Tips</Text>

        <View style={styles.tipCard}>
          <Ionicons name="shield-checkmark" size={24} color={colors.success} />
          <Text style={styles.tipText}>Always share your trip with a family member</Text>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="document-text" size={24} color={colors.accent} />
          <Text style={styles.tipText}>Verify your driver's details before starting</Text>
        </View>

        <View style={styles.tipCard}>
          <Ionicons name="warning" size={24} color={colors.error} />
          <Text style={styles.tipText}>Trust your instincts - report anything suspicious</Text>
        </View>
      </View>
    </ScrollView>
  );
}
