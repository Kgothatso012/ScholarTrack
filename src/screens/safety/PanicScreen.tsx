import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

export const PanicButton = ({ style, size = 60 }: { style?: any, size?: number }) => {
  const [pressed, setPressed] = useState(false);

  const triggerPanic = () => {
    Alert.alert(
      'EMERGENCY - SOS',
      'Sending emergency alert to all contacts...',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND SOS', style: 'destructive', onPress: () => Alert.alert('SOS SENT!', 'Emergency contacts notified.') },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={[
        { width: size, height: size, borderRadius: size / 2, backgroundColor: '#E91E63', justifyContent: 'center', alignItems: 'center' },
        pressed && { transform: [{ scale: 0.95 }] },
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

export default function PanicScreen() {
  const { colors } = useTheme();
  const [sosActive, setSosActive] = useState(false);
  const [contacts, setContacts] = useState<any[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    const saved = await AsyncStorage.getItem('emergencyContacts');
    if (saved) setContacts(JSON.parse(saved));
  };

  const triggerSOS = () => {
    Alert.alert('Trigger SOS', 'Send emergency alert?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'SEND', style: 'destructive', onPress: () => setSosActive(true) },
    ]);
  };

  const cancelSOS = () => {
    setSosActive(false);
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    sosCard: { backgroundColor: colors.error, margin: spacing.lg, padding: spacing.xl, borderRadius: borderRadius.xl, alignItems: 'center', elevation: 5 },
    sosText: { ...typography.h1, color: colors.textInverse, marginBottom: spacing.sm },
    sosSub: { ...typography.body, color: colors.textInverse, opacity: 0.8 },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    contactCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    contactIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    contactInfo: { flex: 1, marginLeft: spacing.md },
    contactName: { ...typography.label, color: colors.text },
    contactPhone: { ...typography.bodySmall, color: colors.textSecondary },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Emergency SOS</Text>
        <Text style={styles(colors).headerSub}>Quick emergency response</Text>
      </View>

      {/* SOS Button */}
      <Card variant="elevated" padding="large">
        <TouchableOpacity style={styles(colors).sosCard} onPress={triggerSOS}>
          <Text style={styles(colors).sosText}>HOLD FOR SOS</Text>
          <Text style={styles(colors).sosSub}>3 seconds to activate</Text>
        </TouchableOpacity>
      </Card>

      {/* Active SOS State */}
      {sosActive && (
        <Card variant="elevated" padding="large">
          <Badge label="SOS ACTIVE" variant="error" size="small" />
          <Spacer size="md" />
          <Button title="Cancel SOS" onPress={cancelSOS} variant="outline" fullWidth />
        </Card>
      )}

      {/* Emergency Contacts */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Emergency Contacts</Text>
        {contacts.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No emergency contacts</Text>
          </Card>
        ) : (
          contacts.map((contact, index) => (
            <Card key={index} variant="elevated" padding="medium">
              <View style={styles(colors).contactCard}>
                <View style={styles(colors).contactIcon}>
                  <Ionicons name="person" size={20} color={colors.accent} />
                </View>
                <View style={styles(colors).contactInfo}>
                  <Text style={styles(colors).contactName}>{contact.name}</Text>
                  <Text style={styles(colors).contactPhone}>{contact.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => Alert.alert('Call', `Calling ${contact.phone}...`)}>
                  <Ionicons name="call" size={20} color={colors.success} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}