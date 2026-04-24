// ScholarTrack ParentDocumentsScreen — Dark SA Transport Design
// Glassmorphism, dark theme, cyan/amber accents

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  UIManager,
  ViewStyle,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  FadeIn,
  ZoomIn,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { supabase } from '../../lib/supabase';

import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SPRING = { damping: 15, stiffness: 150 };
const DT = {
  bg: '#050810',
  bg2: '#080d1a',
  panel: '#0b1120',
  border: '#1a2a40',
  cyan: '#00e5ff',
  amber: '#ffb700',
  green: '#00e676',
  red: '#ff3d5a',
  white: '#ffffff',
  text: '#9bbdd4',
  muted: '#4a6a8a',
};

// ─── Parametric styles (must be outside StyleSheet.create) ─────────────────────
const progressFillStyle = (pct: number): ViewStyle => ({
  height: 8,
  width: `${pct}%` as any,
  backgroundColor: pct >= 100 ? DT.green : DT.cyan,
  borderRadius: 4,
});

const docIconStyle = (index: number) => ({
  width: 50,
  height: 50,
  borderRadius: 25,
  backgroundColor: docColors[index % docColors.length] + '20',
  borderWidth: 1.5,
  borderColor: docColors[index % docColors.length],
  justifyContent: 'center' as const,
  alignItems: 'center' as const,
});

const SpringTouchable = ({
  children,
  onPress,
  style,
}: {
  children: React.ReactNode;
  onPress: () => void;
  style?: object;
}) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }],
  }));
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

const glassCard = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
};

const documentTypes = [
  { id: 'id_card', label: 'ID Document', icon: 'card', required: true },
  { id: 'proof_of_residence', label: 'Proof of Residence', icon: 'home', required: true },
  { id: 'birth_certificate', label: 'Birth Certificate', icon: 'people', required: false },
  { id: 'consent_form', label: 'Consent Form', icon: 'document-text', required: false },
];

const docColors = [DT.cyan, DT.amber, DT.green, DT.red];

interface ParentDocument {
  id: string;
  parent_id: string;
  document_type: string;
  file_url?: string;
  status: string;
  created_at: string;
}

interface Props {
  navigation: { goBack: () => void };
}

export default function ParentDocumentsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<ParentDocument[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
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

  const pickImage = async (docType: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setUploadedDocs(prev => [...prev, {
        id: Date.now().toString(),
        parent_id: '',
        document_type: docType,
        status: 'uploaded',
        created_at: new Date().toISOString(),
      }]);
    }
  };

  const uploadedCount = uploadedDocs.length;
  const requiredCount = documentTypes.filter(d => d.required).length;
  const progressPct = requiredCount > 0 ? Math.min((uploadedCount / requiredCount) * 100, 100) : 0;

  const sectionLabelStyle = { fontFamily: 'DMMono_400Regular', fontSize: 9, letterSpacing: 2.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.25)', marginBottom: spacing.sm };

  const insets = useSafeAreaInsets();
  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    header: {
      backgroundColor: DT.bg2,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomWidth: 4,
      borderBottomColor: DT.amber,
      position: 'relative',
      overflow: 'hidden',
    },
    headerTitle: { ...typography.h2, color: DT.white },
    headerSub: { ...typography.bodySmall, color: DT.muted, marginTop: spacing.xs },
    progressCard: {
      margin: spacing.lg,
      padding: spacing.lg,
      borderRadius: borderRadius.lg,
      ...glassCard,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255,183,0,.3)',
      borderColor: 'rgba(255,183,0,.12)',
    },
    progressTitle: { ...typography.h4, color: DT.white, marginBottom: spacing.md },
    progressBar: {
      height: 8,
      backgroundColor: DT.border,
      borderRadius: 4,
      overflow: 'hidden',
    },
    progressFill: undefined as any,
    progressText: { ...typography.labelSmall, color: DT.muted, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: DT.white, marginBottom: spacing.md },
    docCard: {
      borderRadius: borderRadius.lg,
      padding: spacing.lg,
      marginBottom: spacing.md,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      ...glassCard,
    },
    docIcon: undefined as any,
    docInfo: { flex: 1, marginLeft: spacing.md },
    docLabel: { ...typography.label, color: DT.white },
    docStatus: { ...typography.bodySmall, color: DT.muted, marginTop: 2 },
    emptyText: { ...typography.body, color: DT.muted, textAlign: 'center', padding: spacing.xl },
  });

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 80, backgroundColor: DT.amber, opacity: 0.06 }} />
        <Text style={styles.headerTitle}>Documents</Text>
        <Text style={styles.headerSub}>Upload required documents</Text>
      </View>

      {/* Progress Card */}
      <View style={styles.progressCard}>
        <Text style={styles.progressTitle}>Upload Progress</Text>
        <View style={styles.progressBar}>
          <View style={progressFillStyle(progressPct)} />
        </View>
        <Text style={styles.progressText}>
          {uploadedCount} of {requiredCount} required documents
        </Text>
      </View>

      {/* Documents List */}
      <View style={styles.section}>
        <Text style={sectionLabelStyle}>Required Documents</Text>
        {documentTypes.map((doc, index) => {
          const isUploaded = uploadedDocs.some(d => d.document_type === doc.id);
          return (
            <Animated.View key={doc.id} entering={ZoomIn.duration(300).delay(index * 60)}>
              <SpringTouchable
                onPress={() => pickImage(doc.id)}
                style={[styles.docCard, { overflow: 'hidden', position: 'relative' }]}
              >
                <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,183,0,.3)' }} />
                <View style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, borderRadius: 2, backgroundColor: 'rgba(255,183,0,.5)' }} />
                <View style={docIconStyle(index)}>
                  <Ionicons
                    name={doc.icon as keyof typeof Ionicons.glyphMap}
                    size={24}
                    color={isUploaded ? DT.green : docColors[index % docColors.length]}
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docLabel}>{doc.label}</Text>
                  <Text style={styles.docStatus}>
                    {isUploaded ? 'Uploaded' : doc.required ? 'Required' : 'Optional'}
                  </Text>
                </View>
                {isUploaded ? (
                  <Ionicons name="checkmark-circle" size={24} color={DT.green} />
                ) : (
                  <Ionicons name="cloud-upload" size={24} color={docColors[index % docColors.length]} />
                )}
              </SpringTouchable>
            </Animated.View>
          );
        })}
      </View>

      <Spacer size="xl" />
    </Animated.View>
  );
}
