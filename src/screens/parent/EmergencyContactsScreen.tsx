import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase, emergencyContactService, EmergencyContact } from '../../lib/api';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function EmergencyContactsScreen({ navigation }: Props) {
  const { colors } = useTheme();
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
      { text: 'Delete', style: 'destructive', onPress: () => {
        setContacts(contacts.filter(c => c.id !== contact.id));
      }},
    ]);
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    addBtn: { backgroundColor: colors.accent, padding: spacing.md, borderRadius: borderRadius.md, margin: spacing.lg, alignItems: 'center' },
    addBtnText: { ...typography.button, color: colors.text },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    contactCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    contactAvatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
    contactInitial: { ...typography.h4, color: colors.accent },
    contactInfo: { flex: 1, marginLeft: spacing.md },
    contactName: { ...typography.label, color: colors.text },
    contactPhone: { ...typography.bodySmall, color: colors.textSecondary },
    contactRelation: { ...typography.caption, color: colors.textSecondary },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
    modalContent: { backgroundColor: colors.card, padding: spacing.xl, borderRadius: borderRadius.lg, margin: spacing.lg },
    modalTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.lg },
    input: { backgroundColor: colors.backgroundAlt, padding: spacing.md, borderRadius: borderRadius.md, marginBottom: spacing.md, ...typography.body, color: colors.text },
  });

  if (loading) {
    return (
      <View style={styles(colors).container}>
        <Card variant="elevated" padding="large">
          <Text style={styles(colors).emptyText}>Loading contacts...</Text>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Emergency Contacts</Text>
        <Text style={styles(colors).headerSubtext}>Manage your emergency contacts</Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity style={styles(colors).addBtn} onPress={() => setShowAddModal(true)}>
        <Ionicons name="add" size={20} color={colors.text} />
        <Text style={styles(colors).addBtnText}> Add Contact</Text>
      </TouchableOpacity>

      {/* Contacts List */}
      <ScrollView
        style={styles(colors).section}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.accent]}
            tintColor={colors.accent}
          />
        }
      >
        <Text style={styles(colors).sectionTitle}>My Contacts ({contacts.length})</Text>

        {contacts.length === 0 ? (
          <Card variant="outlined" padding="large">
            <Text style={styles(colors).emptyText}>No emergency contacts yet</Text>
            <Spacer size="md" />
            <Button title="Add First Contact" onPress={() => setShowAddModal(true)} variant="primary" />
          </Card>
        ) : (
          contacts.map((contact) => (
            <Card key={contact.id} variant="elevated" padding="medium">
              <View style={styles(colors).contactCard}>
                <View style={styles(colors).contactAvatar}>
                  <Text style={styles(colors).contactInitial}>
                    {(contact.name || 'C').substring(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={styles(colors).contactInfo}>
                  <Text style={styles(colors).contactName}>{contact.name}</Text>
                  <Text style={styles(colors).contactPhone}>{contact.phone}</Text>
                  {contact.relationship && (
                    <Text style={styles(colors).contactRelation}>{contact.relationship}</Text>
                  )}
                </View>
                {contact.is_primary && (
                  <Badge label="Primary" variant="primary" size="small" />
                )}
                <TouchableOpacity onPress={() => handleDelete(contact)} style={{ marginLeft: spacing.sm }}>
                  <Ionicons name="trash" size={20} color={colors.error} />
                </TouchableOpacity>
              </View>
            </Card>
          ))
        )}
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={showAddModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center' }}>
          <Card variant="elevated" padding="large">
            <View style={styles(colors).modalContent}>
              <Text style={styles(colors).modalTitle}>Add Contact</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ position: 'absolute', top: spacing.md, right: spacing.md }}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
              <Button title="Save Contact" onPress={handleSave} variant="primary" fullWidth />
            </View>
          </Card>
        </View>
      </Modal>
    </View>
  );
}