import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { elderTheme as t } from '../../ui-plugin/elder';
import { Card, Button } from '../../ui-plugin/elder';
import { useAuth } from '../../lib/auth';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut } = useAuth();
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    (async () => {
      const name = await AsyncStorage.getItem('userName');
      const role = await AsyncStorage.getItem('userRole');
      setUserName(name || 'User');
      setUserRole(role || 'parent');
    })();
  }, []);

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
            await signOut();
            if (typeof window !== 'undefined' && window.location?.reload) {
              window.location.reload();
            }
          },
        },
      ]
    );
  };

  const initials = userName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={[ss.screen, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={ss.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={ss.pageTitle}>Profile</Text>

        <Card>
          <View style={ss.userRow}>
            <View style={ss.avatar}>
              <Text style={ss.avatarText}>{initials}</Text>
            </View>
            <View style={ss.userInfo}>
              <Text style={ss.userName}>{userName}</Text>
              <Text style={ss.userRole}>
                {userRole === 'driver' ? 'Driver' : userRole === 'admin' ? 'Administrator' : 'Parent'}
              </Text>
            </View>
          </View>
        </Card>

        <View style={ss.menuSection}>
          <Text style={ss.sectionTitle}>Account</Text>
          <Card>
            <TouchableOpacity style={ss.menuRow}>
              <Ionicons name="person-outline" size={22} color={t.colors.text} />
              <Text style={ss.menuLabel}>Edit Profile</Text>
              <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
            </TouchableOpacity>
            <View style={ss.divider} />
            <TouchableOpacity style={ss.menuRow}>
              <Ionicons name="people-outline" size={22} color={t.colors.text} />
              <Text style={ss.menuLabel}>My Children</Text>
              <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
            </TouchableOpacity>
            <View style={ss.divider} />
            <TouchableOpacity style={ss.menuRow}>
              <Ionicons name="card-outline" size={22} color={t.colors.text} />
              <Text style={ss.menuLabel}>Payments</Text>
              <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={ss.menuSection}>
          <Text style={ss.sectionTitle}>Settings</Text>
          <Card>
            <TouchableOpacity style={ss.menuRow}>
              <Ionicons name="notifications-outline" size={22} color={t.colors.text} />
              <Text style={ss.menuLabel}>Notifications</Text>
              <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
            </TouchableOpacity>
            <View style={ss.divider} />
            <TouchableOpacity style={ss.menuRow}>
              <Ionicons name="shield-checkmark-outline" size={22} color={t.colors.text} />
              <Text style={ss.menuLabel}>Privacy & Security</Text>
              <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
            </TouchableOpacity>
            <View style={ss.divider} />
            <TouchableOpacity style={ss.menuRow}>
              <Ionicons name="help-circle-outline" size={22} color={t.colors.text} />
              <Text style={ss.menuLabel}>Help & Support</Text>
              <Ionicons name="chevron-forward" size={18} color={t.colors.textSecondary} />
            </TouchableOpacity>
          </Card>
        </View>

        <View style={ss.logoutSection}>
          <Button label="Logout" onPress={handleLogout} variant="danger" />
        </View>

        <View style={{ height: t.spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const ss = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  scroll: {
    padding: t.layout.screenPadding,
    paddingBottom: 48,
  },
  pageTitle: {
    ...t.typography.pageTitle,
    marginBottom: t.layout.cardGap,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: t.spacing.lg,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: t.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 22,
    fontWeight: '700',
    color: t.colors.textInverse,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...t.typography.cardHeading,
  },
  userRole: {
    ...t.typography.bodySmall,
    marginTop: 2,
  },
  menuSection: {
    marginTop: t.layout.cardGap,
  },
  sectionTitle: {
    ...t.typography.bodySmall,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: t.spacing.sm,
    marginLeft: t.spacing.xs,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: t.spacing.md,
    gap: t.spacing.md,
  },
  menuLabel: {
    ...t.typography.body,
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: t.colors.border,
  },
  logoutSection: {
    marginTop: t.spacing.xxxl,
  },
});
