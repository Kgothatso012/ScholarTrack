// Settings Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal, Linking, RefreshControl, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { Spacer, Card } from '../../ui-plugin/components';
import { getTheme, cards } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

const glass = cards.glassAmber;

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void; reset: (state: object) => void };
}

export default function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [userProfile, setUserProfile] = useState<UserProfile>({ name: '', email: '', phone: '', role: 'parent' });
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editProfile, setEditProfile] = useState({ name: '', phone: '' });

  const [notifications, setNotifications] = useState({
    trips: true,
    payments: true,
    safety: true,
    updates: false,
    email: true,
  });

  const [privacy, setPrivacy] = useState({
    shareLocation: true,
    showProfile: true,
    showPhone: false,
  });

  const [appSettings, setAppSettings] = useState({
    language: 'English',
    emergencyAlert: true,
    autoRefresh: true,
    darkMode: true,
  });
  const isDriver = userProfile.role === 'driver';
  const isParent = userProfile.role === 'parent';

  useEffect(() => { loadUserProfile(); }, []);
  const loadUserProfile = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');
      const phone = await AsyncStorage.getItem('userPhone');
      const role = await AsyncStorage.getItem('userRole');
      setUserProfile({ name: name || '', email: email || '', phone: phone || '', role: role || 'parent' });
      setEditProfile({ name: name || '', phone: phone || '' });
    } catch (error) { /* silent */ }
  };

  const handleSaveProfile = async () => {
    try {
      await AsyncStorage.setItem('userName', editProfile.name);
      await AsyncStorage.setItem('userPhone', editProfile.phone);
      setUserProfile(prev => ({ ...prev, name: editProfile.name, phone: editProfile.phone }));
      setShowProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) { Alert.alert('Error', 'Failed to update profile'); }
  };
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          await AsyncStorage.clear();
          navigation.reset({ index: 0, routes: [{ name: 'Auth' }] });
        },
      },
    ]);
  };

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open link'));
  };
  const now = new Date();
    const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },

    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.accent, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,229,255,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    headerBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
    section: { paddingHorizontal: 16, paddingTop: 20 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    profileCard: { ...glass, padding: 16, flexDirection: 'row', alignItems: 'center' },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(0,229,255,.4)' },
    profileAvatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: 'rgba(0,229,255,.3)' },
    profileInitial: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '800', color: C.accent },
    profileInfo: { flex: 1, marginLeft: 14 },
    profileName: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.text },
    profileEmail: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted, marginTop: 2 },
    badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 6, alignSelf: 'flex-start' },
    badgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: C.text, textTransform: 'capitalize' },
    settingCard: { padding: 0, overflow: 'visible' },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    settingInfo: { flex: 1 },
    settingLabel: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    settingDesc: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    settingRowBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: C.border },
    settingRowBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.text },
    themeRow: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 8 },
    themeOption: { alignItems: 'center', padding: 12, borderRadius: 14, gap: 6 },
    themeIcon: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    themeLabel: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '600', color: C.textMuted },
    dangerBtn: { ...glass, padding: 16, marginHorizontal: 16, marginTop: 20, alignItems: 'center', borderColor: 'rgba(255,61,90,.3)' },
    dangerText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.error },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { ...glass, padding: 24, width: '85%', borderRadius: 24 },
    modalTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: C.text, marginBottom: 20 },
    inputLabel: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.accent, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
    input: { ...glass, borderRadius: 12, padding: 14, fontFamily: 'Syne_700Bold', fontSize: 14, color: C.text, marginBottom: 16, borderColor: C.border },
    modalActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
    saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
    saveBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.background },
    cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: C.border },
    cancelBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: C.textMuted },
    bottomPadding: { height: 50 },
  });

  const SettingRow = ({ label, description, value, onValueChange }: { label: string; description?: string; value: boolean; onValueChange: (v: boolean) => void }) => (
    <View style={s.settingRow}>
      <View style={s.settingInfo}>
        <Text style={s.settingLabel}>{label}</Text>
        {description && <Text style={s.settingDesc}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: C.border, true: `${C.accent}60` }}
        thumbColor={value ? C.accent : C.textMuted}
      />
    </View>
  );

  const SettingRowBtn = ({ label, onPress }: { label: string; onPress: () => void }) => (
    <TouchableOpacity style={s.settingRowBtn} onPress={onPress} activeOpacity={0.7}>
      <Text style={s.settingRowBtnText}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={s.container}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={false} onRefresh={loadUserProfile} tintColor={C.accent} colors={[C.accent]} />}
    >





      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Settings</Text><Text style={s.ltSub}>{userProfile.name || 'User'} — {userProfile.role || 'Parent'}</Text></View>
          <TouchableOpacity style={s.headerBtn} onPress={loadUserProfile}>
            <Ionicons name="refresh" size={18} color={C.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Profile</Text>
        <TouchableOpacity style={s.profileCard} onPress={() => setShowProfileModal(true)} activeOpacity={0.8}>
          <View style={s.cardTopRefraction} />
          <View style={[s.profileAvatar, { backgroundColor: `${C.accent}15` }]}>
            <Text style={s.profileInitial}>{(userProfile.name || 'U').substring(0, 1).toUpperCase()}</Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.profileName}>{userProfile.name || 'User'}</Text>
            <Text style={s.profileEmail}>{userProfile.email || 'No email'}</Text>
            <View style={[s.badge, { backgroundColor: C.primary }]}>
              <Text style={s.badgeText}>{userProfile.role}</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={18} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Notifications</Text>
        <View style={s.settingCard}>
          <SettingRow label="Trip Updates" description="Get notified about trip status changes" value={notifications.trips} onValueChange={v => setNotifications(n => ({ ...n, trips: v }))} />
          <SettingRow label="Payment Alerts" description="Payment confirmations and reminders" value={notifications.payments} onValueChange={v => setNotifications(n => ({ ...n, payments: v }))} />
          <SettingRow label="Safety Alerts" description="Emergency and safety notifications" value={notifications.safety} onValueChange={v => setNotifications(n => ({ ...n, safety: v }))} />
          <SettingRow label="Email Notifications" description="Receive updates via email" value={notifications.email} onValueChange={v => setNotifications(n => ({ ...n, email: v }))} />
        </View>
      </View>

      {/* Privacy */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Privacy</Text>
        <View style={s.settingCard}>
          <SettingRow label="Share Location" description="Allow tracking for safety features" value={privacy.shareLocation} onValueChange={v => setPrivacy(p => ({ ...p, shareLocation: v }))} />
          <SettingRow label="Show Profile" description="Allow others to see your profile" value={privacy.showProfile} onValueChange={v => setPrivacy(p => ({ ...p, showProfile: v }))} />
        </View>
      </View>

      {/* App Settings */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>App</Text>
        <View style={s.settingCard}>
          <SettingRow label="Emergency Alert" description="Enable SOS button" value={appSettings.emergencyAlert} onValueChange={v => setAppSettings(s => ({ ...s, emergencyAlert: v }))} />
          <SettingRow label="Auto Refresh" description="Automatically refresh data" value={appSettings.autoRefresh} onValueChange={v => setAppSettings(s => ({ ...s, autoRefresh: v }))} />
        </View>
      </View>

      {/* Role-specific */}
      {isDriver && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Driver Settings</Text>
          <View style={s.settingCard}>
            <SettingRowBtn label="Vehicle Checklist" onPress={() => navigation.navigate('VehicleChecklist')} />
            <SettingRowBtn label="Compliance Documents" onPress={() => navigation.navigate('Compliance')} />
            <SettingRow label="Auto-Assigned Routes" description="Automatically accept assigned routes" value={appSettings.autoRefresh} onValueChange={v => setAppSettings(s => ({ ...s, autoRefresh: v }))} />
          </View>
        </View>
      )}

      {isParent && (
        <View style={s.section}>
          <Text style={s.sectionTitle}>Parent Settings</Text>
          <View style={s.settingCard}>
            <SettingRowBtn label="Manage Children" onPress={() => navigation.navigate('Children')} />
            <SettingRowBtn label="Emergency Contacts" onPress={() => navigation.navigate('EmergencyContacts')} />
            <SettingRow label="Real-Time Tracking" description="Enable live location updates" value={privacy.shareLocation} onValueChange={v => setPrivacy(p => ({ ...p, shareLocation: v }))} />
          </View>
        </View>
      )}

      {/* About */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>About</Text>
        <View style={s.settingCard}>
          <SettingRowBtn label="Privacy Policy" onPress={() => handleLink('https://scholartrack.co.za/privacy')} />
          <SettingRowBtn label="Terms of Service" onPress={() => handleLink('https://scholartrack.co.za/terms')} />
          <SettingRowBtn label="Contact Support" onPress={() => navigation.navigate('Support')} />
          <SettingRowBtn label="DevTools — Test GPS, Notifications, SOS" onPress={() => navigation.navigate('DevTools')} />
        </View>
      </View>

      {/* Logout */}
      <TouchableOpacity style={s.dangerBtn} onPress={handleLogout} activeOpacity={0.7}>
        <View style={s.cardTopRefraction} />
        <Text style={s.dangerText}>Logout</Text>
      </TouchableOpacity>

      <Spacer size="xl" />
      <View style={s.bottomPadding} />

      {/* Profile Edit Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <TouchableOpacity onPress={() => setShowProfileModal(false)} style={{ position: 'absolute', top: 16, right: 16 }}>
              <Ionicons name="close" size={22} color={C.textMuted} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Edit Profile</Text>
            <Text style={s.inputLabel}>Name</Text>
            <TextInput
              style={s.input}
              value={editProfile.name}
              onChangeText={text => setEditProfile(prev => ({ ...prev, name: text }))}
              placeholder="Enter your name"
              placeholderTextColor={C.textMuted}
            />
            <Text style={s.inputLabel}>Phone</Text>
            <TextInput
              style={s.input}
              value={editProfile.phone}
              onChangeText={text => setEditProfile(prev => ({ ...prev, phone: text }))}
              placeholder="Enter your phone"
              placeholderTextColor={C.textMuted}
              keyboardType="phone-pad"
            />
            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setShowProfileModal(false)}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, { backgroundColor: C.accent }]} onPress={handleSaveProfile}>
                <Text style={s.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}
