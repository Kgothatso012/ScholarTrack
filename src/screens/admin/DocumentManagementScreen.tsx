// Document Management Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, Modal, FlatList, ActivityIndicator, Image, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { documentService, DriverDocument, ParentDocument } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { Spacer } from '../../ui-plugin/components';

// ─── Design Tokens ───────────────────────────────────────────────────────────
const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#007749',
  green2: '#00e676',
  blue: '#002395',
  red: '#ff3d5a',
  dim: '#2e4a6e',
  muted: '#4a6a8a',
  text: '#9bbdd4',
  white: '#e8f4ff',
};

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

type TabType = 'drivers' | 'parents';

const documentTypes: Record<string, string> = {
  id_card: 'ID Card',
  drivers_license: "Driver's License",
  pdp_certificate: 'PDP Certificate',
  vehicle_license: 'Vehicle License',
  roadworthy: 'Roadworthy Certificate',
  insurance: 'Insurance',
  permit: 'Transport Permit',
  proof_of_residence: 'Proof of Residence',
  birth_certificate: 'Birth Certificate',
  consent_form: 'Consent Form',
};

export default function DocumentManagementScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('drivers');
  const [driverDocs, setDriverDocs] = useState<DriverDocument[]>([]);
  const [parentDocs, setParentDocs] = useState<ParentDocument[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<DriverDocument | ParentDocument | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  useEffect(() => { loadDocuments(); }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const [drivers, parents] = await Promise.all([
        documentService.getAllDriverDocuments(),
        documentService.getAllParentDocuments(),
      ]);
      setDriverDocs(drivers || []);
      setParentDocs(parents || []);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => { setRefreshing(true); await loadDocuments(); };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return DT.green2;
      case 'rejected': return DT.red;
      default: return DT.amber;
    }
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const pendingDriver = driverDocs.filter(d => d.status === 'pending').length;
  const pendingParent = parentDocs.filter(d => d.status === 'pending').length;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'DMMono_400Regular', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 6 },
    sbIcon: { fontSize: 14 },
    ltHeader: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.amber, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'DMMono_400Regular', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4 },
    refreshBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,183,0,.15)', justifyContent: 'center', alignItems: 'center' },
    tabs: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, ...glass, borderRadius: 16 },
    tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, gap: 6 },
    tabText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600' },
    tabBadge: { width: 20, height: 20, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    tabBadgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: DT.white },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, gap: 10 },
    statItem: { flex: 1, ...glass, paddingVertical: 14, alignItems: 'center' },
    statNumber: { fontFamily: 'Syne_700Bold', fontSize: 22, fontWeight: '700', color: DT.amber },
    statLabel: { fontFamily: 'Syne_700Bold', fontSize: 9, color: DT.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    list: { padding: 16 },
    docCard: { ...glass, padding: 16, marginBottom: 12 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.18)' },
    cardLeftBar: { position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.6)' },
    docHeader: { flexDirection: 'row', alignItems: 'center' },
    docIcon: { width: 50, height: 50, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 1 },
    docInfo: { flex: 1, marginLeft: 14 },
    docType: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: DT.white },
    docMeta: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 3 },
    statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: DT.white, textTransform: 'uppercase' },
    docFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: DT.border },
    docDate: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted },
    reviewBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 7, borderRadius: 10, gap: 6 },
    reviewBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.white },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 60 },
    emptyIcon: { marginBottom: 12 },
    emptyText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.muted },
    loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'flex-end' },
    modalContent: { backgroundColor: DT.bg2, borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: DT.border },
    modalTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: DT.white },
    modalBody: { padding: 20 },
    previewCard: { height: 200, justifyContent: 'center', alignItems: 'center', marginBottom: 16, ...glass },
    previewImage: { width: '100%', height: '100%', borderRadius: 16 },
    filePreview: { alignItems: 'center' },
    fileName: { fontFamily: 'Syne_700Bold', fontSize: 14, color: DT.text, marginTop: 10 },
    docDetail: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.text, marginBottom: 8 },
    inputLabel: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.amber, marginBottom: 8, marginTop: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
    notesInput: { ...glass, padding: 14, fontFamily: 'Syne_700Bold', fontSize: 14, color: DT.white, minHeight: 80, textAlignVertical: 'top' },
    modalActions: { flexDirection: 'row', padding: 20, gap: 12 },
    rejectBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
    approveBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
    actionBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: DT.white },
    bottomPadding: { height: 50 },
  });

  const renderDriverDoc = ({ item }: { item: DriverDocument }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity style={s.docCard} onPress={() => setSelectedDoc(item)} activeOpacity={0.7}>
        <View style={s.cardTopRefraction} />
        <View style={s.docHeader}>
          <View style={[s.docIcon, { backgroundColor: `${DT.cyan}15`, borderColor: `${DT.cyan}35` }]}>
            <Ionicons name="document-text" size={22} color={DT.cyan} />
          </View>
          <View style={s.docInfo}>
            <Text style={s.docType}>{documentTypes[item.document_type] || item.document_type}</Text>
            <Text style={s.docMeta}>{item.driver?.full_name || 'Unknown Driver'}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={s.statusText}>{item.status}</Text>
          </View>
        </View>
        <View style={s.docFooter}>
          <Text style={s.docDate}>{new Date(item.uploaded_at).toLocaleDateString()}</Text>
          {item.status === 'pending' && (
            <TouchableOpacity
              style={[s.reviewBtn, { backgroundColor: `${DT.cyan}20`, borderWidth: 1, borderColor: `${DT.cyan}40` }]}
              onPress={() => { setSelectedDoc(item); setShowReviewModal(true); }}
            >
              <Ionicons name="checkmark" size={14} color={DT.cyan} />
              <Text style={[s.reviewBtnText, { color: DT.cyan }]}>Review</Text>
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderParentDoc = ({ item }: { item: ParentDocument }) => {
    const statusColor = getStatusColor(item.status);
    return (
      <TouchableOpacity style={s.docCard} onPress={() => setSelectedDoc(item)} activeOpacity={0.7}>
        <View style={s.cardTopRefraction} />
        <View style={s.docHeader}>
          <View style={[s.docIcon, { backgroundColor: `${DT.amber}15`, borderColor: `${DT.amber}35` }]}>
            <Ionicons name="people" size={22} color={DT.amber} />
          </View>
          <View style={s.docInfo}>
            <Text style={s.docType}>{documentTypes[item.document_type] || item.document_type}</Text>
            <Text style={s.docMeta}>
              {item.parent?.full_name || 'Unknown Parent'}
              {item.child ? ` — ${item.child.full_name}` : ''}
            </Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={s.statusText}>{item.status}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const activeDocs = activeTab === 'drivers' ? driverDocs : parentDocs;

  return (
    <View style={s.container}>
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.green2} /><Ionicons name="battery-full" size={14} color={DT.white} /></View>
      </View>

      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={DT.white} />
          </TouchableOpacity>
          <View><Text style={s.ltTitle}>Documents</Text><Text style={s.ltSub}>Manage uploaded files</Text></View>
          <TouchableOpacity style={s.refreshBtn} onPress={loadDocuments}>
            <Ionicons name="refresh" size={18} color={DT.cyan} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, activeTab === 'drivers' && { borderBottomWidth: 2, borderBottomColor: DT.cyan }]}
          onPress={() => setActiveTab('drivers')}
        >
          <Ionicons name="car" size={14} color={activeTab === 'drivers' ? DT.cyan : DT.muted} />
          <Text style={[s.tabText, { color: activeTab === 'drivers' ? DT.cyan : DT.muted }]}>Drivers</Text>
          {pendingDriver > 0 && (
            <View style={[s.tabBadge, { backgroundColor: DT.red }]}>
              <Text style={s.tabBadgeText}>{pendingDriver}</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, activeTab === 'parents' && { borderBottomWidth: 2, borderBottomColor: DT.cyan }]}
          onPress={() => setActiveTab('parents')}
        >
          <Ionicons name="people" size={14} color={activeTab === 'parents' ? DT.cyan : DT.muted} />
          <Text style={[s.tabText, { color: activeTab === 'parents' ? DT.cyan : DT.muted }]}>Parents</Text>
          {pendingParent > 0 && (
            <View style={[s.tabBadge, { backgroundColor: DT.red }]}>
              <Text style={s.tabBadgeText}>{pendingParent}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statItem}>
          <Text style={[s.statNumber, { color: DT.cyan }]}>{activeDocs.length}</Text>
          <Text style={s.statLabel}>Total</Text>
        </View>
        <View style={s.statItem}>
          <Text style={[s.statNumber, { color: DT.green2 }]}>{activeDocs.filter(d => d.status === 'approved').length}</Text>
          <Text style={s.statLabel}>Approved</Text>
        </View>
        <View style={s.statItem}>
          <Text style={[s.statNumber, { color: DT.amber }]}>{activeDocs.filter(d => d.status === 'pending').length}</Text>
          <Text style={s.statLabel}>Pending</Text>
        </View>
        <View style={s.statItem}>
          <Text style={[s.statNumber, { color: DT.red }]}>{activeDocs.filter(d => d.status === 'rejected').length}</Text>
          <Text style={s.statLabel}>Rejected</Text>
        </View>
      </View>

      {/* Document List */}
      {loading ? (
        <View style={s.loading}><ActivityIndicator size="large" color={DT.cyan} /></View>
      ) : (
        <FlatList
          data={activeDocs as (DriverDocument | ParentDocument)[]}
          renderItem={activeTab === 'drivers' ? (renderDriverDoc as ({ item }: { item: DriverDocument | ParentDocument }) => React.ReactElement) : (renderParentDoc as ({ item }: { item: DriverDocument | ParentDocument }) => React.ReactElement)}
          keyExtractor={item => item.id}
          contentContainerStyle={s.list}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="folder-open" size={64} color={DT.muted} style={s.emptyIcon} />
              <Text style={s.emptyText}>No documents yet</Text>
            </View>
          }
          ListFooterComponent={<View style={s.bottomPadding} />}
        />
      )}

      {/* Review Modal */}
      <Modal visible={showReviewModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <Text style={s.modalTitle}>Review Document</Text>
              <TouchableOpacity onPress={() => setShowReviewModal(false)}>
                <Ionicons name="close" size={22} color={DT.muted} />
              </TouchableOpacity>
            </View>

            {selectedDoc && (
              <ScrollView style={s.modalBody} showsVerticalScrollIndicator={false}>
                <View style={s.previewCard}>
                  {selectedDoc.file_url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                    <Image source={{ uri: selectedDoc.file_url }} style={s.previewImage} resizeMode="contain" />
                  ) : (
                    <View style={s.filePreview}>
                      <Ionicons name="document" size={48} color={DT.cyan} />
                      <Text style={s.fileName}>{selectedDoc.file_name}</Text>
                    </View>
                  )}
                </View>

                <Text style={s.docDetail}>Type: {documentTypes[selectedDoc.document_type]}</Text>
                <Text style={s.docDetail}>Submitted: {new Date(selectedDoc.uploaded_at).toLocaleString()}</Text>

                <Text style={s.inputLabel}>Notes (Optional)</Text>
                <TextInput
                  style={s.notesInput}
                  placeholder="Add notes about this document..."
                  placeholderTextColor={DT.muted}
                  value={reviewNotes}
                  onChangeText={setReviewNotes}
                  multiline
                  numberOfLines={3}
                />
              </ScrollView>
            )}

            <View style={s.modalActions}>
              <TouchableOpacity
                style={[s.rejectBtn, { backgroundColor: DT.red }]}
                onPress={() => selectedDoc && handleReview(selectedDoc.id, 'rejected')}
              >
                <Ionicons name="close" size={18} color={DT.white} />
                <Text style={s.actionBtnText}>Reject</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.approveBtn, { backgroundColor: DT.green2 }]}
                onPress={() => selectedDoc && handleReview(selectedDoc.id, 'approved')}
              >
                <Ionicons name="checkmark" size={18} color={DT.bg} />
                <Text style={[s.actionBtnText, { color: DT.bg }]}>Approve</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}