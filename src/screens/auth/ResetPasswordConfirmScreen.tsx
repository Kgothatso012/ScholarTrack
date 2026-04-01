// Reset Password Confirmation Screen
// Set new password after clicking reset link

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../lib/supabase';

// UI Plugin components
import { Card, Button, Spacer, Input } from '../../ui-plugin/components';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

export default function ResetPasswordConfirmScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | null>(null);

  useEffect(() => {
    if (password.length > 0) {
      const strength = getPasswordStrength(password);
      setPasswordStrength(strength);
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

  const getPasswordStrength = (pwd: string): 'weak' | 'medium' | 'strong' => {
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;

    if (score >= 4) return 'strong';
    if (score >= 2) return 'medium';
    return 'weak';
  };

  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'strong': return colors.success;
      case 'medium': return colors.warning;
      case 'weak': return colors.error;
      default: return colors.border;
    }
  };

  const getStrengthLabel = () => {
    switch (passwordStrength) {
      case 'strong': return 'Strong';
      case 'medium': return 'Medium';
      case 'weak': return 'Weak';
      default: return '';
    }
  };

  const handleResetPassword = async () => {
    if (!password) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        Alert.alert('Error', error.message || 'Failed to reset password');
        return;
      }

      Alert.alert(
        'Success!',
        'Your password has been reset successfully.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const styles = (colors: any) => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    keyboardView: { flex: 1 },
    header: { backgroundColor: colors.primary, padding: spacing.lg, paddingTop: 50 },
    headerTitle: { ...typography.h2, color: colors.textInverse },
    backBtn: { marginBottom: spacing.md },
    content: { flex: 1, padding: spacing.lg },
    iconContainer: { alignItems: 'center', marginVertical: spacing.lg },
    icon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success + '20', justifyContent: 'center', alignItems: 'center' },
    title: { ...typography.h2, color: colors.text, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },
    inputContainer: { marginBottom: spacing.md },
    passwordRequirements: { marginTop: spacing.sm },
    requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
    requirementIcon: { marginRight: spacing.sm },
    requirementText: { ...typography.bodySmall, color: colors.textSecondary },
    strengthBar: { height: 4, borderRadius: 2, marginTop: spacing.sm, overflow: 'hidden' },
    strengthFill: { height: '100%', borderRadius: 2 },
    strengthLabel: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs, textAlign: 'right' },
    successContainer: { alignItems: 'center', paddingVertical: spacing.xl },
    successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success + '20', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg },
  });

  return (
    <KeyboardAvoidingView
      style={styles(colors).container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles(colors).header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles(colors).backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles(colors).headerTitle}>New Password</Text>
      </View>

      <View style={styles(colors).content}>
        <View style={styles(colors).iconContainer}>
          <View style={styles(colors).icon}>
            <Ionicons name="lock-open" size={40} color={colors.success} />
          </View>
        </View>

        <Text style={styles(colors).title}>Create New Password</Text>
        <Text style={styles(colors).subtitle}>
          Enter a new password for your account.
        </Text>

        <View style={styles(colors).inputContainer}>
          <Input
            label="New Password"
            placeholder="Enter new password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            leftIcon="lock-closed"
            rightIcon={showPassword ? 'eye-off' : 'eye'}
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          {password.length > 0 && (
            <View style={styles(colors).strengthBar}>
              <View style={[styles(colors).strengthFill, { width: passwordStrength === 'weak' ? '33%' : passwordStrength === 'medium' ? '66%' : '100%', backgroundColor: getStrengthColor() }]} />
            </View>
          )}
          {passwordStrength && (
            <Text style={styles(colors).strengthLabel}>
              Password strength: {getStrengthLabel()}
            </Text>
          )}
        </View>

        <View style={styles(colors).inputContainer}>
          <Input
            label="Confirm Password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            leftIcon="lock-closed"
          />
        </View>

        <Card variant="outlined" padding="small" style={{ marginBottom: spacing.lg }}>
          <Text style={{ ...typography.labelSmall, color: colors.text, marginBottom: spacing.xs }}>Password Requirements:</Text>
          <View style={styles(colors).passwordRequirements}>
            <View style={styles(colors).requirementRow}>
              <Ionicons name={password.length >= 6 ? 'checkmark-circle' : 'close-circle'} size={16} color={password.length >= 6 ? colors.success : colors.textSecondary} style={styles(colors).requirementIcon} />
              <Text style={styles(colors).requirementText}>At least 6 characters</Text>
            </View>
            <View style={styles(colors).requirementRow}>
              <Ionicons name={password === confirmPassword && password.length > 0 ? 'checkmark-circle' : 'close-circle'} size={16} color={password === confirmPassword && password.length > 0 ? colors.success : colors.textSecondary} style={styles(colors).requirementIcon} />
              <Text style={styles(colors).requirementText}>Passwords match</Text>
            </View>
          </View>
        </Card>

        <Button
          title={loading ? 'Resetting...' : 'Reset Password'}
          onPress={handleResetPassword}
          variant="primary"
          fullWidth
          disabled={loading}
          loading={loading}
        />
      </View>
    </KeyboardAvoidingView>
  );
}
