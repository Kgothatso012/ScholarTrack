// Comprehensive Settings Screen for All User Roles
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, TextInput, Modal, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role: string;
}

export default function SettingsScreen({ navigation }: any) {
  const { colors, themeMode, setThemeMode } = useTheme();
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
    darkMode: themeMode === 'dark',
  });

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      const name = await AsyncStorage.getItem('userName');
      const email = await AsyncStorage.getItem('userEmail');
      const phone = await AsyncStorage.getItem('userPhone');
      const role = await AsyncStorage.getItem('userRole');

      setUserProfile({
        name: name || 'User',
        email: email || '',
        phone: phone || '',
        role: role || 'parent',
      });

      setEditProfile({ name: name || '', phone: phone || '' });
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const handleSaveProfile = async () => {
    try {
      await AsyncStorage.setItem('userName', editProfile.name);
      await AsyncStorage.setItem('userPhone', editProfile.phone);

      setUserProfile(prev => ({ ...prev, name: editProfile.name, phone: editProfile.phone }));
      setShowProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    }
  };

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            await AsyncStorage.clear();
            (window as any).logout?.();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            Alert.alert('Contact Support', 'Please contact support to delete your account.');
          },
        },
      ]
    );
  };

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@scholartrack.co.za');
  };

  const themeOptions: { value: ThemeMode; label: string; icon: string; color: string }[] = [
    { value: 'light', label: 'Light', icon: 'sunny', color: '#ffffff' },
    { value: 'dark', label: 'Dark', icon: 'moon', color: '#1a1a1a' },
    { value: 'blue', label: 'Blue', icon: 'color-palette', color: '#002395' },
  ];

  const SettingSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: colors.card }]}>
        {children}
      </View>
    </View>
  );

  const SettingItem = ({ icon, title, subtitle, onPress, right, color = colors.accent }: any) => (
    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.divider }]} onPress={onPress} disabled={!onPress}>
      <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right || (onPress && <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />)}
    </TouchableOpacity>
  );

  const ToggleItem = ({ icon, title, subtitle, value, onValueChange, color = colors.accent }: any) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
      <View style={[styles.settingIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.primary, false: colors.border }}
        thumbColor={value ? '#fff' : '#f4f3f4'}
      />
    </View>
  );

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'parent': return 'Parent';
      case 'driver': return 'Driver';
      case 'admin': return 'Admin';
      default: return 'User';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'parent': return 'people';
      case 'driver': return 'car';
      case 'admin': return 'shield';
      default: return 'person';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary, paddingTop: 50 }]}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      {/* Profile Card */}
      <TouchableOpacity style={[styles.profileCard, { backgroundColor: colors.card }]} onPress={() => setShowProfileModal(true)}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.primary }]}>
          <Ionicons name="person" size={30} color="#fff" />
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>{userProfile.name}</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{userProfile.email}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name={getRoleIcon(userProfile.role) as any} size={12} color={colors.primary} />
            <Text style={[styles.roleText, { color: colors.primary }]}>{getRoleLabel(userProfile.role)}</Text>
          </View>
        </View>
        <Ionicons name="create-outline" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      {/* Account Settings */}
      <SettingSection title="ACCOUNT">
        <SettingItem
          icon="person-outline"
          title="Edit Profile"
          subtitle="Name, phone, photo"
          onPress={() => setShowProfileModal(true)}
        />
        <SettingItem
          icon="lock-closed-outline"
          title="Change Password"
          subtitle="Update your password"
          onPress={() => Alert.alert('Change Password', 'This would open password change screen')}
        />
        <SettingItem
          icon="mail-outline"
          title="Email Preferences"
          subtitle="Manage email notifications"
          onPress={() => Alert.alert('Email Settings', 'This would open email settings')}
        />
      </SettingSection>

      {/* Notifications */}
      <SettingSection title="NOTIFICATIONS">
        <ToggleItem
          icon="bus-outline"
          title="Trip Updates"
          subtitle="Get notified about trips"
          value={notifications.trips}
          onValueChange={(v: boolean) => setNotifications(n => ({ ...n, trips: v }))}
        />
        <ToggleItem
          icon="card-outline"
          title="Payment Alerts"
          subtitle="Payment confirmations"
          value={notifications.payments}
          onValueChange={(v: boolean) => setNotifications(n => ({ ...n, payments: v }))}
        />
        <ToggleItem
          icon="shield-checkmark-outline"
          title="Safety Alerts"
          subtitle="Emergency notifications"
          value={notifications.safety}
          onValueChange={(v: boolean) => setNotifications(n => ({ ...n, safety: v }))}
        />
        <ToggleItem
          icon="newspaper-outline"
          title="App Updates"
          subtitle="New features & updates"
          value={notifications.updates}
          onValueChange={(v: boolean) => setNotifications(n => ({ ...n, updates: v }))}
        />
      </SettingSection>

      {/* Privacy */}
      <SettingSection title="PRIVACY">
        <ToggleItem
          icon="location-outline"
          title="Share Location"
          subtitle="Allow location tracking"
          value={privacy.shareLocation}
          onValueChange={(v: boolean) => setPrivacy(p => ({ ...p, shareLocation: v }))}
        />
        <ToggleItem
          icon="eye-outline"
          title="Profile Visibility"
          subtitle="Others can see your profile"
          value={privacy.showProfile}
          onValueChange={(v: boolean) => setPrivacy(p => ({ ...p, showProfile: v }))}
        />
        <ToggleItem
          icon="call-outline"
          title="Show Phone Number"
          subtitle="Drivers can see your phone"
          value={privacy.showPhone}
          onValueChange={(v: boolean) => setPrivacy(p => ({ ...p, showPhone: v }))}
        />
      </SettingSection>

      {/* Appearance */}
      <SettingSection title="APPEARANCE">
        <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
          <View style={[styles.settingIcon, { backgroundColor: '#FFB81C' + '20' }]}>
            <Ionicons name="color-palette" size={20} color="#FFB81C" />
          </View>
          <View style={styles.settingInfo}>
            <Text style={[styles.settingTitle, { color: colors.text }]}>Theme</Text>
          </View>
        </View>
        <View style={styles.themeSelector}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.themeOption,
                { borderColor: colors.border },
                themeMode === option.value && [styles.themeOptionSelected, { borderColor: colors.primary }],
              ]}
              onPress={() => handleThemeChange(option.value)}
            >
              <View style={[styles.themeIcon, { backgroundColor: option.color }]}>
                <Ionicons name={option.icon as any} size={18} color={option.value === 'light' ? '#333' : '#FFB81C'} />
              </View>
              <Text style={[styles.themeLabel, { color: themeMode === option.value ? colors.primary : colors.text }]}>
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </SettingSection>

      {/* Language */}
      <SettingSection title="LANGUAGE">
        <SettingItem
          icon="language-outline"
          title="App Language"
          subtitle={appSettings.language}
          onPress={() => Alert.alert('Language', 'Currently only English is available')}
        />
      </SettingSection>

      {/* Safety */}
      <SettingSection title="SAFETY">
        <ToggleItem
          icon="warning-outline"
          title="Emergency SOS"
          subtitle="Quick emergency button"
          value={appSettings.emergencyAlert}
          onValueChange={(v: boolean) => setAppSettings(a => ({ ...a, emergencyAlert: v }))}
          color="#E03C31"
        />
        <SettingItem
          icon="shield-outline"
          title="Child Safety Mode"
          subtitle="Extra safety features"
          onPress={() => Alert.alert('Safety Mode', 'This would toggle additional safety features')}
          color="#E03C31"
        />
      </SettingSection>

      {/* Support */}
      <SettingSection title="SUPPORT">
        <SettingItem
          icon="help-circle-outline"
          title="Help Center"
          subtitle="FAQs and guides"
          onPress={() => Alert.alert('Help', 'This would open the help center')}
        />
        <SettingItem
          icon="chatbubbles-outline"
          title="Contact Support"
          subtitle="Email or chat with us"
          onPress={handleContactSupport}
        />
        <SettingItem
          icon="document-text-outline"
          title="Terms of Service"
          subtitle="Read our terms"
          onPress={() => Alert.alert('Terms', 'https://scholartrack.co.za/terms')}
        />
        <SettingItem
          icon="shield-checkmark-outline"
          title="Privacy Policy"
          subtitle="How we handle your data"
          onPress={() => Alert.alert('Privacy', 'https://scholartrack.co.za/privacy')}
        />
      </SettingSection>

      {/* About */}
      <SettingSection title="ABOUT">
        <SettingItem
          icon="information-circle-outline"
          title="App Version"
          subtitle="1.0.0"
        />
        <SettingItem
          icon="build-outline"
          title="Check for Updates"
          subtitle="You're up to date"
          onPress={() => Alert.alert('Updates', 'No updates available')}
        />
      </SettingSection>

      {/* Danger Zone */}
      <SettingSection title="DANGER ZONE">
        <SettingItem
          icon="log-out-outline"
          title="Logout"
          subtitle="Sign out of your account"
          onPress={handleLogout}
          color="#E03C31"
        />
        <SettingItem
          icon="trash-outline"
          title="Delete Account"
          subtitle="Permanently delete your account"
          onPress={handleDeleteAccount}
          color="#E03C31"
        />
      </SettingSection>

      <View style={styles.bottomPadding} />

      {/* Edit Profile Modal */}
      <Modal visible={showProfileModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Full Name</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editProfile.name}
                onChangeText={(t) => setEditProfile(p => ({ ...p, name: t }))}
                placeholder="Enter your name"
                placeholderTextColor={colors.textSecondary}
              />

              <Text style={[styles.inputLabel, { color: colors.text, marginTop: 16 }]}>Phone Number</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                value={editProfile.phone}
                onChangeText={(t) => setEditProfile(p => ({ ...p, phone: t }))}
                placeholder="Enter phone number"
                placeholderTextColor={colors.textSecondary}
                keyboardType="phone-pad"
              />

              <TouchableOpacity style={[styles.saveButton, { backgroundColor: colors.primary }]} onPress={handleSaveProfile}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingBottom: 15 },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  profileCard: { flexDirection: 'row', alignItems: 'center', margin: 16, marginTop: -30, padding: 16, borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 3 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  profileInfo: { flex: 1, marginLeft: 12 },
  profileName: { fontSize: 18, fontWeight: '600' },
  profileEmail: { fontSize: 14, marginTop: 2 },
  roleBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, marginTop: 6 },
  roleText: { fontSize: 11, fontWeight: '600', marginLeft: 4 },
  section: { marginTop: 20, paddingHorizontal: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', marginBottom: 8, marginLeft: 4, letterSpacing: 0.5 },
  sectionContent: { borderRadius: 12, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 14, borderBottomWidth: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 8, justifyContent: 'center', alignItems: 'center' },
  settingInfo: { flex: 1, marginLeft: 12 },
  settingTitle: { fontSize: 15, fontWeight: '500' },
  settingSubtitle: { fontSize: 13, marginTop: 2 },
  themeSelector: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 16, paddingHorizontal: 10 },
  themeOption: { alignItems: 'center', padding: 10, borderRadius: 10, borderWidth: 2, width: 90 },
  themeOptionSelected: { borderWidth: 2 },
  themeIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  themeLabel: { fontSize: 12, fontWeight: '600' },
  bottomPadding: { height: 40 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '600' },
  modalBody: {},
  inputLabel: { fontSize: 14, fontWeight: '500', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16 },
  saveButton: { marginTop: 24, padding: 16, borderRadius: 10, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
