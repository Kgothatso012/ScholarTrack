import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Badge, Avatar } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface EmergencyContact {
  id: number;
  name: string;
  phone: string;
  relation: string;
}

export default function EmergencyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
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

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase();

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.md },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    sosButton: { backgroundColor: colors.error, margin: spacing.lg, padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', elevation: 10 },
    sosIcon: { marginBottom: spacing.sm },
    sosText: { ...typography.h3, color: colors.textInverse },
    sosSub: { ...typography.bodySmall, color: colors.textInverse, opacity: 0.8, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    quickDialCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    dialIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    dialEmoji: { fontSize: 24 },
    dialInfo: { flex: 1, marginLeft: spacing.md },
    dialName: { ...typography.label, color: colors.text },
    dialNumber: { ...typography.h4, color: colors.success },
    contactCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    contactAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    contactInitial: { ...typography.h4, color: colors.accent },
    contactInfo: { flex: 1, marginLeft: spacing.md },
    contactName: { ...typography.label, color: colors.text },
    contactPhone: { ...typography.bodySmall, color: colors.textSecondary },
    contactRelation: { ...typography.caption, color: colors.textSecondary },
    callBtn: { padding: spacing.md, borderRadius: borderRadius.full },
    tipCard: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    tipText: { flex: 1, marginLeft: spacing.md, ...typography.body, color: colors.text },
  });

  const quickDials = [
    { name: 'Police', phone: '10111', emoji: '🚔', color: colors.primary },
    { name: 'Ambulance', phone: '10177', emoji: '🚑', color: colors.error },
    { name: 'Fire', phone: '10177', emoji: '🚒', color: colors.warning },
  ];

  const tips = [
    { icon: 'location', text: 'Your location is automatically shared with emergency contacts' },
    { icon: 'time', text: 'SOS alerts include timestamp for emergency services' },
    { icon: 'shield-checkmark', text: 'All contacts verified through ScholarTrack' },
  ];

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Emergency Services</Text>
        <Text style={styles(colors).headerSub}>Quick access to emergency help</Text>
      </View>

      {/* SOS Button */}
      <TouchableOpacity style={styles(colors).sosButton} onPress={sosAlert}>
        <View style={styles(colors).sosIcon}>
          <Ionicons name="warning" size={40} color={colors.textInverse} />
        </View>
        <Text style={styles(colors).sosText}>HOLD FOR SOS</Text>
        <Text style={styles(colors).sosSub}>Sends location to all contacts</Text>
      </TouchableOpacity>

      {/* Quick Dial */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Quick Dial</Text>
        {quickDials.map((item, index) => (
          <Card key={index} variant="elevated" padding="medium">
            <TouchableOpacity style={styles(colors).quickDialCard} onPress={() => callEmergency(item.name, item.phone)}>
              <View style={[styles(colors).dialIcon, { backgroundColor: item.color + '20' }]}>
                <Text style={styles(colors).dialEmoji}>{item.emoji}</Text>
              </View>
              <View style={styles(colors).dialInfo}>
                <Text style={styles(colors).dialName}>{item.name}</Text>
                <Text style={styles(colors).dialNumber}>{item.phone}</Text>
              </View>
              <View style={styles(colors).callBtn}>
                <Ionicons name="call" size={20} color={colors.success} />
              </View>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      {/* Emergency Contacts */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Emergency Contacts</Text>
        {contacts.map((contact) => (
          <Card key={contact.id} variant="elevated" padding="medium">
            <TouchableOpacity style={styles(colors).contactCard} onPress={() => callEmergency(contact.name, contact.phone)}>
              <View style={styles(colors).contactAvatar}>
                <Text style={styles(colors).contactInitial}>{getInitials(contact.name)}</Text>
              </View>
              <View style={styles(colors).contactInfo}>
                <Text style={styles(colors).contactName}>{contact.name}</Text>
                <Text style={styles(colors).contactPhone}>{contact.phone}</Text>
                <Badge label={contact.relation} variant="neutral" size="small" />
              </View>
              <View style={styles(colors).callBtn}>
                <Ionicons name="call" size={20} color={colors.success} />
              </View>
            </TouchableOpacity>
          </Card>
        ))}
      </View>

      {/* Safety Tips */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Safety Tips</Text>
        {tips.map((tip, index) => (
          <Card key={index} variant="outlined" padding="medium">
            <View style={styles(colors).tipCard}>
              <Ionicons name={tip.icon as any} size={20} color={colors.primary} />
              <Text style={styles(colors).tipText}>{tip.text}</Text>
            </View>
          </Card>
        ))}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}