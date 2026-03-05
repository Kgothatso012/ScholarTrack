import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeMode } from '../../context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SettingsScreen() {
  const { colors, themeMode, setThemeMode } = useTheme();

  const [notifications, setNotifications] = useState({
    trips: true,
    payments: true,
    safety: true,
    updates: false,
  });

  const [privacy, setPrivacy] = useState({
    shareLocation: true,
    showProfile: true,
  });

  const themeOptions: { value: ThemeMode; label: string; icon: string; color: string }[] = [
    { value: 'dark', label: 'Dark', icon: 'moon', color: '#000000' },
    { value: 'blue', label: 'Blue', icon: 'color-palette', color: '#002395' },
    { value: 'light', label: 'Light', icon: 'sunny', color: '#ffffff' },
  ];

  const handleThemeChange = async (mode: ThemeMode) => {
    await setThemeMode(mode);
  };

  const SettingItem = ({ icon, title, subtitle, onPress, right }: any) => (
    <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.divider }]} onPress={onPress}>
      <View style={[styles.settingIcon, { backgroundColor: colors.selected }]}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {right || <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />}
    </TouchableOpacity>
  );

  const ToggleItem = ({ icon, title, subtitle, value, onValueChange }: any) => (
    <View style={[styles.settingItem, { borderBottomColor: colors.divider }]}>
      <View style={[styles.settingIcon, { backgroundColor: colors.selected }]}>
        <Ionicons name={icon} size={22} color={colors.accent} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
        {subtitle && <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ true: colors.accent, false: colors.border }}
        thumbColor={value ? colors.primary : '#f4f3f4'}
      />
    </View>
  );

  const ThemeSelector = () => (
    <View style={[styles.themeSelector, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {themeOptions.map((option) => (
        <TouchableOpacity
          key={option.value}
          style={[
            styles.themeOption,
            { borderColor: colors.border },
            themeMode === option.value && [styles.themeOptionSelected, { borderColor: colors.accent }],
          ]}
          onPress={() => handleThemeChange(option.value)}
        >
          <View style={[styles.themeIcon, { backgroundColor: option.color }]}>
            <Ionicons name={option.icon as any} size={20} color={option.value === 'light' ? '#333' : '#FFB81C'} />
          </View>
          <Text style={[styles.themeLabel, { color: themeMode === option.value ? colors.accent : colors.text }]}>
            {option.label}
          </Text>
          {themeMode === option.value && (
            <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
          )}
        </TouchableOpacity>
      ))}
    </View>
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: async () => {
        await AsyncStorage.removeItem('userRole');
        await AsyncStorage.removeItem('userEmail');
        await AsyncStorage.removeItem('userName');
      }}
    ]);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={[styles.headerTitle, { color: colors.textInverse }]}>Settings</Text>
        <Text style={[styles.headerSubtext, { color: colors.accent }]}>Manage your account</Text>
      </View>

      {/* Profile Section */}
      <View style={[styles.profileCard, { backgroundColor: colors.card }]}>
        <View style={[styles.profileAvatar, { backgroundColor: colors.accent }]}>
          <Text style={[styles.profileInitials, { color: colors.textInverse }]}>JD</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: colors.text }]}>John Dlamini</Text>
          <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>parent@test.com</Text>
          <Text style={[styles.profileRole, { color: colors.accent }]}>Parent - Mamelodi</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={18} color={colors.accent} />
        </TouchableOpacity>
      </View>

      {/* Theme */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        <ThemeSelector />
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notifications</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.card }]}>
          <ToggleItem
            icon="notifications"
            title="Trip Alerts"
            subtitle="Get notified when trips start/end"
            value={notifications.trips}
            onValueChange={(v: boolean) => setNotifications({...notifications, trips: v})}
          />
          <ToggleItem
            icon="card"
            title="Payment Alerts"
            subtitle="Payment reminders and receipts"
            value={notifications.payments}
            onValueChange={(v: boolean) => setNotifications({...notifications, payments: v})}
          />
          <ToggleItem
            icon="warning"
            title="Safety Alerts"
            subtitle="Emergency and safety notifications"
            value={notifications.safety}
            onValueChange={(v: boolean) => setNotifications({...notifications, safety: v})}
          />
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Privacy</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.card }]}>
          <ToggleItem
            icon="location"
            title="Share Live Location"
            value={privacy.shareLocation}
            onValueChange={(v: boolean) => setPrivacy({...privacy, shareLocation: v})}
          />
          <ToggleItem
            icon="eye"
            title="Profile Visibility"
            value={privacy.showProfile}
            onValueChange={(v: boolean) => setPrivacy({...privacy, showProfile: v})}
          />
        </View>
      </View>

      {/* Account */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="person"
            title="Edit Profile"
            onPress={() => Alert.alert('Edit Profile', 'Opening profile editor...')}
          />
          <SettingItem
            icon="people"
            title="Family Members"
            subtitle="Manage family accounts"
            onPress={() => Alert.alert('Family', 'Managing family members...')}
          />
          <SettingItem
            icon="car"
            title="My Drivers"
            subtitle="View hired drivers"
            onPress={() => Alert.alert('Drivers', 'Viewing your drivers...')}
          />
          <SettingItem
            icon="shield-checkmark"
            title="Security"
            subtitle="Password and 2FA"
            onPress={() => Alert.alert('Security', 'Security settings...')}
          />
        </View>
      </View>

      {/* App */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>App</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="globe"
            title="Language"
            subtitle="English"
            onPress={() => Alert.alert('Language', 'Opening language settings...')}
          />
          <SettingItem
            icon="help-circle"
            title="Help and Support"
            onPress={() => Alert.alert('Help', 'Contact support...')}
          />
          <SettingItem
            icon="document-text"
            title="Terms of Service"
            onPress={() => Alert.alert('Terms', 'View terms...')}
          />
          <SettingItem
            icon="lock-closed"
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy', 'View privacy policy...')}
          />
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>

        <View style={[styles.settingsGroup, { backgroundColor: colors.card }]}>
          <SettingItem
            icon="information-circle"
            title="App Version"
            right={<Text style={[styles.versionText, { color: colors.textSecondary }]}>1.0.0</Text>}
          />
          <SettingItem
            icon="build"
            title="Check for Updates"
            onPress={() => Alert.alert('Updates', 'You are on the latest version!')}
          />
        </View>
      </View>

      {/* Logout */}
      <View style={styles.section}>
        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: colors.card }]} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color="#d32f2f" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={[styles.footer, { color: colors.textSecondary }]}>
        ScholarTrack SA 2026{'\n'}
        Safe Student Transport
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold' },
  headerSubtext: { fontSize: 13, marginTop: 5 },
  profileCard: { margin: 15, padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 3, marginTop: -20 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
  profileInitials: { fontSize: 22, fontWeight: 'bold' },
  profileInfo: { flex: 1, marginLeft: 15 },
  profileName: { fontSize: 18, fontWeight: 'bold' },
  profileEmail: { fontSize: 14, marginTop: 2 },
  profileRole: { fontSize: 12, marginTop: 2 },
  editButton: { padding: 10 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  settingsGroup: { borderRadius: 12, elevation: 2, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1 },
  settingIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16 },
  settingSubtitle: { fontSize: 12, marginTop: 2 },
  versionText: { fontSize: 14 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, elevation: 2 },
  logoutText: { color: '#d32f2f', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  footer: { textAlign: 'center', fontSize: 12, padding: 30, lineHeight: 18 },
  themeSelector: { flexDirection: 'row', borderRadius: 12, padding: 8, borderWidth: 1 },
  themeOption: { flex: 1, alignItems: 'center', padding: 12, borderRadius: 8, borderWidth: 2 },
  themeOptionSelected: { borderWidth: 2 },
  themeIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 5 },
  themeLabel: { fontSize: 12, fontWeight: '600' },
});
