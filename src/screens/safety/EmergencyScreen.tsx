import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import { emergencyContactService, panicAlertService } from '../../lib/services/emergency';
import { locationService } from '../../services/location';
import { sendAppNotification } from '../../services/NotificationService';
import { supabase } from '../../lib/supabase';
import { EmergencyContact } from '../../lib/services/types';

import { Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';
import { RSA_EMERGENCY } from '../../constants/app';

const EmergencyScreen = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [sendingSos, setSendingSos] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  // SOS button animations
  const sosScale = useSharedValue(1);
  const sosRingScale = useSharedValue(1);
  const sosRingOpacity = useSharedValue(0.4);

  useEffect(() => {
    // Start breathing ring animation
    sosRingScale.value = withRepeat(
      withSequence(
        withTiming(1.3, { duration: 1800 }),
        withTiming(1, { duration: 1800 })
      ),
      -1,
      false
    );
    sosRingOpacity.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 1800 }),
        withTiming(0.4, { duration: 1800 })
      ),
      -1,
      false
    );
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
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Unable to make phone call'));
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const sendSOS = async () => {
    try {
      setSendingSos(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Please login first'); return; }
      const location = await locationService.getCurrentLocation();
      const locationStr = location ? `${location.coords.latitude},${location.coords.longitude}` : undefined;
      const panicAlert = await panicAlertService.createPanicAlert(user.id, locationStr);
      for (const contact of contacts) {
        await sendAppNotification('EMERGENCY', user.id, {
          message: `Emergency SOS from ${user.email}`,
          location: locationStr,
          timestamp: new Date().toISOString(),
          panicAlertId: panicAlert?.id,
        });
      }
      Alert.alert('SOS SENT', `Emergency alert sent to ${contacts.length} contact(s)${locationStr ? ' with your location' : ''}`, [{ text: 'OK' }]);
    } catch (error: unknown) {
      console.error('SOS Error:', error);
      Alert.alert('SOS Failed', error instanceof Error ? error.message || 'Failed to send emergency alert' : 'Failed to send emergency alert');
    } finally {
      setSendingSos(false);
    }
  };

  const sosAlert = () => {
    if (contacts.length === 0) { Alert.alert('No Contacts', 'Please add emergency contacts first'); return; }
    Alert.alert('SEND SOS', `Send emergency alert to ${contacts.length} contact(s) with your location?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'SEND SOS', style: 'destructive', onPress: sendSOS },
    ]);
  };

  const handleSOSPressIn = () => {
    sosScale.value = withSpring(0.93, { damping: 15, stiffness: 150, mass: 0.8 });
  };

  const handleSOSPressOut = () => {
    sosScale.value = withSpring(1, { damping: 15, stiffness: 150, mass: 0.8 });
  };

  const quickDials = [
    { name: 'Police', phone: RSA_EMERGENCY.POLICE, icon: 'shield', color: '#007749' },
    { name: 'Ambulance', phone: RSA_EMERGENCY.AMBULANCE, icon: 'medkit', color: '#E03C31' },
    { name: 'Fire', phone: RSA_EMERGENCY.FIRE, icon: 'flame', color: '#FFB81C' },
  ];

  const tips = [
    { icon: 'location', text: 'Your location is automatically shared with emergency contacts' },
    { icon: 'time', text: 'SOS alerts include timestamp for emergency services' },
    { icon: 'shield-checkmark', text: 'All contacts verified through ScholarTrack' },
  ];

  // Animated styles for SOS button
  const sosAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sosScale.value }],
  }));

  const sosRingAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sosRingScale.value }],
    opacity: sosRingOpacity.value,
  }));

  // Styles
  const s = (c: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: c.background },
    // Full glass header
    headerGlass: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderBottomLeftRadius: 32,
      borderBottomRightRadius: 32,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,184,28,0.15)',
      position: 'relative',
      overflow: 'hidden',
    },
    headerGlow: { position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(224,60,49,0.12)' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 },
    headerTitle: { ...typography.h2, color: c.textInverse, fontWeight: '700' },
    headerSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.65)', marginTop: spacing.xs },
    // SOS SECTION — full glass hero
    sosHero: { marginHorizontal: spacing.md, marginTop: spacing.lg, position: 'relative' },
    sosGlass: {
      backgroundColor: 'rgba(255,255,255,0.05)',
      borderWidth: 1,
      borderColor: 'rgba(224,60,49,0.3)',
      borderRadius: borderRadius.xxl + 8,
      padding: spacing.xl,
      alignItems: 'center',
      overflow: 'hidden',
      shadowColor: '#E03C31',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.2,
      shadowRadius: 40,
      elevation: 0,
    },
    sosRingOuter: { position: 'absolute', top: '50%', left: '50%', marginTop: -70, marginLeft: -70, width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: 'rgba(224,60,49,0.3)' },
    sosRingMid: { position: 'absolute', top: '50%', left: '50%', marginTop: -55, marginLeft: -55, width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: 'rgba(224,60,49,0.2)' },
    sosIconWrap: {
      width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(224,60,49,0.2)',
      justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(224,60,49,0.5)',
      marginBottom: spacing.md,
      zIndex: 1,
    },
    sosLabel: { ...typography.h3, color: c.textInverse, fontWeight: '700', zIndex: 1 },
    sosSub: { ...typography.bodySmall, color: 'rgba(255,255,255,0.5)', marginTop: spacing.xs, zIndex: 1 },
    // QUICK DIAL SECTION
    section: { paddingHorizontal: spacing.md, paddingTop: spacing.lg },
    sectionTitle: { ...typography.h4, color: colors.text, marginBottom: spacing.md, fontWeight: '600', letterSpacing: 0.2 },
    glass: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, overflow: 'hidden' },
    glassRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,184,28,0.2)' },
    quickDialItem: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    dialIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    dialInfo: { flex: 1 },
    dialName: { ...typography.label, color: colors.text },
    dialNumber: { ...typography.h4, color: '#007749' },
    contactCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    contactAvatar: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: 'rgba(0,35,149,0.25)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,35,149,0.3)' },
    contactInitial: { ...typography.h4, color: '#002395' },
    contactInfo: { flex: 1 },
    contactName: { ...typography.label, color: colors.text },
    contactPhone: { ...typography.bodySmall, color: 'rgba(255,255,255,0.45)' },
    callBtn: { padding: spacing.md, borderRadius: borderRadius.full, backgroundColor: 'rgba(0,119,73,0.2)', borderWidth: 1, borderColor: 'rgba(0,119,73,0.3)' },
    tipCard: { backgroundColor: 'rgba(255,255,255,0.05)', borderWidth: 1, borderColor: 'rgba(255,184,28,0.12)', borderRadius: borderRadius.xxl, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    tipText: { flex: 1, ...typography.body, color: colors.text },
    emptyText: { ...typography.body, color: 'rgba(255,255,255,0.45)', textAlign: 'center', padding: spacing.lg },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  });

  return (
    <ScrollView style={s(colors).container}>
      {/* HEADER */}
      <View style={s(colors).headerGlass}>
        <View style={s(colors).headerGlow} />
        <View style={s(colors).headerRow}>
          <View>
            <Text style={s(colors).headerTitle}>Emergency Services</Text>
            <Text style={s(colors).headerSub}>Quick access to emergency help</Text>
          </View>
        </View>
      </View>

      {/* SOS BUTTON — full glass hero with breathing rings */}
      <View style={s(colors).sosHero}>
        <View style={s(colors).sosGlass}>
          {/* Breathing rings */}
          <Animated.View style={[s(colors).sosRingOuter, sosRingAnimatedStyle]} />
          <Animated.View style={[s(colors).sosRingMid, sosRingAnimatedStyle]} />
          {/* Refraction top edge */}
          <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(224,60,49,0.3)' }} />
          
          <TouchableOpacity
            activeOpacity={1}
            onPress={sosAlert}
            onPressIn={handleSOSPressIn}
            onPressOut={handleSOSPressOut}
            disabled={sendingSos}
            style={{ alignItems: 'center' }}
          >
            <Animated.View style={sosAnimatedStyle}>
              <View style={s(colors).sosIconWrap}>
                {sendingSos ? (
                  <ActivityIndicator color={colors.textInverse} size="large" />
                ) : (
                  <Ionicons name="warning" size={40} color={colors.textInverse} />
                )}
              </View>
              <Text style={s(colors).sosLabel}>{sendingSos ? 'SENDING...' : 'SEND SOS'}</Text>
              <Text style={s(colors).sosSub}>Alerts all contacts with location</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* QUICK DIAL */}
      <View style={s(colors).section}>
        <Text style={s(colors).sectionTitle}>Quick Dial</Text>
        {quickDials.map((item, index) => (
          <TouchableOpacity key={index} onPress={() => callNumber(item.phone)} style={s(colors).quickDialItem}>
            <View style={[s(colors).dialIcon, { backgroundColor: `${item.color}20`, borderColor: `${item.color}40` }]}>
              <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={item.color} />
            </View>
            <View style={s(colors).dialInfo}>
              <Text style={s(colors).dialName}>{item.name}</Text>
              <Text style={s(colors).dialNumber}>{item.phone}</Text>
            </View>
            <View style={s(colors).callBtn}>
              <Ionicons name="call" size={18} color="#007749" />
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* EMERGENCY CONTACTS */}
      <View style={s(colors).section}>
        <Text style={s(colors).sectionTitle}>Emergency Contacts ({contacts.length})</Text>
        {loading ? (
          <View style={s(colors).glass}>
            <View style={s(colors).glassRefraction} />
            {[1,2,3].map(i => (
              <View key={i} style={{ height: 60, backgroundColor: 'rgba(255,255,255,0.03)', marginBottom: 1 }} />
            ))}
          </View>
        ) : contacts.length === 0 ? (
          <View style={s(colors).glass}>
            <View style={s(colors).glassRefraction} />
            <Text style={s(colors).emptyText}>No emergency contacts added. Add contacts in Settings.</Text>
          </View>
        ) : (
          contacts.map(contact => (
            <View key={contact.id} style={s(colors).contactCard}>
              <View style={s(colors).contactAvatar}>
                <Text style={s(colors).contactInitial}>{getInitials(contact.name)}</Text>
              </View>
              <View style={s(colors).contactInfo}>
                <Text style={s(colors).contactName}>{contact.name}</Text>
                <Text style={s(colors).contactPhone}>{contact.phone}</Text>
                <Badge label={contact.relationship} variant={contact.is_primary ? 'warning' : 'neutral'} size="small" />
              </View>
              <TouchableOpacity onPress={() => callNumber(contact.phone)} style={s(colors).callBtn}>
                <Ionicons name="call" size={18} color="#007749" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </View>

      {/* SAFETY TIPS */}
      <View style={s(colors).section}>
        <Text style={s(colors).sectionTitle}>Safety Tips</Text>
        {tips.map((tip, index) => (
          <View key={index} style={s(colors).tipCard}>
            <Ionicons name={tip.icon as keyof typeof Ionicons.glyphMap} size={20} color="#FFB81C" />
            <Text style={s(colors).tipText}>{tip.text}</Text>
          </View>
        ))}
      </View>

      <Spacer size="xxl" />
    </ScrollView>
  );
};

export default EmergencyScreen;
