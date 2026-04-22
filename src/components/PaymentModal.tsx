import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { useTheme, ThemeColors } from '../context/ThemeContext';
import { useAuth } from '../hooks/useAuth';
import { payStackService, paymentHelper } from '../lib/paystack';

const SPRING = { damping: 15, stiffness: 150 };

// Spring press wrapper for pay button
const SpringButton = ({ children, onPress, disabled, style }: { children: React.ReactNode; onPress: () => void; disabled?: boolean; style?: object }) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(1 - pressed.value * 0.05, SPRING) }],
    opacity: withSpring(disabled ? 0.6 : 1, SPRING),
  }));
  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={() => { pressed.value = 1; }}
      onPressOut={() => { pressed.value = 0; }}
      disabled={disabled}
      activeOpacity={1}
      style={style}
    >
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

interface Props {
  visible: boolean;
  onClose: () => void;
  amount: number;
  description: string;
  paymentType: 'monthly' | 'one-time' | 'deposit';
  childId?: string;
  onSuccess: (reference: string) => void;
  onFailure: (error: string) => void;
}

export default function PaymentModal({ visible, onClose, amount, description, paymentType, childId, onSuccess, onFailure }: Props) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'processing'>('email');

  const handlePayment = async () => {
    if (!email || !email.includes('@')) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const userId = user?.id || '';

    try {
      setLoading(true);
      setStep('processing');

      // Initialize Paystack payment
      const { authorization_url, reference } = await payStackService.initializePayment({
        email,
        amount: paymentHelper.randToKobo(amount),
        paymentType,
        metadata: {
          user_id: userId,
          child_id: childId,
          payment_type: paymentType,
          description,
        },
      });

      // Open Paystack checkout in-app browser
      await WebBrowser.openBrowserAsync(authorization_url, {
        toolbarColor: '#007749',
        controlsColor: '#FFFFFF',
      });

      // After browser closes, verify the payment
      const verified = await payStackService.verifyTransaction(reference);
      if (verified.status === 'success') {
        await paymentHelper.savePaymentRecord(
          userId,
          amount,
          reference,
          'paid',
          paymentType,
          childId
        );
        onSuccess(reference);
        setStep('email');
        onClose();
      } else {
        await paymentHelper.savePaymentRecord(
          userId,
          amount,
          reference,
          'failed',
          paymentType,
          childId
        );
        onFailure(`Payment was ${verified.status}`);
        setStep('email');
      }
    } catch (error: unknown) {
      if (error instanceof Error && (error.message?.includes('user cancelled') || error.message?.includes('cancelled') || error.message?.includes('cancelle'))) {
        setStep('email');
      } else {
        Alert.alert('Payment Error', error instanceof Error ? error.message || 'Failed to initiate payment' : 'Failed to initiate payment');
        onFailure(error instanceof Error ? error.message : 'Payment failed');
        setStep('email');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles(colors).overlay}>
        <View style={[styles(colors).modal, { backgroundColor: colors.card }]}>
          <View style={styles(colors).header}>
            <Text style={[styles(colors).title, { color: colors.text }]}>Make Payment</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {step === 'email' ? (
            <View style={styles(colors).content}>
              <View style={[styles(colors).amountCard, { backgroundColor: colors.primary + '15' }]}>
                <Text style={[styles(colors).amountLabel, { color: colors.textSecondary }]}>Amount Due</Text>
                <Text style={[styles(colors).amount, { color: colors.primary }]}>{paymentHelper.formatRand(amount)}</Text>
                <Text style={[styles(colors).description, { color: colors.textSecondary }]}>{description}</Text>
              </View>

              <View style={styles(colors).form}>
                <Text style={[styles(colors).label, { color: colors.text }]}>Email Address</Text>
                <TextInput
                  style={[styles(colors).input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textSecondary}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <Text style={[styles(colors).note, { color: colors.textSecondary }]}>
                  Receipt will be sent to this email
                </Text>
              </View>

              <View style={[styles(colors).secureBadge, { backgroundColor: colors.background }]}>
                <Ionicons name="lock-closed" size={16} color="#007749" />
                <Text style={[styles(colors).secureText, { color: colors.textSecondary }]}>
                  Secured by PayStack
                </Text>
              </View>

              <SpringButton
                style={[styles(colors).payButton, { backgroundColor: colors.primary }]}
                onPress={handlePayment}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="card" size={20} color="#fff" />
                    <Text style={styles(colors).payButtonText}>Pay {paymentHelper.formatRand(amount)}</Text>
                  </>
                )}
              </SpringButton>
            </View>
          ) : (
            <View style={styles(colors).processing}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={[styles(colors).processingText, { color: colors.text }]}>
                Processing Payment...
              </Text>
              <Text style={[styles(colors).processingSubtext, { color: colors.textSecondary }]}>
                Please wait while we connect to PayStack
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = (colors: ThemeColors) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {},
  amountCard: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  amountLabel: {
    fontSize: 14,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 5,
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
  },
  form: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
  },
  note: {
    fontSize: 12,
    marginTop: 8,
  },
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    gap: 6,
  },
  secureText: {
    fontSize: 12,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  payButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  processing: {
    alignItems: 'center',
    padding: 40,
  },
  processingText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
  },
  processingSubtext: {
    fontSize: 14,
    marginTop: 8,
  },
});
