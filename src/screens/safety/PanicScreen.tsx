import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import { panicAlertService } from '../../lib/services/emergency';
import { locationService } from '../../services/location';
import { sendAppNotification } from '../../services/NotificationService';
import { supabase } from '../../lib/supabase';
import { emergencyContactService } from '../../lib/services/emergency';
import { EmergencyContact } from '../../lib/services/types';

// UI Plugin components
import { Card, Button, Spacer, Badge, SkeletonCard } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

export const PanicButton = ({
  style,
  size = 60,
  onActivate,
}: {
  style?: StyleProp<ViewStyle>;
  size?: number;
  onActivate?: () => void;
}) => {
  const { colors } = useTheme();
  const [pressed, setPressed] = useState(false);

  return (
    <TouchableOpacity
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.error,
          justifyContent: 'center',
          alignItems: 'center',
        },
        pressed && { transform: [{ scale: 0.95 }] },
        style,
      ]}
      onPress={onActivate}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Ionicons name="warning" size={size * 0.5} color={colors.textInverse} />
    </TouchableOpacity>
  );
};

export default function PanicScreen() {
  const { colors } = useTheme();
  const [sosActive, setSosActive] = useState(false);
  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await emergencyContactService.getContacts(user.id);
      setContacts(data);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendSOS = async () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Please add emergency contacts first');
      return;
    }

    try {
      setSending(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Get location
      const location = await locationService.getCurrentLocation();
      const locationStr = location
        ? `${location.coords.latitude},${location.coords.longitude}`
        : undefined;

      // Create panic alert
      const panicAlert = await panicAlertService.createPanicAlert(user.id, locationStr);

      // Notify all emergency contacts
      for (const contact of contacts) {
        await sendAppNotification('EMERGENCY', user.id, {
          message: `Emergency SOS from ${user.email}`,
          location: locationStr,
          timestamp: new Date().toISOString(),
          panicAlertId: panicAlert?.id,
        });
      }

      setSosActive(true);
    } catch (error: unknown) {
      console.error('SOS Error:', error);
      Alert.alert('SOS Failed', error instanceof Error ? error.message || 'Failed to send emergency alert' : 'Failed to send emergency alert');
    } finally {
      setSending(false);
    }
  };

  const triggerSOS = () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Please add emergency contacts first');
      return;
    }
    Alert.alert(
      'Trigger SOS',
      `Send emergency alert to ${contacts.length} contact(s)?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND', style: 'destructive', onPress: sendSOS },
      ]
    );
  };

  const cancelSOS = () => {
    setSosActive(false);
  };

  const callContact = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const styles = (colors: ThemeColors) =>
    StyleSheet.create({
      container: { flex: 1, backgroundColor: colors.background },
      header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.md, borderBottomWidth: 4, borderBottomColor: colors.accent },
      headerTitle: { ...typography.displayMedium, color: colors.textInverse },
      headerSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
      sosCard: {
        backgroundColor: colors.error,
        margin: spacing.lg,
        padding: spacing.xl,
        borderRadius: borderRadius.card,
        alignItems: 'center',
        borderTopWidth: 4,
        borderTopColor: 'rgba(255,255,255,0.3)',
        shadowColor: colors.error,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 2,
      },
      sosText: { ...typography.displayMedium, color: colors.textInverse, marginBottom: spacing.sm },
      sosSub: { ...typography.body, color: colors.textInverse, opacity: 0.8 },
      sosLoading: { marginTop: spacing.md },
      section: { padding: spacing.lg },
      sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
      contactCard: {
        backgroundColor: colors.card,
        borderRadius: borderRadius.lg,
        padding: spacing.md,
        marginBottom: spacing.sm,
        flexDirection: 'row',
        alignItems: 'center',
        borderLeftWidth: 3,
        borderLeftColor: colors.accent,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 1,
        shadowRadius: 16,
        elevation: 2,
      },
      contactIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primaryMuted,
        justifyContent: 'center',
        alignItems: 'center',
      },
      contactInfo: { flex: 1, marginLeft: spacing.md },
      contactName: { ...typography.label, color: colors.text },
      contactPhone: { ...typography.bodySmall, color: colors.textSecondary },
      emptyText: {
        ...typography.body,
        color: colors.textSecondary,
        textAlign: 'center',
        padding: spacing.xl,
      },
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
        <TouchableOpacity
          style={styles(colors).sosCard}
          onPress={triggerSOS}
          disabled={sending}
        >
          <Text style={styles(colors).sosText}>SEND SOS</Text>
          <Text style={styles(colors).sosSub}>Tap to alert all contacts</Text>
          {sending && (
            <View style={styles(colors).sosLoading}>
              <ActivityIndicator color={colors.textInverse} />
            </View>
          )}
        </TouchableOpacity>
      </Card>

      {/* Active SOS State */}
      {sosActive && (
        <Card variant="elevated" padding="large">
          <Badge label="SOS ACTIVE" variant="error" size="small" />
          <Spacer size="md" />
          <Text style={{ color: colors.text, textAlign: 'center', marginBottom: spacing.md }}>
            Emergency contacts have been notified
          </Text>
          <Button title="Cancel Alert" onPress={cancelSOS} variant="outline" fullWidth />
        </Card>
      )}

      {/* Emergency Contacts */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Emergency Contacts ({contacts.length})</Text>
        {loading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : contacts.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No emergency contacts added</Text>
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} variant="elevated" padding="medium">
              <View style={styles(colors).contactCard}>
                <View style={styles(colors).contactIcon}>
                  <Ionicons name="person" size={20} color={colors.accent} />
                </View>
                <View style={styles(colors).contactInfo}>
                  <Text style={styles(colors).contactName}>{contact.name}</Text>
                  <Text style={styles(colors).contactPhone}>{contact.phone}</Text>
                </View>
                <TouchableOpacity onPress={() => callContact(contact.phone)}>
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
