// Language Settings Screen — Design System: Dark SA Transport
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacer } from '../../ui-plugin/components';

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

interface Language {
  code: string;
  name: string;
  flag: string;
}

export default function LanguageSettingsScreen() {
  const insets = useSafeAreaInsets();
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

  const translations: Record<string, string> = {
    dashboard: 'Dashboard',
    track: 'Track',
    safety: 'Safety',
    payments: 'Payments',
    settings: 'Settings',
  };

  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    statusBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 4, backgroundColor: DT.bg },
    sbTime: { fontFamily: 'Syne_700Bold', fontSize: 12, fontWeight: '600', color: DT.white, letterSpacing: 0.5 },
    sbIcons: { flexDirection: 'row', gap: 4 },
    sbIcon: { fontSize: 12 },
    ltHeader: { backgroundColor: DT.bg2, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: DT.cyan, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,229,255,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: DT.white, marginBottom: 12, letterSpacing: 0.5 },
    langCard: { ...glass, padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    langFlag: { fontSize: 24 },
    langName: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '600', color: DT.white, flex: 1, marginLeft: 14 },
    checkmark: { marginLeft: 'auto' },
    previewCard: { ...glass, padding: 20 },
    cardTopRefraction2: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    previewTitle: { fontFamily: 'Syne_700Bold', fontSize: 11, fontWeight: '700', color: DT.muted, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
    previewItem: { fontFamily: 'Syne_700Bold', fontSize: 14, color: DT.text, marginBottom: 8, paddingLeft: 8, borderLeftWidth: 2, borderLeftColor: DT.cyan },
    bottomPadding: { height: 50 },
  });

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>
      {/* Status Bar */}
      <View style={s.statusBar}>
        <Text style={s.sbTime}>{timeStr}</Text>
        <View style={s.sbIcons}><Ionicons name="wifi" size={14} color={DT.dim} /><Ionicons name="battery-full" size={14} color={DT.dim} /></View>
      </View>

      {/* Header */}
      <View style={s.ltHeader}>
        <View style={s.ltHeaderBg} />
        <View style={s.ltTop}>
          <View><Text style={s.ltTitle}>Language</Text><Text style={s.ltSub}>Choose your preferred language</Text></View>
        </View>
      </View>

      {/* Languages List */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Available Languages</Text>
        {languages.map((lang) => (
          <TouchableOpacity key={lang.code} onPress={() => selectLanguage(lang.code)} activeOpacity={0.7}>
            <View style={[s.langCard, currentLang === lang.code && { borderColor: `${DT.cyan}50`, borderWidth: 1 }]}>
              <View style={s.cardTopRefraction} />
              <Text style={s.langFlag}>{lang.flag}</Text>
              <Text style={s.langName}>{lang.name}</Text>
              {currentLang === lang.code && (
                <Ionicons name="checkmark-circle" size={22} color={DT.cyan} style={s.checkmark} />
              )}
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preview */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Preview</Text>
        <View style={s.previewCard}>
          <View style={s.cardTopRefraction2} />
          <Text style={s.previewTitle}>App Translations</Text>
          {Object.entries(translations).map(([key, value]) => (
            <Text key={key} style={s.previewItem}>{value}</Text>
          ))}
        </View>
      </View>

      <Spacer size="xl" />
      <View style={s.bottomPadding} />
    </ScrollView>
  );
}