// ScholarTrack SupportScreen — Design System: Dark SA Transport
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeIn, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Spacer } from '../../ui-plugin/components';
import { spacing } from '../../ui-plugin/theme';

interface Props {
  navigation?: { goBack?: () => void; navigate?: (s: string) => void };
}

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
  muted: '#4a6a8a',
  white: '#e8f4ff',
};

// Breathing dot
const BreathingDot = ({ color = DT.green2, size = 8 }: { color?: string; size?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  React.useEffect(() => {
    scale.value = withRepeat(withSequence(withTiming(1.5, { duration: 1600, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })), -1, false);
    opacity.value = withRepeat(withSequence(withTiming(0.3, { duration: 1600, easing: Easing.inOut(Easing.ease) }), withTiming(1, { duration: 1600, easing: Easing.inOut(Easing.ease) })), -1, false);
  }, []);
  const ringStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }], opacity: opacity.value }));
  return (
    <View style={{ width: size + 10, height: size + 10, justifyContent: 'center', alignItems: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, ringStyle]} />
      <View style={{ width: size * 0.7, height: size * 0.7, borderRadius: size * 0.35, backgroundColor: color }} />
    </View>
  );
};

// Contact card pill
const contactCardBase = {
  backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderRadius: 16, padding: 14,
  marginBottom: 8, flexDirection: 'row' as const, alignItems: 'center' as const,
};

export default function SupportScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const contactOptions = [
    { icon: 'chatbubbles', title: 'Live Chat', subtitle: 'Chat with our team', route: 'Chat', color: DT.cyan },
    { icon: 'call', title: 'Call Us', subtitle: '0800 123 456', action: () => Linking.openURL('tel:0800123456'), color: DT.green2 },
    { icon: 'mail', title: 'Email', subtitle: 'support@scholartrack.co.za', action: () => Linking.openURL('mailto:support@scholartrack.co.za'), color: DT.amber },
    { icon: 'logo-whatsapp', title: 'WhatsApp', subtitle: 'Chat on WhatsApp', action: () => Linking.openURL('https://wa.me/270800123456'), color: '#25D366' },
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

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    scroll: { flex: 1 },
    // HEADER
    header: {
      backgroundColor: DT.bg2,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      position: 'relative',
      overflow: 'hidden',
    },
    headerGlow1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,229,255,.06)' },
    headerGlow2: { position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,183,0,.06)' },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.sm },
    headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 28, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    headerSub: { fontFamily: 'Syne_700Bold', fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: spacing.xs },
    headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerBadgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' },
    headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
    // SECTION
    section: { padding: spacing.lg },
    sectionLabel: { fontFamily: 'Syne_700Bold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.2)', marginBottom: spacing.sm, paddingHorizontal: spacing.xs },
    // CONTACT
    contactCard: { backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,.08)', borderRadius: 16, padding: 14, marginBottom: 8, flexDirection: 'row', alignItems: 'center' },
    contactIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    contactInfo: { flex: 1, marginLeft: spacing.md },
    contactTitle: { fontFamily: 'Syne_700Bold', fontSize: 14, fontWeight: '600', color: DT.white },
    contactSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: DT.muted, marginTop: 2 },
    contactArrow: { opacity: 0.4 },
    // FAQ
    faqCard: { backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,.08)', borderRadius: 16, padding: 14, marginBottom: 8, overflow: 'hidden' },
    faqHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    faqQuestion: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600', color: DT.white, flex: 1, marginRight: spacing.sm },
    faqAnswer: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted, marginTop: spacing.sm, lineHeight: 18 },
    // REPORT BTN
    reportBtn: {
      backgroundColor: 'rgba(255,61,90,.15)', borderWidth: 1, borderColor: 'rgba(255,61,90,.3)',
      borderRadius: 16, padding: spacing.lg, marginTop: spacing.md, flexDirection: 'row',
      alignItems: 'center', justifyContent: 'center', gap: spacing.sm,
    },
    reportBtnText: { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '700', color: DT.red },
    // FOOTER
    footer: { padding: spacing.xl, alignItems: 'center' },
    footerText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: 'rgba(255,255,255,.2)', marginBottom: 4 },
  });

  return (
    <View style={s.container}>
      <ScrollView style={s.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.springify()}>
          <View style={s.header}>
            <View style={s.headerGlow1} />
            <View style={s.headerGlow2} />
            <View style={s.headerTop}>
              <View>
                <Text style={s.headerTitle}>Support</Text>
                <Text style={s.headerSub}>We're here to help</Text>
              </View>
              <View style={s.headerBadge}>
                <BreathingDot color={DT.green2} size={7} />
                <Text style={s.headerBadgeText}>Online</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Contact Options */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>Contact Us</Text>
          {contactOptions.map((option, index) => (
            <Animated.View key={index} entering={FadeIn.delay(index * 60).springify()}>
              <TouchableOpacity
                style={s.contactCard}
                onPress={() => option.route ? navigation?.navigate?.(option.route) : option.action?.()}
                activeOpacity={0.7}
              >
                <View style={[s.contactIcon, { backgroundColor: option.color + '18' }]}>
                  <Ionicons name={option.icon as keyof typeof Ionicons.glyphMap} size={22} color={option.color} />
                </View>
                <View style={s.contactInfo}>
                  <Text style={s.contactTitle}>{option.title}</Text>
                  <Text style={s.contactSub}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={DT.muted} style={s.contactArrow} />
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* FAQs */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>FAQs</Text>
          {faqs.map((faq, index) => (
            <Animated.View key={index} entering={FadeIn.delay(index * 60).springify()}>
              <TouchableOpacity
                style={s.faqCard}
                onPress={() => toggleFaq(index)}
                activeOpacity={0.7}
              >
                <View style={s.faqHeader}>
                  <Text style={s.faqQuestion}>{faq.q}</Text>
                  <Ionicons
                    name={expandedFaq === index ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color={DT.muted}
                  />
                </View>
                {expandedFaq === index && (
                  <Animated.View entering={FadeIn.springify()}>
                    <Text style={s.faqAnswer}>{faq.a}</Text>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}
        </View>

        {/* Report Issue */}
        <View style={s.section}>
          <TouchableOpacity
            style={s.reportBtn}
            onPress={() => navigation?.navigate?.('Chat')}
            activeOpacity={0.7}
          >
            <Ionicons name="warning" size={20} color={DT.red} />
            <Text style={s.reportBtnText}>Report an Issue</Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerText}>ScholarTrack v1.0.0</Text>
          <Text style={s.footerText}>© 2026 ScholarTrack South Africa</Text>
        </View>

        <Spacer size="xxl" />
      </ScrollView>
    </View>
  );
}
