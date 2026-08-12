// MalumeScholarTrack ResetPasswordConfirmScreen — Design System: Dark SA Transport
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeIn, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { spacing, getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S } = getTheme('dark');

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
}

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

export default function ResetPasswordConfirmScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
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
      case 'strong': return C.success;
      case 'medium': return C.primary;
      case 'weak': return C.error;
      default: return C.border;
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

  const getStrengthWidth = () => {
    switch (passwordStrength) {
      case 'weak': return '33%';
      case 'medium': return '66%';
      case 'strong': return '100%';
      default: return '0%';
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
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        Alert.alert('Error', error.message || 'Failed to reset password');
        return;
      }
      Alert.alert(
        'Success!',
        'Your password has been reset successfully.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    header: {
      backgroundColor: C.backgroundAlt,
      padding: S.lg,
      paddingTop: insets.top + S.lg,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      position: 'relative',
      overflow: 'hidden',
    },
    headerGlow1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(0,230,118,.06)' },
    headerGlow2: { position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,229,255,.06)' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', justifyContent: 'center', alignItems: 'center', marginBottom: S.md },
    headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    headerSub: { fontFamily: 'Syne_700Bold', fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: S.xs },
    headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: S.sm },
    headerBadgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' },
    content: { flex: 1, padding: S.lg },
    iconContainer: { alignItems: 'center', marginVertical: S.xl },
    iconWrap: {
      width: 80, height: 80, borderRadius: 22,
      backgroundColor: 'rgba(0,230,118,.1)', borderWidth: 1, borderColor: 'rgba(0,230,118,.25)',
      justifyContent: 'center', alignItems: 'center',
    },
    title: { fontFamily: 'Syne_700Bold', fontSize: 22, fontWeight: '800', color: C.text, textAlign: 'center', marginBottom: S.sm },
    subtitle: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted, textAlign: 'center', marginBottom: S.xl },
    // INPUT
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,.12)', borderRadius: 14, paddingHorizontal: 14, marginBottom: 12, height: 52 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 15, color: C.text },
    inputPlaceholder: { fontFamily: 'Syne_700Bold', fontSize: 15, color: C.textMuted },
    // STRENGTH BAR
    strengthBar: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,.06)', marginTop: S.xs, overflow: 'hidden' },
    strengthFill: { height: '100%', borderRadius: 2 },
    strengthLabel: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: S.xs, textAlign: 'right' },
    // REQUIREMENTS
    requirementsCard: {
      backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,.1)',
      borderRadius: 16, padding: S.md, marginBottom: S.lg,
      borderTopWidth: 1, borderTopColor: 'rgba(0,229,255,.15)',
    },
    requirementsTitle: { fontFamily: 'Syne_700Bold', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: S.sm },
    requirementRow: { flexDirection: 'row', alignItems: 'center', marginBottom: S.xs },
    requirementIcon: { marginRight: S.sm },
    requirementText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.textMuted },
    // SUBMIT BTN
    submitBtn: {
      backgroundColor: C.success, borderRadius: 14, height: 52,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: C.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    submitBtnDisabled: { backgroundColor: C.textMuted },
    submitBtnText: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.background },
  });

  const req1Met = password.length >= 6;
  const req2Met = password === confirmPassword && password.length > 0;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View entering={FadeIn.springify()}>
        <View style={s.header}>
          <View style={s.headerGlow1} />
          <View style={s.headerGlow2} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={C.text} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>New Password</Text>
          <Text style={s.headerSub}>Create a secure new password</Text>
          <View style={s.headerBadge}>
            <BreathingDot color={C.success} size={7} />
            <Text style={s.headerBadgeText}>Account Recovery</Text>
          </View>
        </View>
      </Animated.View>

      <View style={s.content}>
        <Animated.View entering={FadeIn.delay(100).springify()}>
          <View style={s.iconContainer}>
            <View style={s.iconWrap}>
              <Ionicons name="lock-open" size={36} color={C.success} />
            </View>
          </View>

          <Text style={s.title}>Create New Password</Text>
          <Text style={s.subtitle}>Enter a new secure password for your account.</Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(150).springify()}>
          {/* New Password Input */}
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={C.primary} style={s.inputIcon} />
            <TextInput
              style={password ? s.input : s.inputPlaceholder}
              placeholder="New Password"
              placeholderTextColor={C.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Strength Bar */}
          {password.length > 0 && (
            <View style={{ marginBottom: S.sm }}>
              <View style={s.strengthBar}>
                <View style={[s.strengthFill, { width: getStrengthWidth(), backgroundColor: getStrengthColor() }]} />
              </View>
              <Text style={s.strengthLabel}>Password strength: {getStrengthLabel()}</Text>
            </View>
          )}

          {/* Confirm Password Input */}
          <View style={s.inputWrap}>
            <Ionicons name="lock-closed-outline" size={18} color={C.cyan} style={s.inputIcon} />
            <TextInput
              style={confirmPassword ? s.input : s.inputPlaceholder}
              placeholder="Confirm Password"
              placeholderTextColor={C.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).springify()}>
          <View style={s.requirementsCard}>
            <Text style={s.requirementsTitle}>Password Requirements</Text>
            <View style={s.requirementRow}>
              <Ionicons
                name={req1Met ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={req1Met ? C.success : C.textMuted}
                style={s.requirementIcon}
              />
              <Text style={[s.requirementText, req1Met && { color: C.success }]}>At least 6 characters</Text>
            </View>
            <View style={s.requirementRow}>
              <Ionicons
                name={req2Met ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={req2Met ? C.success : C.textMuted}
                style={s.requirementIcon}
              />
              <Text style={[s.requirementText, req2Met && { color: C.success }]}>Passwords match</Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={loading}
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={C.background} size="small" />
            ) : (
              <Text style={s.submitBtnText}>Reset Password</Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
