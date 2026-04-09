import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
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

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
  setScreen?: (s: string) => void;
}

export default function ComplianceScreen({ navigation, setScreen }: Props) {
  const { colors } = useTheme();
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

        // Update documents with uploaded status
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

  useEffect(() => {
    checkExistingCompliance();
  }, [checkExistingCompliance]);

  const onRefresh = async () => {
    setRefreshing(true);
    await checkExistingCompliance();
    setRefreshing(false);
  };

  const updateComplianceStatus = (docs: ComplianceDocument[]) => {
    const uploadedCount = docs.filter((d: ComplianceDocument) => d.document).length;
    const requiredDocs = documents.filter(d => d.required);
    const uploadedRequired = requiredDocs.filter(d => docs.some((d2: ComplianceDocument & { name?: string }) => d2.id === d.id && d2.name)).length;

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
      <View style={[styles(colors).container, styles(colors).loadingContainer]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles(colors).loadingText}>Loading compliance...</Text>
      </View>
    );
  }

  // Show submitted status
  if (existingCompliance?.status === 'pending_review') {
    return (
      <ScrollView style={styles(colors).container}>
        <View style={[styles(colors).header, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
          <View>
            <Text style={styles(colors).headerTitle}>Compliance</Text>
            <Text style={styles(colors).headerSubtext}>Driver Documents</Text>
          </View>
          <TouchableOpacity
            style={{ backgroundColor: colors.danger, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 4 }}
            onPress={() => Alert.alert('Emergency SOS', 'Calling emergency services...', [{ text: 'Cancel', style: 'cancel' }])}
          >
            <Ionicons name="warning" size={16} color="#fff" />
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>SOS</Text>
          </TouchableOpacity>
        </View>

        <View style={styles(colors).successCard}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
          <Text style={styles(colors).successTitle}>Submitted Successfully!</Text>
          <Text style={styles(colors).successText}>
            Your documents are being reviewed. This typically takes 1-2 business days.
          </Text>
          <Text style={styles(colors).submittedDate}>
            Submitted: {new Date(existingCompliance.submittedAt).toLocaleDateString()}
          </Text>
        </View>

        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>Uploaded Documents</Text>
          {documents.map(doc => (
            <View key={doc.id} style={styles(colors).docCard}>
              <View style={styles(colors).docInfo}>
                <Text style={styles(colors).docLabel}>{doc.label}</Text>
                <View style={styles(colors).docStatus}>
                  <Ionicons name="checkmark" size={14} color={colors.success} />
                  <Text style={styles(colors).docStatusText}>Uploaded</Text>
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
      style={styles(colors).container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.accent]} tintColor={colors.accent} />}
    >
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Compliance</Text>
        <Text style={styles(colors).headerSubtext}>Driver Documents</Text>
      </View>

      {/* Progress */}
      <View style={styles(colors).progressCard}>
        <View style={styles(colors).progressBar}>
          <View style={[styles(colors).progressFill, { width: `${(verified / documents.length) * 100}%` }]} />
        </View>
        <Text style={styles(colors).progressText}>
          {verified} of {documents.length} documents uploaded
        </Text>
      </View>

      {/* Stats */}
      <View style={styles(colors).statsRow}>
        <View style={styles(colors).statCard}>
          <Text style={[styles(colors).statNumber, { color: colors.success }]}>{verified}</Text>
          <Text style={styles(colors).statLabel}>Uploaded</Text>
        </View>
        <View style={styles(colors).statCard}>
          <Text style={[styles(colors).statNumber, { color: colors.accent }]}>{pending}</Text>
          <Text style={styles(colors).statLabel}>Pending</Text>
        </View>
      </View>

      {/* Documents */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Required Documents</Text>
        {documents.map(doc => (
          <View key={doc.id} style={styles(colors).documentCard}>
            <View style={styles(colors).documentHeader}>
              <View style={styles(colors).documentInfo}>
                <Text style={styles(colors).documentLabel}>
                  {doc.label}
                  {doc.required && <Text style={{ color: colors.danger }}> *</Text>}
                </Text>
                <Text style={styles(colors).documentDescription}>
                  {doc.description}
                </Text>
              </View>
              {doc.document ? (
                <View style={[styles(colors).uploadedBadge, { backgroundColor: colors.success + '20' }]}>
                  <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                </View>
              ) : (
                <View style={[styles(colors).pendingBadge, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="time-outline" size={20} color={colors.accent} />
                </View>
              )}
            </View>

            {doc.document ? (
              <View style={styles(colors).uploadedPreview}>
                <Ionicons name="document-text" size={20} color={colors.success} />
                <Text style={styles(colors).previewName} numberOfLines={1}>
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
                <Ionicons name="cloud-upload" size={24} color={colors.accent} />
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
          <Ionicons name="send" size={20} color={colors.textInverse} />
          <Text style={styles(colors).submitButtonText}>Submit for Review</Text>
        </TouchableOpacity>
      </View>

      {/* Help */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Need Help?</Text>
        <View style={styles(colors).helpCard}>
          <Ionicons name="help-circle" size={24} color={colors.accent} />
          <Text style={styles(colors).helpText}>
            Contact support for help with document verification
          </Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 16, color: colors.textSecondary },
  header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: 40 },
  headerTitle: { ...typography.h2, color: colors.textInverse },
  headerSubtext: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
  progressCard: { margin: spacing.md, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.card },
  progressBar: { height: 8, borderRadius: 4, overflow: 'hidden', backgroundColor: colors.border },
  progressFill: { height: '100%', borderRadius: 4, backgroundColor: colors.success },
  progressText: { fontSize: 14, marginTop: spacing.sm, textAlign: 'center', color: colors.textSecondary },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: spacing.md, marginHorizontal: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.card },
  statCard: { alignItems: 'center' },
  statNumber: { ...typography.h2, color: colors.accent },
  statLabel: { ...typography.labelSmall, color: colors.textSecondary },
  section: { padding: spacing.md },
  sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
  documentCard: { borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.card },
  documentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  documentInfo: { flex: 1 },
  documentLabel: { ...typography.label, color: colors.text },
  documentDescription: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
  uploadedBadge: { padding: spacing.xs, borderRadius: borderRadius.sm },
  pendingBadge: { padding: spacing.xs, borderRadius: borderRadius.sm },
  uploadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: borderRadius.sm, marginTop: spacing.md, borderWidth: 1, borderStyle: 'dashed', borderColor: colors.accent, backgroundColor: 'transparent' },
  uploadButtonText: { marginLeft: spacing.sm, fontWeight: '600', color: colors.accent },
  uploadedPreview: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.md, padding: spacing.sm, borderRadius: borderRadius.sm, backgroundColor: colors.success + '20' },
  previewName: { flex: 1, marginLeft: spacing.sm, ...typography.bodySmall, color: colors.text },
  changeBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  changeBtnText: { fontWeight: '600', fontSize: 12, color: colors.primary },
  submitButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.success },
  submitButtonDisabled: { opacity: 0.5, backgroundColor: colors.textMuted },
  submitButtonText: { ...typography.button, marginLeft: spacing.sm, color: colors.textInverse },
  helpCard: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.card },
  helpText: { flex: 1, marginLeft: spacing.md, ...typography.bodySmall, color: colors.textSecondary },
  successCard: { margin: spacing.md, padding: spacing.xl, borderRadius: borderRadius.md, alignItems: 'center', backgroundColor: colors.card },
  successTitle: { ...typography.h3, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md },
  successText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  submittedDate: { ...typography.caption, marginTop: spacing.md, color: colors.textSecondary },
  docCard: { borderRadius: borderRadius.sm, padding: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.card },
  docInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  docLabel: { ...typography.label, color: colors.text },
  docStatus: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, backgroundColor: colors.success + '20' },
  docStatusText: { ...typography.labelSmall, marginLeft: spacing.xs, fontWeight: '600', color: colors.success },
});
