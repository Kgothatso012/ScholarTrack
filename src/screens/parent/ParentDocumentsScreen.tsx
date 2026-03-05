import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { documentService, ParentDocument, Child } from '../../lib/api';
import { supabase } from '../../lib/supabase';

interface Props {
  navigation: { goBack: () => void };
}

type DocType = 'id_card' | 'proof_of_residence' | 'birth_certificate' | 'consent_form';

const documentTypes = [
  { id: 'id_card', label: 'ID Document', icon: 'card', required: true },
  { id: 'proof_of_residence', label: 'Proof of Residence', icon: 'home', required: true },
  { id: 'birth_certificate', label: 'Birth Certificate', icon: 'people', required: false },
  { id: 'consent_form', label: 'Consent Form', icon: 'document-text', required: false },
];

export default function ParentDocumentUpload({ navigation }: Props) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [children, setChildren] = useState<Child[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [uploadedDocs, setUploadedDocs] = useState<ParentDocument[]>([]);
  const [uploadingType, setUploadingType] = useState<DocType | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load children
      const { data: childData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);
      setChildren(childData || []);

      // Load existing documents
      const { data: docData } = await supabase
        .from('parent_documents')
        .select('*')
        .eq('parent_id', user.id);
      setUploadedDocs(docData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async (docType: DocType) => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow access to your photos');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(result.assets[0], docType);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const takePhoto = async (docType: DocType) => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Please allow camera access');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadDocument(result.assets[0], docType);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const uploadDocument = async (asset: any, docType: DocType) => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch the file as blob
      const response = await fetch(asset.uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const fileName = `${user.id}/${docType}_${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, blob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName);

      // Save to database
      await documentService.saveParentDocument(
        user.id,
        docType,
        urlData.publicUrl,
        asset.fileName || `${docType}.jpg`,
        selectedChild || undefined
      );

      Alert.alert('Success', 'Document uploaded successfully!');
      loadData();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to upload document');
    } finally {
      setLoading(false);
    }
  };

  const showUploadOptions = (docType: DocType) => {
    Alert.alert(
      'Upload Document',
      'Choose how to add your document',
      [
        { text: 'Take Photo', onPress: () => takePhoto(docType) },
        { text: 'Choose from Gallery', onPress: () => pickImage(docType) },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const getDocStatus = (docType: DocType) => {
    return uploadedDocs.find(d => d.document_type === docType && d.status !== 'rejected');
  };

  const renderDocumentCard = (doc: typeof documentTypes[0]) => {
    const uploaded = getDocStatus(doc.id as DocType);
    const isPending = uploaded?.status === 'pending';
    const isApproved = uploaded?.status === 'approved';

    return (
      <View key={doc.id} style={[styles.docCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.docHeader}>
          <View style={[styles.docIcon, { backgroundColor: doc.required ? colors.primary + '20' : colors.border }]}>
            <Ionicons name={doc.icon as any} size={28} color={doc.required ? colors.primary : colors.textSecondary} />
          </View>
          <View style={styles.docInfo}>
            <Text style={[styles.docLabel, { color: colors.text }]}>{doc.label}</Text>
            {doc.required && <Text style={[styles.required, { color: colors.danger || '#E91E63' }]}>Required</Text>}
          </View>
          {uploaded ? (
            <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#007749' : isPending ? '#FFB81C' : '#E91E63' }]}>
              <Ionicons name={isApproved ? 'checkmark-circle' : 'time'} size={16} color="#fff" />
              <Text style={styles.statusText}>{isApproved ? 'Verified' : isPending ? 'Pending' : 'Rejected'}</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.primary }]}
              onPress={() => showUploadOptions(doc.id as DocType)}
            >
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.uploadText}>Upload</Text>
            </TouchableOpacity>
          )}
        </View>

        {uploaded && (
          <TouchableOpacity style={styles.previewContainer}>
            <Image source={{ uri: uploaded.file_url }} style={styles.thumbnail} />
            <View style={styles.previewInfo}>
              <Text style={[styles.previewDate, { color: colors.textSecondary }]}>
                Uploaded: {new Date(uploaded.uploaded_at).toLocaleDateString()}
              </Text>
              {uploaded.notes && (
                <Text style={[styles.previewNotes, { color: colors.text }]}>
                  Note: {uploaded.notes}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>📄 My Documents</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Children Selection */}
        {children.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Child (Optional)</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.childScroll}>
              <TouchableOpacity
                style={[
                  styles.childChip,
                  { backgroundColor: !selectedChild ? colors.primary : colors.card, borderColor: colors.border }
                ]}
                onPress={() => setSelectedChild('')}
              >
                <Text style={[styles.childChipText, { color: !selectedChild ? '#fff' : colors.text }]}>All</Text>
              </TouchableOpacity>
              {children.map(child => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.childChip,
                    { backgroundColor: selectedChild === child.id ? colors.primary : colors.card, borderColor: colors.border }
                  ]}
                  onPress={() => setSelectedChild(child.id)}
                >
                  <Text style={[styles.childChipText, { color: selectedChild === child.id ? '#fff' : colors.text }]}>
                    {child.full_name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Document List */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Required Documents</Text>
          {documentTypes.map(renderDocumentCard)}
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: colors.primary + '10', borderColor: colors.primary }]}>
          <Ionicons name="information-circle" size={24} color={colors.primary} />
          <View style={styles.infoContent}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>Why do we need these?</Text>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              These documents are required for:
            </Text>
            <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>• Child safety verification</Text>
            <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>• Government compliance</Text>
            <Text style={[styles.infoBullet, { color: colors.textSecondary }]}>• Emergency contact purposes</Text>
          </View>
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Uploading...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 15 },
  backBtn: { padding: 5 },
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: '#fff', marginLeft: 10 },
  content: { flex: 1, padding: 15 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
  childScroll: { marginBottom: 10 },
  childChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 10, borderWidth: 1 },
  childChipText: { fontSize: 14, fontWeight: '500' },
  docCard: { borderRadius: 12, padding: 15, marginBottom: 12, borderWidth: 1 },
  docHeader: { flexDirection: 'row', alignItems: 'center' },
  docIcon: { width: 50, height: 50, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  docInfo: { flex: 1, marginLeft: 12 },
  docLabel: { fontSize: 16, fontWeight: '600' },
  required: { fontSize: 12, marginTop: 2 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
  uploadText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  previewContainer: { flexDirection: 'row', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#eee' },
  thumbnail: { width: 60, height: 60, borderRadius: 8 },
  previewInfo: { flex: 1, marginLeft: 12 },
  previewDate: { fontSize: 12 },
  previewNotes: { fontSize: 12, marginTop: 4, fontStyle: 'italic' },
  infoBox: { flexDirection: 'row', padding: 15, borderRadius: 12, borderWidth: 1, marginTop: 10 },
  infoContent: { flex: 1, marginLeft: 12 },
  infoTitle: { fontSize: 14, fontWeight: '600', marginBottom: 5 },
  infoText: { fontSize: 12, marginBottom: 5 },
  infoBullet: { fontSize: 12, marginLeft: 5 },
  bottomSpacer: { height: 30 },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  loadingText: { marginTop: 10, fontSize: 16 }
});
