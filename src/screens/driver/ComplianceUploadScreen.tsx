import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, Alert, ActivityIndicator, TextInput, Image, Platform, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, ThemeColors } from '../../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { documentService } from '../../lib/api';

// UI Plugin components
import { Card, Button, Spacer, Avatar, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

// ============ RSA VALIDATION UTILITIES ============

// Validate RSA ID number (13 digits with Luhn checksum)
export function validateRSAId(idNumber: string): { valid: boolean; error?: string } {
  if (!idNumber || idNumber.length !== 13) {
    return { valid: false, error: 'RSA ID must be exactly 13 digits' };
  }
  
  if (!/^\d{13}$/.test(idNumber)) {
    return { valid: false, error: 'ID must contain only numbers' };
  }
  
  // Extract date part (first 6 digits)
  const year = parseInt(idNumber.substring(0, 2));
  const month = parseInt(idNumber.substring(2, 4));
  const day = parseInt(idNumber.substring(4, 6));
  
  // Validate date
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, error: 'Invalid date in ID number' };
  }
  
  // Luhn checksum validation
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

// Validate PDP number (RSA format: PDP + 8 digits)
export function validatePDPNumber(pdpNumber: string): { valid: boolean; error?: string } {
  if (!pdpNumber) {
    return { valid: false, error: 'PDP number is required' };
  }
  
  // Remove spaces and convert to uppercase
  const clean = pdpNumber.replace(/\s/g, '').toUpperCase();
  
  // PDP format: PDP + 8 digits
  const pdpRegex = /^PDP\d{8}$/;
  if (!pdpRegex.test(clean)) {
    return { valid: false, error: 'PDP must be in format: PDP12345678 (8 digits after PDP)' };
  }
  
  return { valid: true };
}

// Validate South African cell number
export function validateSACellNumber(phone: string): { valid: boolean; error?: string } {
  const clean = phone.replace(/\s/g, '').replace(/^\+27/, '0');
  
  // Must be 10 digits starting with 0, or 9 digits starting with 7
  const saCellRegex = /^0[6-8]\d{8}$/;
  if (!saCellRegex.test(clean)) {
    return { valid: false, error: 'Invalid SA cell number (e.g., 0821234567)' };
  }
  
  return { valid: true };
}

// ============ FORM SCHEMA ============

const complianceSchema = z.object({
  // Personal Info
  fullName: z.string().min(2, 'Full name required'),
  idNumber: z.string().refine((val) => validateRSAId(val).valid, {
    message: validateRSAId('').error || 'Invalid ID',
  }),
  phoneNumber: z.string().refine((val) => validateSACellNumber(val).valid, {
    message: validateSACellNumber('').error || 'Invalid phone',
  }),
  email: z.string().email('Valid email required'),
  
  // PDP License
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

// ============ MAIN COMPONENT ============

interface DriverCompliance {
  status: string;
  submittedAt: string;
  documents?: Record<string, unknown>;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function ComplianceUploadScreen({ navigation }: Props) {
  const { colors } = useTheme();
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
    } catch (error) {
      console.error('Error checking compliance:', error);
    } finally {
      setLoading(false);
    }
  };

  const [documents, setDocuments] = useState<ComplianceDocument[]>([
    {
      id: 'idCopy',
      label: 'ID Document',
      description: 'South African ID or valid passport',
      required: true,
    },
    {
      id: 'profilePhoto',
      label: 'Profile Photo',
      description: 'Clear selfie for driver profile',
      required: true,
    },
    {
      id: 'pdp',
      label: 'PDP License',
      description: 'Public Driver Permit (PDP) Certificate - Code 10',
      required: true,
    },
    {
      id: 'driversLicense',
      label: "Driver's License",
      description: "Valid SA driver's license (front & back)",
      required: true,
    },
    {
      id: 'criminalCheck',
      label: 'Criminal Check',
      description: 'HURU or MIE safety screening certificate',
      required: true,
    },
    {
      id: 'roadworthy',
      label: 'Roadworthy Certificate',
      description: 'Vehicle roadworthy certification (A30)',
      required: true,
    },
    {
      id: 'vehicleRegistration',
      label: 'Vehicle Registration',
      description: 'Vehicle license disk / registration papers',
      required: true,
    },
    {
      id: 'insurance',
      label: 'Vehicle Insurance',
      description: 'Comprehensive insurance with rideshare cover',
      required: true,
    },
    {
      id: 'operatingLicense',
      label: 'Operating License',
      description: 'National Land Transport Act permit',
      required: true,
    },
    {
      id: 'proofOfAddress',
      label: 'Proof of Address',
      description: 'Utility bill or bank statement (recent)',
      required: false,
    },
  ]);

  // Date picker state
  const [showDatePicker, setShowDatePicker] = useState<string | null>(null);
  const [tempDocId, setTempDocId] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  // Simple date picker using Modal
  const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  // Handle date selection
  const handleDateConfirm = () => {
    if (tempDocId) {
      const newDate = new Date(selectedYear, selectedMonth, selectedDay);
      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === tempDocId ? { ...doc, expiryDate: newDate } : doc
        )
      );
      updateComplianceStatus();
    }
    setShowDatePicker(null);
    setTempDocId(null);
  };

  // Open date picker for a document
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

  // Format date for display
  const formatDate = (date?: Date) => {
    if (!date) return null;
    return date.toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  // Calculate days until expiry
  const getDaysUntilExpiry = (date?: Date) => {
    if (!date) return null;
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Get expiry status color
  const getExpiryStatusColor = (date?: Date) => {
    const days = getDaysUntilExpiry(date);
    if (days === null) return colors.textMuted;
    if (days < 0) return colors.error; // Red - expired
    if (days <= 30) return colors.warning; // Yellow - expiring soon
    return colors.success; // Green - valid
  };

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [complianceStatus, setComplianceStatus] = useState<'pending' | 'partial' | 'complete'>('pending');

  const {
    control,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ComplianceFormData>({
    defaultValues: {
      fullName: '',
      idNumber: '',
      phoneNumber: '',
      email: '',
      pdpNumber: '',
    },
    mode: 'onBlur',
  });

  // ============ PICK DOCUMENT ============

  const pickDocument = async (docId: string) => {
    try {
      // For testing without actual file picker - create a dummy document
      const isTestMode = false; // Set to false for production

      if (isTestMode) {
        // Create a test document for demo purposes
        const testDoc = {
          uri: 'https://via.placeholder.com/300x400.png?text=Test+Document',
          name: `test_${docId}_${Date.now()}.jpg`,
          type: 'image/jpeg',
          uploadedAt: new Date(),
        };

        setDocuments((prev) =>
          prev.map((doc) =>
            doc.id === docId ? { ...doc, document: testDoc } : doc
          )
        );
        updateComplianceStatus();
        Alert.alert('Test Mode', 'Test document added. In production, this would open file picker.');
        return;
      }

      // Actual document picker (works on mobile)
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];

        setDocuments((prev) =>
          prev.map((doc) =>
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

        updateComplianceStatus();
      }
    } catch (error) {
      console.error('Document pick error:', error);
      Alert.alert('Error', 'Failed to pick document. Please try again.');
    }
  };

  // ============ TAKE PHOTO ============

  const takePhoto = async (docId: string) => {
    // Test mode - use placeholder
    const isTestMode = false;

    if (isTestMode) {
      const testDoc = {
        uri: 'https://via.placeholder.com/300x400.png?text=Test+Photo',
        name: `test_photo_${docId}_${Date.now()}.jpg`,
        type: 'image/jpeg',
        uploadedAt: new Date(),
      };

      setDocuments((prev) =>
        prev.map((doc) =>
          doc.id === docId ? { ...doc, document: testDoc } : doc
        )
      );
      updateComplianceStatus();
      Alert.alert('Test Mode', 'Test photo added. In production, this would open camera.');
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Camera access is needed to take photos of documents.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      setDocuments((prev) =>
        prev.map((doc) =>
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
      
      updateComplianceStatus();
    }
  };

  // ============ SHOW DOCUMENT OPTIONS ============

  const showDocumentOptions = (docId: string) => {

    Alert.alert(
      'Add Document',
      'Choose how to add the document',
      [
        {
          text: 'Take Photo',
          onPress: () => {

            takePhoto(docId);
          },
        },
        {
          text: 'Choose from Files',
          onPress: () => {

            pickDocument(docId);
          },
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  // ============ UPDATE COMPLIANCE STATUS ============

  const updateComplianceStatus = () => {
    const uploadedCount = documents.filter((d) => d.document).length;
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

  // ============ REMOVE DOCUMENT ============

  const removeDocument = (docId: string) => {
    Alert.alert(
      'Remove Document',
      'Are you sure you want to remove this document?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setDocuments((prev) =>
              prev.map((doc) =>
                doc.id === docId ? { ...doc, document: undefined } : doc
              )
            );
            updateComplianceStatus();
          },
        },
      ]
    );
  };

  // ============ SUBMIT ============

  const onSubmit = async (data: ComplianceFormData) => {
    // Validate all required documents are uploaded
    const missingDocs = documents
      .filter((d) => d.required && !d.document)
      .map((d) => d.label);

    if (missingDocs.length > 0) {
      Alert.alert(
        'Missing Documents',
        `Please upload: ${missingDocs.join(', ')}`
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Please login to submit compliance');
        setIsSubmitting(false);
        return;
      }

      // DEBUG: submit removed
      //   ...data,
      //   documents: documents.map((d) => ({
      //     id: d.id,
      //     name: d.document?.name,
      //     type: d.document?.type,
      //   })),
      // });

      // Upload each document to Supabase Storage and save record
      const uploadedDocs: { id: string; label: string; name: string; uploadedAt: Date }[] = [];
      const failedDocs: string[] = [];

      for (const doc of documents) {
        if (doc.document) {
          try {
            // Upload to Supabase Storage
            const fileName = `driver/${user.id}/${doc.id}_${Date.now()}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
              .from('documents')
              .upload(fileName, doc.document as any);

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: { publicUrl } } = supabase.storage
              .from('documents')
              .getPublicUrl(fileName);

            // Map doc.id to document_type
            const docTypeMap: Record<string, any> = {
              'pdp': 'pdp_certificate',
              'roadworthy': 'roadworthy',
              'driversLicense': 'drivers_license',
              'insurance': 'insurance',
              'vehiclePermit': 'permit'
            };

            // Save to database with expiry date
            await documentService.saveDriverDocument(
              user.id,
              docTypeMap[doc.id] || 'pdp_certificate',
              publicUrl,
              doc.document.name,
              doc.expiryDate?.toISOString()
            );

            uploadedDocs.push({
              id: doc.id,
              label: doc.label,
              name: doc.document.name,
              uploadedAt: doc.document.uploadedAt,
            });
          } catch (uploadError) {
            failedDocs.push(doc.label);
          }
        }
      }

      // Check if any uploads failed
      if (failedDocs.length > 0) {
        Alert.alert(
          'Partial Upload',
          `Some documents failed to upload: ${failedDocs.join(', ')}. Please try uploading these again.`,
          [{ text: 'OK' }]
        );
        setIsSubmitting(false);
        return;
      }

      // Save compliance status to AsyncStorage only if all uploads succeeded
      await AsyncStorage.setItem('driverCompliance', JSON.stringify({
        ...data,
        documents: uploadedDocs,
        submittedAt: new Date().toISOString(),
        status: 'pending_review',
      }));

      Alert.alert(
        'Success!',
        'Your compliance documents have been submitted for review. This typically takes 1-2 business days.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to submit compliance. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============ LOGOUT ============

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          onPress: async () => {
            (window as any).logout();
          },
        },
      ],
    );
  };

  // ============ RENDER ============

  if (loading) {
    return (
      <View style={[styles(colors).container, styles(colors).loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
        <Text style={styles(colors).loadingText}>Loading compliance status...</Text>
      </View>
    );
  }

  // Show existing compliance status if already submitted
  if (existingCompliance && existingCompliance.status === 'pending_review') {
    return (
      <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
        <View style={[styles(colors).header, { backgroundColor: colors.primary }]}>
          <Text style={styles(colors).headerTitle}>Driver Compliance</Text>
          <Text style={styles(colors).headerSubtitle}>Submitted for review</Text>
        </View>
        <View style={styles(colors).section}>
          <View style={[styles(colors).successCard, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={80} color={colors.success} />
            <Text style={[styles(colors).successTitle, { color: colors.text }]}>Submitted Successfully!</Text>
            <Text style={[styles(colors).successText, { color: colors.textSecondary }]}>
              Your compliance documents have been submitted for review. This typically takes 1-2 business days.
            </Text>
            <Text style={[styles(colors).submittedDate, { color: colors.textSecondary }]}>
              Submitted: {new Date(existingCompliance.submittedAt).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles(colors).submitButton}
            onPress={() => {
              Alert.alert('View Documents', 'This would open the submitted documents.', [
                { text: 'OK' }
              ]);
            }}
          >
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles(colors).submitButtonText}>View Submitted Documents</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles(colors).container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles(colors).header}>
        <View>
          <Text style={styles(colors).headerTitle}>Driver Compliance</Text>
          <Text style={styles(colors).headerSubtitle}>
            Complete all required documents
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles(colors).logoutButton}>
          <Ionicons name="log-out-outline" size={24} color={colors.error} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles(colors).scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles(colors).progressContainer}>
          <View style={styles(colors).progressBar}>
            <View
              style={[
                styles(colors).progressFill,
                {
                  width:
                    complianceStatus === 'complete'
                      ? '100%'
                      : complianceStatus === 'partial'
                      ? '50%'
                      : '0%',
                },
              ]}
            />
          </View>
          <Text style={styles(colors).progressText}>
            {complianceStatus === 'complete'
              ? '✓ All documents uploaded'
              : complianceStatus === 'partial'
              ? '📋 Partially complete'
              : '⬆️ Start uploading documents'}
          </Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles(colors).section}>
          <View style={styles(colors).sectionTitleRow}>
            <Ionicons name="person" size={20} color={colors.primary} />
            <Text style={styles(colors).sectionTitle}> Personal Information</Text>
          </View>

          {/* Full Name */}
          <View style={styles(colors).inputGroup}>
            <Text style={styles(colors).label}>Full Name (as on ID)</Text>
            <Controller
              control={control}
              name="fullName"
              rules={{ required: 'Full name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles(colors).input, errors.fullName && styles(colors).inputError]}
                  placeholder="e.g., John Sipho Moyo"
                  placeholderTextColor={colors.textMuted}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.fullName && (
              <Text style={styles(colors).errorText}>{errors.fullName.message}</Text>
            )}
          </View>

          {/* RSA ID Number */}
          <View style={styles(colors).inputGroup}>
            <Text style={styles(colors).label}>🇿🇦 RSA ID Number (13 digits)</Text>
            <Controller
              control={control}
              name="idNumber"
              rules={{
                validate: (value) => {
                  const result = validateRSAId(value);
                  return result.valid || result.error;
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles(colors).input, errors.idNumber && styles(colors).inputError]}
                  placeholder="e.g., 8501011234567"
                  placeholderTextColor={colors.textMuted}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="numeric"
                  maxLength={13}
                />
              )}
            />
            {errors.idNumber && (
              <Text style={styles(colors).errorText}>{errors.idNumber.message}</Text>
            )}
            <Text style={styles(colors).helperText}>
              Enter your 13-digit South African ID number
            </Text>
          </View>

          {/* Phone Number */}
          <View style={styles(colors).inputGroup}>
            <View style={styles(colors).labelRow}>
              <Ionicons name="call" size={16} color={colors.textSecondary} />
              <Text style={styles(colors).label}> Cell Number</Text>
            </View>
            <Controller
              control={control}
              name="phoneNumber"
              rules={{
                validate: (value) => {
                  const result = validateSACellNumber(value);
                  return result.valid || result.error;
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles(colors).input, errors.phoneNumber && styles(colors).inputError]}
                  placeholder="e.g., 0821234567"
                  placeholderTextColor={colors.textMuted}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              )}
            />
            {errors.phoneNumber && (
              <Text style={styles(colors).errorText}>{errors.phoneNumber.message}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles(colors).inputGroup}>
            <Text style={styles(colors).label}>📧 Email Address</Text>
            <Controller
              control={control}
              name="email"
              rules={{ required: 'Email is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles(colors).input, errors.email && styles(colors).inputError]}
                  placeholder="e.g., john@example.com"
                  placeholderTextColor={colors.textMuted}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <Text style={styles(colors).errorText}>{errors.email.message}</Text>
            )}
          </View>
        </View>

        {/* PDP License Section */}
        <View style={styles(colors).section}>
          <View style={styles(colors).sectionTitleRow}>
            <Ionicons name="bus" size={20} color={colors.primary} />
            <Text style={styles(colors).sectionTitle}> PDP License</Text>
          </View>

          <View style={styles(colors).inputGroup}>
            <Text style={styles(colors).label}>PDP Number</Text>
            <Controller
              control={control}
              name="pdpNumber"
              rules={{
                validate: (value) => {
                  const result = validatePDPNumber(value);
                  return result.valid || result.error;
                },
              }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles(colors).input, errors.pdpNumber && styles(colors).inputError]}
                  placeholder="e.g., PDP12345678"
                  placeholderTextColor={colors.textMuted}
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  value={value}
                  autoCapitalize="characters"
                  maxLength={11}
                />
              )}
            />
            {errors.pdpNumber && (
              <Text style={styles(colors).errorText}>{errors.pdpNumber.message}</Text>
            )}
            <Text style={styles(colors).helperText}>
              Public Driver Permit - 11 characters (PDP + 8 digits)
            </Text>
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles(colors).section}>
          <Text style={styles(colors).sectionTitle}>📄 Required Documents</Text>
          <Text style={styles(colors).sectionSubtitle}>
            Upload clear photos or PDFs of each document
          </Text>

          {documents.map((doc) => (
            <View key={doc.id} style={styles(colors).documentCard}>
              <View style={styles(colors).documentHeader}>
                <View style={styles(colors).documentInfo}>
                  <Text style={styles(colors).documentLabel}>
                    {doc.label}
                    {doc.required && <Text style={styles(colors).required}> *</Text>}
                  </Text>
                  <Text style={styles(colors).documentDescription}>
                    {doc.description}
                  </Text>
                </View>
                {doc.document ? (
                  <View style={styles(colors).uploadedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color={colors.success} />
                  </View>
                ) : (
                  <View style={styles(colors).pendingBadge}>
                    <Ionicons name="time-outline" size={20} color={colors.warning} />
                  </View>
                )}
              </View>

              {doc.document ? (
                <View style={styles(colors).uploadedPreview}>
                  <Image
                    source={{ uri: doc.document.uri }}
                    style={styles(colors).previewImage}
                    resizeMode="cover"
                  />
                  <View style={styles(colors).previewInfo}>
                    <Text style={styles(colors).previewName} numberOfLines={1}>
                      {doc.document.name}
                    </Text>
                    <Text style={styles(colors).previewDate}>
                      Uploaded {doc.document.uploadedAt.toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles(colors).removeButton}
                    onPress={() => removeDocument(doc.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    style={styles(colors).uploadButton}
                    onPress={() => {

                      // Directly call takePhoto for test mode
                      takePhoto(doc.id);
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={24} color={colors.success} />
                    <Text style={styles(colors).uploadButtonText}>
                      Take Photo or Choose File
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles(colors).uploadButton, { marginTop: 8, backgroundColor: '#E8F5E9' }]}
                    onPress={() => {

                      pickDocument(doc.id);
                    }}
                  >
                    <Ionicons name="folder-outline" size={24} color={colors.success} />
                    <Text style={styles(colors).uploadButtonText}>
                      Test: Add File
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {uploadProgress[doc.id] !== undefined && (
                <View style={styles(colors).uploadProgress}>
                  <View
                    style={[
                      styles(colors).uploadProgressBar,
                      { width: `${uploadProgress[doc.id]}%` },
                    ]}
                  />
                </View>
              )}

              {/* Expiry Date Picker */}
              <View style={styles(colors).expiryContainer}>
                <Text style={styles(colors).expiryLabel}>Expiry Date:</Text>
                <TouchableOpacity
                  style={[styles(colors).expiryButton, { borderColor: getExpiryStatusColor(doc.expiryDate) }]}
                  onPress={() => openDatePicker(doc.id)}
                >
                  <Ionicons name="calendar-outline" size={20} color={getExpiryStatusColor(doc.expiryDate)} />
                  <Text style={[styles(colors).expiryButtonText, { color: getExpiryStatusColor(doc.expiryDate) }]}>
                    {formatDate(doc.expiryDate) || 'Select expiry date'}
                  </Text>
                </TouchableOpacity>
                {doc.expiryDate && (
                  <View style={styles(colors).expiryStatus}>
                    <Text style={[styles(colors).expiryStatusText, { color: getExpiryStatusColor(doc.expiryDate) }]}>
                      {getDaysUntilExpiry(doc.expiryDate)! < 0
                        ? 'EXPIRED'
                        : `${getDaysUntilExpiry(doc.expiryDate)} days remaining`}
                    </Text>
                  </View>
                )}
              </View>

              {/* Custom Date Picker Modal */}
              <Modal
                visible={showDatePicker === doc.id}
                transparent
                animationType="slide"
                onRequestClose={() => setShowDatePicker(null)}
              >
                <View style={styles(colors).modalOverlay}>
                  <View style={styles(colors).modalContent}>
                    <Text style={styles(colors).modalTitle}>Select Expiry Date</Text>

                    <View style={styles(colors).pickerRow}>
                      <View style={styles(colors).pickerColumn}>
                        <Text style={styles(colors).pickerLabel}>Day</Text>
                        <ScrollView style={styles(colors).pickerScroll} showsVerticalScrollIndicator={false}>
                          {days.map((day) => (
                            <TouchableOpacity
                              key={day}
                              style={[styles(colors).pickerItem, selectedDay === day && styles(colors).pickerItemSelected]}
                              onPress={() => setSelectedDay(day)}
                            >
                              <Text style={[styles(colors).pickerItemText, selectedDay === day && styles(colors).pickerItemTextSelected]}>{day}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      <View style={styles(colors).pickerColumn}>
                        <Text style={styles(colors).pickerLabel}>Month</Text>
                        <ScrollView style={styles(colors).pickerScroll} showsVerticalScrollIndicator={false}>
                          {months.map((month, idx) => (
                            <TouchableOpacity
                              key={month}
                              style={[styles(colors).pickerItem, selectedMonth === idx && styles(colors).pickerItemSelected]}
                              onPress={() => setSelectedMonth(idx)}
                            >
                              <Text style={[styles(colors).pickerItemText, selectedMonth === idx && styles(colors).pickerItemTextSelected]}>{month}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>

                      <View style={styles(colors).pickerColumn}>
                        <Text style={styles(colors).pickerLabel}>Year</Text>
                        <ScrollView style={styles(colors).pickerScroll} showsVerticalScrollIndicator={false}>
                          {years.map((year) => (
                            <TouchableOpacity
                              key={year}
                              style={[styles(colors).pickerItem, selectedYear === year && styles(colors).pickerItemSelected]}
                              onPress={() => setSelectedYear(year)}
                            >
                              <Text style={[styles(colors).pickerItemText, selectedYear === year && styles(colors).pickerItemTextSelected]}>{year}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    </View>

                    <View style={styles(colors).modalButtons}>
                      <TouchableOpacity style={styles(colors).modalButtonCancel} onPress={() => setShowDatePicker(null)}>
                        <Text style={styles(colors).modalButtonCancelText}>Cancel</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles(colors).modalButtonConfirm} onPress={handleDateConfirm}>
                        <Text style={styles(colors).modalButtonConfirmText}>Confirm</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </Modal>
            </View>
          ))}
        </View>

        {/* Legal Disclaimer */}
        <View style={styles(colors).disclaimer}>
          <Ionicons name="shield-checkmark-outline" size={20} color={colors.textSecondary} />
          <Text style={styles(colors).disclaimerText}>
            By submitting, I confirm all documents are authentic and valid. I
            understand that providing false information is a criminal offence
            under South African law.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles(colors).submitButton,
            isSubmitting && styles(colors).submitButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles(colors).submitButtonText}>Submit for Review</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles(colors).bottomPadding} />
      </ScrollView>
    </View>
  );
}

// ============ STYLES ============

const styles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: 60,
    paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
    borderBottomWidth: 4,
    borderBottomColor: colors.accent,
  },
  headerTitle: { ...typography.displayMedium, color: colors.textInverse },
  headerSubtitle: { ...typography.bodySmall, color: 'rgba(255,255,255,0.7)', marginTop: spacing.xs },
  logoutButton: { padding: spacing.sm, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: borderRadius.md },
  scrollView: { flex: 1 },
  progressContainer: { padding: spacing.lg, backgroundColor: colors.backgroundAlt, marginBottom: spacing.md },
  progressBar: { height: 8, backgroundColor: colors.border, borderRadius: borderRadius.sm, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.success, borderRadius: borderRadius.sm },
  progressText: { marginTop: spacing.sm, ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center' },
  section: {
    backgroundColor: colors.card,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.card,
    borderTopWidth: 3,
    borderTopColor: colors.accent,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  sectionTitle: { ...typography.h3, color: colors.text, fontWeight: '700', marginBottom: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  sectionSubtitle: { ...typography.bodySmall, color: colors.textSecondary, marginTop: -spacing.xs, marginBottom: spacing.lg },
  inputGroup: { marginBottom: spacing.lg },
  label: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    ...typography.body,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputError: { borderColor: colors.error, backgroundColor: colors.danger },
  errorText: { color: colors.error, ...typography.caption, marginTop: spacing.xs },
  helperText: { color: colors.textSecondary, ...typography.caption, marginTop: spacing.xs },
  documentCard: {
    backgroundColor: colors.card,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.accent,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 2,
  },
  documentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  documentInfo: { flex: 1 },
  documentLabel: { ...typography.label, color: colors.text, fontWeight: '600' },
  required: { color: colors.error },
  documentDescription: { ...typography.bodySmall, color: colors.textSecondary, marginTop: 2 },
  uploadedBadge: { marginLeft: spacing.sm },
  pendingBadge: { marginLeft: spacing.sm },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.success,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.success,
    borderStyle: 'dashed',
  },
  uploadButtonText: { marginLeft: spacing.sm, color: colors.success, ...typography.label },
  uploadedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.backgroundAlt,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
  },
  previewImage: { width: 60, height: 60, borderRadius: borderRadius.sm, backgroundColor: colors.border },
  previewInfo: { flex: 1, marginLeft: spacing.md },
  previewName: { ...typography.label, color: colors.text },
  previewDate: { ...typography.caption, color: colors.textSecondary, marginTop: 2 },
  removeButton: { padding: spacing.sm },
  uploadProgress: { height: 4, backgroundColor: colors.border, borderRadius: 2, marginTop: spacing.md, overflow: 'hidden' },
  uploadProgressBar: { height: '100%', backgroundColor: colors.success },
  expiryContainer: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: colors.border },
  expiryLabel: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
  expiryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  expiryButtonText: { marginLeft: spacing.sm, ...typography.body },
  expiryStatus: { marginTop: spacing.sm },
  modalOverlay: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.card, borderRadius: borderRadius.card, padding: spacing.xl, width: '85%', maxHeight: '60%' },
  modalTitle: { ...typography.h3, color: colors.text, textAlign: 'center', marginBottom: spacing.lg, fontWeight: '700' },
  pickerRow: { flexDirection: 'row', justifyContent: 'space-between', height: 200 },
  pickerColumn: { flex: 1, marginHorizontal: 4 },
  pickerLabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.sm },
  pickerScroll: { height: 160 },
  pickerItem: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  pickerItemSelected: { backgroundColor: colors.primary },
  pickerItemText: { ...typography.body, color: colors.text },
  pickerItemTextSelected: { color: colors.textInverse, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xl },
  modalButtonCancel: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.backgroundAlt, marginRight: spacing.sm },
  modalButtonCancelText: { color: colors.textSecondary, ...typography.button, textAlign: 'center' },
  modalButtonConfirm: { flex: 1, padding: spacing.md, borderRadius: borderRadius.md, backgroundColor: colors.primary, marginLeft: spacing.sm },
  modalButtonConfirmText: { color: colors.textInverse, ...typography.button, textAlign: 'center' },
  expiryStatusText: { ...typography.caption, fontWeight: '600' },
  disclaimer: {
    flexDirection: 'row',
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    backgroundColor: colors.warning,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
  },
  disclaimerText: { flex: 1, marginLeft: spacing.md, ...typography.caption, color: colors.textSecondary, lineHeight: 18 },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    borderRadius: borderRadius.card,
    marginBottom: spacing.lg,
  },
  submitButtonDisabled: { opacity: 0.6 },
  submitButtonText: { marginLeft: spacing.sm, color: colors.textInverse, ...typography.button },
  bottomPadding: { height: spacing.xxl },
  loadingContainer: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
  successCard: {
    margin: spacing.lg,
    padding: spacing.xxl,
    borderRadius: borderRadius.card,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderTopWidth: 3,
    borderTopColor: colors.success,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
  },
  successTitle: { ...typography.h2, color: colors.text, marginTop: spacing.lg, marginBottom: spacing.md, fontWeight: '700' },
  successText: { ...typography.bodySmall, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },
  submittedDate: { ...typography.caption, color: colors.textSecondary },
});
