// Panic Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { locationService } from '../../services/location';
import { sendAppNotification } from '../../services/NotificationService';
import { supabase } from '../../lib/supabase';
import { emergencyContactService } from '../../lib/services/emergency';
import { EmergencyContact } from '../../lib/services/types';
import { Spacer, Badge, Card } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';
import { RSA_EMERGENCY } from '../../constants/app';

const { colors: C, spacing: S } = getTheme('dark');

const callEmergencyNumber = (phone: string) =>
  Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() =>
    Alert.alert('Unable to Call', `Could not open the dialer. Please call ${phone} manually.`)
  );

// SA emergency service numbers — always available, even with zero saved contacts
const quickDials = [
  { name: 'Police', phone: RSA_EMERGENCY.POLICE, icon: 'shield', color: C.success },
  { name: 'Ambulance', phone: RSA_EMERGENCY.AMBULANCE, icon: 'medkit', color: C.error },
  { name: 'Fire', phone: RSA_EMERGENCY.FIRE, icon: 'flame', color: C.accent },
];

export const PanicButton = ({
  style,
  size = 88,
  onActivate,
}: {
  style?: any;
  size?: number;
  onActivate?: () => void;
}) => {
  const [pressed, setPressed] = useState(false);
  return (
    <TouchableOpacity
      style={[
        {
          width: '100%',
          height: 88,
          borderRadius: 16,
          backgroundColor: C.error,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          gap: 12,
        },
        pressed && { transform: [{ scale: 0.97 }], opacity: 0.9 },
        style,
      ]}
      onPress={onActivate}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Ionicons name="warning" size={32} color={C.textInverse} />
      <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 22, color: C.textInverse, letterSpacing: 0.5 }}>
        EMERGENCY — TAP FOR HELP
      </Text>
    </TouchableOpacity>
  );
};

export default function PanicScreen() {
  const insets = useSafeAreaInsets();
  const [sosActive, setSosActive] = useState(false);
  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadContacts(); }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await emergencyContactService.getContacts(user.id);
      setContacts(data);
    } catch (error) { /* silent */ }
    finally { setLoading(false); }
  };

  const sendSOS = async () => {
    // Check GPS first — warn if location will be missing
    let locationStr: string | undefined = undefined;
    let gpsAvailable = true;
    try {
      const result = await locationService.getCurrentLocation();
      if (result.location) {
        locationStr = `${result.location.coords.latitude},${result.location.coords.longitude}`;
      } else {
        gpsAvailable = false;
      }
    } catch {
      gpsAvailable = false;
    }

    // If GPS is off, warn the user before proceeding
    if (!gpsAvailable) {
      const proceed = await new Promise<boolean>((resolve) => {
        Alert.alert(
          'Location Unavailable',
          'Your GPS is off or location permission is denied. SOS will be sent WITHOUT your location. For a life-threatening emergency, call 10111 (Police) or 10177 (Ambulance) directly.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Send SOS Anyway', onPress: () => resolve(true) },
            { text: 'Call 10111', onPress: () => { callEmergencyNumber(RSA_EMERGENCY.POLICE); resolve(false); } },
          ]
        );
      });
      if (!proceed) return;
    }

    if (contacts.length === 0) {
      Alert.alert(
        'No Emergency Contacts',
        'You have no saved emergency contacts. For a life-threatening emergency, call 10111 (Police) or 10177 (Ambulance) now.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Call 10111', onPress: () => callEmergencyNumber(RSA_EMERGENCY.POLICE) },
          { text: 'Call 10177', onPress: () => callEmergencyNumber(RSA_EMERGENCY.AMBULANCE) },
        ]
      );
      return;
    }
    try {
      setSending(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { Alert.alert('Error', 'Please login first'); return; }
      const panicAlert = await emergencyContactService.createPanicAlert(user.id, locationStr);
      for (const contact of contacts) {
        await sendAppNotification('EMERGENCY', user.id, {
          message: `Emergency SOS from ${user.email}${gpsAvailable ? '' : ' (no location)'}`,
          location: locationStr,
          timestamp: new Date().toISOString(),
          panicAlertId: panicAlert?.id,
        });
      }
      setSosActive(true);
    } catch (error: unknown) {
      Alert.alert(
        'SOS Failed',
        `Failed to send emergency alert.\n\nFor a life-threatening emergency, call 10111 (Police) or 10177 (Ambulance).`,
        [
          { text: 'OK', style: 'cancel' },
          { text: 'Call 10111', onPress: () => callEmergencyNumber(RSA_EMERGENCY.POLICE) },
          { text: 'Call 10177', onPress: () => callEmergencyNumber(RSA_EMERGENCY.AMBULANCE) },
        ]
      );
    } finally { setSending(false); }
  };

  const triggerSOS = () => {
    if (contacts.length === 0) {
      Alert.alert(
        'No Emergency Contacts',
        'You have no saved emergency contacts. For a life-threatening emergency, call 10111 (Police) or 10177 (Ambulance) now.',
        [
          { text: 'Not now', style: 'cancel' },
          { text: 'Call 10111', onPress: () => callEmergencyNumber(RSA_EMERGENCY.POLICE) },
          { text: 'Call 10177', onPress: () => callEmergencyNumber(RSA_EMERGENCY.AMBULANCE) },
        ]
      );
      return;
    }
    Alert.alert('Trigger SOS', `Send emergency alert to ${contacts.length} contact(s)?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'SEND', style: 'destructive', onPress: sendSOS },
    ]);
  };

  const cancelSOS = () => { setSosActive(false); };

  const callContact = (phone: string) => {
    Linking.openURL(`tel:${phone.replace(/\s/g, '')}`).catch(() => Alert.alert('Error', 'Unable to make phone call'));
  };

  const now = new Date();
  

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },




    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.error, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,61,90,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    sosCard: { marginHorizontal: 16, marginTop: 20, padding: 32, alignItems: 'center', borderColor: 'rgba(255,61,90,.3)', borderWidth: 1, shadowColor: C.error, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24 },
    sosTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,61,90,.3)' },
    sosButton: { width: 100, height: 100, borderRadius: 50, backgroundColor: C.error, justifyContent: 'center', alignItems: 'center', marginBottom: 16, shadowColor: C.error, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12 },
    sosText: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 6 },
    sosSub: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted },
    sosLoading: { marginTop: 12 },
    activeCard: { marginHorizontal: 16, marginTop: 16, padding: 20, borderColor: 'rgba(255,61,90,.3)', borderWidth: 1 },
    activeTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,61,90,.3)' },
    activeTitle: { fontFamily: 'Syne_700Bold', fontSize: 15, color: C.text, textAlign: 'center', marginBottom: 14 },
    cancelBtn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    cancelBtnText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: C.textMuted },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    contactCard: { padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    contactIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(0,229,255,.3)' },
    contactInfo: { flex: 1, marginLeft: 12 },
    contactName: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: C.text },
    contactPhone: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    callBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', paddingVertical: 30 },
    skeletonCard: { height: 76, marginBottom: 10, borderRadius: 20 },
    quickDialItem: { flexDirection: 'row', alignItems: 'center', padding: 14, marginBottom: 10, gap: 14 },
    dialIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    dialInfo: { flex: 1 },
    dialName: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.text },
    dialNumber: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '800', marginTop: 2 },
    bottomPadding: { height: 50 },
  });

  return (
    <View style={s.container}>





      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Emergency SOS</Text><Text style={s.ltSub}>Quick emergency response</Text></View>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* SOS Button */}
        <Card variant='glassAmber' style={s.sosCard}>
          <View style={s.sosTopRefraction} />
          <TouchableOpacity style={s.sosButton} onPress={triggerSOS} disabled={sending} activeOpacity={0.8}>
            <Ionicons name="warning" size={44} color={C.text} />
          </TouchableOpacity>
          <Text style={s.sosText}>{sending ? 'SENDING...' : 'TAP TO SEND SOS'}</Text>
          <Text style={s.sosSub}>{contacts.length} contacts will be notified</Text>
          {sending && <View style={s.sosLoading}><ActivityIndicator color={C.error} /></View>}
        </Card>

        {/* Active SOS State */}
        {sosActive && (
          <Card variant='glassAmber' style={s.activeCard}>
            <View style={s.activeTopRefraction} />
            <Badge label="SOS ACTIVE" variant="error" size="medium" />
            <Spacer size="md" />
            <Text style={s.activeTitle}>Emergency contacts have been notified</Text>
            <TouchableOpacity style={s.cancelBtn} onPress={cancelSOS}>
              <Text style={s.cancelBtnText}>Cancel Alert</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Quick Dial — direct access to SA emergency services */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Call Emergency Services</Text>
          {quickDials.map((item, index) => (
            <Card
              key={index}
              variant='glassAmber'
              onPress={() => callEmergencyNumber(item.phone)}
              style={s.quickDialItem}
            >
              <View style={[s.dialIcon, { backgroundColor: `${item.color}18`, borderColor: `${item.color}35` }]}>
                <Ionicons name={item.icon as keyof typeof Ionicons.glyphMap} size={24} color={item.color} />
              </View>
              <View style={s.dialInfo}>
                <Text style={s.dialName}>{item.name}</Text>
                <Text style={[s.dialNumber, { color: item.color }]}>{item.phone}</Text>
              </View>
              <View style={[s.callBtn, { backgroundColor: 'rgba(5,150,105,.18)' }]}>
                <Ionicons name="call" size={20} color={C.success} />
              </View>
            </Card>
          ))}
        </View>

        {/* Emergency Contacts */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Emergency Contacts ({contacts.length})</Text>
          {loading ? (
            <>
              <Card variant='glassAmber' style={s.skeletonCard}>{null}</Card>
              <Card variant='glassAmber' style={s.skeletonCard}>{null}</Card>
              <Card variant='glassAmber' style={s.skeletonCard}>{null}</Card>
            </>
          ) : contacts.length === 0 ? (
            <Text style={s.emptyText}>No emergency contacts added</Text>
          ) : (
            contacts.map((contact) => (
              <Card key={contact.id} variant='glassAmber' style={s.contactCard}>
                <View style={s.cardTopRefraction} />
                <View style={[s.contactIcon, { backgroundColor: 'rgba(0,229,255,.08)' }]}>
                  <Ionicons name="person" size={18} color={C.accent} />
                </View>
                <View style={s.contactInfo}>
                  <Text style={s.contactName}>{contact.name}</Text>
                  <Text style={s.contactPhone}>{contact.phone}</Text>
                  {contact.is_primary && <Badge label="Primary" variant="warning" size="small" />}
                </View>
                <TouchableOpacity style={[s.callBtn, { backgroundColor: 'rgba(0,119,73,.15)' }]} onPress={() => callContact(contact.phone)}>
                  <Ionicons name="call" size={18} color={C.success} />
                </TouchableOpacity>
              </Card>
            ))
          )}
        </View>

        <Spacer size="xl" />
        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
}
