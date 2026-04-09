// Forgot Password Screen
// Password reset flow with email verification

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { ThemeColors } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Input } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function ForgotPasswordScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: 'scholartrack://reset-password',
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to send reset email');
        return;
      }

      // Navigate to ResetPasswordConfirm screen after sending
      setSent(true);
      if (navigation.navigate) {
        navigation.navigate('ResetPasswordConfirm');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const styles = (colors: ThemeColors) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    keyboardView: { flex: 1 },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: 50 },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    backBtn: { marginBottom: spacing.md },
    content: { flex: 1, padding: spacing.lg },
    iconContainer: { alignItems: 'center', marginVertical: spacing.xl },
    icon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary + '20', justifyContent: 'center', alignItems: 'center' },
    title: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
    inputContainer: { marginBottom: spacing.md },
    successContainer: { alignItems: 'center', paddingVertical: spacing.xl },
    successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
    successTitle: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
    successText: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
    helpCard: { backgroundColor: colors.card, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.xl },
    helpTitle: { ...typography.label, color: colors.text, marginBottom: spacing.sm },
    helpRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    helpIcon: { marginRight: spacing.sm, color: colors.textSecondary },
    helpText: { ...typography.bodySmall, color: colors.textSecondary },
  });

  if (sent) {
    return (
      <View style={styles(colors).container}>
        <View style={styles(colors).header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles(colors).backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles(colors).headerTitle}>Check Your Email</Text>
        </View>

        <View style={styles(colors).content}>
          <View style={styles(colors).successContainer}>
            <View style={styles(colors).successIcon}>
              <Ionicons name="mail" size={40} color={colors.success} />
            </View>
            <Text style={styles(colors).successTitle}>Reset Link Sent!</Text>
            <Text style={styles(colors).successText}>
              We've sent a password reset link to{'\n'}
              <Text style={{ fontWeight: 'bold', color: colors.text }}>{email}</Text>
            </Text>
          </View>

          <Card variant="outlined" padding="medium">
            <Text style={{ ...typography.bodySmall, color: colors.textSecondary }}>
              Didn't receive the email? Check your spam folder, or{' '}
              <Text
                style={{ color: colors.primary, fontWeight: '600' }}
                onPress={() => {
                  setSent(false);
                  handleResetPassword();
                }}
              >
                try again
              </Text>
            </Text>
          </Card>

          <Spacer size="xl" />

          <Button
            title="Back to Login"
            onPress={() => navigation.goBack()}
            variant="primary"
            fullWidth
          />
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles(colors).container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles(colors).header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles(colors).backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>Reset Password</Text>
      </View>

      <View style={styles(colors).content}>
        <View style={styles(colors).iconContainer}>
          <View style={styles(colors).icon}>
            <Ionicons name="key" size={40} color={colors.primary} />
          </View>
        </View>

        <Text style={styles(colors).title}>Forgot Password?</Text>
        <Text style={styles(colors).subtitle}>
          Enter your email address and we'll send you a link to reset your password.
        </Text>

        <View style={styles(colors).inputContainer}>
          <Input
            label="Email Address"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon="mail"
          />
        </View>

        <Button
          title={loading ? 'Sending...' : 'Send Reset Link'}
          onPress={handleResetPassword}
          variant="primary"
          fullWidth
          disabled={loading}
          loading={loading}
        />

        <View style={styles(colors).helpCard}>
          <Text style={styles(colors).helpTitle}>Need Help?</Text>
          <View style={styles(colors).helpRow}>
            <Ionicons name="time" size={16} style={styles(colors).helpIcon} />
            <Text style={styles(colors).helpText}>Link expires in 1 hour</Text>
          </View>
          <View style={styles(colors).helpRow}>
            <Ionicons name="shield-checkmark" size={16} style={styles(colors).helpIcon} />
            <Text style={styles(colors).helpText}>Check your spam folder</Text>
          </View>
          <View style={styles(colors).helpRow}>
            <Ionicons name="help-circle" size={16} style={styles(colors).helpIcon} />
            <Text style={styles(colors).helpText}>Contact support@scholartrack.co.za</Text>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
