// ScholarTrack Compliance Screen — Design System: Dark SA Transport
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
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

// Glassmorphism helper
const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

interface UploadedDocument {
  uri: string;
  name: string;
  type: string;
  uploadedAt: Date;
}

interface ComplianceDocument {
  id: string;
  label: string;
  description: string;
  required: boolean;
  document?: UploadedDocument;
}

interface ComplianceStatus {
  status: 'pending_review' | 'approved' | 'rejected';
  submittedAt: string;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
  setScreen?: (s: string) => void;
}

export default function ComplianceScreen({ navigation, setScreen }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [existingCompliance, setExistingCompliance] = useState<ComplianceStatus | null>(null);

  const [documents, setDocuments] = useState<ComplianceDocument[]>([
    { id: 'pdp', label: 'PDP License', description: 'Public Driver Permit Certificate', required: true },
    { id: 'roadworthy', label: 'Roadworthy Certificate', description: 'Vehicle roadworthy certification', required: true },
    { id: 'driversLicense', label: "Driver's License", description: "Valid SA driver's license", required: true },
    { id: 'insurance', label: 'Vehicle Insurance', description: 'Comprehensive insurance cover', required: true },
    { id: 'vehiclePermit', label: 'Operating License', description: 'National Land Transport Act permit', required: true },
  ]);

  const [complianceStatus, setComplianceStatus] = useState<'pending' | 'partial' | 'complete'>('pending');

  const checkExistingCompliance = useCallback(async () => {
    try {
      setLoading(true);
      const stored = await AsyncStorage.getItem('driverCompliance');
      if (stored) {
        const compliance = JSON.parse(stored);
        setExistingCompliance(compliance);
        const uploadedDocs = compliance.documents || [];
        setDocuments(prev => prev.map(doc => {
          const uploaded = uploadedDocs.find((d: { id: string }) => d.id === doc.id);
          return uploaded ? { ...doc, document: { uri: uploaded.name, name: uploaded.name, type: 'image', uploadedAt: new Date(uploaded.uploadedAt) } } : doc;
        }));
        updateComplianceStatus(compliance.documents || []);
      }
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { checkExistingCompliance(); }, [checkExistingCompliance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkExistingCompliance();
    setRefreshing(false);
  };

  const updateComplianceStatus = (docs: any[]) => {
    const requiredDocs = documents.filter(d => d.required);
    const uploadedRequired = requiredDocs.filter(d => docs.some((d2: any) => d2.id === d.id && d2.name)).length;
    if (uploadedRequired === requiredDocs.length && requiredDocs.length > 0) setComplianceStatus('complete');
    else if (uploadedRequired > 0) setComplianceStatus('partial');
    else setComplianceStatus('pending');
  };

  const pickDocument = async (docId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['application/pdf', 'image/*'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, document: { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream', uploadedAt: new Date() } } : doc));
        const updatedDocs = documents.map(d => d.id === docId ? { ...d, document: { uri: asset.uri, name: asset.name, type: 'image', uploadedAt: new Date() } } : d);
        updateComplianceStatus(updatedDocs);
      }
    } catch (error) { Alert.alert('Error', 'Failed to pick document. Please try again.'); }
  };

  const takePhoto = async (docId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') { Alert.alert('Permission Required', 'Camera access is needed to take photos of documents.'); return; }
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setDocuments(prev => prev.map(doc => doc.id === docId ? { ...doc, document: { uri: asset.uri, name: `${docId}_${Date.now()}.jpg`, type: 'image/jpeg', uploadedAt: new Date() } } : doc));
      const updatedDocs = documents.map(d => d.id === docId ? { ...d, document: { uri: asset.uri, name: `${docId}.jpg`, type: 'image', uploadedAt: new Date() } } : d);
      updateComplianceStatus(updatedDocs);
    }
  };

  const showDocumentOptions = (docId: string) => {
    Alert.alert('Add Document', 'Choose how to add the document', [
      { text: 'Take Photo', onPress: () => takePhoto(docId) },
      { text: 'Choose from Files', onPress: () => pickDocument(docId) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const submitCompliance = async () => {
    const missingDocs = documents.filter(d => d.required && !d.document).map(d => d.label);
    if (missingDocs.length > 0) { Alert.alert('Missing Documents', `Please upload: ${missingDocs.join(', ')}`); return; }
    try {
      await AsyncStorage.setItem('driverCompliance', JSON.stringify({
        documents: documents.map(d => ({ id: d.id, label: d.label, name: d.document?.name, uploadedAt: d.document?.uploadedAt.toISOString() })),
        submittedAt: new Date().toISOString(),
        status: 'pending_review',
      }));
      setExistingCompliance({ status: 'pending_review', submittedAt: new Date().toISOString() });
      Alert.alert('Success', 'Your compliance documents have been submitted for review.');
    } catch (error) { Alert.alert('Error', 'Failed to save compliance documents.'); }
  };

  const verified = documents.filter(d => d.document).length;
  const pending = documents.filter(d => !d.document).length;
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.cyan, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,229,255,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    ltBack: { width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,.07)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
    progressCard: { marginHorizontal: 16, marginTop: 12, ...glass, padding: 16 },
    progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: DT.border },
    progressFill: { height: '100%', borderRadius: 4, backgroundColor: DT.green2 },
    progressText: { fontFamily: 'Syne_700Bold', fontSize: 12, marginTop: 8, textAlign: 'center', color: DT.muted },
    statsRow: { flexDirection: 'row', marginHorizontal: 16, marginTop: 12, ...glass, overflow: 'hidden' },
    statCard: { flex: 1, alignItems: 'center', paddingVertical: 16 },
    statNum: { fontFamily: 'Syne_700Bold', fontSize: 28, fontWeight: '700', color: DT.amber },
    statNum2: { fontFamily: 'Syne_700Bold', fontSize: 28, fontWeight: '700', color: DT.cyan },
    statLbl: { fontFamily: 'Syne_700Bold', fontSize: 10, color: DT.muted, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: DT.white, marginBottom: 12, letterSpacing: 0.5 },
    docCard: { ...glass, padding: 16, marginBottom: 12 },
    docTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.12)' },
    docHdr: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    docInfo: { flex: 1 },
    docLabel: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: DT.white },
    docDesc: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 4 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 12, marginTop: 14, borderWidth: 1.5, borderColor: 'rgba(0,229,255,.3)', borderStyle: 'dashed' },
    uploadBtnText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '600', color: DT.cyan, marginLeft: 8, letterSpacing: 1, textTransform: 'uppercase' },
    previewRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 10, borderRadius: 10, backgroundColor: 'rgba(0,230,118,.08)' },
    previewName: { flex: 1, marginLeft: 8, fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.green2 },
    changeBtn: { paddingHorizontal: 12, paddingVertical: 6 },
    changeBtnText: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '600', color: DT.cyan },
    submitBtn: { marginHorizontal: 16, marginBottom: 24, paddingVertical: 14, borderRadius: 14, alignItems: 'center', backgroundColor: DT.green2 },
    submitBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '700', color: DT.bg, letterSpacing: 1, textTransform: 'uppercase' },
    successCard: { marginHorizontal: 16, marginTop: 16, ...glass, padding: 32, alignItems: 'center' },
    successTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: DT.white, marginTop: 16, marginBottom: 8, textAlign: 'center' },
    successText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.muted, textAlign: 'center', lineHeight: 20 },
    submittedDate: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 12 },
    helpCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, ...glass, padding: 16 },
    helpText: { flex: 1, marginLeft: 12, fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted, lineHeight: 18 },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontFamily: 'Syne_700Bold', fontSize: 14, color: DT.muted, marginTop: 10 },
  });

  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Compliance</Text><Text style={s.ltSub}>Driver Documents</Text></View></View>
        <View style={s.loadingContainer}><ActivityIndicator size="large" color={DT.cyan} /><Text style={s.loadingText}>Loading compliance...</Text></View>
      </View>
    );
  }

  if (existingCompliance?.status === 'pending_review') {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View></View>
        <View style={s.ltHeader}>
          <View style={s.ltHeaderBg} />
          <View style={s.ltTop}>
            <View><Text style={s.ltTitle}>Compliance</Text><Text style={s.ltSub}>Driver Documents</Text></View>
            <TouchableOpacity onPress={() => Alert.alert('SOS', 'Calling emergency services...')} style={{ backgroundColor: DT.red, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Ionicons name="warning" size={14} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>SOS</Text>
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.cyan} colors={[DT.cyan]} />}>
          <View style={s.successCard}>
            <Ionicons name="checkmark-circle" size={80} color={DT.green2} />
            <Text style={s.successTitle}>Submitted Successfully!</Text>
            <Text style={s.successText}>Your documents are being reviewed.{'\n'}This typically takes 1-2 business days.</Text>
            <Text style={s.submittedDate}>Submitted: {new Date(existingCompliance.submittedAt).toLocaleDateString()}</Text>
          </View>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Uploaded Documents</Text>
            {documents.map(doc => (
              <View key={doc.id} style={s.docCard}>
                <View style={s.docTopRefraction} />
                <View style={s.docHdr}>
                  <View style={s.docInfo}><Text style={s.docLabel}>{doc.label}</Text></View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons name="checkmark-circle" size={14} color={DT.green2} />
                    <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 10, color: DT.green2, fontWeight: '600' }}>Uploaded</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
          <Spacer size="xxl" />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View></View>
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Compliance</Text><Text style={s.ltSub}>Driver Documents</Text></View>
          <TouchableOpacity onPress={() => Alert.alert('SOS', 'Calling emergency services...')} style={{ backgroundColor: DT.red, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="warning" size={14} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={DT.cyan} colors={[DT.cyan]} />}>
        {/* Progress */}
        <View style={s.progressCard}>
          <View style={s.progressBar}><View style={[s.progressFill, { width: `${(verified / documents.length) * 100}%` }]} /></View>
          <Text style={s.progressText}>{verified} of {documents.length} documents uploaded</Text>
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}><Text style={s.statNum}>{verified}</Text><Text style={s.statLbl}>Uploaded</Text></View>
          <View style={s.statCard}><Text style={s.statNum2}>{pending}</Text><Text style={s.statLbl}>Pending</Text></View>
        </View>

        {/* Documents */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Required Documents</Text>
          {documents.map(doc => (
            <View key={doc.id} style={s.docCard}>
              <View style={s.docTopRefraction} />
              <View style={s.docHdr}>
                <View style={s.docInfo}>
                  <Text style={s.docLabel}>{doc.label}{doc.required && <Text style={{ color: DT.red }}> *</Text>}</Text>
                  <Text style={s.docDesc}>{doc.description}</Text>
                </View>
                {doc.document ? (
                  <View style={{ padding: 4 }}><Ionicons name="checkmark-circle" size={22} color={DT.green2} /></View>
                ) : (
                  <View style={{ padding: 4 }}><Ionicons name="time-outline" size={20} color={DT.amber} /></View>
                )}
              </View>
              {doc.document ? (
                <View style={s.previewRow}>
                  <Ionicons name="document-text" size={16} color={DT.green2} />
                  <Text style={s.previewName} numberOfLines={1}>{doc.document.name}</Text>
                  <TouchableOpacity onPress={() => showDocumentOptions(doc.id)} style={s.changeBtn}><Text style={s.changeBtnText}>Change</Text></TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={s.uploadBtn} onPress={() => showDocumentOptions(doc.id)}>
                  <Ionicons name="cloud-upload" size={20} color={DT.cyan} /><Text style={s.uploadBtnText}>Upload Document</Text>
                </TouchableOpacity>
              )}
            </View>
          ))}
        </View>

        {/* Submit */}
        <TouchableOpacity style={[s.submitBtn, pending > 0 && { opacity: 0.5 }]} onPress={submitCompliance} disabled={pending > 0}>
          <Ionicons name="send" size={18} color={DT.bg} /><Text style={s.submitBtnText}>Submit for Review</Text>
        </TouchableOpacity>

        {/* Help */}
        <View style={s.helpCard}>
          <Ionicons name="help-circle" size={22} color={DT.cyan} />
          <Text style={s.helpText}>Contact support for help with document verification</Text>
        </View>

        <Spacer size="xxl" />
      </ScrollView>
    </View>
  );
}
