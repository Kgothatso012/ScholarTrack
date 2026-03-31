import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

export default function SafetyTipsScreen() {
  const tips = [
    {
      icon: 'person-add',
      title: 'Verify Your Driver',
      description: 'Always check driver details before starting a trip. Verify their photo, name, and vehicle.',
    },
    {
      icon: 'location',
      title: 'Share Your Location',
      description: 'Share your live location with family members during trips for added safety.',
    },
    {
      icon: 'warning',
      title: 'Know Emergency Numbers',
      description: 'Save emergency numbers: Police 10111, Ambulance 10177, Crime Stop 08600 10111.',
    },
    {
      icon: 'chatbubbles',
      title: 'Communicate Openly',
      description: 'Maintain open communication with your driver and children about pickups and dropoffs.',
    },
    {
      icon: 'eye',
      title: 'Monitor Trips',
      description: 'Use the live tracking feature to monitor your child\'s journey in real-time.',
    },
    {
      icon: 'shield-checkmark',
      title: 'Report Suspicious Activity',
      description: 'Report any concerning behavior immediately through the app or emergency services.',
    },
    {
      icon: 'people',
      title: 'Establish Safe Words',
      description: 'Create a secret code word that your child can use if they feel unsafe.',
    },
    {
      icon: 'document-text',
      title: 'Keep Records',
      description: 'Save trip receipts and driver information for your records.',
    },
  ];

  const emergencyTips = [
    'Always buckle up when in the vehicle',
    'Know your exact pickup and dropoff locations',
    'Keep emergency contacts updated in the app',
    'Trust your instincts - if something feels wrong, act',
    'Teach children to exit only at designated stops',
  ];

  return (
    <ScrollView style={styles(colors).container}>
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>🛡️ Safety Tips</Text>
        <Text style={styles(colors).headerSub}>Stay safe with ScholarTrack</Text>
      </View>

      {/* Safety Tips */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Top Safety Tips</Text>
        {tips.map((tip, index) => (
          <View key={index} style={styles(colors).tipCard}>
            <View style={styles(colors).tipIcon}>
              <Ionicons name={tip.icon as any} size={24} color="#FFB81C" />
            </View>
            <View style={styles(colors).tipInfo}>
              <Text style={styles(colors).tipTitle}>{tip.title}</Text>
              <Text style={styles(colors).tipDesc}>{tip.description}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Emergency Checklist */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>🚨 Emergency Checklist</Text>
        {emergencyTips.map((tip, index) => (
          <View key={index} style={styles(colors).checklistItem}>
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles(colors).checklistText}>{tip}</Text>
          </View>
        ))}
      </View>

      {/* Safety Resources */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>📞 Emergency Resources</Text>
        
        <TouchableOpacity style={styles(colors).resourceCard} onPress={() => Alert.alert('Call', 'Dialing SAPS...')}>
          <Ionicons name="call" size={24} color="#1565C0" />
          <View style={styles(colors).resourceInfo}>
            <Text style={styles(colors).resourceTitle}>South African Police</Text>
            <Text style={styles(colors).resourceNumber}>10111</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles(colors).resourceCard} onPress={() => Alert.alert('Call', 'Dialing Ambulance...')}>
          <Ionicons name="medkit" size={24} color="#d32f2f" />
          <View style={styles(colors).resourceInfo}>
            <Text style={styles(colors).resourceTitle}>Ambulance / Fire</Text>
            <Text style={styles(colors).resourceNumber}>10177</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles(colors).resourceCard} onPress={() => Alert.alert('Call', 'Dialing...')}>
          <Ionicons name="shield" size={24} color="#7B1FA2" />
          <View style={styles(colors).resourceInfo}>
            <Text style={styles(colors).resourceTitle}>Crime Stop</Text>
            <Text style={styles(colors).resourceNumber}>08600 10111</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles(colors).footer}>
        <Text style={styles(colors).footerText}>Stay Safe! 🇿🇦</Text>
        <Text style={styles(colors).footerSub}>ScholarTrack - Your safety is our priority</Text>
      </View>
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  header: { backgroundColor: colors.background, padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
  headerSub: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  tipCard: { backgroundColor: colors.card, borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  tipIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF4E0', justifyContent: 'center', alignItems: 'center' },
  tipInfo: { flex: 1, marginLeft: 15 },
  tipTitle: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  tipDesc: { fontSize: 13, color: colors.textSecondary, marginTop: 3 },
  checklistItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, padding: 15, borderRadius: 10, marginBottom: 8 },
  checklistText: { flex: 1, marginLeft: 12, fontSize: 14, color: colors.textSecondary },
  resourceCard: { backgroundColor: colors.card, borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  resourceInfo: { marginLeft: 15 },
  resourceTitle: { fontSize: 15, fontWeight: 'bold', color: '#000' },
  resourceNumber: { fontSize: 18, fontWeight: 'bold', color: '#4CAF50', marginTop: 2 },
  footer: { padding: 30, alignItems: 'center' },
  footerText: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  footerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 5 },
});
