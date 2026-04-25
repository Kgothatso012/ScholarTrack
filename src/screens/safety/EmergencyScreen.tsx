// Emergency Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withRepeat, withSequence, FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { emergencyContactService, panicAlertService } from '../../lib/services/emergency';
import { locationService } from '../../services/location';
import { sendAppNotification } from '../../services/NotificationService';
import { supabase } from '../../lib/supabase';
import { EmergencyContact } from '../../lib/services/types';
import { Spacer, Badge } from '../../ui-plugin/components';
import { RSA_EMERGENCY } from '../../constants/app';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S } = getTheme('dark');

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

const EmergencyScreen = () => {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [sendingSos, setSendingSos] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);

  const sosScale = useSharedValue(1);
  const sosRingScale = useSharedValue(1);
  const sosRingOpacity = useSharedValue(0.4);

  useEffect(() => {
    sosRingScale.value = withRepeat(withSequence(withTiming(1.3, { duration: 1800 }), withTiming(1, { duration: 1800 })), -1, false);
    sosRingOpacity.value = withRepeat(withSequence(withTiming(0, { duration: 1800 }), withTiming(0.4, { duration: 1800 })), -1, false);
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await emergencyContactService.getContacts(user.id);
      setContacts(data);
    } catch (error) { console.error('Error loading contacts:', error); }
    finally { setLoading(false); }
  };

  const callNumber = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => Alert.alert('Error', 'Unable to make phone call'));
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const sendSOS = async () => {
    try {
      setSendingSos(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Please login first'); return; }
      const result = await locationService.getCurrentLocation();
      const locationStr = result.location ? `${result.location.coords.latitude},${result.location.coords.longitude}` : undefined;
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
    } finally { setSendingSos(false); }
  };

  const sosAlert = () => {
    if (contacts.length === 0) { Alert.alert('No Contacts', 'Please add emergency contacts first'); return; }
    Alert.alert('SEND SOS', `Send emergency alert to ${contacts.length} contact(s) with your location?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'SEND SOS', style: 'destructive', onPress: sendSOS },
    ]);
  };

  const handleSOSPressIn = () => { sosScale.value = withSpring(0.93, { damping: 15, stiffness: 150, mass: 0.8 }); };
  const handleSOSPressOut = () => { sosScale.value = withSpring(1, { damping: 15, stiffness: 150, mass: 0.8 }); };

  const quickDials = [
    { name: 'Police', phone: RSA_EMERGENCY.POLICE, icon: 'shield', color: C.success },
    { name: 'Ambulance', phone: RSA_EMERGENCY.AMBULANCE, icon: 'medkit', color: '#E03C31' },
    { name: 'Fire', phone: RSA_EMERGENCY.FIRE, icon: 'flame', color: C.accent },
  ];

  const tips = [
    { icon: 'location', text: 'Your location is automatically shared with emergency contacts' },
    { icon: 'time', text: 'SOS alerts include timestamp for emergency services' },
    { icon: 'shield-checkmark', text: 'All contacts verified through ScholarTrack' },
  ];

  const sosAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: sosScale.value }] }));
  const sosRingAnimatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: sosRingScale.value }], opacity: sosRingOpacity.value }));

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    headerGlass: { backgroundColor: C.surface, borderBottomLeftRadius: 32, borderBottomRightRadius: 32, padding: 20, paddingTop: insets.top + 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,184,28,0.15)', position: 'relative', overflow: 'hidden' },
    headerGlow: { position: 'absolute', top: -60, right: -40, width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(224,60,49,0.1)' },
    headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 },
    headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    headerSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.6)', marginTop: 4 },
    sosHero: { marginHorizontal: 16, marginTop: 20, position: 'relative' },
    sosGlass: { ...glass, padding: 28, alignItems: 'center', borderColor: 'rgba(224,60,49,.3)', borderWidth: 1, shadowColor: '#E03C31', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.2, shadowRadius: 40, elevation: 0 },
    sosRingOuter: { position: 'absolute', top: '50%', left: '50%', marginTop: -70, marginLeft: -70, width: 140, height: 140, borderRadius: 70, borderWidth: 2, borderColor: 'rgba(224,60,49,.3)' },
    sosRingMid: { position: 'absolute', top: '50%', left: '50%', marginTop: -55, marginLeft: -55, width: 110, height: 110, borderRadius: 55, borderWidth: 1, borderColor: 'rgba(224,60,49,.2)' },
    sosTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(224,60,49,.3)' },
    sosIconWrap: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(224,60,49,.2)', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(224,60,49,.5)', marginBottom: 14, zIndex: 1 },
    sosLabel: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: C.text, zIndex: 1 },
    sosSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.5)', marginTop: 4, zIndex: 1 },
    section: { paddingHorizontal: 16, paddingTop: 20 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    quickDialItem: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, ...glass, gap: 14 },
    dialIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    dialInfo: { flex: 1 },
    dialName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    dialNumber: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: C.success },
    callBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    contactCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, ...glass, gap: 14 },
    contactAvatar: { width: 45, height: 45, borderRadius: 22.5, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,35,149,.3)' },
    contactInitial: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '800', color: C.primary },
    contactInfo: { flex: 1 },
    contactName: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    contactPhone: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 20 },
    emptyCard: { ...glass, padding: 20, marginBottom: 10 },
    skeletonCard: { ...glass, height: 76, marginBottom: 10, borderRadius: 20 },
    tipCard: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, ...glass, gap: 14 },
    tipText: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textSecondary, lineHeight: 18 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    bottomPadding: { height: 50 },
  });

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={s.headerGlass}>
        <View style={s.headerGlow} />
        <View style={s.headerRow}>
          <View><Text style={s.headerTitle}>Emergency Services</Text><Text style={s.headerSub}>Quick access to emergency help</Text></View>
        </View>
      </View>

      {/* SOS BUTTON */}
      <View style={s.sosHero}>
        <View style={s.sosGlass}>
          <Animated.View style={[s.sosRingOuter, sosRingAnimatedStyle]} />
          <Animated.View style={[s.sosRingMid, sosRingAnimatedStyle]} />
          <View style={s.sosTopRefraction} />
          <TouchableOpacity activeOpacity={1} onPress={sosAlert} onPressIn={handleSOSPressIn} onPressOut={handleSOSPressOut} disabled={sendingSos} style={{ alignItems: 'center' }}>
            <Animated.View style={sosAnimatedStyle}>
              <View style={s.sosIconWrap}>
                {sendingSos ? (
                  <ActivityIndicator color={C.text} size="large" />
                ) : (
                  <Ionicons name="warning" size={40} color={C.text} />
                )}
              </View>
              <Text style={s.sosLabel}>{sendingSos ? 'SENDING...' : 'SEND SOS'}</Text>
              <Text style={s.sosSub}>Alerts all contacts with location</Text>
            </Animated.View>
          </TouchableOpacity>
        </View>
      </View>

      {/* QUICK DIAL */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Quick Dial</Text>
        {quickDials.map((item, index) => (
          <Animated.View key={index} entering={FadeIn.delay(index * 80).springify()}>
            <TouchableOpacity onPress={() => callNumber(item.phone)} style={s.quickDialItem}>
              <View style={[s.dialIcon, { backgroundColor: `${item.color}18`, borderColor: `${item.color}35` }]}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={item.color} />
              </View>
              <View style={s.dialInfo}>
                <Text style={s.dialName}>{item.name}</Text>
                <Text style={[s.dialNumber, { color: item.color }]}>{item.phone}</Text>
              </View>
              <View style={[s.callBtn, { backgroundColor: `${C.success}20` }]}>
                <Ionicons name="call" size={18} color={C.success} />
              </View>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* EMERGENCY CONTACTS */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Emergency Contacts ({contacts.length})</Text>
        {loading ? (
          <>
            <View style={s.skeletonCard} />
            <View style={s.skeletonCard} />
            <View style={s.skeletonCard} />
          </>
        ) : contacts.length === 0 ? (
          <View style={s.emptyCard}><Text style={s.emptyText}>No emergency contacts added. Add contacts in Settings.</Text></View>
        ) : (
          contacts.map((contact, index) => (
            <Animated.View key={contact.id} entering={FadeIn.delay(index * 70).springify()} style={s.contactCard}>
              <View style={[s.contactAvatar, { backgroundColor: 'rgba(0,35,149,.15)' }]}>
                <Text style={s.contactInitial}>{getInitials(contact.name)}</Text>
              </View>
              <View style={s.contactInfo}>
                <Text style={s.contactName}>{contact.name}</Text>
                <Text style={s.contactPhone}>{contact.phone}</Text>
                <Badge label={contact.relationship} variant={contact.is_primary ? 'warning' : 'neutral'} size="small" />
              </View>
              <TouchableOpacity onPress={() => callNumber(contact.phone)} style={[s.callBtn, { backgroundColor: `${C.success}20` }]}>
                <Ionicons name="call" size={18} color={C.success} />
              </TouchableOpacity>
            </Animated.View>
          ))
        )}
      </View>

      {/* SAFETY TIPS */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Safety Tips</Text>
        {tips.map((tip, index) => (
          <Animated.View key={index} entering={FadeIn.delay(index * 60).springify()} style={s.tipCard}>
            <Ionicons name={tip.icon as keyof typeof Ionicons.glyphMap} size={20} color={C.accent} />
            <Text style={s.tipText}>{tip.text}</Text>
          </Animated.View>
        ))}
      </View>

      <Spacer size="xxl" />
      <View style={s.bottomPadding} />
    </ScrollView>
  );
};

export default EmergencyScreen;
