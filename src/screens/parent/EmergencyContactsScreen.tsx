import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase, emergencyContactService, EmergencyContact } from '../../lib/api';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function EmergencyContactsScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
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
    }
  };

  const handleSave = async () => {
    if (!formData.name || !formData.phone) {
      Alert.alert('Error', 'Please fill in name and phone number');
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (editingContact) {
        // Update existing contact
        await supabase.from('emergency_contacts').update({
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship || null,
          is_primary: formData.is_primary
        }).eq('id', editingContact.id);
      } else {
        // Add new contact
        await emergencyContactService.addContact(user.id, {
          name: formData.name,
          phone: formData.phone,
          relationship: formData.relationship || undefined,
          is_primary: formData.is_primary || contacts.length === 0
        });
      }

      setShowAddModal(false);
      setEditingContact(null);
      setFormData({ name: '', phone: '', relationship: '', is_primary: false });
      loadContacts();
      Alert.alert('Success', editingContact ? 'Contact updated' : 'Contact added');
    } catch (error) {
      Alert.alert('Error', 'Failed to save contact');
    }
  };

  const handleDelete = (contact: EmergencyContact) => {
    Alert.alert(
      'Delete Contact',
      `Are you sure you want to delete ${contact.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await emergencyContactService.deleteContact(contact.id);
              loadContacts();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete contact');
            }
          }
        }
      ]
    );
  };

  const handleSetPrimary = async (contact: EmergencyContact) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await emergencyContactService.setPrimary(user.id, contact.id);
      loadContacts();
    } catch (error) {
      Alert.alert('Error', 'Failed to set primary contact');
    }
  };

  const openEdit = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone,
      relationship: contact.relationship || '',
      is_primary: contact.is_primary
    });
    setShowAddModal(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Contacts</Text>
        <TouchableOpacity onPress={() => {
          setEditingContact(null);
          setFormData({ name: '', phone: '', relationship: '', is_primary: false });
          setShowAddModal(true);
        }} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
            <Ionicons name="information-circle" size={24} color={colors.primary} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              These contacts will be notified in case of emergency. Set one as primary for priority notification.
            </Text>
          </View>

          {/* Contacts List */}
          {contacts.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Emergency Contacts</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Add contacts who should be notified in emergencies
              </Text>
              <TouchableOpacity
                style={[styles.addFirstBtn, { backgroundColor: colors.primary }]}
                onPress={() => setShowAddModal(true)}
              >
                <Ionicons name="add" size={20} color="#fff" />
                <Text style={styles.addFirstBtnText}>Add Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {contacts.map((contact) => (
                <View key={contact.id} style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.contactHeader}>
                    <View style={[styles.avatar, { backgroundColor: contact.is_primary ? colors.primary + '20' : colors.selected }]}>
                      <Ionicons name="person" size={24} color={contact.is_primary ? colors.primary : colors.textSecondary} />
                    </View>
                    <View style={styles.contactInfo}>
                      <View style={styles.nameRow}>
                        <Text style={[styles.contactName, { color: colors.text }]}>{contact.name}</Text>
                        {contact.is_primary && (
                          <View style={[styles.primaryBadge, { backgroundColor: colors.primary }]}>
                            <Text style={styles.primaryBadgeText}>Primary</Text>
                          </View>
                        )}
                      </View>
                      <Text style={[styles.contactPhone, { color: colors.textSecondary }]}>{contact.phone}</Text>
                      {contact.relationship && (
                        <Text style={[styles.contactRelation, { color: colors.textSecondary }]}>
                          {contact.relationship}
                        </Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.contactActions}>
                    {!contact.is_primary && (
                      <TouchableOpacity
                        style={[styles.actionBtn, { borderColor: colors.primary }]}
                        onPress={() => handleSetPrimary(contact)}
                      >
                        <Ionicons name="star-outline" size={18} color={colors.primary} />
                        <Text style={[styles.actionBtnText, { color: colors.primary }]}>Set Primary</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: colors.textSecondary }]}
                      onPress={() => openEdit(contact)}
                    >
                      <Ionicons name="pencil" size={18} color={colors.textSecondary} />
                      <Text style={[styles.actionBtnText, { color: colors.textSecondary }]}>Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, { borderColor: '#E91E63' }]}
                      onPress={() => handleDelete(contact)}
                    >
                      <Ionicons name="trash" size={18} color="#E91E63" />
                      <Text style={[styles.actionBtnText, { color: '#E91E63' }]}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </>
          )}

          {/* Emergency Numbers */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Emergency Numbers</Text>
            <View style={[styles.emergencyCard, { backgroundColor: colors.card }]}>
              <TouchableOpacity style={styles.emergencyRow}>
                <View style={[styles.emergencyIcon, { backgroundColor: '#d32f2f' }]}>
                  <Ionicons name="call" size={20} color="#fff" />
                </View>
                <View style={styles.emergencyInfo}>
                  <Text style={[styles.emergencyLabel, { color: colors.text }]}>South African Police</Text>
                  <Text style={[styles.emergencyNumber, { color: colors.text }]}>10111</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.emergencyRow}>
                <View style={[styles.emergencyIcon, { backgroundColor: '#007749' }]}>
                  <Ionicons name="medkit" size={20} color="#fff" />
                </View>
                <View style={styles.emergencyInfo}>
                  <Text style={[styles.emergencyLabel, { color: colors.text }]}>Ambulance</Text>
                  <Text style={[styles.emergencyNumber, { color: colors.text }]}>10177</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.emergencyRow}>
                <View style={[styles.emergencyIcon, { backgroundColor: '#FFB81C' }]}>
                  <Ionicons name="globe" size={20} color="#fff" />
                </View>
                <View style={styles.emergencyInfo}>
                  <Text style={[styles.emergencyLabel, { color: colors.text }]}>International Emergency</Text>
                  <Text style={[styles.emergencyNumber, { color: colors.text }]}>112</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingContact ? 'Edit Contact' : 'Add Contact'}
              </Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.inputLabel, { color: colors.text }]}>Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="Contact name"
                placeholderTextColor={colors.textSecondary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Phone Number *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="+27821234567"
                placeholderTextColor={colors.textSecondary}
                value={formData.phone}
                onChangeText={(text) => setFormData({ ...formData, phone: text })}
                keyboardType="phone-pad"
              />

              <Text style={[styles.inputLabel, { color: colors.text }]}>Relationship</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                placeholder="e.g. Spouse, Parent, Sibling"
                placeholderTextColor={colors.textSecondary}
                value={formData.relationship}
                onChangeText={(text) => setFormData({ ...formData, relationship: text })}
              />

              <TouchableOpacity
                style={[styles.checkboxRow, { borderColor: colors.border }]}
                onPress={() => setFormData({ ...formData, is_primary: !formData.is_primary })}
              >
                <View style={[styles.checkbox, formData.is_primary && { backgroundColor: colors.primary }]}>
                  {formData.is_primary && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={[styles.checkboxLabel, { color: colors.text }]}>Set as primary contact</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>{editingContact ? 'Update' : 'Add'} Contact</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15 },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  addBtn: { padding: 5 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, padding: 15 },
  infoBox: { flexDirection: 'row', padding: 15, borderRadius: 12, borderWidth: 1, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, marginLeft: 10 },
  emptyCard: { borderRadius: 16, padding: 40, alignItems: 'center', marginTop: 20 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 20 },
  emptyText: { fontSize: 14, marginTop: 8, textAlign: 'center' },
  addFirstBtn: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10, gap: 8 },
  addFirstBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  contactCard: { borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1 },
  contactHeader: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  contactInfo: { flex: 1, marginLeft: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  contactName: { fontSize: 18, fontWeight: '600' },
  primaryBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  primaryBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  contactPhone: { fontSize: 14, marginTop: 2 },
  contactRelation: { fontSize: 12, marginTop: 2 },
  contactActions: { flexDirection: 'row', marginTop: 15, paddingTop: 15, borderTopWidth: 1, borderTopColor: '#eee', gap: 10 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, gap: 6 },
  actionBtnText: { fontSize: 12, fontWeight: '500' },
  section: { marginTop: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  emergencyCard: { borderRadius: 12, overflow: 'hidden' },
  emergencyRow: { flexDirection: 'row', alignItems: 'center', padding: 15, borderBottomWidth: 1, borderBottomColor: '#eee' },
  emergencyIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  emergencyInfo: { flex: 1, marginLeft: 12 },
  emergencyLabel: { fontSize: 14, fontWeight: '600' },
  emergencyNumber: { fontSize: 18, fontWeight: 'bold', marginTop: 2 },
  bottomSpacer: { height: 30 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  form: { marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 12 },
  input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, padding: 12, borderWidth: 1, borderRadius: 10, gap: 12 },
  checkbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#ccc', justifyContent: 'center', alignItems: 'center' },
  checkboxLabel: { fontSize: 14 },
  saveBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
