// Comprehensive Settings Screen for All User Roles
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch, Modal, Platform, Linking, RefreshControl, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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
  const { colors, themeMode, setThemeMode } = useTheme();
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
    darkMode: themeMode === 'dark',
  });

  const isDriver = userProfile.role === 'driver';
  const isParent = userProfile.role === 'parent';

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
        name: name || '',
        email: email || '',
        phone: phone || '',
        role: role || 'parent',
      });

      setEditProfile({ name: name || '', phone: phone || '' });
    } catch (error) {
      return;
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
    try {
      await setThemeMode(mode);
      setAppSettings(prev => ({ ...prev, darkMode: mode === 'dark' }));
    } catch (error) {
      return;
    }
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
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        }
      }
    ]);
  };

  const handleLink = (url: string) => {
    Linking.openURL(url).catch(() => Alert.alert('Error', 'Cannot open link'));
  };

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: insets.top + spacing.lg, borderBottomWidth: 4, borderBottomColor: colors.accent },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    headerTitle: { ...typography.displayMedium, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
    headerActions: { flexDirection: 'row' },
    headerBtn: { padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.md },
    section: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, fontWeight: '700', marginBottom: spacing.lg, paddingLeft: spacing.xs },
    profileCard: { backgroundColor: colors.card, padding: spacing.lg, borderRadius: borderRadius.card, flexDirection: 'row', alignItems: 'center', borderTopWidth: 3, borderTopColor: colors.accent, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 3 },
    profileAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    profileInitial: { ...typography.h3, color: colors.accent },
    profileInfo: { flex: 1, marginLeft: spacing.md },
    profileName: { ...typography.h4, color: colors.text },
    profileEmail: { ...typography.bodySmall, color: colors.textSecondary },
    profileRole: { marginTop: spacing.xs },
    settingRow: { backgroundColor: colors.card, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: borderRadius.md, borderLeftWidth: 3, borderLeftColor: colors.accent, shadowColor: colors.shadow, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 1, shadowRadius: 16, elevation: 2 },
    settingInfo: { flex: 1 },
    settingLabel: { ...typography.label, color: colors.text },
    settingDesc: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    settingAction: { marginLeft: spacing.md },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.md },
    dangerBtn: { backgroundColor: colors.danger, padding: spacing.md, borderRadius: borderRadius.md, alignItems: 'center', marginTop: spacing.lg, borderTopWidth: 2, borderTopColor: 'rgba(255,255,255,0.2)', shadowColor: colors.danger, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 16, elevation: 2 },
    dangerBtnText: { ...typography.button, color: colors.textInverse },
    modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: colors.card, padding: spacing.xl, borderRadius: borderRadius.lg, width: '85%' },
    modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.lg },
    input: { backgroundColor: colors.background, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, ...typography.body, color: colors.text, borderWidth: 1, borderColor: colors.border },
  });

  const SettingRow = ({ label, description, value, onValueChange, icon }: any) => (
    <View style={styles(colors).settingRow}>
      <View style={styles(colors).settingInfo}>
        <Text style={styles(colors).settingLabel}>{label}</Text>
        {description && <Text style={styles(colors).settingDesc}>{description}</Text>}
      </View>
      <View style={styles(colors).settingAction}>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.card}
        />
      </View>
    </View>
  );

  const SettingRealTimeToggle = () => (
    <View style={styles(colors).settingRow}>
      <View style={styles(colors).settingInfo}>
        <Text style={styles(colors).settingLabel}>Real-Time Tracking</Text>
        <Text style={styles(colors).settingDesc}>Enable live location updates</Text>
      </View>
      <View style={styles(colors).settingAction}>
        <Switch
          value={privacy.shareLocation}
          onValueChange={(v: boolean) => setPrivacy(p => ({ ...p, shareLocation: v }))}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={colors.card}
        />
      </View>
    </View>
  );

  return (
    <ScrollView
      style={styles(colors).container}
      refreshControl={
        <RefreshControl
          refreshing={false}
          onRefresh={loadUserProfile}
          colors={[colors.accent]}
          tintColor={colors.accent}
        />
      }
    >
      {/* Header */}
      <View style={styles(colors).header}>
        <View style={styles(colors).headerTop}>
          <Text style={styles(colors).headerTitle}>Settings</Text>
          <View style={styles(colors).headerActions}>
            <TouchableOpacity style={styles(colors).headerBtn} onPress={loadUserProfile}>
              <Ionicons name="refresh" size={20} color={colors.textInverse} />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles(colors).headerSubtext}>{userProfile.name || 'User'} - {userProfile.role || 'Parent'}</Text>
      </View>

      {/* Profile Section */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setShowProfileModal(true)}>
          <Card variant="elevated" padding="large">
            <View style={styles(colors).profileCard}>
              <View style={styles(colors).profileAvatar}>
                <Text style={styles(colors).profileInitial}>
                  {(userProfile.name || 'U').substring(0, 1).toUpperCase()}
                </Text>
              </View>
              <View style={styles(colors).profileInfo}>
                <Text style={styles(colors).profileName}>{userProfile.name || 'User'}</Text>
                <Text style={styles(colors).profileEmail}>{userProfile.email || 'No email'}</Text>
                <Badge label={userProfile.role} variant="primary" size="small" />
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </View>
          </Card>
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Notifications</Text>
        <Card variant="elevated" padding="none">
          <SettingRow
            label="Trip Updates"
            description="Get notified about trip status changes"
            value={notifications.trips}
            onValueChange={(v: boolean) => setNotifications(n => ({ ...n, trips: v }))}
          />
          <SettingRow
            label="Payment Alerts"
            description="Payment confirmations and reminders"
            value={notifications.payments}
            onValueChange={(v: boolean) => setNotifications(n => ({ ...n, payments: v }))}
          />
          <SettingRow
            label="Safety Alerts"
            description="Emergency and safety notifications"
            value={notifications.safety}
            onValueChange={(v: boolean) => setNotifications(n => ({ ...n, safety: v }))}
          />
          <SettingRow
            label="Email Notifications"
            description="Receive updates via email"
            value={notifications.email}
            onValueChange={(v: boolean) => setNotifications(n => ({ ...n, email: v }))}
          />
        </Card>
      </View>

      {/* Privacy */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Privacy</Text>
        <Card variant="elevated" padding="none">
          <SettingRow
            label="Share Location"
            description="Allow tracking for safety features"
            value={privacy.shareLocation}
            onValueChange={(v: boolean) => setPrivacy(p => ({ ...p, shareLocation: v }))}
          />
          <SettingRow
            label="Show Profile"
            description="Allow others to see your profile"
            value={privacy.showProfile}
            onValueChange={(v: boolean) => setPrivacy(p => ({ ...p, showProfile: v }))}
          />
        </Card>
      </View>

      {/* App Settings */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>App</Text>
        <Card variant="elevated" padding="none">
          <SettingRow
            label="Emergency Alert"
            description="Enable SOS button"
            value={appSettings.emergencyAlert}
            onValueChange={(v: boolean) => setAppSettings(s => ({ ...s, emergencyAlert: v }))}
          />
          <SettingRow
            label="Auto Refresh"
            description="Automatically refresh data"
            value={appSettings.autoRefresh}
            onValueChange={(v: boolean) => setAppSettings(s => ({ ...s, autoRefresh: v }))}
          />
        </Card>
      </View>

      {/* Driver-specific Settings */}
      {isDriver && (
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Driver Settings</Text>
          <Card variant="elevated" padding="none">
            <TouchableOpacity style={styles(colors).settingRow} onPress={() => navigation?.navigate?.('VehicleChecklist')}>
              <Text style={styles(colors).settingLabel}>Vehicle Checklist</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles(colors).settingRow} onPress={() => navigation?.navigate?.('Compliance')}>
              <Text style={styles(colors).settingLabel}>Compliance Documents</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <SettingRow
              label="Accept Auto-Assigned Routes"
              description="Automatically accept assigned routes"
              value={appSettings.autoRefresh}
              onValueChange={(v: boolean) => setAppSettings(s => ({ ...s, autoRefresh: v }))}
            />
          </Card>
        </View>
      )}

      {/* Parent-specific Settings */}
      {isParent && (
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Parent Settings</Text>
          <Card variant="elevated" padding="none">
            <TouchableOpacity style={styles(colors).settingRow} onPress={() => navigation?.navigate?.('Children')}>
              <Text style={styles(colors).settingLabel}>Manage Children</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity style={styles(colors).settingRow} onPress={() => navigation?.navigate?.('EmergencyContacts')}>
              <Text style={styles(colors).settingLabel}>Emergency Contacts</Text>
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
            <SettingRealTimeToggle />
          </Card>
        </View>
      )}

      {/* Theme */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Appearance</Text>
        <Card variant="elevated" padding="medium">
          <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}>
            <TouchableOpacity
              onPress={() => handleThemeChange('light')}
              style={{ alignItems: 'center', padding: spacing.md }}
            >
              <Ionicons name="sunny" size={24} color={themeMode === 'light' ? colors.primary : colors.textSecondary} />
              <Text style={{ ...typography.labelSmall, color: themeMode === 'light' ? colors.primary : colors.textSecondary, marginTop: spacing.xs }}>Light</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleThemeChange('dark')}
              style={{ alignItems: 'center', padding: spacing.md }}
            >
              <Ionicons name="moon" size={24} color={themeMode === 'dark' ? colors.primary : colors.textSecondary} />
              <Text style={{ ...typography.labelSmall, color: themeMode === 'dark' ? colors.primary : colors.textSecondary, marginTop: spacing.xs }}>Dark</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleThemeChange('blue')}
              style={{ alignItems: 'center', padding: spacing.md }}
            >
              <Ionicons name="settings" size={24} color={themeMode === 'blue' ? colors.primary : colors.textSecondary} />
              <Text style={{ ...typography.labelSmall, color: themeMode === 'blue' ? colors.primary : colors.textSecondary, marginTop: spacing.xs }}>Blue</Text>
            </TouchableOpacity>
          </View>
        </Card>
      </View>

      {/* About & Support */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>About</Text>
        <Card variant="elevated" padding="none">
          <TouchableOpacity style={styles(colors).settingRow} onPress={() => handleLink('https://scholartrack.co.za/privacy')}>
            <Text style={styles(colors).settingLabel}>Privacy Policy</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).settingRow} onPress={() => handleLink('https://scholartrack.co.za/terms')}>
            <Text style={styles(colors).settingLabel}>Terms of Service</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles(colors).settingRow} onPress={() => navigation?.navigate?.('Support')}>
            <Text style={styles(colors).settingLabel}>Contact Support</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </Card>
      </View>

      {/* Logout */}
      <View style={styles(colors).section}>
        <TouchableOpacity style={styles(colors).dangerBtn} onPress={handleLogout}>
          <Text style={styles(colors).dangerBtnText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Spacer size="xl" />

      {/* Profile Edit Modal */}
      <Modal visible={showProfileModal} transparent animationType="fade">
        <View style={styles(colors).modalOverlay}>
          <Card variant="elevated" padding="large">
            <View style={styles(colors).modalContent}>
              <Text style={styles(colors).modalTitle}>Edit Profile</Text>
              <TouchableOpacity onPress={() => setShowProfileModal(false)} style={{ position: 'absolute', top: spacing.md, right: spacing.md }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <View style={{ marginBottom: spacing.md }}>
                <Text style={{ ...typography.label, color: colors.text, marginBottom: spacing.xs }}>Name</Text>
                <TextInput
                  style={styles(colors).input}
                  value={editProfile.name}
                  onChangeText={(text) => setEditProfile(prev => ({ ...prev, name: text }))}
                  placeholder="Enter your name"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
              <View style={{ marginBottom: spacing.lg }}>
                <Text style={{ ...typography.label, color: colors.text, marginBottom: spacing.xs }}>Phone</Text>
                <TextInput
                  style={styles(colors).input}
                  value={editProfile.phone}
                  onChangeText={(text) => setEditProfile(prev => ({ ...prev, phone: text }))}
                  placeholder="Enter your phone"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
              <Button title="Save" onPress={handleSaveProfile} variant="primary" fullWidth />
            </View>
          </Card>
        </View>
      </Modal>
    </ScrollView>
  );
}