import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

// UI Plugin components
import { Card, Button, Spacer } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

export default function SupportScreen({ navigation }: any) {
  const { colors } = useTheme();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const contactOptions = [
    { icon: 'chatbubbles', title: 'Live Chat', subtitle: 'Chat with our team', route: 'Chat', color: colors.primary },
    { icon: 'call', title: 'Call Us', subtitle: '0800 123 456', action: () => Linking.openURL('tel:0800123456'), color: colors.success },
    { icon: 'mail', title: 'Email', subtitle: 'support@scholartrack.co.za', action: () => Linking.openURL('mailto:support@scholartrack.co.za'), color: colors.secondary },
    { icon: 'logo-whatsapp', title: 'WhatsApp', subtitle: 'Chat on WhatsApp', route: 'Chat', color: '#25D366' },
  ];

  const faqs = [
    { q: 'How do I hire a driver?', a: 'Go to Hire Driver in the menu and browse available drivers in your area.' },
    { q: 'How do payments work?', a: 'Parents pay monthly via the app. Drivers receive weekly payouts.' },
    { q: 'Is my child safe?', a: 'All drivers are verified with ID, license, and criminal checks.' },
    { q: 'How do I report an issue?', a: 'Use the Reports section or call emergency services.' },
  ];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: spacing.md },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    headerSub: { ...typography.bodySmall, color: colors.accent, marginTop: spacing.xs },
    section: { padding: spacing.lg },
    sectionTitle: { ...typography.h3, color: colors.text, marginBottom: spacing.md },
    contactCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'center', elevation: 2 },
    contactIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
    contactInfo: { flex: 1, marginLeft: spacing.md },
    contactTitle: { ...typography.label, color: colors.text },
    contactSub: { ...typography.bodySmall, color: colors.textSecondary, marginTop: spacing.xs },
    faqCard: { backgroundColor: colors.card, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm, elevation: 2 },
    faqQuestion: { ...typography.label, color: colors.text, flex: 1 },
    faqAnswer: { ...typography.body, color: colors.textSecondary, marginTop: spacing.sm },
    reportBtn: { backgroundColor: colors.error, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, borderRadius: borderRadius.lg, marginTop: spacing.md },
    reportBtnText: { ...typography.button, color: colors.textInverse, marginLeft: spacing.sm },
    footer: { padding: spacing.xl, alignItems: 'center' },
    footerText: { ...typography.caption, color: colors.textSecondary },
  });

  return (
    <ScrollView style={styles(colors).container}>
      {/* Header */}
      <View style={styles(colors).header}>
        <Text style={styles(colors).headerTitle}>Support</Text>
        <Text style={styles(colors).headerSub}>We're here to help</Text>
      </View>

      {/* Contact Options */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>Contact Us</Text>
        {contactOptions.map((option, index) => (
          <TouchableOpacity key={index} onPress={() => option.route ? navigation?.navigate?.(option.route) : option.action?.()}>
            <Card variant="elevated" padding="medium">
              <View style={styles(colors).contactCard}>
                <View style={[styles(colors).contactIcon, { backgroundColor: option.color + '20' }]}>
                  <Ionicons name={option.icon as any} size={24} color={option.color} />
                </View>
                <View style={styles(colors).contactInfo}>
                  <Text style={styles(colors).contactTitle}>{option.title}</Text>
                  <Text style={styles(colors).contactSub}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* FAQs */}
      <View style={styles(colors).section}>
        <Text style={styles(colors).sectionTitle}>FAQs</Text>
        {faqs.map((faq, index) => (
          <TouchableOpacity key={index} onPress={() => toggleFaq(index)}>
            <Card variant="elevated" padding="medium">
              <View style={styles(colors).faqCard}>
                <Text style={styles(colors).faqQuestion}>{faq.q}</Text>
                <Ionicons name={expandedFaq === index ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textSecondary} />
                {expandedFaq === index && (
                  <Text style={styles(colors).faqAnswer}>{faq.a}</Text>
                )}
              </View>
            </Card>
          </TouchableOpacity>
        ))}
      </View>

      {/* Report Issue Button */}
      <View style={styles(colors).section}>
        <Button
          title="Report an Issue"
          onPress={() => navigation?.navigate?.('Chat')}
          variant="danger"
          fullWidth
          icon={<Ionicons name="warning" size={20} color={colors.textInverse} />}
        />
      </View>

      {/* Footer */}
      <View style={styles(colors).footer}>
        <Text style={styles(colors).footerText}>ScholarTrack v1.0.0</Text>
        <Text style={styles(colors).footerText}>© 2026 ScholarTrack South Africa</Text>
      </View>

      <Spacer size="xl" />
    </ScrollView>
  );
}