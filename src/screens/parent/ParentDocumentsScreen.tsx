import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

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
  const [children, setChildren] = useState<any[]>([]);
  const [selectedChild, setSelectedChild] = useState<string>('');
  const [uploadedDocs, setUploadedDocs] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: childData } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', user.id);
      setChildren(childData || []);

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
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo access to upload documents.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled) {
      Alert.alert('Upload', `Document uploaded: ${docType}`);
    }
  };

  const uploadedCount = uploadedDocs.length;
  const requiredCount = documentTypes.filter(d => d.required).length;

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    progressCard: { backgroundColor: colors.card, margin: spacing.lg, padding: spacing.lg, borderRadius: borderRadius.lg, elevation: 3 },
    progressBar: { height: 8, backgroundColor: colors.border, borderRadius: 4, marginTop: spacing.sm },
    progressFill: { height: 8, borderRadius: 4 },
    progressText: { ...typography.labelSmall, color: colors.textSecondary, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    docCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    docIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    docInfo: { flex: 1, marginLeft: spacing.md },
    docLabel: { ...typography.label, color: colors.text },
    docStatus: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    emptyText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
  });

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Documents</Text>
        <Text style={styles(colors).headerSub}>Upload required documents</Text>
      </View>

      {/* Progress */}
      <Card variant="elevated" padding="large">
        <View style={styles(colors).progressCard}>
          <Text style={styles(colors).sectionTitle}>Upload Progress</Text>
          <View style={styles(colors).progressBar}>
            <View style={[styles(colors).progressFill, { width: `${(uploadedCount / requiredCount) * 100}%`, backgroundColor: colors.success }]} />
          </View>
          <Text style={styles(colors).progressText}>{uploadedCount} of {requiredCount} required documents</Text>
        </View>
      </Card>

      {/* Documents List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Required Documents</Text>
        {documentTypes.map((doc) => {
          const isUploaded = uploadedDocs.some(d => d.document_type === doc.id);
          return (
            <TouchableOpacity key={doc.id} onPress={() => pickImage(doc.id as DocType)}>
              <Card variant={isUploaded ? 'elevated' : 'outlined'} padding="medium">
                <View style={styles(colors).docCard}>
                  <View style={[styles(colors).docIcon, { backgroundColor: isUploaded ? colors.success + '20' : colors.textSecondary + '20' }]}>
                    <Ionicons name={doc.icon as any} size={24} color={isUploaded ? colors.success : colors.textSecondary} />
                  </View>
                  <View style={styles(colors).docInfo}>
                    <Text style={styles(colors).docLabel}>{doc.label}</Text>
                    <Text style={styles(colors).docStatus}>
                      {isUploaded ? 'Uploaded' : doc.required ? 'Required' : 'Optional'}
                    </Text>
                  </View>
                  {isUploaded ? (
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  ) : (
                    <Ionicons name="cloud-upload" size={24} color={colors.textSecondary} />
                  )}
                </View>
              </Card>
            </TouchableOpacity>
          );
        })}
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}