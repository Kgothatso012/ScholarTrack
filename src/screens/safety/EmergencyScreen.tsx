import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import { emergencyContactService, panicAlertService } from '../../lib/services/emergency';
import { locationService } from '../../services/location';
import { sendAppNotification } from '../../services/NotificationService';
import { supabase } from '../../lib/supabase';
import { EmergencyContact } from '../../lib/services/types';

import { Card, Button, Spacer, Badge, SkeletonCard, SkeletonListItem } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { RSA_EMERGENCY } from '../../constants/app';

export default function EmergencyScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [sendingSos, setSendingSos] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

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

  const callNumber = (phone: string) => {
    const url = `tel:${phone.replace(/\s/g, '')}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'Unable to make phone call');
    });
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const sendSOS = async () => {
    try {
      setSendingSos(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login first');
        return;
      }

      // Get current location
      const location = await locationService.getCurrentLocation();
      const locationStr = location
        ? `${location.coords.latitude},${location.coords.longitude}`
        : undefined;

      // Create panic alert in DB
      const panicAlert = await panicAlertService.createPanicAlert(user.id, locationStr);

      // Send push notifications to emergency contacts
      for (const contact of contacts) {
        await sendAppNotification('EMERGENCY', user.id, {
          message: `Emergency SOS from ${user.email}`,
          location: locationStr,
          timestamp: new Date().toISOString(),
          panicAlertId: panicAlert?.id,
        });
      }

      Alert.alert(
        'SOS SENT',
        `Emergency alert sent to ${contacts.length} contact(s)${locationStr ? ' with your location' : ''}`,
        [{ text: 'OK' }]
      );
    } catch (error: unknown) {
      console.error('SOS Error:', error);
      Alert.alert('SOS Failed', error instanceof Error ? error.message || 'Failed to send emergency alert' : 'Failed to send emergency alert');
    } finally {
      setSendingSos(false);
    }
  };

  const sosAlert = () => {
    if (contacts.length === 0) {
      Alert.alert('No Contacts', 'Please add emergency contacts first');
      return;
    }
    Alert.alert(
      'SEND SOS',
      `Send emergency alert to ${contacts.length} contact(s) with your location?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND SOS', style: 'destructive', onPress: sendSOS },
      ]
    );
  };

  const quickDials = [
    { name: 'Police', phone: RSA_EMERGENCY.POLICE, icon: 'shield', color: colors.primary },
    { name: 'Ambulance', phone: RSA_EMERGENCY.AMBULANCE, icon: 'medkit', color: colors.error },
    { name: 'Fire', phone: RSA_EMERGENCY.FIRE, icon: 'flame', color: colors.warning },
  ];

  const tips = [
    { icon: 'location', text: 'Your location is automatically shared with emergency contacts' },
    { icon: 'time', text: 'SOS alerts include timestamp for emergency services' },
    { icon: 'shield-checkmark', text: 'All contacts verified through ScholarTrack' },
  ];

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: insets.top + spacing.lg, borderBottomWidth: 4, borderBottomColor: colors.accent },
    headerTitle: { ...typography.displayMedium, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
    sosButton: {
      backgroundColor: colors.error,
      margin: spacing.lg,
      padding: spacing.xl,
      borderRadius: borderRadius.card,
      alignItems: 'center',
      borderTopWidth: 4,
      borderTopColor: 'rgba(255,255,255,0.3)',
      shadowColor: colors.error,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 24,
      elevation: 8,
    },
    sosIcon: { marginBottom: spacing.sm },
    sosText: { ...typography.displaySmall, color: colors.textInverse },
    sosSub: { ...typography.bodySmall, color: colors.textInverse, opacity: 0.8, marginTop: spacing.xs },
    sosLoading: { marginTop: spacing.md },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    quickDialCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      borderTopWidth: 2,
      borderTopColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 1,
      shadowRadius: 8,
      elevation: 1,
    },
    dialIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    dialInfo: { flex: 1, marginLeft: spacing.md },
    dialName: { ...typography.label, color: colors.text },
    dialNumber: { ...typography.h4, color: colors.success },
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
      shadowRadius: 8,
      elevation: 1,
    },
    contactAvatar: {
      width: 45,
      height: 45,
      borderRadius: 22.5,
      backgroundColor: colors.primary,
      justifyContent: 'center',
      alignItems: 'center',
    },
    contactInitial: { ...typography.h4, color: colors.accent },
    contactInfo: { flex: 1, marginLeft: spacing.md },
    contactName: { ...typography.label, color: colors.text },
    contactPhone: { ...typography.bodySmall, color: colors.textSecondary },
    contactRelation: { ...typography.caption, color: colors.textSecondary },
    callBtn: { padding: spacing.md, borderRadius: borderRadius.full },
    tipCard: {
      backgroundColor: colors.card,
      borderRadius: borderRadius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 1,
      shadowRadius: 4,
      elevation: 1,
    },
    tipText: { flex: 1, marginLeft: spacing.md, ...typography.body, color: colors.text },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.lg },
  });

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Emergency Services</Text>
        <Text style={styles(colors).headerSub}>Quick access to emergency help</Text>
      </View>

      {/* SOS Button */}
      <TouchableOpacity
        style={styles(colors).sosButton}
        onPress={sosAlert}
        disabled={sendingSos}
      >
        <View style={styles(colors).sosIcon}>
          <Ionicons name="warning" size={40} color={colors.textInverse} />
        </View>
        <Text style={styles(colors).sosText}>SEND SOS</Text>
        <Text style={styles(colors).sosSub}>Alerts all contacts with location</Text>
        {sendingSos && (
          <View style={styles(colors).sosLoading}>
            <ActivityIndicator color={colors.textInverse} />
          </View>
        )}
      </TouchableOpacity>

      {/* Quick Dial */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Quick Dial</Text>
        {quickDials.map((item, index) => (
          <Card key={index} variant="elevated" padding="medium">
            <TouchableOpacity
              style={styles(colors).quickDialCard}
              onPress={() => callNumber(item.phone)}
            >
              <View style={[styles(colors).dialIcon, { backgroundColor: colors.primaryMuted }]}>
                <Ionicons name={item.icon as any} size={24} color={item.color} />
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
            <Spacer size="sm" />
            <Button
              title="Add Contacts in Settings"
              variant="primary"
              size="small"
              onPress={() => {}}
            />
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} variant="elevated" padding="medium">
              <TouchableOpacity
                style={styles(colors).contactCard}
                onPress={() => callNumber(contact.phone)}
              >
                <View style={styles(colors).contactAvatar}>
                  <Text style={styles(colors).contactInitial}>{getInitials(contact.name)}</Text>
                </View>
                <View style={styles(colors).contactInfo}>
                  <Text style={styles(colors).contactName}>{contact.name}</Text>
                  <Text style={styles(colors).contactPhone}>{contact.phone}</Text>
                  <Badge
                    label={contact.relationship}
                    variant={contact.is_primary ? 'warning' : 'neutral'}
                    size="small"
                  />
                </View>
                <View style={styles(colors).callBtn}>
                  <Ionicons name="call" size={20} color={colors.success} />
                </View>
              </TouchableOpacity>
            </Card>
          ))
        )}
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
