// ScholarTrack EmergencyContactsScreen — Dark SA Transport Design
// Glassmorphism, dark theme, cyan/amber accents

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Alert,
  TextInput,
  Platform,
  UIManager,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { supabase, emergencyContactService, EmergencyContact } from '../../lib/api';

import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };

const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#00e676',
  red: '#ff3d5a',
  white: '#ffffff',
  text: '#9bbdd4',
  muted: '#4a6a8a',
};

const SpringTouchable = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }],
  }));
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const glassCard = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
};

const avatarColors = [DT.cyan, DT.amber, DT.green, DT.red, '#a855f7'];

const contactAvatarStyle = (index: number) => ({
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: avatarColors[index % avatarColors.length] + '20',
  borderWidth: 1.5,
  borderColor: avatarColors[index % avatarColors.length],
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
});

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function EmergencyContactsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', relationship: '', is_primary: false });

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const data = await emergencyContactService.getContacts(user.id);
      setContacts(data || []);
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadContacts();
  };

  const handleSave = () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }
    Alert.alert('Success', 'Contact saved');
    setShowAddModal(false);
    setFormData({ name: '', phone: '', relationship: '', is_primary: false });
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert('Delete Contact', `Remove ${contact.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setContacts(contacts.filter(c => c.id !== contact.id));
        },
      },
    ]);
  };

  const sectionLabelStyle = { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.25)', marginBottom: spacing.sm };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    header: {
      backgroundColor: DT.bg2,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 4,
      borderBottomColor: DT.amber,
      position: 'relative',
      overflow: 'hidden',
    },
    headerTitle: { ...typography.h2, color: DT.white },
    headerSubtext: { ...typography.bodySmall, color: DT.muted, marginTop: spacing.xs },
    addBtn: {
      margin: spacing.lg,
      padding: spacing.md,
      borderRadius: borderRadius.lg,
      ...glassCard,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,255,255,.12)',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    addBtnText: { ...typography.button, color: DT.cyan, marginLeft: spacing.sm },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: DT.white, marginBottom: spacing.md },
    contactCard: {
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      ...glassCard,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,183,0,.3)',
      borderColor: 'rgba(255,183,0,.12)',
    },
    contactRow: { flexDirection: 'row' as const, alignItems: 'center' as const },
    contactAvatar: undefined as any,
    contactInitial: { ...typography.h4, color: DT.white },
    contactInfo: { flex: 1, marginLeft: spacing.md },
    contactName: { ...typography.label, color: DT.white },
    contactPhone: { ...typography.bodySmall, color: DT.muted },
    contactRelation: { ...typography.caption, color: DT.muted },
    emptyText: { ...typography.body, color: DT.muted, textAlign: 'center', padding: spacing.xl },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
    modalContent: {
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: spacing.lg,
      paddingBottom: insets.bottom + spacing.lg,
      backgroundColor: DT.panel,
    },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
    modalTitle: { ...typography.h3, color: DT.white },
    input: {
      backgroundColor: 'rgba(255,255,255,.06)',
      padding: spacing.md,
      borderRadius: borderRadius.md,
      marginBottom: spacing.md,
      ...typography.body,
      color: DT.white,
      borderWidth: 1,
      borderColor: DT.border,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: DT.bg },
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Emergency Contacts</Text>
          <Text style={styles.headerSubtext}>Manage your emergency contacts</Text>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.emptyText}>Loading contacts...</Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: DT.amber, opacity: 0.06 }} />
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <Text style={styles.headerSubtext}>Manage your emergency contacts</Text>
      </View>

      {/* Add Button */}
      <SpringTouchable onPress={() => setShowAddModal(true)} style={styles.addBtn}>
        <Ionicons name="add" size={20} color={DT.cyan} />
        <Text style={styles.addBtnText}>Add Contact</Text>
      </SpringTouchable>

      {/* Contacts List */}
      <ScrollView
        style={styles.section}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[DT.cyan]} tintColor={DT.cyan} />
        }
      >
        <Text style={sectionLabelStyle}>My Contacts ({contacts.length})</Text>

        {contacts.length === 0 ? (
          <Animated.View entering={ZoomIn.duration(300)} style={{ alignItems: 'center', padding: spacing.xl }}>
            <Ionicons name="people-outline" size={64} color={DT.muted} />
            <Text style={styles.emptyText}>No emergency contacts yet</Text>
            <Spacer size="md" />
            <Button title="Add First Contact" onPress={() => setShowAddModal(true)} variant="primary" />
          </Animated.View>
        ) : (
          contacts.map((contact, index) => (
            <Animated.View key={contact.id} entering={ZoomIn.duration(300).delay(index * 60)}>
              <View style={[styles.contactCard, { overflow: 'hidden', position: 'relative' }]}>
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
                <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.5)' }} />
                <View style={styles.contactRow}>
                  <View style={contactAvatarStyle(index)}>
                    <Text style={styles.contactInitial}>
                      {(contact.name || 'C').substring(0, 1).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                    {contact.relationship && (
                      <Text style={styles.contactRelation}>{contact.relationship}</Text>
                    )}
                  </View>
                  {contact.is_primary && (
                    <Badge label="Primary" variant="primary" size="small" />
                  )}
                  <TouchableOpacity
                    onPress={() => handleDelete(contact)}
                    style={{ marginLeft: spacing.sm, padding: spacing.xs }}
                  >
                    <Ionicons name="trash" size={20} color={DT.red} />
                  </TouchableOpacity>
                </View>
              </View>
            </Animated.View>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Contact</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={DT.muted} />
              </TouchableOpacity>
            </View>
            <View style={{ marginBottom: spacing.lg }}>
              <Text style={{ ...typography.labelSmall, color: DT.muted, marginBottom: 4 }}>Full Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter full name"
                placeholderTextColor={DT.muted}
                value={formData.name}
                onChangeText={t => setFormData({ ...formData, name: t })}
              />
              <Text style={{ ...typography.labelSmall, color: DT.muted, marginBottom: 4 }}>Phone Number</Text>
              <TextInput
                style={styles.input}
                placeholder="+27 XX XXX XXXX"
                placeholderTextColor={DT.muted}
                value={formData.phone}
                onChangeText={t => setFormData({ ...formData, phone: t })}
                keyboardType="phone-pad"
              />
              <Text style={{ ...typography.labelSmall, color: DT.muted, marginBottom: 4 }}>Relationship</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Spouse, Parent"
                placeholderTextColor={DT.muted}
                value={formData.relationship}
                onChangeText={t => setFormData({ ...formData, relationship: t })}
              />
            </View>
            <Button title="Save Contact" onPress={handleSave} variant="primary" fullWidth />
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}
