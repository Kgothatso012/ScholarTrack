// ConsentGate — POPIA §11 consent gate.
//
// Blocks core screens until the signed-in user has accepted the current policy
// version (CONSENT_VERSION). On a version bump (policy change) it re-prompts:
// a user whose stored consent_version no longer matches is asked to accept the
// updated policy before continuing, and `record_consent` persists the new
// version + timestamp.
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, Alert, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { getTheme } from '../ui-plugin/theme';
import { CONSENT_VERSION, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../constants/app';

const { colors: C } = getTheme('dark');

export default function ConsentGate() {
  const [checking, setChecking] = useState(true);
  const [needsConsent, setNeedsConsent] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { if (active) { setChecking(false); } return; }
        const { data, error } = await supabase
          .from('profiles')
          .select('consent_version')
          .eq('id', user.id)
          .maybeSingle();
        if (active) {
          if (error || !data || data.consent_version !== CONSENT_VERSION) {
            setNeedsConsent(true);
          }
          setChecking(false);
        }
      } catch {
        if (active) setChecking(false);
      }
    })();
    return () => { active = false; };
  }, []);

  if (checking || !needsConsent) return null;

  const accept = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.rpc('record_consent', {
        p_version: CONSENT_VERSION,
        p_policy_url: PRIVACY_POLICY_URL,
      });
      if (error) throw error;
      setNeedsConsent(false);
    } catch (error) {
      Alert.alert('Could not record consent', error instanceof Error ? error.message : 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={() => {}}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.topBar} />
          <Text style={styles.title}>Privacy Policy update</Text>
          <Text style={styles.body}>
            We have updated our Privacy Policy and Terms of Service. To continue using
            ScholarTrack, please review and accept the updated terms.
          </Text>
          <View style={styles.linkRow}>
            <Text style={styles.link} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>Privacy Policy</Text>
            <Text style={styles.dot}> • </Text>
            <Text style={styles.link} onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>Terms of Service</Text>
          </View>
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 16 }}
            onPress={() => setAccepted(v => !v)}
            activeOpacity={0.7}
          >
            <View style={[styles.box, accepted && { borderColor: C.success, backgroundColor: C.success }]}>
              {accepted ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
            </View>
            <Text style={styles.checkboxLabel}>
              I have read and agree to the updated Privacy Policy and Terms of Service.
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, (!accepted || saving) && styles.btnDisabled]}
            disabled={!accepted || saving}
            onPress={accept}
            activeOpacity={0.8}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Accept & continue</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  sheet: { width: '100%', maxWidth: 420, backgroundColor: C.surface, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: C.border },
  topBar: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,229,255,.4)' },
  title: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '800', color: C.text, marginBottom: 12 },
  body: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, lineHeight: 20 },
  linkRow: { flexDirection: 'row', marginTop: 12, flexWrap: 'wrap' },
  link: { color: C.accent, fontWeight: '700', fontSize: 13 },
  dot: { color: C.textMuted, fontSize: 13 },
  box: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: C.textMuted, marginRight: 10, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  checkboxLabel: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 13, color: C.text, lineHeight: 20 },
  btn: { marginTop: 20, backgroundColor: C.accent, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnDisabled: { opacity: 0.5 },
  btnText: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '800', color: '#001018' },
});
