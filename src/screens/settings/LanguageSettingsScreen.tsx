import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../lib/theme';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export default function LanguageSettingsScreen() {
  const [currentLang, setCurrentLang] = useState('en');

  const languages: Language[] = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zu', name: 'Zulu', flag: '🇿🇦' },
    { code: 'xh', name: 'Xhosa', flag: '🇿🇦' },
    { code: 'af', name: 'Afrikaans', flag: '🇿🇦' },
    { code: 'st', name: 'Sesotho', flag: '🇿🇦' },
    { code: 'tn', name: 'Tswana', flag: '🇿🇦' },
    { code: 'ns', name: 'Northern Sotho', flag: '🇿🇦' },
    { code: 'ss', name: 'Swazi', flag: '🇿🇦' },
  ];

  const selectLanguage = (code: string) => {
    setCurrentLang(code);
    Alert.alert('Language Changed', `Language set to ${languages.find(l => l.code === code)?.name}`);
  };

  const translations = {
    dashboard: 'Dashboard',
    track: 'Track',
    safety: 'Safety',
    payments: 'Payments',
    settings: 'Settings',
  };

  return (
    <ScrollView style={styles(colors).container}>
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>🌐 Language</Text>
        <Text style={styles(colors).headerSubtext}>Select your preferred language</Text>
      </View>

      {/* Current Preview */}
      <View style={styles(colors).previewCard}>
        <Text style={styles(colors).previewTitle}>App Preview</Text>
        <View style={styles(colors).previewContent}>
          <View style={styles(colors).previewItem}>
            <Ionicons name="home" size={20} color="#002395" />
            <Text style={styles(colors).previewText}>{translations.dashboard}</Text>
          </View>
          <View style={styles(colors).previewItem}>
            <Ionicons name="map" size={20} color="#002395" />
            <Text style={styles(colors).previewText}>{translations.track}</Text>
          </View>
          <View style={styles(colors).previewItem}>
            <Ionicons name="warning" size={20} color="#d32f2f" />
            <Text style={styles(colors).previewText}>{translations.safety}</Text>
          </View>
          <View style={styles(colors).previewItem}>
            <Ionicons name="card" size={20} color="#007749" />
            <Text style={styles(colors).previewText}>{translations.payments}</Text>
          </View>
        </View>
      </View>

      {/* Language List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Available Languages</Text>
        
        {languages.map((lang) => (
          <TouchableOpacity
            key={lang.code}
            style={[styles(colors).langCard, currentLang === lang.code && styles(colors).langCardActive]}
            onPress={() => selectLanguage(lang.code)}
          >
            <Text style={styles(colors).langFlag}>{lang.flag}</Text>
            <View style={styles(colors).langInfo}>
              <Text style={[styles(colors).langName, currentLang === lang.code && styles(colors).langNameActive]}>
                {lang.name}
              </Text>
              <Text style={styles(colors).langCode}>{lang.code.toUpperCase()}</Text>
            </View>
            {currentLang === lang.code && (
              <Ionicons name="checkmark-circle" size={24} color="#007749" />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Language Info */}
      <View style={styles(colors).infoCard}>
        <Ionicons name="information-circle" size={24} color="#002395" />
        <Text style={styles(colors).infoText}>
          ScholarTrack is committed to serving all South African communities. 
          More languages will be added based on demand.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.card },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: colors.text },
  headerSubtext: { fontSize: 13, color: '#FFB81C', marginTop: 5 },
  previewCard: { backgroundColor: colors.card, margin: 15, padding: 15, borderRadius: 12, elevation: 3 },
  previewTitle: { fontSize: 14, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 15 },
  previewContent: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  previewItem: { alignItems: 'center', width: '25%' },
  previewText: { fontSize: 11, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 15 },
  langCard: { backgroundColor: colors.card, borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  langCardActive: { borderWidth: 2, borderColor: '#007749', backgroundColor: '#f0fff4' },
  langFlag: { fontSize: 28 },
  langInfo: { flex: 1, marginLeft: 15 },
  langName: { fontSize: 16, fontWeight: 'bold', color: colors.textSecondary },
  langNameActive: { color: '#007749' },
  langCode: { fontSize: 12, color: colors.textSecondary },
  infoCard: { backgroundColor: '#e3f2fd', margin: 15, padding: 15, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  infoText: { flex: 1, marginLeft: 12, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
});
