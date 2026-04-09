import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer, Badge } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Language {
  code: string;
  name: string;
  flag: string;
}

export default function LanguageSettingsScreen() {
  const { colors } = useTheme();
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

  const translations = {
    dashboard: 'Dashboard',
    track: 'Track',
    safety: 'Safety',
    payments: 'Payments',
    settings: 'Settings',
  };

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: insets.top + spacing.lg },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    langCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    langFlag: { fontSize: 24 },
    langName: { ...typography.label, color: colors.text, flex: 1, marginLeft: spacing.md },
    checkmark: { color: colors.success },
    previewCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, elevation: 2 },
    previewTitle: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.sm },
    previewItem: { ...typography.body, color: colors.text, marginBottom: spacing.xs },
  });

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Language</Text>
        <Text style={styles(colors).headerSub}>Choose your preferred language</Text>
      </View>

      {/* Languages List */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Available Languages</Text>
        {languages.map((lang) => (
          <TouchableOpacity key={lang.code} onPress={() => selectLanguage(lang.code)}>
            <Card variant={currentLang === lang.code ? 'elevated' : 'outlined'} padding="medium">
              <View style={styles(colors).langCard}>
                <Text style={styles(colors).langFlag}>{lang.flag}</Text>
                <Text style={styles(colors).langName}>{lang.name}</Text>
                {currentLang === lang.code && (
                  <Ionicons name="checkmark-circle" size={24} style={styles(colors).checkmark} />
                )}
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Preview */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Preview</Text>
        <Card variant="elevated" padding="large">
          <View style={styles(colors).previewCard}>
            <Text style={styles(colors).previewTitle}>App Translations</Text>
            {Object.entries(translations).map(([key, value]) => (
              <Text key={key} style={styles(colors).previewItem}>{value}</Text>
            ))}
          </View>
        </Card>
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}