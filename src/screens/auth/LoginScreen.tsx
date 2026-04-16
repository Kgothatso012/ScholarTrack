import React, { useState } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { colors as themeColors } from '../../ui-plugin/theme';

// UI Plugin components - Soft & Friendly theme
import { Button } from '../../ui-plugin/components/Button';
import { Input } from '../../ui-plugin/components/Input';
import { Card } from '../../ui-plugin/components/Card';
import { Spacer } from '../../ui-plugin/components/Spacer';
import { spacing, typography, borderRadius } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void; onRegister?: () => void; onForgotPassword?: () => void };
  onLogin?: (role: string) => void;
}

export default function LoginScreen({ navigation, onLogin }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Use ui-plugin theme colors directly
  const colors = themeColors;


  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user?.id)
        .single();

      const userRole = profileData?.role || data.user?.user_metadata?.role || 'parent';
      const userName = profileData?.full_name || data.user?.user_metadata?.full_name || '';

      if (userRole) {
        await AsyncStorage.setItem('userRole', userRole);
        await AsyncStorage.setItem('userEmail', data.user?.email || '');
        await AsyncStorage.setItem('userName', userName);
        await AsyncStorage.setItem('userId', data.user?.id || '');

        if (!profileData && data.user) {
          try {
            await supabase.from('profiles').insert({
              id: data.user.id,
              email: data.user.email,
              role: userRole,
              full_name: userName,
              phone: data.user?.user_metadata?.phone || ''
            });
          } catch (err) {}
        }

        if (onLogin) onLogin(userRole);
      } else {
        Alert.alert('Error', 'User profile not found.');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message?.toLowerCase() || '' : '';
      if (errorMessage.includes('email not confirmed')) {
        Alert.alert('Email Not Confirmed', 'Please check your email and click the confirmation link.');
      } else if (errorMessage.includes('invalid login credentials')) {
        Alert.alert('Incorrect Credentials', 'Please check your credentials and try again.');
      } else if (errorMessage.includes('network')) {
        Alert.alert('Connection Error', 'Please check your internet connection.');
      } else {
        Alert.alert('Login Failed', 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = () => {
    if (navigation?.onRegister) {
      navigation.onRegister();
    } else if (navigation?.navigate) {
      navigation.navigate('Register');
    }
  };

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setResetLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'scholartrack://reset-password',
      });
      if (error) throw error;
      Alert.alert('Check Your Email', 'Password reset link has been sent.');
      setShowResetModal(false);
      setResetEmail('');
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message || 'Failed to send reset email' : 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (navigation?.onForgotPassword) {
      navigation.onForgotPassword();
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles(colors).container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles(colors).scrollView} keyboardShouldPersistTaps="handled">
        {/* Logo Section */}
        <View style={styles(colors).logoContainer}>
          <View style={styles(colors).logoCircle}>
            <Ionicons name="school" size={40} color={colors.textInverse} />
          </View>
          <Text style={styles(colors).appTitle}>ScholarTrack</Text>
          <Text style={styles(colors).appSubtitle}>Safe Student Transport</Text>
        </View>

        {/* Form Card */}
        <Card style={styles(colors).formCard}>
          <Text style={styles(colors).welcomeText}>Welcome Back</Text>
          <Text style={styles(colors).subtitleText}>Login to your account</Text>

          {/* Info Toggle */}
          <Button
            title={showInfo ? 'Hide Info' : 'What is ScholarTrack?'}
            variant="ghost"
            onPress={() => setShowInfo(!showInfo)}
            icon={<Ionicons name="information-circle-outline" size={18} color={colors.primary} />}
            iconPosition="left"
          />

          {showInfo && (
            <View style={styles(colors).infoBox}>
              <Text style={styles(colors).infoTitle}>Safe Student Transport</Text>
              <Text style={styles(colors).infoText}>• Track your child's bus in real-time</Text>
              <Text style={styles(colors).infoText}>• Hire trusted, verified drivers</Text>
              <Text style={styles(colors).infoText}>• Get instant arrival alerts</Text>
              <Text style={styles(colors).infoText}>• Emergency SOS button</Text>
              <Text style={styles(colors).infoText}>• View payments & history</Text>
            </View>
          )}

          <Spacer size="lg" />

          {/* Email Input */}
          <Input
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="Enter your email"
            keyboardType="email-address"
            autoCapitalize="none"
            leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
          />

          {/* Password Input */}
          <Input
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="Enter your password"
            secureTextEntry={!showPassword}
            rightIcon={
              <Ionicons
                name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={colors.textMuted}
              />
            }
            onRightIconPress={() => setShowPassword(!showPassword)}
          />

          {/* Forgot Password */}
          <Button
            title="Forgot Password?"
            variant="ghost"
            size="small"
            onPress={handleForgotPassword}
            textStyle={{ color: colors.primary }}
          />

          <Spacer size="md" />

          {/* Login Button */}
          <Button
            title={loading ? 'Logging in...' : 'Login'}
            variant="primary"
            size="large"
            onPress={handleLogin}
            loading={loading}
            fullWidth
          />

          <Spacer size="md" />

          {/* Register Link */}
          <Button
            title="Don't have an account? Sign Up"
            variant="ghost"
            onPress={handleRegister}
            textStyle={{ color: colors.textSecondary }}
          />
        </Card>
      </ScrollView>

      {/* Password Reset Modal */}
      <Modal visible={showResetModal} animationType="slide" transparent>
        <View style={styles(colors).modalOverlay}>
          <Card style={styles(colors).modalContent}>
            <Button
              title=""
              variant="ghost"
              onPress={() => setShowResetModal(false)}
              icon={<Ionicons name="close" size={24} color={colors.text} />}
              style={styles(colors).modalClose}
            />
            <Text style={styles(colors).modalTitle}>Reset Password</Text>
            <Text style={styles(colors).modalSubtitle}>Enter your email to receive a reset link</Text>

            <Input
              label="Email"
              value={resetEmail}
              onChangeText={setResetEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={20} color={colors.primary} />}
            />

            <Spacer size="md" />

            <Button
              title={resetLoading ? 'Sending...' : 'Send Reset Link'}
              variant="primary"
              size="large"
              onPress={handlePasswordReset}
              loading={resetLoading}
              fullWidth
            />
          </Card>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// Styles using Soft & Friendly theme
type UIColors = typeof themeColors;
const styles = (colors: UIColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  // Logo: asymmetric left-aligned composition
  logoContainer: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xxl,
    backgroundColor: colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    // Inner top highlight for premium feel
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 6,
  },
  appTitle: {
    ...typography.displayMedium,
    color: colors.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  formCard: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: borderRadius.xxl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(24, 24, 27, 0.04)',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
  welcomeText: {
    ...typography.h1,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitleText: {
    ...typography.body,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  infoBox: {
    backgroundColor: colors.primaryMuted,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  infoTitle: {
    ...typography.h4,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  infoText: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    borderRadius: borderRadius.xxl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(24, 24, 27, 0.04)',
    position: 'relative',
    shadowColor: colors.shadowStrong,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 1,
    shadowRadius: 24,
    elevation: 10,
  },
  modalClose: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    minWidth: 44,
    minHeight: 44,
  },
  modalTitle: {
    ...typography.h2,
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.lg,
  },
  modalSubtitle: {
    ...typography.body,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
});
