import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SupportScreen() {
  const contactOptions = [
    { 
      icon: 'chatbubbles', 
      title: 'Live Chat', 
      subtitle: 'Chat with our team',
      action: () => Alert.alert('Chat', 'Opening live chat...')
    },
    { 
      icon: 'call', 
      title: 'Call Us', 
      subtitle: '0800 123 456',
      action: () => Linking.openURL('tel:0800123456')
    },
    { 
      icon: 'mail', 
      title: 'Email', 
      subtitle: 'support@scholartrack.co.za',
      action: () => Linking.openURL('mailto:support@scholartrack.co.za')
    },
    { 
      icon: 'logo-whatsapp', 
      title: 'WhatsApp', 
      subtitle: 'Chat on WhatsApp',
      action: () => Alert.alert('WhatsApp', 'Opening WhatsApp...')
    },
  ];

  const faqs = [
    { q: 'How do I hire a driver?', a: 'Go to Hire Driver in the menu and browse available drivers in your area.' },
    { q: 'How do payments work?', a: 'Parents pay monthly via the app. Drivers receive weekly payouts.' },
    { q: 'Is my child safe?', a: 'All drivers are verified with ID, license, and criminal checks.' },
    { q: 'How do I report an issue?', a: 'Use the Reports section or call emergency services.' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🆘 Support</Text>
        <Text style={styles.headerSub}>We're here to help</Text>
      </View>

      {/* Contact Options */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        {contactOptions.map((option, index) => (
          <TouchableOpacity key={index} style={styles.contactCard} onPress={option.action}>
            <View style={styles.contactIcon}>
              <Ionicons name={option.icon as any} size={24} color="#FFB81C" />
            </View>
            <View style={styles.contactInfo}>
              <Text style={styles.contactTitle}>{option.title}</Text>
              <Text style={styles.contactSub}>{option.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* FAQs */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <TouchableOpacity key={index} style={styles.faqCard} onPress={() => Alert.alert(faq.q, faq.a)}>
            <Text style={styles.faqQuestion}>{faq.q}</Text>
            <Ionicons name="chevron-down" size={20} color="#ccc" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Report Issue */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.reportBtn} onPress={() => Alert.alert('Report', 'Opening report form...')}>
          <Ionicons name="warning" size={24} color="#fff" />
          <Text style={styles.reportBtnText}>Report an Issue</Text>
        </TouchableOpacity>
      </View>

      {/* App Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>ScholarTrack SA v1.0.0</Text>
        <Text style={styles.footerText}>© 2026 Safe Student Transport</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  header: { backgroundColor: '#000', padding: 20, paddingTop: 10 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  headerSub: { fontSize: 14, color: '#FFB81C', marginTop: 5 },
  section: { padding: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 15 },
  contactCard: { backgroundColor: '#fff', borderRadius: 15, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  contactIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFF4E0', justifyContent: 'center', alignItems: 'center' },
  contactInfo: { flex: 1, marginLeft: 15 },
  contactTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  contactSub: { fontSize: 13, color: '#666', marginTop: 2 },
  faqCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  faqQuestion: { flex: 1, fontSize: 14, fontWeight: '600', color: '#000' },
  reportBtn: { backgroundColor: '#d32f2f', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 15, marginTop: 10 },
  reportBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginLeft: 10 },
  footer: { padding: 30, alignItems: 'center' },
  footerText: { color: '#999', fontSize: 12 },
});
