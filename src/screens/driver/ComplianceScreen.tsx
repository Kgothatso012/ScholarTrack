import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';

// UI Plugin components
import { Card, Button, Spacer, Avatar, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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
  reviewedAt?: string;
  reviewedBy?: string;
}

export default function ComplianceScreen({ navigation, setScreen }: any) {
  const { colors } = useTheme();
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

        // Update documents with uploaded status
        const uploadedDocs = compliance.documents || [];
        setDocuments(prev => prev.map(doc => {
          const uploaded = uploadedDocs.find((d: any) => d.id === doc.id);
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

  useEffect(() => {
    checkExistingCompliance();
  }, [checkExistingCompliance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkExistingCompliance();
    setRefreshing(false);
  };

  const updateComplianceStatus = (docs: any[]) => {
    const uploadedCount = docs.filter((d: any) => d.document).length;
    const requiredDocs = documents.filter(d => d.required);
    const uploadedRequired = requiredDocs.filter(d => docs.some((d2: any) => d2.id === d.id && d2.name)).length;

    if (uploadedRequired === requiredDocs.length && requiredDocs.length > 0) {
      setComplianceStatus('complete');
    } else if (uploadedRequired > 0) {
      setComplianceStatus('partial');
    } else {
      setComplianceStatus('pending');
    }
  };

  const pickDocument = async (docId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];

        setDocuments(prev =>
          prev.map(doc =>
            doc.id === docId
              ? {
                  ...doc,
                  document: {
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/octet-stream',
                    uploadedAt: new Date(),
                  },
                }
              : doc
          )
        );

        const updatedDocs = documents.map(d => d.id === docId ? { ...d, document: { uri: asset.uri, name: asset.name, type: 'image', uploadedAt: new Date() } } : d);
        updateComplianceStatus(updatedDocs);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  const takePhoto = async (docId: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera access is needed to take photos of documents.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];

      setDocuments(prev =>
        prev.map(doc =>
          doc.id === docId
            ? {
                ...doc,
                document: {
                  uri: asset.uri,
                  name: `${docId}_${Date.now()}.jpg`,
                  type: 'image/jpeg',
                  uploadedAt: new Date(),
                },
              }
            : doc
        )
      );

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

    if (missingDocs.length > 0) {
      Alert.alert('Missing Documents', `Please upload: ${missingDocs.join(', ')}`);
      return;
    }

    try {
      await AsyncStorage.setItem('driverCompliance', JSON.stringify({
        documents: documents.map(d => ({
          id: d.id,
          label: d.label,
          name: d.document?.name,
          uploadedAt: d.document?.uploadedAt.toISOString(),
        })),
        submittedAt: new Date().toISOString(),
        status: 'pending_review',
      }));

      setExistingCompliance({
        status: 'pending_review',
        submittedAt: new Date().toISOString()
      });

      Alert.alert('Success', 'Your compliance documents have been submitted for review.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save compliance documents.');
    }
  };

  const verified = documents.filter(d => d.document).length;
  const pending = documents.filter(d => !d.document).length;

  if (loading) {
    return (
      <View style={[styles(colors).container, styles(colors).loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles(colors).loadingText}>Loading compliance...</Text>
      </View>
    );
  }

  // Show submitted status
  if (existingCompliance?.status === 'pending_review') {
    return (
      <ScrollView style={[styles(colors).container, { backgroundColor: colors.background }]}>
        <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
          <Text style={styles(colors).headerTitle}>Compliance</Text>
          <Text style={[styles(colors).headerSubtext, { color: colors.accent }]}>Driver Documents</Text>
        </View>

        <View style={[styles(colors).successCard, { backgroundColor: colors.card }]}>
          <Ionicons name="checkmark-circle" size={80} color="#007749" />
          <Text style={[styles(colors).successTitle, { color: colors.text }]}>Submitted Successfully!</Text>
          <Text style={[styles(colors).successText, { color: colors.textSecondary }]}>
            Your documents are being reviewed. This typically takes 1-2 business days.
          </Text>
          <Text style={[styles(colors).submittedDate, { color: colors.textSecondary }]}>
            Submitted: {new Date(existingCompliance.submittedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles(colors).section}>
          <Text style={[styles(colors).sectionTitle, { color: colors.text }]}>Uploaded Documents</Text>
          {documents.map(doc => (
            <View key={doc.id} style={[styles(colors).docCard, { backgroundColor: colors.card }]}>
              <View style={styles(colors).docInfo}>
                <Text style={[styles(colors).docLabel, { color: colors.text }]}>{doc.label}</Text>
                <View style={[styles(colors).docStatus, { backgroundColor: '#00774920' }]}>
                  <Ionicons name="checkmark" size={14} color="#007749" />
                  <Text style={[styles(colors).docStatusText, { color: '#007749' }]}>Uploaded</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles(colors).container, { backgroundColor: colors.background }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
        <Text style={styles(colors).headerTitle}>Compliance</Text>
        <Text style={[styles(colors).headerSubtext, { color: colors.accent }]}>Driver Documents</Text>
      </View>

      {/* Progress */}
      <View style={[styles(colors).progressCard, { backgroundColor: colors.card }]}>
        <View style={styles(colors).progressBar}>
          <View style={[styles(colors).progressFill, { width: `${(verified / documents.length) * 100}%` }]} />
        </View>
        <Text style={[styles(colors).progressText, { color: colors.textSecondary }]}>
          {verified} of {documents.length} documents uploaded
        </Text>
      </View>

      {/* Stats */}
      <View style={[styles(colors).statsRow, { backgroundColor: colors.card }]}>
        <View style={styles(colors).statCard}>
          <Text style={[styles(colors).statNumber, { color: '#007749' }]}>{verified}</Text>
          <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Uploaded</Text>
        </View>
        <View style={styles(colors).statCard}>
          <Text style={[styles(colors).statNumber, { color: '#FFB81C' }]}>{pending}</Text>
          <Text style={[styles(colors).statLabel, { color: colors.textSecondary }]}>Pending</Text>
        </View>
      </View>

      {/* Documents */}
      <View style={styles(colors).section}>
        <Text style={[styles(colors).sectionTitle, { color: colors.text }]}>Required Documents</Text>
        {documents.map(doc => (
          <View key={doc.id} style={[styles(colors).documentCard, { backgroundColor: colors.card }]}>
            <View style={styles(colors).documentHeader}>
              <View style={styles(colors).documentInfo}>
                <Text style={[styles(colors).documentLabel, { color: colors.text }]}>
                  {doc.label}
                  {doc.required && <Text style={{ color: '#FF3B30' }}> *</Text>}
                </Text>
                <Text style={[styles(colors).documentDescription, { color: colors.textSecondary }]}>
                  {doc.description}
                </Text>
              </View>
              {doc.document ? (
                <View style={[styles(colors).uploadedBadge, { backgroundColor: '#00774920' }]}>
                  <Ionicons name="checkmark-circle" size={24} color="#007749" />
                </View>
              ) : (
                <View style={[styles(colors).pendingBadge, { backgroundColor: '#FFB81C20' }]}>
                  <Ionicons name="time-outline" size={20} color="#FFB81C" />
                </View>
              )}
            </View>

            {doc.document ? (
              <View style={styles(colors).uploadedPreview}>
                <Ionicons name="document-text" size={20} color="#007749" />
                <Text style={[styles(colors).previewName, { color: colors.text }]} numberOfLines={1}>
                  {doc.document.name}
                </Text>
                <TouchableOpacity
                  onPress={() => showDocumentOptions(doc.id)}
                  style={styles(colors).changeBtn}
                >
                  <Text style={styles(colors).changeBtnText}>Change</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles(colors).uploadButton}
                onPress={() => showDocumentOptions(doc.id)}
              >
                <Ionicons name="cloud-upload" size={24} color="#FFB81C" />
                <Text style={styles(colors).uploadButtonText}>Upload Document</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </View>

      {/* Submit Button */}
      <View style={styles(colors).section}>
        <TouchableOpacity
          style={[styles(colors).submitButton, pending > 0 && styles(colors).submitButtonDisabled]}
          onPress={submitCompliance}
          disabled={pending > 0}
        >
          <Ionicons name="send" size={20} color="#fff" />
          <Text style={styles(colors).submitButtonText}>Submit for Review</Text>
        </TouchableOpacity>
      </View>

      {/* Help */}
      <View style={styles(colors).section}>
        <Text style={[styles(colors).sectionTitle, { color: colors.text }]}>Need Help?</Text>
        <View style={[styles(colors).helpCard, { backgroundColor: colors.card }]}>
          <Ionicons name="help-circle" size={24} color="#FFB81C" />
          <Text style={[styles(colors).helpText, { color: colors.textSecondary }]}>
            Contact support for help with document verification
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#888' },
  header: { padding: 20, paddingTop: 50, backgroundColor: '#002395' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 14, marginTop: 4, color: '#FFB81C' },
  progressCard: { margin: 16, padding: 16, borderRadius: 12, backgroundColor: '#1a1a1a' },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: '#333' },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: '#007749' },
  progressText: { fontSize: 14, marginTop: 8, textAlign: 'center', color: '#888' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 16, marginHorizontal: 16, borderRadius: 12, backgroundColor: '#1a1a1a' },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold' },
  statLabel: { fontSize: 12, marginTop: 4, color: '#888' },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#fff' },
  documentCard: { borderRadius: 12, padding: 16, marginBottom: 12, backgroundColor: '#1a1a1a' },
  documentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  documentInfo: { flex: 1 },
  documentLabel: { fontSize: 16, fontWeight: '600', color: '#fff' },
  documentDescription: { fontSize: 12, marginTop: 2, color: '#888' },
  uploadedBadge: { padding: 4, borderRadius: 12 },
  pendingBadge: { padding: 4, borderRadius: 12 },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 8, marginTop: 12, borderWidth: 1, borderStyle: 'dashed', borderColor: '#FFB81C', backgroundColor: 'transparent' },
  uploadButtonText: { marginLeft: 8, fontWeight: '600', color: '#FFB81C' },
  uploadedPreview: { flexDirection: 'row', alignItems: 'center', marginTop: 12, padding: 10, borderRadius: 8, backgroundColor: '#00774920' },
  previewName: { flex: 1, marginLeft: 8, fontSize: 14, color: '#fff' },
  changeBtn: { paddingHorizontal: 12, paddingVertical: 6 },
  changeBtnText: { fontWeight: '600', fontSize: 12, color: '#FFB81C' },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: '#007749' },
  submitButtonDisabled: { opacity: 0.5, backgroundColor: '#666' },
  submitButtonText: { fontSize: 16, fontWeight: 'bold', marginLeft: 8, color: '#fff' },
  helpCard: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, backgroundColor: '#1a1a1a' },
  helpText: { flex: 1, marginLeft: 12, fontSize: 14, color: '#888' },
  successCard: { margin: 16, padding: 30, borderRadius: 12, alignItems: 'center', backgroundColor: '#1a1a1a' },
  successTitle: { fontSize: 22, fontWeight: 'bold', marginTop: 20, marginBottom: 10, color: '#fff' },
  successText: { fontSize: 14, textAlign: 'center', lineHeight: 20, color: '#888' },
  submittedDate: { fontSize: 12, marginTop: 15, color: '#888' },
  docCard: { borderRadius: 10, padding: 12, marginBottom: 8, backgroundColor: '#1a1a1a' },
  docInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docLabel: { fontSize: 14, fontWeight: '600', color: '#fff' },
  docStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  docStatusText: { fontSize: 12, marginLeft: 4, fontWeight: '600', color: '#007749' },
});
