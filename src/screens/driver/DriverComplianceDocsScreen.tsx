// Driver Compliance Documents Screen — Design System: Dark SA Transport
// Required for South African Scholar Transport - National Land Transport Act

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

interface DocStatus {
  id: string;
  name: string;
  description: string;
  icon: string;
  required: boolean;
  expiryDate?: string;
  verified: boolean;
}

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
  setScreen?: (s: string) => void;
}

export default function DriverComplianceScreen({ navigation, setScreen }: Props) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [docs, setDocs] = useState<DocStatus[]>([
    {
      id: 'prdp',
      name: 'Professional Driving Permit (PrDP)',
      description: 'Valid PrDP for transporting passengers',
      icon: 'card',
      required: true,
      verified: true,
      expiryDate: '2027-06-15',
    },
    {
      id: 'operating_license',
      name: 'Operating License',
      description: 'National Land Transport Authority permit',
      icon: 'document-text',
      required: true,
      verified: true,
      expiryDate: '2026-12-31',
    },
    {
      id: 'vehicle_fitness',
      name: 'Vehicle Fitness Certificate',
      description: 'Certificate of Roadworthiness',
      icon: 'car',
      required: true,
      verified: false,
      expiryDate: '2026-08-20',
    },
    {
      id: 'insurance',
      name: 'Scholar Transport Insurance',
      description: 'Comprehensive insurance covering passengers',
      icon: 'shield-checkmark',
      required: true,
      verified: true,
      expiryDate: '2026-11-30',
    },
    {
      id: 'roadworthy',
      name: 'Roadworthy Certificate',
      description: 'Annual vehicle roadworthiness',
      icon: 'checkmark-circle',
      required: true,
      verified: false,
      expiryDate: '2026-09-15',
    },
    {
      id: 'speed_limiter',
      name: 'Speed Limiter Certificate',
      description: 'Verified speed restriction (80km/h)',
      icon: 'speedometer',
      required: true,
      verified: true,
      expiryDate: '2027-01-10',
    },
  ]);

  const getStatusColor = (verified: boolean, required: boolean) => {
    if (verified) return C.success;
    if (required) return C.error;
    return C.primary;
  };

  const getStatusText = (verified: boolean, required: boolean) => {
    if (verified) return 'Verified';
    if (required) return 'Required';
    return 'Pending';
  };

  const handleVerifyDoc = (docId: string) => {
    Alert.alert(
      'Submit for Verification',
      'Upload your document for verification by admin?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upload',
          onPress: () => {
            setDocs(docs.map(d => d.id === docId ? { ...d, verified: true } : d));
            Alert.alert('Success', 'Document submitted for verification');
          },
        },
      ]
    );
  };

  const verifiedCount = docs.filter(d => d.verified).length;
  const requiredCount = docs.filter(d => d.required).length;
  const compliancePercent = Math.round((verifiedCount / requiredCount) * 100);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setRefreshing(false);
  }, []);

  const now = new Date();
  

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },




    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.primary, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(217,119,6,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    scoreCard: { marginHorizontal: 16, marginTop: 16, padding: 20, flexDirection: 'row', alignItems: 'center' },
    scoreCircle: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: C.primary, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(217,119,6,.08)' },
    scoreText: { fontFamily: 'Syne_700Bold', fontSize: 22, fontWeight: '800', color: C.primary },
    scoreLabel: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.text },
    scoreInfo: { flex: 1, marginLeft: 16 },
    scoreTitle: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.text },
    scoreSubtitle: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted, marginTop: 4 },
    warningText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.error, marginTop: 6, fontWeight: '600' },
    legalBox: { marginHorizontal: 16, marginTop: 12, padding: 14, borderRadius: 14, backgroundColor: 'rgba(71,85,105,.1)', borderWidth: 1, borderColor: 'rgba(71,85,105,.3)', flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    legalText: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, lineHeight: 17 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    docCard: { padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    docTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.1)' },
    docIcon: { width: 50, height: 50, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    docInfo: { flex: 1, marginLeft: 12 },
    docHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    docName: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: C.text, flex: 1 },
    statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
    statusText: { fontFamily: 'Syne_700Bold', fontSize: 10, fontWeight: '700', color: '#fff' },
    docDesc: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 3 },
    expiryText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 3 },
    uploadBtn: { marginHorizontal: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 16, backgroundColor: C.success, gap: 10 },
    uploadBtnText: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '700', color: C.background, letterSpacing: 0.5 },
    bottomPadding: { height: 50 },
  });

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={C.textMuted} /><Ionicons name="battery-full" size={14} color={C.textMuted} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Compliance</Text><Text style={s.ltSub}>SA Transport Requirements</Text></View>
          <TouchableOpacity onPress={() => Alert.alert('SOS', 'Emergency services...')} style={{ backgroundColor: C.error, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="warning" size={14} color="#fff" /><Text style={{ color: '#fff', fontWeight: '700', fontSize: 11 }}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} colors={[C.primary]} />
        }
      >
        {/* Compliance Score */}
        <Card variant='glassAmber' style={s.scoreCard}>
          <View style={s.scoreCircle}>
            <Text style={s.scoreText}>{compliancePercent}%</Text>
            <Text style={s.scoreLabel}>Compliant</Text>
          </View>
          <View style={s.scoreInfo}>
            <Text style={s.scoreTitle}>Document Compliance</Text>
            <Text style={s.scoreSubtitle}>{verifiedCount} of {requiredCount} documents verified</Text>
            {compliancePercent < 100 && (
              <Text style={s.warningText}>Some documents need verification</Text>
            )}
          </View>
        </Card>

        {/* Legal Reference */}
        <View style={s.legalBox}>
          <Ionicons name="information-circle" size={18} color={C.info} />
          <Text style={s.legalText}>
            Required by: National Land Transport Act (Act 5 of 2009) & Scholar Transport Regulations
          </Text>
        </View>

        {/* Documents List */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Required Documents</Text>
          {docs.map((doc) => {
            const statusColor = getStatusColor(doc.verified, doc.required);
            return (
              <Card
                key={doc.id}
                variant='glassAmber'
                style={s.docCard}
                onPress={() => handleVerifyDoc(doc.id)}
              >
                <View style={s.docTopRefraction} />
                <View style={[s.docIcon, { backgroundColor: statusColor + '18' }]}>
                  <Ionicons name={doc.icon as keyof typeof Ionicons.glyphMap} size={24} color={statusColor} />
                </View>
                <View style={s.docInfo}>
                  <View style={s.docHeader}>
                    <Text style={s.docName}>{doc.name}</Text>
                    <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                      <Text style={s.statusText}>{getStatusText(doc.verified, doc.required)}</Text>
                    </View>
                  </View>
                  <Text style={s.docDesc}>{doc.description}</Text>
                  {doc.expiryDate && (
                    <Text style={s.expiryText}>Expires: {doc.expiryDate}</Text>
                  )}
                </View>
                <Ionicons name="chevron-forward" size={20} color={C.textMuted} />
              </Card>
            );
          })}
        </View>

        {/* Upload Button */}
        <TouchableOpacity style={s.uploadBtn}>
          <Ionicons name="cloud-upload" size={22} color={C.background} />
          <Text style={s.uploadBtnText}>Upload All Documents</Text>
        </TouchableOpacity>

        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
}