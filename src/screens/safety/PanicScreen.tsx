// Panic Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { panicAlertService } from '../../lib/services/emergency';
import { locationService } from '../../services/location';
import { sendAppNotification } from '../../services/NotificationService';
import { supabase } from '../../lib/supabase';
import { emergencyContactService } from '../../lib/services/emergency';
import { EmergencyContact } from '../../lib/services/types';
import { Spacer, Badge, Card } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

export const PanicButton = ({
  style,
  size = 60,
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
        { width: size, height: size, borderRadius: size / 2, backgroundColor: C.error, justifyContent: 'center', alignItems: 'center' },
        pressed && { transform: [{ scale: 0.95 }] },
        style,
      ]}
      onPress={onActivate}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <Ionicons name="warning" size={size * 0.5} color={C.text} />
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
    if (contacts.length === 0) { Alert.alert('No Contacts', 'Please add emergency contacts first'); return; }
    try {
      setSending(true);
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
      setSosActive(true);
    } catch (error: unknown) {
      Alert.alert('SOS Failed', error instanceof Error ? error.message || 'Failed to send emergency alert' : 'Failed to send emergency alert');
    } finally { setSending(false); }
  };

  const triggerSOS = () => {
    if (contacts.length === 0) { Alert.alert('No Contacts', 'Please add emergency contacts first'); return; }
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
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
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
    bottomPadding: { height: 50 },
  });

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
      </View>

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
