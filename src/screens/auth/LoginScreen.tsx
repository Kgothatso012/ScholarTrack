// MalumeScholarTrack LoginScreen — Design System: Dark SA Transport
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, FadeIn, ZoomIn, Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';
import { Spacer, SpringTouchable } from '../../ui-plugin/components';
import { spacing, getTheme } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void; onRegister?: () => void; onForgotPassword?: () => void };
  onLogin?: (role: string) => void;
  confirmationError?: string | null;
  onConfirmationErrorHandled?: () => void;
}

const t = getTheme('dark');
const C = {
  // Primary amber accent (unified taste-skill)
  primary: t.colors.primary,
  primaryLight: t.colors.primaryLight,
  primaryDark: t.colors.primaryDark,
  // Cyan (unified taste-skill)
  cyan: t.colors.cyan,
  cyanLight: t.colors.cyanLight,
  // Success green (unified taste-skill)
  success: t.colors.success,
  successLight: t.colors.successLight,
  // Background / surface tokens
  background: t.colors.background,
  surface: t.colors.surface,
  surfaceElevated: t.colors.surfaceElevated,
  // Text tokens
  text: t.colors.text,
  textMuted: t.colors.textMuted,
  textSecondary: t.colors.textSecondary,
  // Border tokens
  border: t.colors.border,
  borderLight: t.colors.borderLight,
  // Shadows
  shadow: t.colors.shadow,
  shadowStrong: t.colors.shadowStrong,
  // Input background
  inputBg: t.colors.inputBg,
  // Glass surfaces (from cards preset)
  glassBg: 'rgba(255, 255, 255, 0.04)',
  glassCyanBorder: 'rgba(0, 229, 255, 0.10)',
  glassRefraction: 'rgba(0, 229, 255, 0.18)',
  glassAmberBorder: 'rgba(255, 183, 0, 0.10)',
  // Overlay
  overlay: t.colors.overlay,
  // Semantic aliases
  danger: t.colors.error,
  dangerLight: t.colors.errorLight,
};

// Breathing dot
const BreathingDot = ({ color = C.success, size = 8 }: { color?: string; size?: number }) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  useEffect(() => {
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

export default function LoginScreen({ navigation, onLogin, confirmationError, onConfirmationErrorHandled }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showResetSuccess, setShowResetSuccess] = useState(false);
  const [resetSentLoading, setResetSentLoading] = useState(false);

  // Show confirmation error alert when deep link fails
  useEffect(() => {
    if (confirmationError) {
      Alert.alert('Confirmation Failed', confirmationError, [
        { text: 'OK', onPress: onConfirmationErrorHandled }
      ]);
    }
  }, [confirmationError]);

  // Refs for input focus
  const passwordRef = useRef<TextInput | null>(null);

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setResetSentLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
        redirectTo: 'malumescholartrack://reset-password',
      });
      if (error) throw error;
      setShowResetSuccess(true);
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message || 'Failed to send reset email' : 'Failed to send reset email');
    } finally {
      setResetSentLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setShowResetModal(true);
  };


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

      // Prefer user_metadata.role (set at registration) over profiles.role (DB trigger may be NULL)
      const metaRole = data.user?.user_metadata?.role;
      const profileRole = profileData?.role;
      const userRole = (metaRole || profileRole || 'parent') as 'parent' | 'driver' | 'admin';
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
          } catch (err) { /* silent */ }
        } else if (!profileData?.role && data.user) {
          // Profile exists but role is NULL — sync from metadata
          await supabase.from('profiles').update({ role: userRole }).eq('id', data.user.id);
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

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    scrollView: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
    // HEADER
    header: {
      backgroundColor: C.surface,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      position: 'relative',
      overflow: 'hidden',
    },
    headerGlow1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: `${C.cyan}10` },
    headerGlow2: { position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: `${C.primary}10` },
    headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.xl },
    headerBrand: { fontFamily: 'Syne_700Bold', fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    headerSub: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 4, letterSpacing: 0.5 },
    headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    headerBadgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: C.textMuted },
    headerBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassCyanBorder, alignItems: 'center', justifyContent: 'center' },
    // GLASS
    glass: { backgroundColor: C.glassBg, borderWidth: 1, borderColor: C.glassCyanBorder, borderRadius: 20, overflow: 'hidden' },
    glassRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: C.glassRefraction },
    // LOGO
    logoSection: { alignItems: 'center', marginBottom: spacing.xl },
    logoCircle: {
      width: 72, height: 72, borderRadius: 20, backgroundColor: C.surface,
      justifyContent: 'center', alignItems: 'center',
      borderWidth: 1, borderColor: `${C.cyan}40`,
      shadowColor: C.cyan, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 8,
    },
    appTitle: { fontFamily: 'Syne_700Bold', fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5, marginTop: spacing.md },
    appSubtitle: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted, marginTop: spacing.xs, letterSpacing: 0.5 },
    // FORM
    formCard: { marginBottom: spacing.lg },
    welcomeText: { fontFamily: 'Syne_700Bold', fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    subtitleText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, marginTop: spacing.xs, marginBottom: spacing.lg },
    infoBox: { backgroundColor: `${C.cyan}10`, borderRadius: 14, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: C.cyan, marginTop: spacing.sm },
    infoTitle: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '700', color: C.cyan, marginBottom: spacing.sm },
    infoText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginBottom: spacing.xs },
    // INPUT
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: C.glassBg, borderWidth: 1, borderColor: `${C.cyan}1F`, borderRadius: 14, paddingHorizontal: 14, marginBottom: 12, height: 50 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 15, color: C.text },
    inputPlaceholder: { fontFamily: 'Syne_700Bold', fontSize: 15, color: C.textMuted },
    // FORGOT ROW
    forgotRow: { flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.md },
    forgotBtn: { paddingVertical: spacing.xs },
    forgotText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.cyan, fontWeight: '600' },
    // LOGIN BTN — primary amber (taste-skill cyan for login CTA — distinct from amber used in password field)
    loginBtn: {
      backgroundColor: C.cyan, borderRadius: 14, height: 52,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: C.cyan, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    loginBtnDisabled: { backgroundColor: C.textMuted },
    loginBtnText: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.background },
    // DIVIDER
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: C.glassBg },
    dividerText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginHorizontal: spacing.md, letterSpacing: 1, textTransform: 'uppercase' },
    // REGISTER
    registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
    registerText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted },
    registerLink: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.primary, fontWeight: '700' },
    // MODAL
    modalOverlay: { flex: 1, backgroundColor: C.overlay, justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    modalCard: { backgroundColor: C.surfaceElevated, borderWidth: 1, borderColor: C.border, borderRadius: 24, padding: spacing.xl, width: '100%', maxWidth: 400, position: 'relative' },
    modalRefraction: { position: 'absolute', top: 0, left: 0, right: 0, height: 1, backgroundColor: C.glassRefraction },
    modalClose: { position: 'absolute', top: spacing.md, right: spacing.md, width: 36, height: 36, borderRadius: 18, backgroundColor: C.glassBg, alignItems: 'center', justifyContent: 'center' },
    modalTitle: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '800', color: C.text, marginTop: spacing.xl, marginBottom: spacing.xs },
    modalSub: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, marginBottom: spacing.lg },
    // SUCCESS
    successWrap: { alignItems: 'center', paddingVertical: spacing.xl },
    successIcon: { width: 64, height: 64, borderRadius: 20, backgroundColor: `${C.success}26`, borderWidth: 1, borderColor: `${C.success}4D`, justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
    successTitle: { fontFamily: 'Syne_700Bold', fontSize: 18, fontWeight: '700', color: C.success, marginBottom: spacing.xs },
    successText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: spacing.lg },
    successEmail: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.text, fontWeight: '600' },
  });

  const now = new Date();
  

  return (
    <KeyboardAvoidingView style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scrollView} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View entering={FadeIn.springify()}>
          <View style={s.header}>
            <View style={s.headerGlow1} />
            <View style={s.headerGlow2} />
            <View style={s.headerTop}>
              <View>
                <Text style={s.headerBrand}>MalumeScholarTrack</Text>
                <Text style={s.headerSub}>Safe Student Transport</Text>
              </View>
              <View style={s.headerBadge}>
                <BreathingDot color={C.success} size={7} />
                <Text style={s.headerBadgeText}>Secure Login</Text>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Logo + Welcome */}
        <Animated.View entering={FadeIn.delay(100).springify()} style={s.logoSection}>
          <View style={s.logoCircle}>
            <Ionicons name="school" size={36} color={C.text} />
          </View>
          <Text style={s.appTitle}>Welcome Back</Text>
          <Text style={s.appSubtitle}>Sign in to your account</Text>
        </Animated.View>

        {/* Form Card */}
        <Animated.View entering={FadeIn.delay(200).springify()}>
          <View style={[s.glass, { marginBottom: spacing.lg, overflow: 'hidden' }]}>
            <View style={s.glassRefraction} />
            <View style={{ padding: spacing.lg }}>
              {/* Info toggle */}
              <TouchableOpacity onPress={() => setShowInfo(!showInfo)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.md }}>
                <Ionicons name="information-circle" size={16} color={C.cyan} />
                <Text style={{ fontFamily: 'Syne_700Bold', fontSize: 12, color: C.cyan }}>{showInfo ? 'Hide info' : 'What is MalumeScholarTrack?'}</Text>
              </TouchableOpacity>

              {showInfo && (
                <Animated.View entering={FadeIn.springify()} style={s.infoBox}>
                  <Text style={s.infoTitle}>Safe Student Transport</Text>
                  <Text style={s.infoText}>• Track your child's bus in real-time</Text>
                  <Text style={s.infoText}>• Hire trusted, verified drivers</Text>
                  <Text style={s.infoText}>• Get instant arrival alerts</Text>
                  <Text style={s.infoText}>• Emergency SOS button</Text>
                  <Text style={s.infoText}>• View payments & history</Text>
                </Animated.View>
              )}

              <Spacer size="md" />

              {/* Email Input */}
              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={C.cyan} style={s.inputIcon} />
                <TextInput
                  style={email ? s.input : s.inputPlaceholder}
                  placeholder="Email address"
                  placeholderTextColor={C.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                  onSubmitEditing={() => passwordRef.current?.focus()}
                />
              </View>

              {/* Password Input */}
              <View style={s.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={C.primary} style={s.inputIcon} />
                <TextInput
                  style={password ? s.input : s.inputPlaceholder}
                  placeholder="Password"
                  placeholderTextColor={C.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  ref={passwordRef}
                  returnKeyType="done"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
                </TouchableOpacity>
              </View>

              {/* Forgot Password */}
              <View style={s.forgotRow}>
                <TouchableOpacity onPress={handleForgotPassword} style={s.forgotBtn}>
                  <Text style={s.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>

              {/* Login Button */}
              <SpringTouchable onPress={handleLogin} style={{}}>
                <View style={[s.loginBtn, loading && s.loginBtnDisabled]}>
                  {loading ? (
                    <Text style={[s.loginBtnText, { color: 'rgba(5,8,16,.5)' }]}>Signing in…</Text>
                  ) : (
                    <Text style={s.loginBtnText}>Sign In</Text>
                  )}
                </View>
              </SpringTouchable>

              <Spacer size="md" />

              {/* Register */}
              <View style={s.registerRow}>
                <Text style={s.registerText}>Don't have an account?</Text>
                <TouchableOpacity onPress={handleRegister}>
                  <Text style={s.registerLink}>Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Time */}
        <Animated.View entering={FadeIn.delay(300).springify()} style={{ alignItems: 'center', marginTop: spacing.sm }}>

        </Animated.View>
      </ScrollView>

      {/* Password Reset Modal */}
      <Modal visible={showResetModal} animationType="slide" transparent>
        <View style={s.modalOverlay}>
          <Animated.View entering={ZoomIn.springify()} style={s.modalCard}>
            <View style={s.modalRefraction} />
            <TouchableOpacity onPress={() => setShowResetModal(false)} style={s.modalClose}>
              <Ionicons name="close" size={20} color={C.text} />
            </TouchableOpacity>

            {showResetSuccess ? (
              <View style={s.successWrap}>
                <View style={s.successIcon}>
                  <Ionicons name="mail" size={30} color={C.success} />
                </View>
                <Text style={s.successTitle}>Check Your Email</Text>
                <Text style={s.successText}>
                  We've sent a password reset link to{'\n'}
                  <Text style={s.successEmail}>{resetEmail}</Text>
                </Text>
                <TouchableOpacity onPress={() => { setShowResetModal(false); setShowResetSuccess(false); setResetEmail(''); }} style={[s.loginBtn, { marginTop: spacing.sm }]}>
                  <Text style={s.loginBtnText}>Back to Login</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={s.modalTitle}>Reset Password</Text>
                <Text style={s.modalSub}>Enter your email to receive a reset link</Text>
                <View style={s.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={C.cyan} style={s.inputIcon} />
                  <TextInput
                    style={resetEmail ? s.input : s.inputPlaceholder}
                    placeholder="Enter your email"
                    placeholderTextColor={C.textMuted}
                    value={resetEmail}
                    onChangeText={setResetEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <Spacer size="md" />
                <TouchableOpacity onPress={handlePasswordReset} style={[s.loginBtn, resetSentLoading && s.loginBtnDisabled]}>
                  <Text style={s.loginBtnText}>{resetSentLoading ? 'Sending…' : 'Send Reset Link'}</Text>
                </TouchableOpacity>
              </>
            )}
          </Animated.View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

