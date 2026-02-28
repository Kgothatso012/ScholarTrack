import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/api';

export default function ComplianceScreen({ navigation, setScreen }: any) {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('darkMode').then(d => setDarkMode(d === 'dark'));
  }, []);

  const COLORS = darkMode ? {
    bg: '#0a0a0a', card: '#1a1a1a', text: '#fff', textSec: '#888',
    primary: '#FFB81C', green: '#4CAF50', orange: '#FF9800', header: '#000'
  } : {
    bg: '#f5f5f5', card: '#fff', text: '#333', textSec: '#666',
    primary: '#000000', green: '#007749', orange: '#FF9800', header: '#000000'
  };

  const docs = [
    { id: '1', name: 'Driver License', icon: 'card', status: 'verified' as const },
    { id: '2', name: 'Professional Permit', icon: 'document-text', status: 'pending' as const },
    { id: '3', name: 'Vehicle Insurance', icon: 'shield-checkmark', status: 'verified' as const },
    { id: '4', name: 'Vehicle License', icon: 'car', status: 'missing' as const },
    { id: '5', name: 'Police Clearance', icon: 'finger-print', status: 'pending' as const },
  ];

  const verified = docs.filter(d => d.status === 'verified').length;
  const pending = docs.filter(d => d.status === 'pending' || d.status === 'missing').length;

  const getColor = (s: string) => {
    if (s === 'verified') return COLORS.green;
    if (s === 'pending' || s === 'missing') return COLORS.orange;
    return COLORS.textSec;
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={{ backgroundColor: COLORS.header, padding: 20, paddingTop: 50 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#fff' }}>Compliance</Text>
        <Text style={{ fontSize: 14, color: '#FFB81C', marginTop: 4 }}>Driver Documents</Text>
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'space-around', padding: 20, backgroundColor: '#fff', marginHorizontal: 16, marginTop: -15, borderRadius: 16, elevation: 3 }}>
        <View><Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.green }}>{verified}</Text><Text style={{ fontSize: 12, color: COLORS.textSec }}>Verified</Text></View>
        <View><Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.orange }}>{pending}</Text><Text style={{ fontSize: 12, color: COLORS.textSec }}>Pending</Text></View>
        <View><Text style={{ fontSize: 28, fontWeight: 'bold', color: COLORS.primary }}>{docs.length}</Text><Text style={{ fontSize: 12, color: COLORS.textSec }}>Total</Text></View>
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text, marginBottom: 12 }}>Required Documents</Text>
        {docs.map(doc => (
          <View key={doc.id} style={{ backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginBottom: 10, elevation: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View style={{ width: 48, height: 48, borderRadius: 12, backgroundColor: COLORS.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                <Ionicons name={doc.icon as any} size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '600', color: COLORS.text }}>{doc.name}</Text>
                <View style={{ backgroundColor: getColor(doc.status) + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginTop: 4 }}>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: getColor(doc.status) }}>
                    {doc.status === 'verified' ? 'Verified' : doc.status === 'pending' ? 'Pending' : 'Required'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={{ backgroundColor: doc.status === 'verified' ? COLORS.green : COLORS.primary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 12 }}>{doc.status === 'verified' ? '✓' : 'Upload'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </View>

      <View style={{ padding: 16 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', color: COLORS.text }}>Verification Process</Text>
        <View style={{ backgroundColor: COLORS.card, padding: 16, borderRadius: 12, marginTop: 12 }}>
          <Text style={{ color: COLORS.textSec, fontSize: 14 }}>• Upload clear photos of your documents. Verification takes 24-48 hours.</Text>
          <Text style={{ color: COLORS.textSec, fontSize: 14, marginTop: 8 }}>• Pending documents must be uploaded before accepting trips.</Text>
          <Text style={{ color: COLORS.textSec, fontSize: 14, marginTop: 8 }}>• All documents are encrypted and stored securely.</Text>
        </View>
      </View>

      <View style={{ padding: 16 }}>
        <TouchableOpacity style={{ borderColor: COLORS.primary, borderWidth: 2, padding: 16, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
          <Ionicons name="help-circle" size={24} color={COLORS.primary} />
          <Text style={{ color: COLORS.primary, fontWeight: '600', marginLeft: 8 }}>Need help with verification?</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
