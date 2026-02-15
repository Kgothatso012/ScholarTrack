import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PaymentMethod {
  id: string;
  type: 'card' | 'eft' | 'zapper' | 'snapscan';
  name: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
}

interface Payment {
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'pending' | 'failed';
  method: string;
  driver: string;
  description: string;
}

export default function PaymentScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('card');

  const [paymentMethods] = useState<PaymentMethod[]>([
    { id: '1', type: 'card', name: 'Visa', last4: '4242', expiry: '12/27', isDefault: true },
    { id: '2', type: 'zapper', name: 'Zapper', isDefault: false },
  ]);

  const [payments] = useState<Payment[]>([
    { id: '1', date: '2026-02-15', amount: 'R800', status: 'pending', method: 'Visa ****4242', driver: 'Mr. John Molaba', description: 'February Transport' },
    { id: '2', date: '2026-02-01', amount: 'R800', status: 'paid', method: 'Visa ****4242', driver: 'Mr. John Molaba', description: 'January Transport' },
    { id: '3', date: '2026-01-01', amount: 'R800', status: 'paid', method: 'Visa ****4242', driver: 'Mr. John Molaba', description: 'December Transport' },
    { id: '4', date: '2025-12-01', amount: 'R800', status: 'paid', method: 'Visa ****4242', driver: 'Mrs. Sarah Nkosi', description: 'November Transport' },
    { id: '5', date: '2025-11-01', amount: 'R750', status: 'paid', method: 'Visa ****4242', driver: 'Mrs. Sarah Nkosi', description: 'October Transport' },
  ]);

  const currentBalance = 'R800';
  const dueDate = '15 Feb 2026';

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card': return 'card';
      case 'eft': return 'swap-horizontal';
      case 'zapper': return 'qr-code';
      case 'snapscan': return 'camera';
      default: return 'card';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return '#007749';
      case 'pending': return '#FFB81C';
      case 'failed': return '#d32f2f';
      default: return '#666';
    }
  };

  const payNow = () => {
    Alert.alert(
      '💳 Make Payment',
      `Pay R${currentBalance} using default card?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Pay Now', onPress: () => Alert.alert('Success', 'Payment processed successfully!') },
      ]
    );
  };

  const payWithMethod = (method: PaymentMethod) => {
    Alert.alert(
      '💳 Confirm Payment',
      `Pay R${currentBalance} using ${method.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Confirm', onPress: () => Alert.alert('Processing', 'Redirecting to payment...') },
      ]
    );
  };

  const addPaymentMethod = () => {
    Alert.alert('Add Payment Method', 'Choose payment method type:', [
      { text: 'Credit Card', onPress: () => Alert.alert('Card', 'Opening card form...') },
      { text: 'Instant EFT', onPress: () => Alert.alert('EFT', 'Opening EFT...') },
      { text: 'Zapper', onPress: () => Alert.alert('Zapper', 'Opening Zapper...') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const paidPayments = payments.filter(p => p.status === 'paid');
  const totalPaid = paidPayments.reduce((sum, p) => sum + parseInt(p.amount.replace('R', '').replace(',', '')), 0);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💳 Payments</Text>
        <Text style={styles.headerSubtext}>Manage your subscriptions</Text>
      </View>

      {/* Balance Card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceRow}>
          <View>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceAmount}>{currentBalance}</Text>
          </View>
          <View style={styles.dueDateBox}>
            <Text style={styles.dueDateLabel}>Due</Text>
            <Text style={styles.dueDate}>{dueDate}</Text>
          </View>
        </View>
        
        {pendingPayments.length > 0 && (
          <TouchableOpacity style={styles.payButton} onPress={payNow}>
            <Text style={styles.payButtonText}>Pay Now</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{payments.length}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#007749' }]}>{paidPayments.length}</Text>
          <Text style={styles.statLabel}>Paid</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: '#FFB81C' }]}>{pendingPayments.length}</Text>
          <Text style={styles.statLabel}>Pending</Text>
        </View>
      </View>

      {/* Payment Methods */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment Methods</Text>
          <TouchableOpacity onPress={addPaymentMethod}>
            <Ionicons name="add-circle" size={28} color="#007749" />
          </TouchableOpacity>
        </View>

        {paymentMethods.map((method) => (
          <TouchableOpacity 
            key={method.id} 
            style={[styles.methodCard, method.isDefault && styles.methodCardDefault]}
            onPress={() => payWithMethod(method)}
          >
            <View style={styles.methodIcon}>
              <Ionicons name={getMethodIcon(method.type) as any} size={24} color="#002395" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodName}>
                {method.name} {method.last4 && `•••• ${method.last4}`}
              </Text>
              {method.expiry && <Text style={styles.methodExpiry}>Expires {method.expiry}</Text>}
            </View>
            {method.isDefault && (
              <View style={styles.defaultBadge}>
                <Text style={styles.defaultText}>Default</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* SA Payment Options */}
        <Text style={styles.saTitle}>South African Payment Options</Text>
        
        <View style={styles.saOptions}>
          <TouchableOpacity style={styles.saOption} onPress={() => Alert.alert('EFT', 'Instant EFT coming soon')}>
            <View style={[styles.saIcon, { backgroundColor: '#007749' }]}>
              <Ionicons name="swap-horizontal" size={20} color="#fff" />
            </View>
            <Text style={styles.saText}>Instant EFT</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saOption} onPress={() => Alert.alert('Zapper', 'Opening Zapper...')}>
            <View style={[styles.saIcon, { backgroundColor: '#002395' }]}>
              <Ionicons name="qr-code" size={20} color="#fff" />
            </View>
            <Text style={styles.saText}>Zapper</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saOption} onPress={() => Alert.alert('SnapScan', 'Opening SnapScan...')}>
            <View style={[styles.saIcon, { backgroundColor: '#FFB81C' }]}>
              <Ionicons name="camera" size={20} color="#fff" />
            </View>
            <Text style={styles.saText}>SnapScan</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saOption} onPress={() => Alert.alert('PayPal', 'Opening PayPal...')}>
            <View style={[styles.saIcon, { backgroundColor: '#003087' }]}>
              <Ionicons name="logo-paypal" size={20} color="#fff" />
            </View>
            <Text style={styles.saText}>PayPal</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment History */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        
        {payments.map((payment) => (
          <View key={payment.id} style={styles.paymentCard}>
            <View style={styles.paymentLeft}>
              <View style={[styles.paymentIcon, { backgroundColor: getStatusColor(payment.status) + '20' }]}>
                <Ionicons 
                  name={payment.status === 'paid' ? 'checkmark' : payment.status === 'pending' ? 'time' : 'close'} 
                  size={16} 
                  color={getStatusColor(payment.status)} 
                />
              </View>
              <View>
                <Text style={styles.paymentDesc}>{payment.description}</Text>
                <Text style={styles.paymentMeta}>{payment.driver} • {payment.date}</Text>
              </View>
            </View>
            <View style={styles.paymentRight}>
              <Text style={styles.paymentAmount}>{payment.amount}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payment.status) }]}>
                <Text style={styles.statusText}>
                  {payment.status === 'paid' ? 'Paid' : payment.status === 'pending' ? 'Pending' : 'Failed'}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Receipts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📄 Receipts</Text>
        
        {payments.filter(p => p.status === 'paid').slice(0, 3).map((payment) => (
          <TouchableOpacity key={payment.id} style={styles.receiptCard} onPress={() => Alert.alert('Receipt', 'Opening receipt...')}>
            <View style={styles.receiptIcon}>
              <Ionicons name="document-text" size={20} color="#002395" />
            </View>
            <View style={styles.receiptInfo}>
              <Text style={styles.receiptTitle}>{payment.description}</Text>
              <Text style={styles.receiptMeta}>{payment.date} • {payment.amount}</Text>
            </View>
            <Ionicons name="download" size={20} color="#007749" />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { backgroundColor: '#002395', padding: 20, paddingTop: 40 },
  headerTitle: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  headerSubtext: { fontSize: 13, color: '#FFB81C', marginTop: 5 },
  balanceCard: { backgroundColor: '#fff', margin: 15, padding: 20, borderRadius: 15, elevation: 5 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  balanceLabel: { fontSize: 14, color: '#666' },
  balanceAmount: { fontSize: 36, fontWeight: 'bold', color: '#002395', marginTop: 5 },
  dueDateBox: { alignItems: 'flex-end' },
  dueDateLabel: { fontSize: 12, color: '#666' },
  dueDate: { fontSize: 16, fontWeight: 'bold', color: '#d32f2f' },
  payButton: { backgroundColor: '#007749', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  payButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', padding: 15, backgroundColor: '#fff', marginHorizontal: 15, borderRadius: 12, elevation: 3, marginTop: -10 },
  statCard: { alignItems: 'center' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#002395' },
  statLabel: { fontSize: 12, color: '#666' },
  section: { padding: 15 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  methodCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2, borderWidth: 1, borderColor: '#e0e0e0' },
  methodCardDefault: { borderColor: '#007749', backgroundColor: '#f0fff4' },
  methodIcon: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  methodInfo: { flex: 1, marginLeft: 15 },
  methodName: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  methodExpiry: { fontSize: 12, color: '#666', marginTop: 2 },
  defaultBadge: { backgroundColor: '#007749', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  defaultText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  saTitle: { fontSize: 14, fontWeight: 'bold', color: '#666', marginTop: 20, marginBottom: 10 },
  saOptions: { flexDirection: 'row', justifyContent: 'space-between' },
  saOption: { alignItems: 'center', width: '23%' },
  saIcon: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  saText: { fontSize: 10, color: '#333', marginTop: 5, textAlign: 'center' },
  paymentCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', elevation: 2 },
  paymentLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  paymentIcon: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  paymentDesc: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  paymentMeta: { fontSize: 12, color: '#666', marginTop: 2 },
  paymentRight: { alignItems: 'flex-end' },
  paymentAmount: { fontSize: 16, fontWeight: 'bold', color: '#002395' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, marginTop: 4 },
  statusText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  receiptCard: { backgroundColor: '#fff', borderRadius: 12, padding: 15, marginBottom: 10, flexDirection: 'row', alignItems: 'center', elevation: 2 },
  receiptIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#e3f2fd', justifyContent: 'center', alignItems: 'center' },
  receiptInfo: { flex: 1, marginLeft: 12 },
  receiptTitle: { fontSize: 14, fontWeight: 'bold', color: '#333' },
  receiptMeta: { fontSize: 12, color: '#666', marginTop: 2 },
});
