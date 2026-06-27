// Compliance Upload Screen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, TextInput, Image, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { documentService } from '../../lib/api';
import { Spacer } from '../../ui-plugin/components';
import { getTheme, cards } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

const glass = cards.glassAmber;

// ============ RSA VALIDATION UTILITIES ============

export function validateRSAId(idNumber: string): { valid: boolean; error?: string } {
  if (!idNumber || idNumber.length !== 13) {
    return { valid: false, error: 'RSA ID must be exactly 13 digits' };
  }

  if (!/^\d{13}$/.test(idNumber)) {
    return { valid: false, error: 'ID must contain only numbers' };
  }

  const year = parseInt(idNumber.substring(0, 2));
  const month = parseInt(idNumber.substring(2, 4));
  const day = parseInt(idNumber.substring(4, 6));

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, error: 'Invalid date in ID number' };
  }

  let sum = 0;
  let isEven = false;
  for (let i = idNumber.length - 1; i >= 0; i--) {
    let digit = parseInt(idNumber[i]);
    if (isEven) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    isEven = !isEven;
  }

  if (sum % 10 !== 0) {
    return { valid: false, error: 'Invalid ID checksum (Luhn validation failed)' };
  }

  return { valid: true };
}

export function validatePDPNumber(pdpNumber: string): { valid: boolean; error?: string } {
  if (!pdpNumber) {
    return { valid: false, error: 'PDP number is required' };
  }

  const clean = pdpNumber.replace(/\s/g, '').toUpperCase();
  const pdpRegex = /^PDP\d{8}$/;
  if (!pdpRegex.test(clean)) {
    return { valid: false, error: 'PDP must be in format: PDP12345678 (8 digits after PDP)' };
  }

  return { valid: true };
}

export function validateSACellNumber(phone: string): { valid: boolean; error?: string } {
  const clean = phone.replace(/\s/g, '').replace(/^\+27/, '0');
  const saCellRegex = /^0[6-8]\d{8}$/;
  if (!saCellRegex.test(clean)) {
    return { valid: false, error: 'Invalid SA cell number (e.g., 0821234567)' };
  }

  return { valid: true };
}

// ============ FORM SCHEMA ============

const complianceSchema = z.object({
  fullName: z.string().min(2, 'Full name required'),
  idNumber: z.string().refine((val) => validateRSAId(val).valid, {
    message: validateRSAId('').error || 'Invalid ID',
  }),
  phoneNumber: z.string().refine((val) => validateSACellNumber(val).valid, {
    message: validateSACellNumber('').error || 'Invalid phone',
  }),
  email: z.string().email('Valid email required'),
  pdpNumber: z.string().refine((val) => validatePDPNumber(val).valid, {
    message: validatePDPNumber('').error || 'Invalid PDP',
  }),
});

type ComplianceFormData = z.infer<typeof complianceSchema>;

// ============ DOCUMENT TYPES ============

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
  expiryDate?: Date;
}

interface DriverCompliance {
  status: string;
  submittedAt: string;
  documents?: Record<string, unknown>;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

// ============ MAIN COMPONENT ============

export default function ComplianceUploadScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [existingCompliance, setExistingCompliance] = useState<DriverCompliance | null>(null);

  useEffect(() => {
    checkExistingCompliance();
  }, []);

  const checkExistingCompliance = async () => {
    try {
      const stored = await AsyncStorage.getItem('driverCompliance');
      if (stored) {
        setExistingCompliance(JSON.parse(stored));
      }
    } catch (error) { /* silent */ } finally {
      setLoading(false);
    }
  };

  const [documents, setDocuments] = useState<ComplianceDocument[]>([
    { id: 'idCopy', label: 'ID Document', description: 'South African ID or valid passport', required: true },
    { id: 'profilePhoto', label: 'Profile Photo', description: 'Clear selfie for driver profile', required: true },
    { id: 'pdp', label: 'PDP License', description: 'Public Driver Permit (PDP) Certificate - Code 10', required: true },
    { id: 'driversLicense', label: "Driver's License", description: "Valid SA driver's license (front & back)", required: true },
    { id: 'criminalCheck', label: 'Criminal Check', description: 'HURU or MIE safety screening certificate', required: true },
    { id: 'roadworthy', label: 'Roadworthy Certificate', description: 'Vehicle roadworthy certification (A30)', required: true },
    { id: 'vehicleRegistration', label: 'Vehicle Registration', description: 'Vehicle license disk / registration papers', required: true },
    { id: 'insurance', label: 'Vehicle Insurance', description: 'Comprehensive insurance with rideshare cover', required: true },
    { id: 'operatingLicense', label: 'Operating License', description: 'National Land Transport Act permit', required: true },
    { id: 'proofOfAddress', label: 'Proof of Address', description: 'Utility bill or bank statement (recent)', required: false },
  ]);

  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [tempDocId, setTempDocId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState<'pending' | 'partial' | 'complete'>('pending');

  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ComplianceFormData>({
    defaultValues: { fullName: '', idNumber: '', phoneNumber: '', email: '', pdpNumber: '' },
    mode: 'onBlur',
  });

  const handleDateConfirm = () => {
    if (tempDocId) {
      const newDate = new Date(selectedYear, selectedMonth, selectedDay);
      setDocuments((prev) => prev.map((doc) => doc.id === tempDocId ? { ...doc, expiryDate: newDate } : doc));
      updateComplianceStatus();
    }
    setShowDatePicker(null);
    setTempDocId(null);
  };

  const openDatePicker = (docId: string) => {
    setTempDocId(docId);
    const doc = documents.find(d => d.id === docId);
    if (doc?.expiryDate) {
      setSelectedYear(doc.expiryDate.getFullYear());
      setSelectedMonth(doc.expiryDate.getMonth());
      setSelectedDay(doc.expiryDate.getDate());
    } else {
      setSelectedYear(new Date().getFullYear() + 1);
      setSelectedMonth(0);
      setSelectedDay(1);
    }
    setShowDatePicker(docId);
  };

  const formatDate = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleDateString('en-ZA', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const getDaysUntilExpiry = (date?: Date) => {
    if (!date) return null;
    const today = new Date();
    return Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatusColor = (date?: Date) => {
    const days = getDaysUntilExpiry(date);
    if (days === null) return C.textMuted;
    if (days < 0) return C.error;
    if (days <= 30) return C.accent;
    return C.success;
  };

  const pickDocument = async (docId: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        setDocuments((prev) => prev.map((doc) =>
          doc.id === docId
            ? { ...doc, document: { uri: asset.uri, name: asset.name, type: asset.mimeType || 'application/octet-stream', uploadedAt: new Date() } }
            : doc
        ));
        updateComplianceStatus();
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
      setDocuments((prev) => prev.map((doc) =>
        doc.id === docId
          ? { ...doc, document: { uri: asset.uri, name: `${docId}_${Date.now()}.jpg`, type: 'image/jpeg', uploadedAt: new Date() } }
          : doc
      ));
      updateComplianceStatus();
    }
  };

  const showDocumentOptions = (docId: string) => {
    Alert.alert('Add Document', 'Choose how to add the document', [
      { text: 'Take Photo', onPress: () => takePhoto(docId) },
      { text: 'Choose from Files', onPress: () => pickDocument(docId) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const updateComplianceStatus = () => {
    const requiredDocs = documents.filter((d) => d.required);
    const uploadedRequired = requiredDocs.filter((d) => d.document).length;
    if (uploadedRequired === requiredDocs.length && requiredDocs.length > 0) {
      setComplianceStatus('complete');
    } else if (uploadedRequired > 0) {
      setComplianceStatus('partial');
    } else {
      setComplianceStatus('pending');
    }
  };

  const removeDocument = (docId: string) => {
    Alert.alert('Remove Document', 'Are you sure you want to remove this document?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => {
        setDocuments((prev) => prev.map((doc) => doc.id === docId ? { ...doc, document: undefined } : doc));
        updateComplianceStatus();
      }},
    ]);
  };

  const onSubmit = async (data: ComplianceFormData) => {
    const missingDocs = documents.filter((d) => d.required && !d.document).map((d) => d.label);
    if (missingDocs.length > 0) {
      Alert.alert('Missing Documents', `Please upload: ${missingDocs.join(', ')}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'Please login to submit compliance');
        setIsSubmitting(false);
        return;
      }

      const uploadedDocs: { id: string; label: string; name: string; uploadedAt: Date }[] = [];
      const failedDocs: string[] = [];

      for (const doc of documents) {
        if (doc.document) {
          try {
            const fileName = `driver/${user.id}/${doc.id}_${Date.now()}`;
            const { error: uploadError } = await supabase.storage
              .from('documents')
              .upload(fileName, {
                uri: doc.document.uri,
                name: doc.document.name,
                type: doc.document.type,
              } as unknown as string);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName);

            const docTypeMap: Record<string, string> = {
              'pdp': 'pdp_certificate',
              'roadworthy': 'roadworthy',
              'driversLicense': 'drivers_license',
              'insurance': 'insurance',
              'vehiclePermit': 'permit',
            };

            await documentService.saveDriverDocument(
              user.id,
              docTypeMap[doc.id] || 'pdp_certificate',
              publicUrl,
              doc.document.name,
              doc.expiryDate?.toISOString(),
            );

            uploadedDocs.push({ id: doc.id, label: doc.label, name: doc.document.name, uploadedAt: doc.document.uploadedAt });
          } catch (uploadError) {
            failedDocs.push(doc.label);
          }
        }
      }

      if (failedDocs.length > 0) {
        Alert.alert('Partial Upload', `Some documents failed to upload: ${failedDocs.join(', ')}. Please try uploading these again.`);
        setIsSubmitting(false);
        return;
      }

      await AsyncStorage.setItem('driverCompliance', JSON.stringify({
        ...data,
        documents: uploadedDocs,
        submittedAt: new Date().toISOString(),
        status: 'pending_review',
      }));

      Alert.alert('Success!', 'Your compliance documents have been submitted for review. This typically takes 1-2 business days.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to submit compliance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', onPress: async () => {
        await supabase.auth.signOut();
        await AsyncStorage.multiRemove(['driverCompliance', 'userRole', 'userName', 'userEmail']);
      }},
    ]);
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const uploadedCount = documents.filter((d) => d.document).length;
  const requiredCount = documents.filter((d) => d.required).length;
  const progressPct = requiredCount > 0 ? (uploadedCount / documents.length) * 100 : 0;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: C.background },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.text, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.accent, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    backBtn: { width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)' },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { fontFamily: 'Syne_700Bold', fontSize: 14, color: C.textMuted, marginTop: 10 },
    progressCard: { ...glass, marginHorizontal: 16, marginTop: 16, padding: 20, marginBottom: 8 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    progressBar: { height: 8, backgroundColor: C.border, borderRadius: 4, overflow: 'hidden' },
    progressFill: { height: '100%', backgroundColor: complianceStatus === 'complete' ? C.success : complianceStatus === 'partial' ? C.accent : C.textMuted, borderRadius: 4 },
    progressText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted, marginTop: 8, textAlign: 'center' },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    sectionRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    sectionIcon: { marginRight: 8 },
    inputGroup: { marginBottom: 16 },
    label: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.textSecondary, marginBottom: 6, letterSpacing: 0.3 },
    labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
    input: { backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: C.border, borderRadius: 12, padding: 14, fontFamily: 'Syne_700Bold', fontSize: 14, color: C.text },
    inputError: { borderColor: C.error, backgroundColor: 'rgba(255,61,90,.08)' },
    errorText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.error, marginTop: 4 },
    helperText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 4 },
    docCard: { ...glass, padding: 16, marginBottom: 12 },
    docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    docInfo: { flex: 1 },
    docLabel: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: C.text },
    docRequired: { color: C.error },
    docDesc: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 },
    uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,230,118,.1)', borderRadius: 12, padding: 14, marginTop: 12, borderWidth: 1, borderColor: `${C.success}40` },
    uploadBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: C.success, marginLeft: 8 },
    uploadedPreview: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: 'rgba(255,255,255,.03)', borderRadius: 10, padding: 8 },
    previewImage: { width: 50, height: 50, borderRadius: 8, backgroundColor: C.border },
    previewInfo: { flex: 1, marginLeft: 10 },
    previewName: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '600', color: C.text },
    previewDate: { fontFamily: 'Syne_700Bold', fontSize: 10, color: C.textMuted, marginTop: 2 },
    removeBtn: { padding: 8 },
    expiryContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
    expiryLabel: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textSecondary, marginBottom: 6 },
    expiryBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,.03)', borderRadius: 10, padding: 10, borderWidth: 1 },
    expiryBtnText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textSecondary, marginLeft: 8 },
    expiryStatus: { marginTop: 4 },
    expiryStatusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '600' },
    disclaimer: { flexDirection: 'row', padding: 16, marginHorizontal: 16, marginBottom: 16, backgroundColor: 'rgba(255,183,0,.06)', borderRadius: 12, borderLeftWidth: 3, borderLeftColor: C.accent },
    disclaimerText: { flex: 1, marginLeft: 10, fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, lineHeight: 18 },
    submitBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: C.accent, marginHorizontal: 16, padding: 16, borderRadius: 14, marginBottom: 8 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.background, marginLeft: 8 },
    bottomPadding: { height: 50 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,.7)', justifyContent: 'center', alignItems: 'center' },
    modalContent: { backgroundColor: C.surface, borderRadius: 20, padding: 24, width: '85%', maxHeight: '60%', borderWidth: 1, borderColor: C.border },
    modalTitle: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.text, textAlign: 'center', marginBottom: 20 },
    pickerRow: { flexDirection: 'row', justifyContent: 'space-between', height: 200 },
    pickerColumn: { flex: 1, marginHorizontal: 4 },
    pickerLabel: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, textAlign: 'center', marginBottom: 8 },
    pickerScroll: { height: 160 },
    pickerItem: { paddingVertical: 8, paddingHorizontal: 8, alignItems: 'center', borderRadius: 8 },
    pickerItemSelected: { backgroundColor: C.accent },
    pickerItemText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textSecondary },
    pickerItemTextSelected: { color: C.background, fontWeight: '600' },
    modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 },
    modalCancel: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.06)', marginRight: 8, alignItems: 'center' },
    modalCancelText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: C.textMuted },
    modalConfirm: { flex: 1, padding: 12, borderRadius: 12, backgroundColor: C.accent, marginLeft: 8, alignItems: 'center' },
    modalConfirmText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.background },
    successCard: { ...glass, margin: 16, padding: 32, alignItems: 'center', marginTop: 40 },
    successTitle: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 8 },
    successText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', lineHeight: 20 },
    submittedDate: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 8 },
    viewDocsBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', backgroundColor: C.accent, marginHorizontal: 16, padding: 16, borderRadius: 14, marginTop: 20 },
    viewDocsBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.background, marginLeft: 8 },
  });

  // ── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}><Text style={s.ltTitle}>Driver Compliance</Text></View></View>
        <View style={s.loadingWrap}><ActivityIndicator size="large" color={C.accent} /><Text style={s.loadingText}>Loading compliance status...</Text></View>
      </View>
    );
  }

  // ── Already Submitted State ─────────────────────────────────────────────────
  if (existingCompliance && existingCompliance.status === 'pending_review') {
    return (
      <View style={s.container}>
        <View style={s.statusBar}><Text style={s.sbTime}>{timeStr}</Text><View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View></View>
        <View style={s.ltHeader}><View style={s.ltHeaderBg} /><View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>
          <Text style={s.ltTitle}>Driver Compliance</Text>
          <View style={{ width: 36 }} />
        </View><Text style={s.ltSub}>Submitted for review</Text></View>
        <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
          <View style={s.successCard}>
            <View style={s.cardTopRefraction} />
            <Ionicons name="checkmark-circle" size={80} color={C.success} />
            <Text style={s.successTitle}>Submitted Successfully!</Text>
            <Text style={s.successText}>Your compliance documents have been submitted for review. This typically takes 1-2 business days.</Text>
            <Text style={s.submittedDate}>Submitted: {new Date(existingCompliance.submittedAt).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity style={s.viewDocsBtn} onPress={() => Alert.alert('View Documents', 'This would open the submitted documents.')}>
            <Ionicons name="document-text" size={20} color={C.background} />
            <Text style={s.viewDocsBtnText}>View Submitted Documents</Text>
          </TouchableOpacity>
          <Spacer size="xl" />
        </ScrollView>
      </View>
    );
  }

  // ── Main Form ───────────────────────────────────────────────────────────────
  return (
    <View style={s.container}>
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
      </View>

      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <TouchableOpacity style={s.backBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={18} color={C.text} />
          </TouchableOpacity>
          <View><Text style={s.ltTitle}>Driver Compliance</Text><Text style={s.ltSub}>Complete all required documents</Text></View>
          <TouchableOpacity onPress={handleLogout} style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: 'rgba(255,61,90,.15)', justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="log-out-outline" size={18} color={C.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(false)} tintColor={C.accent} colors={[C.accent]} />}
      >
        {/* Progress Indicator */}
        <View style={s.progressCard}>
          <View style={s.cardTopRefraction} />
          <View style={s.progressBar}>
            <View style={[s.progressFill, { width: `${progressPct}%` }]} />
          </View>
          <Text style={s.progressText}>
            {complianceStatus === 'complete' ? <><Ionicons name="checkmark-circle" size={14} color={C.success} /> All documents uploaded</> : complianceStatus === 'partial' ? <><Ionicons name="document-text" size={14} color={C.accent} /> Partially complete</> : <><Ionicons name="arrow-up" size={14} color={C.textMuted} /> Start uploading documents</>}
          </Text>
        </View>

        {/* Personal Information */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Ionicons name="person" size={18} color={C.accent} style={s.sectionIcon} />
            <Text style={s.sectionTitle}>Personal Information</Text>
          </View>

          {/* Full Name */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Full Name (as on ID)</Text>
            <Controller
              control={control} name="fullName"
              rules={{ required: 'Full name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[s.input, errors.fullName && s.inputError]}
                  placeholder="e.g., John Sipho Moyo"
                  placeholderTextColor={C.textMuted}
                  onBlur={onBlur} onChangeText={onChange} value={value}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.fullName && <Text style={s.errorText}>{errors.fullName.message}</Text>}
          </View>

          {/* RSA ID */}
          <View style={s.inputGroup}>
            <Text style={s.label}>RSA ID Number (13 digits)</Text>
            <Controller
              control={control} name="idNumber"
              rules={{ validate: (value) => { const r = validateRSAId(value); return r.valid || r.error; } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[s.input, errors.idNumber && s.inputError]}
                  placeholder="e.g., 8501011234567"
                  placeholderTextColor={C.textMuted}
                  onBlur={onBlur} onChangeText={onChange} value={value}
                  keyboardType="numeric" maxLength={13}
                />
              )}
            />
            {errors.idNumber && <Text style={s.errorText}>{errors.idNumber.message}</Text>}
            <Text style={s.helperText}>Enter your 13-digit South African ID number</Text>
          </View>

          {/* Cell Number */}
          <View style={s.inputGroup}>
            <View style={s.labelRow}>
              <Ionicons name="call" size={14} color={C.textMuted} />
              <Text style={s.label}> Cell Number</Text>
            </View>
            <Controller
              control={control} name="phoneNumber"
              rules={{ validate: (value) => { const r = validateSACellNumber(value); return r.valid || r.error; } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[s.input, errors.phoneNumber && s.inputError]}
                  placeholder="e.g., 0821234567"
                  placeholderTextColor={C.textMuted}
                  onBlur={onBlur} onChangeText={onChange} value={value}
                  keyboardType="phone-pad" maxLength={10}
                />
              )}
            />
            {errors.phoneNumber && <Text style={s.errorText}>{errors.phoneNumber.message}</Text>}
          </View>

          {/* Email */}
          <View style={s.inputGroup}>
            <Text style={s.label}>Email Address</Text>
            <Controller
              control={control} name="email"
              rules={{ required: 'Email is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[s.input, errors.email && s.inputError]}
                  placeholder="e.g., john@example.com"
                  placeholderTextColor={C.textMuted}
                  onBlur={onBlur} onChangeText={onChange} value={value}
                  keyboardType="email-address" autoCapitalize="none"
                />
              )}
            />
            {errors.email && <Text style={s.errorText}>{errors.email.message}</Text>}
          </View>
        </View>

        {/* PDP License */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Ionicons name="bus" size={18} color={C.accent} style={s.sectionIcon} />
            <Text style={s.sectionTitle}>PDP License</Text>
          </View>
          <View style={s.inputGroup}>
            <Text style={s.label}>PDP Number</Text>
            <Controller
              control={control} name="pdpNumber"
              rules={{ validate: (value) => { const r = validatePDPNumber(value); return r.valid || r.error; } }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[s.input, errors.pdpNumber && s.inputError]}
                  placeholder="e.g., PDP12345678"
                  placeholderTextColor={C.textMuted}
                  onBlur={onBlur} onChangeText={(text) => onChange(text.toUpperCase())} value={value}
                  autoCapitalize="characters" maxLength={11}
                />
              )}
            />
            {errors.pdpNumber && <Text style={s.errorText}>{errors.pdpNumber.message}</Text>}
            <Text style={s.helperText}>Public Driver Permit - 11 characters (PDP + 8 digits)</Text>
          </View>
        </View>

        {/* Documents */}
        <View style={s.section}>
          <View style={s.sectionRow}>
            <Ionicons name="document" size={18} color={C.accent} style={s.sectionIcon} />
            <Text style={s.sectionTitle}>Required Documents</Text>
          </View>
          <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: -8, marginBottom: 16 }}>Upload clear photos or PDFs of each document</Text>

          {documents.map((doc) => {
            const expiryColor = getExpiryStatusColor(doc.expiryDate);
            return (
              <View key={doc.id} style={s.docCard}>
                <View style={s.cardTopRefraction} />
                <View style={s.docHeader}>
                  <View style={s.docInfo}>
                    <Text style={s.docLabel}>{doc.label}{doc.required && <Text style={s.docRequired}> *</Text>}</Text>
                    <Text style={s.docDesc}>{doc.description}</Text>
                  </View>
                  {doc.document
                    ? <Ionicons name="checkmark-circle" size={24} color={C.success} />
                    : <Ionicons name="time-outline" size={20} color={C.accent} />
                  }
                </View>

                {doc.document ? (
                  <View style={s.uploadedPreview}>
                    <Image source={{ uri: doc.document.uri }} style={s.previewImage} resizeMode="cover" />
                    <View style={s.previewInfo}>
                      <Text style={s.previewName} numberOfLines={1}>{doc.document.name}</Text>
                      <Text style={s.previewDate}>Uploaded {doc.document.uploadedAt.toLocaleDateString()}</Text>
                    </View>
                    <TouchableOpacity style={s.removeBtn} onPress={() => removeDocument(doc.id)}>
                      <Ionicons name="trash-outline" size={18} color={C.error} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={s.uploadBtn} onPress={() => showDocumentOptions(doc.id)}>
                    <Ionicons name="cloud-upload-outline" size={20} color={C.success} />
                    <Text style={s.uploadBtnText}>Take Photo or Choose File</Text>
                  </TouchableOpacity>
                )}

                {/* Expiry Date */}
                <View style={s.expiryContainer}>
                  <Text style={s.expiryLabel}>Expiry Date:</Text>
                  <TouchableOpacity style={[s.expiryBtn, { borderColor: expiryColor }]} onPress={() => openDatePicker(doc.id)}>
                    <Ionicons name="calendar-outline" size={16} color={expiryColor} />
                    <Text style={[s.expiryBtnText, { color: expiryColor }]}>
                      {formatDate(doc.expiryDate) || 'Select expiry date'}
                    </Text>
                  </TouchableOpacity>
                  {doc.expiryDate && (
                    <View style={s.expiryStatus}>
                      <Text style={[s.expiryStatusText, { color: expiryColor }]}>
                        {getDaysUntilExpiry(doc.expiryDate)! < 0
                          ? 'EXPIRED'
                          : `${getDaysUntilExpiry(doc.expiryDate)} days remaining`}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Date Picker Modal */}
                <Modal visible={showDatePicker === doc.id} transparent animationType="slide" onRequestClose={() => setShowDatePicker(null)}>
                  <View style={s.modalOverlay}>
                    <View style={s.modalContent}>
                      <Text style={s.modalTitle}>Select Expiry Date</Text>
                      <View style={s.pickerRow}>
                        <View style={s.pickerColumn}>
                          <Text style={s.pickerLabel}>Day</Text>
                          <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false}>
                            {days.map((day) => (
                              <TouchableOpacity key={day}
                                style={[s.pickerItem, selectedDay === day && s.pickerItemSelected]}
                                onPress={() => setSelectedDay(day)}
                              >
                                <Text style={[s.pickerItemText, selectedDay === day && s.pickerItemTextSelected]}>{day}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                        <View style={s.pickerColumn}>
                          <Text style={s.pickerLabel}>Month</Text>
                          <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false}>
                            {months.map((month, idx) => (
                              <TouchableOpacity key={month}
                                style={[s.pickerItem, selectedMonth === idx && s.pickerItemSelected]}
                                onPress={() => setSelectedMonth(idx)}
                              >
                                <Text style={[s.pickerItemText, selectedMonth === idx && s.pickerItemTextSelected]}>{month}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                        <View style={s.pickerColumn}>
                          <Text style={s.pickerLabel}>Year</Text>
                          <ScrollView style={s.pickerScroll} showsVerticalScrollIndicator={false}>
                            {years.map((year) => (
                              <TouchableOpacity key={year}
                                style={[s.pickerItem, selectedYear === year && s.pickerItemSelected]}
                                onPress={() => setSelectedYear(year)}
                              >
                                <Text style={[s.pickerItemText, selectedYear === year && s.pickerItemTextSelected]}>{year}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      </View>
                      <View style={s.modalButtons}>
                        <TouchableOpacity style={s.modalCancel} onPress={() => setShowDatePicker(null)}>
                          <Text style={s.modalCancelText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={s.modalConfirm} onPress={handleDateConfirm}>
                          <Text style={s.modalConfirmText}>Confirm</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </Modal>
              </View>
            );
          })}
        </View>

        {/* Legal Disclaimer */}
        <View style={s.disclaimer}>
          <Ionicons name="shield-checkmark-outline" size={18} color={C.accent} />
          <Text style={s.disclaimerText}>
            By submitting, I confirm all documents are authentic and valid. I understand that providing false information is a criminal offence under South African law.
          </Text>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[s.submitBtn, isSubmitting && s.submitBtnDisabled]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          activeOpacity={0.8}
        >
          {isSubmitting
            ? <ActivityIndicator color={C.background} />
            : <><Ionicons name="send" size={18} color={C.background} /><Text style={s.submitBtnText}>Submit for Review</Text></>
          }
        </TouchableOpacity>

        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
}