// Language Settings Screen — Design System: Dark SA Transport
import React, { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacer, Card } from '../../ui-plugin/components';
import { getTheme } from '../../ui-plugin/theme';

const { colors: C } = getTheme('dark');

interface Language {
  code: string;
  name: string;
  flag: string;
}

export default function LanguageSettingsScreen() {
  const insets = useSafeAreaInsets();
  const [currentLang, setCurrentLang] = useState('en');

  useEffect(() => { AsyncStorage.getItem('appLanguage').then(v => v && setCurrentLang(v)); }, []);

  const languages: Language[] = [
    { code: 'en', name: 'English', flag: 'GB' },
    { code: 'zu', name: 'Zulu', flag: 'ZA' },
    { code: 'xh', name: 'Xhosa', flag: 'ZA' },
    { code: 'af', name: 'Afrikaans', flag: 'ZA' },
    { code: 'st', name: 'Sesotho', flag: 'ZA' },
    { code: 'tn', name: 'Tswana', flag: 'ZA' },
    { code: 'ns', name: 'Northern Sotho', flag: 'ZA' },
    { code: 'ss', name: 'Swazi', flag: 'ZA' },
  ];

  const selectLanguage = (code: string) => {
    setCurrentLang(code);
    AsyncStorage.setItem('appLanguage', code).catch(() => {});
    Alert.alert('Language Changed', `Language set to ${languages.find(l => l.code === code)?.name}`);
  };


  const now = new Date();
    const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },

    ltHeader: { backgroundColor: C.surface, padding: 20, paddingTop: 0, borderBottomWidth: 4, borderBottomColor: C.accent, position: 'relative', overflow: 'hidden' },
    ltHeaderBg: { position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,229,255,.05)' },
    ltTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1, marginBottom: 12 },
    ltTitle: { fontFamily: 'Syne_700Bold', fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    ltSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.4)', marginTop: 4, letterSpacing: 0.5 },
    section: { padding: 16 },
    sectionTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.text, marginBottom: 12, letterSpacing: 0.5 },
    langCard: { padding: 16, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
    cardTopRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,.08)' },
    langFlag: { fontSize: 24 },
    langName: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '600', color: C.text, flex: 1, marginLeft: 14 },
    checkmark: { marginLeft: 'auto' },
    bottomPadding: { height: 50 },
  });

  return (
    <ScrollView style={s.container} showsVerticalScrollIndicator={false}>





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
            <Card variant='glassAmber' style={s.langCard}>
              <View style={s.cardTopRefraction} />
              <Text style={s.langFlag}>{lang.flag}</Text>
              <Text style={s.langName}>{lang.name}</Text>
              {currentLang === lang.code && (
                <Ionicons name="checkmark-circle" size={22} color={C.accent} style={s.checkmark} />
              )}
            </Card>
          </TouchableOpacity>
        ))}
      </View>
      <Spacer size="xl" />
      <View style={s.bottomPadding} />
    </ScrollView>
  );
}