import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, TextInput, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { documentService } from '../../lib/api';

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
}

// ============ MAIN COMPONENT ============

export default function ComplianceUploadScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [existingCompliance, setExistingCompliance] = useState<any>(null);

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
      id: 'pdp',
      label: 'PDP License',
      description: 'Public Driver Permit (PDP) Certificate',
      required: true,
    },
    {
      id: 'roadworthy',
      label: 'Roadworthy Certificate',
      description: 'Vehicle roadworthy certification',
      required: true,
    },
    {
      id: 'driversLicense',
      label: "Driver's License",
      description: "Valid SA driver's license (front & back)",
      required: true,
    },
    {
      id: 'insurance',
      label: 'Vehicle Insurance',
      description: 'Comprehensive insurance cover',
      required: true,
    },
    {
      id: 'vehiclePermit',
      label: 'Operating License',
      description: 'National Land Transport Act permit',
      required: true,
    },
  ]);

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
      const isTestMode = true; // Set to false for production

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
    const isTestMode = true;

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
    console.log('showDocumentOptions called for:', docId);
    Alert.alert(
      'Add Document',
      'Choose how to add the document',
      [
        {
          text: 'Take Photo',
          onPress: () => {
            console.log('Take Photo pressed for:', docId);
            takePhoto(docId);
          },
        },
        {
          text: 'Choose from Files',
          onPress: () => {
            console.log('Choose File pressed for:', docId);
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

      console.log('Submitting compliance data:', {
        ...data,
        documents: documents.map((d) => ({
          id: d.id,
          name: d.document?.name,
          type: d.document?.type,
        })),
      });

      // Upload each document to Supabase Storage and save record
      for (const doc of documents) {
        if (doc.document) {
          try {
            // Upload to Supabase Storage
            const fileUrl = await documentService.uploadDocument(
              'documents',  // bucket name
              `driver/${user.id}`,  // folder
              {
                uri: doc.document.uri,
                name: doc.document.name,
                type: doc.document.type
              }
            );

            // Map doc.id to document_type
            const docTypeMap: Record<string, any> = {
              'pdp': 'pdp_certificate',
              'roadworthy': 'roadworthy',
              'driversLicense': 'drivers_license',
              'insurance': 'insurance',
              'vehiclePermit': 'permit'
            };

            // Save to database
            await documentService.saveDriverDocument(
              user.id,
              docTypeMap[doc.id] || 'pdp_certificate',
              fileUrl,
              doc.document.name
            );

            console.log(`Uploaded ${doc.label}: ${fileUrl}`);
          } catch (uploadError) {
            console.error(`Failed to upload ${doc.label}:`, uploadError);
            // Continue with other documents
          }
        }
      }

      // Save compliance status to AsyncStorage
      await AsyncStorage.setItem('driverCompliance', JSON.stringify({
        ...data,
        documents: documents.map((d) => ({
          id: d.id,
          label: d.label,
          name: d.document?.name,
          uploadedAt: d.document?.uploadedAt,
        })),
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
      console.error('Submit error:', error);
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
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color="#FFB81C" />
        <Text style={styles.loadingText}>Loading compliance status...</Text>
      </View>
    );
  }

  // Show existing compliance status if already submitted
  if (existingCompliance && existingCompliance.status === 'pending_review') {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <Text style={styles.headerTitle}>Driver Compliance</Text>
          <Text style={styles.headerSubtitle}>Submitted for review</Text>
        </View>
        <View style={styles.section}>
          <View style={[styles.successCard, { backgroundColor: colors.card }]}>
            <Ionicons name="checkmark-circle" size={80} color="#007749" />
            <Text style={[styles.successTitle, { color: colors.text }]}>Submitted Successfully!</Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>
              Your compliance documents have been submitted for review. This typically takes 1-2 business days.
            </Text>
            <Text style={[styles.submittedDate, { color: colors.textSecondary }]}>
              Submitted: {new Date(existingCompliance.submittedAt).toLocaleDateString()}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={() => {
              Alert.alert('View Documents', 'This would open the submitted documents.', [
                { text: 'OK' }
              ]);
            }}
          >
            <Ionicons name="document-text" size={20} color="#fff" />
            <Text style={styles.submitButtonText}>View Submitted Documents</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Driver Compliance</Text>
          <Text style={styles.headerSubtitle}>
            Complete all required documents
          </Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
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
          <Text style={styles.progressText}>
            {complianceStatus === 'complete'
              ? '✓ All documents uploaded'
              : complianceStatus === 'partial'
              ? '📋 Partially complete'
              : '⬆️ Start uploading documents'}
          </Text>
        </View>

        {/* Personal Information Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 Personal Information</Text>

          {/* Full Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name (as on ID)</Text>
            <Controller
              control={control}
              name="fullName"
              rules={{ required: 'Full name is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.fullName && styles.inputError]}
                  placeholder="e.g., John Sipho Moyo"
                  placeholderTextColor="#999"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.fullName && (
              <Text style={styles.errorText}>{errors.fullName.message}</Text>
            )}
          </View>

          {/* RSA ID Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>🇿🇦 RSA ID Number (13 digits)</Text>
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
                  style={[styles.input, errors.idNumber && styles.inputError]}
                  placeholder="e.g., 8501011234567"
                  placeholderTextColor="#999"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="numeric"
                  maxLength={13}
                />
              )}
            />
            {errors.idNumber && (
              <Text style={styles.errorText}>{errors.idNumber.message}</Text>
            )}
            <Text style={styles.helperText}>
              Enter your 13-digit South African ID number
            </Text>
          </View>

          {/* Phone Number */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📱 Cell Number</Text>
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
                  style={[styles.input, errors.phoneNumber && styles.inputError]}
                  placeholder="e.g., 0821234567"
                  placeholderTextColor="#999"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                  maxLength={10}
                />
              )}
            />
            {errors.phoneNumber && (
              <Text style={styles.errorText}>{errors.phoneNumber.message}</Text>
            )}
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>📧 Email Address</Text>
            <Controller
              control={control}
              name="email"
              rules={{ required: 'Email is required' }}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  style={[styles.input, errors.email && styles.inputError]}
                  placeholder="e.g., john@example.com"
                  placeholderTextColor="#999"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />
            {errors.email && (
              <Text style={styles.errorText}>{errors.email.message}</Text>
            )}
          </View>
        </View>

        {/* PDP License Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚌 PDP License</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>PDP Number</Text>
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
                  style={[styles.input, errors.pdpNumber && styles.inputError]}
                  placeholder="e.g., PDP12345678"
                  placeholderTextColor="#999"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text.toUpperCase())}
                  value={value}
                  autoCapitalize="characters"
                  maxLength={11}
                />
              )}
            />
            {errors.pdpNumber && (
              <Text style={styles.errorText}>{errors.pdpNumber.message}</Text>
            )}
            <Text style={styles.helperText}>
              Public Driver Permit - 11 characters (PDP + 8 digits)
            </Text>
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📄 Required Documents</Text>
          <Text style={styles.sectionSubtitle}>
            Upload clear photos or PDFs of each document
          </Text>

          {documents.map((doc) => (
            <View key={doc.id} style={styles.documentCard}>
              <View style={styles.documentHeader}>
                <View style={styles.documentInfo}>
                  <Text style={styles.documentLabel}>
                    {doc.label}
                    {doc.required && <Text style={styles.required}> *</Text>}
                  </Text>
                  <Text style={styles.documentDescription}>
                    {doc.description}
                  </Text>
                </View>
                {doc.document ? (
                  <View style={styles.uploadedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#34C759" />
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Ionicons name="time-outline" size={20} color="#FF9500" />
                  </View>
                )}
              </View>

              {doc.document ? (
                <View style={styles.uploadedPreview}>
                  <Image
                    source={{ uri: doc.document.uri }}
                    style={styles.previewImage}
                    resizeMode="cover"
                  />
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewName} numberOfLines={1}>
                      {doc.document.name}
                    </Text>
                    <Text style={styles.previewDate}>
                      Uploaded {doc.document.uploadedAt.toLocaleDateString()}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeDocument(doc.id)}
                  >
                    <Ionicons name="trash-outline" size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View>
                  <TouchableOpacity
                    style={styles.uploadButton}
                    onPress={() => {
                      console.log('Upload button pressed for:', doc.id);
                      // Directly call takePhoto for test mode
                      takePhoto(doc.id);
                    }}
                  >
                    <Ionicons name="cloud-upload-outline" size={24} color="#007749" />
                    <Text style={styles.uploadButtonText}>
                      Take Photo or Choose File
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.uploadButton, { marginTop: 8, backgroundColor: '#E8F5E9' }]}
                    onPress={() => {
                      console.log('Pick button pressed for:', doc.id);
                      pickDocument(doc.id);
                    }}
                  >
                    <Ionicons name="folder-outline" size={24} color="#007749" />
                    <Text style={styles.uploadButtonText}>
                      Test: Add File
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {uploadProgress[doc.id] !== undefined && (
                <View style={styles.uploadProgress}>
                  <View
                    style={[
                      styles.uploadProgressBar,
                      { width: `${uploadProgress[doc.id]}%` },
                    ]}
                  />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Legal Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#666" />
          <Text style={styles.disclaimerText}>
            By submitting, I confirm all documents are authentic and valid. I
            understand that providing false information is a criminal offence
            under South African law.
          </Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            isSubmitting && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="send" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Submit for Review</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
}

// ============ STYLES ============

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#007749',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  logoutButton: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
  },
  scrollView: {
    flex: 1,
  },
  progressContainer: {
    padding: 20,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5EA',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#34C759',
    borderRadius: 4,
  },
  progressText: {
    marginTop: 10,
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: -8,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  inputError: {
    borderColor: '#FF3B30',
    backgroundColor: '#FFF5F5',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  helperText: {
    color: '#999',
    fontSize: 12,
    marginTop: 4,
  },
  documentCard: {
    backgroundColor: '#F9F9F9',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  documentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  documentInfo: {
    flex: 1,
  },
  documentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  required: {
    color: '#FF3B30',
  },
  documentDescription: {
    fontSize: 13,
    color: '#888888',
    marginTop: 2,
  },
  uploadedBadge: {
    marginLeft: 10,
  },
  pendingBadge: {
    marginLeft: 10,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 10,
    padding: 16,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#007749',
    borderStyle: 'dashed',
  },
  uploadButtonText: {
    marginLeft: 10,
    color: '#FFB81C',
    fontWeight: '500',
  },
  uploadedPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 6,
    backgroundColor: '#E5E5EA',
  },
  previewInfo: {
    flex: 1,
    marginLeft: 12,
  },
  previewName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1a1a1a',
  },
  previewDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  uploadProgress: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  uploadProgressBar: {
    height: '100%',
    backgroundColor: '#007749',
  },
  disclaimer: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: '#FFF9E6',
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#FF9500',
  },
  disclaimerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 12,
    color: '#888888',
    lineHeight: 18,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007749',
    marginHorizontal: 16,
    padding: 18,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    marginLeft: 10,
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#888888',
    marginTop: 10,
    fontSize: 16,
  },
  successCard: {
    margin: 16,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
  },
  successTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 20,
    marginBottom: 10,
  },
  successText: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 15,
  },
  submittedDate: {
    fontSize: 12,
    color: '#888888',
  },
});
