// Regulatory Display Screen — Design System: Dark SA Transport
// Display required operating information per South African Transport Laws

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

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

const glass = {
  backgroundColor: 'rgba(255,255,255,.04)',
  borderWidth: 1,
  borderColor: 'rgba(255,255,255,.08)',
  borderRadius: 20,
  overflow: 'hidden' as const,
};

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
  setScreen?: (s: string) => void;
}

export default function RegulatoryDisplayScreen({ navigation, setScreen }: Props) {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);

  const regulatoryInfo = {
    operatorLicense: 'OP/2026/001234',
    operatorName: 'ScholarTrack Transport Services',
    licenseExpiry: '2026-12-31',
    vehicleRegistration: 'GP 123-456',
    vehiclePermit: 'SCH/2026/789',
    maxPassengers: 65,
    speedLimit: 80,
    routePermit: 'RT/PTA/001',
    departmentContact: '012 555 1234',
    emergencyHotline: '0800 123 456',
    taxiContact: '0861 400 100',
    police: '10111',
    ambulance: '10177',
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.blue, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,35,149,.08)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: DT.amber, marginBottom: 10, letterSpacing: 0.5, textTransform: 'uppercase' },
    infoCard: { ...glass, padding: 16, marginBottom: 10 },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.1)' },
    infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    infoRowIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    infoContent: { flex: 1, marginLeft: 12 },
    infoLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: DT.muted, textTransform: 'uppercase', letterSpacing: 1 },
    infoValue: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '700', color: DT.white, marginTop: 2 },
    divider: { height: 1, backgroundColor: DT.border, marginVertical: 2 },
    emergencyCard: { ...glass, padding: 16 },
    emergencyRow: { flexDirection: 'row' },
    emergencyItem: { flex: 1, alignItems: 'center', padding: 10 },
    emergencyLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: DT.muted, marginTop: 5, textTransform: 'uppercase' },
    emergencyNumber: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '800', color: DT.white, marginTop: 3 },
    contactRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
    contactContent: { marginLeft: 12 },
    contactLabel: { fontFamily: 'Syne_700Bold', fontSize: 10, color: DT.muted, textTransform: 'uppercase' },
    contactNumber: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '700', color: DT.white },
    legalNotice: { marginHorizontal: 16, marginTop: 16, marginBottom: 24, padding: 14, borderRadius: 14, backgroundColor: 'rgba(0,35,149,.1)', borderWidth: 1, borderColor: 'rgba(0,35,149,.3)', flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    legalText: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, lineHeight: 17 },
    bottomPadding: { height: 50 },
  });

  return (
    <View style={s.container}>
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View>
      </View>

      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Regulatory Display</Text><Text style={s.ltSub}>Required by SA Transport Law</Text></View>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => setRefreshing(true)} tintColor={DT.blue} colors={[DT.blue]} />
        }
      >
        {/* Operator Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Operator Details</Text>
          <View style={s.infoCard}>
            <View style={s.cardTopRefraction} />
            <View style={s.infoRow}>
              <View style={[s.infoRowIcon, { backgroundColor: 'rgba(0,229,255,.1)' }]}>
                <Ionicons name="business" size={20} color={DT.cyan} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Operator Name</Text>
                <Text style={s.infoValue}>{regulatoryInfo.operatorName}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <View style={[s.infoRowIcon, { backgroundColor: 'rgba(255,183,0,.1)' }]}>
                <Ionicons name="card" size={20} color={DT.amber} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Operating License No.</Text>
                <Text style={s.infoValue}>{regulatoryInfo.operatorLicense}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <View style={[s.infoRowIcon, { backgroundColor: 'rgba(0,230,118,.1)' }]}>
                <Ionicons name="calendar" size={20} color={DT.green2} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>License Expiry</Text>
                <Text style={s.infoValue}>{regulatoryInfo.licenseExpiry}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Vehicle Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Vehicle Details</Text>
          <View style={s.infoCard}>
            <View style={s.cardTopRefraction} />
            <View style={s.infoRow}>
              <View style={[s.infoRowIcon, { backgroundColor: 'rgba(0,35,149,.15)' }]}>
                <Ionicons name="car" size={20} color={DT.blue} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Vehicle Registration</Text>
                <Text style={s.infoValue}>{regulatoryInfo.vehicleRegistration}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <View style={[s.infoRowIcon, { backgroundColor: 'rgba(0,35,149,.15)' }]}>
                <Ionicons name="document-text" size={20} color={DT.blue} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Vehicle Permit No.</Text>
                <Text style={s.infoValue}>{regulatoryInfo.vehiclePermit}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <View style={[s.infoRowIcon, { backgroundColor: 'rgba(0,229,255,.1)' }]}>
                <Ionicons name="people" size={20} color={DT.cyan} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Max Passengers</Text>
                <Text style={s.infoValue}>{regulatoryInfo.maxPassengers} children</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.infoRow}>
              <View style={[s.infoRowIcon, { backgroundColor: 'rgba(255,61,90,.15)' }]}>
                <Ionicons name="speedometer" size={20} color={DT.red} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Speed Limit</Text>
                <Text style={[s.infoValue, { color: DT.red }]}>{regulatoryInfo.speedLimit} km/h</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Route Details */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Route Details</Text>
          <View style={s.infoCard}>
            <View style={s.cardTopRefraction} />
            <View style={s.infoRow}>
              <View style={[s.infoRowIcon, { backgroundColor: 'rgba(255,183,0,.1)' }]}>
                <Ionicons name="map" size={20} color={DT.amber} />
              </View>
              <View style={s.infoContent}>
                <Text style={s.infoLabel}>Route Permit No.</Text>
                <Text style={s.infoValue}>{regulatoryInfo.routePermit}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Emergency Contacts */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Emergency & Complaint Contacts</Text>
          <View style={s.emergencyCard}>
            <View style={s.cardTopRefraction} />
            <View style={s.emergencyRow}>
              <View style={s.emergencyItem}>
                <Ionicons name="call" size={20} color={DT.red} />
                <Text style={s.emergencyLabel}>Police</Text>
                <Text style={s.emergencyNumber}>{regulatoryInfo.police}</Text>
              </View>
              <View style={s.emergencyItem}>
                <Ionicons name="medkit" size={20} color={DT.red} />
                <Text style={s.emergencyLabel}>Ambulance</Text>
                <Text style={s.emergencyNumber}>{regulatoryInfo.ambulance}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.emergencyRow}>
              <View style={s.emergencyItem}>
                <Ionicons name="warning" size={20} color={DT.amber} />
                <Text style={s.emergencyLabel}>Transport Hotline</Text>
                <Text style={s.emergencyNumber}>{regulatoryInfo.emergencyHotline}</Text>
              </View>
              <View style={s.emergencyItem}>
                <Ionicons name="car" size={20} color={DT.cyan} />
                <Text style={s.emergencyLabel}>Taxi Contact</Text>
                <Text style={s.emergencyNumber}>{regulatoryInfo.taxiContact}</Text>
              </View>
            </View>
            <View style={s.divider} />
            <View style={s.contactRow}>
              <View style={[s.infoRowIcon, { backgroundColor: 'rgba(0,35,149,.15)' }]}>
                <Ionicons name="business" size={20} color={DT.blue} />
              </View>
              <View style={s.contactContent}>
                <Text style={s.contactLabel}>Dept. of Transport</Text>
                <Text style={s.contactNumber}>{regulatoryInfo.departmentContact}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Legal Notice */}
        <View style={s.legalNotice}>
          <Ionicons name="information-circle" size={18} color={DT.blue} />
          <Text style={s.legalText}>
            This vehicle is authorized under the National Land Transport Act (Act 5 of 2009) and Provincial Scholar Transport Regulations. Operating without valid licenses is an offence. Complaints can be lodged at the Department of Transport.
          </Text>
        </View>

        <View style={s.bottomPadding} />
      </ScrollView>
    </View>
  );
}