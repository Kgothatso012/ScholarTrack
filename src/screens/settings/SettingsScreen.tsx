import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SettingsScreen() {
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

  const [darkMode, setDarkMode] = useState(false);

  const SettingItem = ({ icon, title, subtitle, onPress, right }: any) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color="#002395" />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {right || <Ionicons name="chevron-forward" size={20} color="#ccc" />}
    </TouchableOpacity>
  );

  const ToggleItem = ({ icon, title, value, onValueChange }: any) => (
    <View style={styles.settingItem}>
      <View style={styles.settingIcon}>
        <Ionicons name={icon} size={22} color="#002395" />
      </View>
      <View style={styles.settingInfo}>
        <Text style={styles.settingTitle}>{title}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: '#007749' }} />
    </View>
  );

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => (window as any).logout() }
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>⚙️ Settings</Text>
        <Text style={styles.headerSubtext}>Manage your account</Text>
      </View>

      {/* Profile Section */}
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}>
          <Text style={styles.profileInitials}>JD</Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={styles.profileName}>John Dlamini</Text>
          <Text style={styles.profileEmail}>parent@test.com</Text>
          <Text style={styles.profileRole}>Parent • Mamelodi</Text>
        </View>
        <TouchableOpacity style={styles.editButton}>
          <Ionicons name="pencil" size={18} color="#002395" />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        
        <View style={styles.settingsGroup}>
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
        <Text style={styles.sectionTitle}>Privacy</Text>
        
        <View style={styles.settingsGroup}>
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
        <Text style={styles.sectionTitle}>Account</Text>
        
        <View style={styles.settingsGroup}>
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
            subtitle="Password & 2FA"
            onPress={() => Alert.alert('Security', 'Security settings...')}
          />
        </View>
      </View>

      {/* App */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>App</Text>
        
        <View style={styles.settingsGroup}>
          <SettingItem 
            icon="globe" 
            title="Language" 
            subtitle="English"
            onPress={() => Alert.alert('Language', 'Opening language settings...')}
          />
          <ToggleItem 
            icon="moon" 
            title="Dark Mode" 
            value={darkMode}
            onValueChange={(v: boolean) => {
              setDarkMode(v);
              Alert.alert('Theme', v ? 'Dark mode enabled!' : 'Light mode enabled!');
            }}
          />
          <SettingItem 
            icon="help-circle" 
            title="Help & Support" 
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
        <Text style={styles.sectionTitle}>About</Text>
        
        <View style={styles.settingsGroup}>
          <SettingItem 
            icon="information-circle" 
            title="App Version" 
            right={<Text style={styles.versionText}>1.0.0</Text>}
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
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color="#d32f2f" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        ScholarTrack SA © 2026{'\n'}
        Safe Student Transport
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 13, color: '#FFB81C', marginTop: 5 },
  profileCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 15, flexDirection: 'row', alignItems: 'center', elevation: 3, marginTop: -20 },
  profileAvatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#002395', justifyContent: 'center', alignItems: 'center' },
  profileInitials: { color: '#fff', fontSize: 22, fontWeight: 'bold' },
  profileInfo: { flex: 1, marginLeft: 15 },
  profileName: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  profileEmail: { fontSize: 14, color: '#666', marginTop: 2 },
  profileRole: { fontSize: 12, color: '#007749', marginTop: 2 },
  editButton: { padding: 10 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginBottom: 10, textTransform: 'uppercase' },
  settingsGroup: { backgroundColor: '#fff', borderRadius: 12, elevation: 2, overflow: 'hidden' },
  settingItem: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  settingIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  settingInfo: { flex: 1 },
  settingTitle: { fontSize: 16, color: '#333' },
  settingSubtitle: { fontSize: 12, color: '#666', marginTop: 2 },
  versionText: { fontSize: 14, color: '#666' },
  logoutButton: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 12, elevation: 2 },
  logoutText: { color: '#d32f2f', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  footer: { textAlign: 'center', color: '#999', fontSize: 12, padding: 30, lineHeight: 18 },
});
