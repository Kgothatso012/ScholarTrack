import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList, ActivityIndicator, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { documentService, DriverDocument, ParentDocument } from '../../lib/api';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Avatar, Badge, Input } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

type TabType = 'drivers' | 'parents';

const documentTypes = {
  id_card: 'ID Card',
  drivers_license: "Driver's License",
  pdp_certificate: 'PDP Certificate',
  vehicle_license: 'Vehicle License',
  roadworthy: 'Roadworthy Certificate',
  insurance: 'Insurance',
  permit: 'Transport Permit',
  proof_of_residence: 'Proof of Residence',
  birth_certificate: 'Birth Certificate',
  consent_form: 'Consent Form'
};

export default function DocumentManagementScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('drivers');
  const [driverDocs, setDriverDocs] = useState<DriverDocument[]>([]);
  const [parentDocs, setParentDocs] = useState<ParentDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DriverDocument | ParentDocument | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const [drivers, parents] = await Promise.all([
        documentService.getAllDriverDocuments(),
        documentService.getAllParentDocuments()
      ]);
      setDriverDocs(drivers || []);
      setParentDocs(parents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (docId: string, status: 'approved' | 'rejected') => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await documentService.reviewDriverDocument(docId, status, user.id, reviewNotes);
      Alert.alert('Success', `Document ${status} successfully`);
      setShowReviewModal(false);
      setReviewNotes('');
      loadDocuments();
    } catch (error) {
      Alert.alert('Error', 'Failed to review document');
    }
  };

  const renderDriverDoc = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles(colors).docCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setSelectedDoc(item)}
    >
      <View style={styles(colors).docHeader}>
        <View style={[styles(colors).docIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="document-text" size={24} color={colors.primary} />
        </View>
        <View style={styles(colors).docInfo}>
          <Text style={[styles(colors).docType, { color: colors.text }]}>
            {documentTypes[item.document_type as keyof typeof documentTypes] || item.document_type}
          </Text>
          <Text style={[styles(colors).docDriver, { color: colors.textSecondary }]}>
            {item.driver?.full_name || 'Unknown Driver'}
          </Text>
        </View>
        <View style={[
          styles(colors).statusBadge,
          { backgroundColor: item.status === 'approved' ? '#007749' : item.status === 'rejected' ? '#E91E63' : '#FFB81C' }
        ]}>
          <Text style={styles(colors).statusText}>{item.status}</Text>
        </View>
      </View>
      <View style={styles(colors).docFooter}>
        <Text style={[styles(colors).docDate, { color: colors.textSecondary }]}>
          {new Date(item.uploaded_at).toLocaleDateString()}
        </Text>
        {item.status === 'pending' && (
          <View style={styles(colors).actionButtons}>
            <TouchableOpacity
              style={[styles(colors).approveBtn, { backgroundColor: '#007749' }]}
              onPress={() => {
                setSelectedDoc(item);
                setShowReviewModal(true);
              }}
            >
              <Ionicons name="checkmark" size={16} color="#fff" />
              <Text style={styles(colors).btnText}>Review</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderParentDoc = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={[styles(colors).docCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => setSelectedDoc(item)}
    >
      <View style={styles(colors).docHeader}>
        <View style={[styles(colors).docIcon, { backgroundColor: '#FFB81C' + '20' }]}>
          <Ionicons name="people" size={24} color="#FFB81C" />
        </View>
        <View style={styles(colors).docInfo}>
          <Text style={[styles(colors).docType, { color: colors.text }]}>
            {documentTypes[item.document_type as keyof typeof documentTypes] || item.document_type}
          </Text>
          <Text style={[styles(colors).docDriver, { color: colors.textSecondary }]}>
            {item.parent?.full_name || 'Unknown Parent'}
            {item.child ? ` - ${item.child.full_name}` : ''}
          </Text>
        </View>
        <View style={[
          styles(colors).statusBadge,
          { backgroundColor: item.status === 'approved' ? '#007749' : item.status === 'rejected' ? '#E91E63' : '#FFB81C' }
        ]}>
          <Text style={styles(colors).statusText}>{item.status}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles(colors).backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>📁 Document Management</Text>
        <TouchableOpacity onPress={loadDocuments} style={styles(colors).refreshBtn}>
          <Ionicons name="refresh" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles(colors).tabs, { backgroundColor: colors.card }]}>
        <TouchableOpacity
          style={[styles(colors).tab, activeTab === 'drivers' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('drivers')}
        >
          <Text style={[styles(colors).tabText, { color: activeTab === 'drivers' ? colors.primary : colors.textSecondary }]}>
            <Ionicons name="car" size={16} color={activeTab === 'drivers' ? colors.primary : colors.textSecondary} /> Driver Documents
          </Text>
          <View style={[styles(colors).badge, { backgroundColor: colors.danger || '#E91E63' }]}>
            <Text style={styles(colors).badgeText}>{driverDocs.filter(d => d.status === 'pending').length}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles(colors).tab, activeTab === 'parents' && { borderBottomColor: colors.primary, borderBottomWidth: 3 }]}
          onPress={() => setActiveTab('parents')}
        >
          <Text style={[styles(colors).tabText, { color: activeTab === 'parents' ? colors.primary : colors.textSecondary }]}>
            <Ionicons name="people" size={16} color={activeTab === 'parents' ? colors.primary : colors.textSecondary} /> Parent Parent Documents
          </Text>
          <View style={[styles(colors).badge, { backgroundColor: colors.danger || '#E91E63' }]}>
            <Text style={styles(colors).badgeText}>{parentDocs.filter(d => d.status === 'pending').length}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={[styles(colors).statsRow, { backgroundColor: colors.card }]}>
        <View style={styles(colors).statItem}>
          <Text style={[styles(colors).statNumber, { color: colors.primary }]}>{driverDocs.length}</Text>
          <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Total</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={[styles(colors).statNumber, { color: '#007749' }]}>{driverDocs.filter(d => d.status === 'approved').length}</Text>
          <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Approved</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={[styles(colors).statNumber, { color: '#FFB81C' }]}>{driverDocs.filter(d => d.status === 'pending').length}</Text>
          <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
        <View style={styles(colors).statItem}>
          <Text style={[styles(colors).statNumber, { color: '#E91E63' }]}>{driverDocs.filter(d => d.status === 'rejected').length}</Text>
          <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Rejected</Text>
        </View>
      </View>

      {/* Document List */}
      {loading ? (
        <View style={styles(colors).loading}><ActivityIndicator size="large" color={colors.primary} /></View>
      ) : (
        <FlatList
          data={activeTab === 'drivers' ? driverDocs : parentDocs}
          renderItem={activeTab === 'drivers' ? renderDriverDoc : renderParentDoc}
          keyExtractor={item => item.id}
          contentContainerStyle={styles(colors).list}
          ListEmptyComponent={
            <View style={styles(colors).empty}>
              <Ionicons name="folder-open" size={64} color={colors.textSecondary} />
              <Text style={[styles(colors).emptyText, { color: colors.textSecondary }]}>
                No documents yet
              </Text>
            </View>
          }
        />
      )}

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={styles(colors).modalOverlay}>
          <View style={[styles(colors).modalContent, { backgroundColor: colors.card }]}>
            <View style={styles(colors).modalHeader}>
              <Text style={[styles(colors).modalTitle, { color: colors.text }]}>Review Document</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {selectedDoc && (
              <ScrollView style={styles(colors).modalBody}>
                <View style={[styles(colors).previewCard, { backgroundColor: colors.background }]}>
                  {selectedDoc.file_url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <Image source={{ uri: selectedDoc.file_url }} style={styles(colors).previewImage} resizeMode="contain" />
                  ) : (
                    <View style={styles(colors).filePreview}>
                      <Ionicons name="document" size={48} color={colors.primary} />
                      <Text style={[styles(colors).fileName, { color: colors.text }]}>{selectedDoc.file_name}</Text>
                    </View>
                  )}
                </View>

                <Text style={[styles(colors).docDetail, { color: colors.text }]}>
                  Type: {documentTypes[selectedDoc.document_type as keyof typeof documentTypes]}
                </Text>
                <Text style={[styles(colors).docDetail, { color: colors.text }]}>
                  Submitted: {new Date(selectedDoc.uploaded_at).toLocaleString()}
                </Text>

                <Text style={[styles(colors).inputLabel, { color: colors.text }]}>Notes (Optional)</Text>
                <TextInput
                  style={[styles(colors).notesInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Add notes about this document..."
                  placeholderTextColor={colors.textSecondary}
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>
            )}

            <View style={styles(colors).modalActions}>
              <TouchableOpacity
                style={[styles(colors).rejectBtn, { backgroundColor: '#E91E63' }]}
                onPress={() => selectedDoc && handleReview(selectedDoc.id, 'rejected')}
              >
                <Ionicons name="close" size={20} color="#fff" />
                <Text style={styles(colors).actionBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles(colors).approveActionBtn, { backgroundColor: '#007749' }]}
                onPress={() => selectedDoc && handleReview(selectedDoc.id, 'approved')}
              >
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles(colors).actionBtnText}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15 },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  refreshBtn: { padding: 5 },
  tabs: { flexDirection: 'row', paddingHorizontal: 15, paddingVertical: 10 },
  tab: { flex: 1, alignItems: 'center', paddingVertical: 10, flexDirection: 'row', justifyContent: 'center', gap: 8 },
  tabText: { fontSize: 14, fontWeight: '600' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', padding: 15, marginHorizontal: 15, marginTop: 10, borderRadius: 12, justifyContent: 'space-around' },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold' },
  statLabel: { fontSize: 12 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 15 },
  docCard: { borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1 },
  docHeader: { flexDirection: 'row', alignItems: 'center' },
  docIcon: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 12 },
  docType: { fontSize: 16, fontWeight: '600' },
  docDriver: { fontSize: 14, marginTop: 2 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: 'bold', textTransform: 'capitalize' },
  docFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  docDate: { fontSize: 12 },
  actionButtons: { flexDirection: 'row', gap: 10 },
  approveBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnText: { color: '#fff', fontSize: 12, fontWeight: '600', marginLeft: 4 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, marginTop: 10 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  modalTitle: { fontSize: 20, fontWeight: 'bold' },
  modalBody: { padding: 20 },
  previewCard: { height: 200, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  previewImage: { width: '100%', height: '100%' },
  filePreview: { alignItems: 'center' },
  fileName: { marginTop: 10, fontSize: 14 },
  docDetail: { fontSize: 14, marginBottom: 8 },
  inputLabel: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 10 },
  notesInput: { borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14, minHeight: 80, textAlignVertical: 'top' },
  modalActions: { flexDirection: 'row', padding: 20, gap: 15, borderTopWidth: 1, borderTopColor: '#eee' },
  rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10 },
  approveActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 15, borderRadius: 10 },
  actionBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});
