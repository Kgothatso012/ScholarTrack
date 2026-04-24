// ScholarTrack ForgotPasswordScreen — Design System: Dark SA Transport
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, FadeIn, ZoomIn, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../../lib/supabase';
import { Spacer } from '../../ui-plugin/components';
import { spacing } from '../../ui-plugin/theme';

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void };
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

export default function ForgotPasswordScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }
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
      setSent(true);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: DT.bg },
    header: {
      backgroundColor: DT.bg2,
      padding: spacing.lg,
      paddingTop: insets.top + spacing.lg,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      position: 'relative',
      overflow: 'hidden',
    },
    headerGlow1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,183,0,.06)' },
    headerGlow2: { position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(255,61,90,.06)' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', justifyContent: 'center', alignItems: 'center', marginBottom: spacing.md },
    headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '800', color: DT.white, letterSpacing: -0.5 },
    headerSub: { fontFamily: 'Syne_700Bold', fontSize: 12, color: 'rgba(255,255,255,.45)', marginTop: spacing.xs },
    headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
    headerBadgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.4)' },
    content: { flex: 1, padding: spacing.lg },
    iconContainer: { alignItems: 'center', marginVertical: spacing.xl },
    iconWrap: {
      width: 80, height: 80, borderRadius: 22, backgroundColor: 'rgba(255,183,0,.1)',
      borderWidth: 1, borderColor: 'rgba(255,183,0,.25)',
      justifyContent: 'center', alignItems: 'center',
    },
    title: { fontFamily: 'Syne_700Bold', fontSize: 22, fontWeight: '800', color: DT.white, textAlign: 'center', marginBottom: spacing.sm },
    subtitle: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.muted, textAlign: 'center', marginBottom: spacing.xl },
    // INPUT
    inputWrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(255,183,0,.12)', borderRadius: 14, paddingHorizontal: 14, marginBottom: spacing.md, height: 52 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 15, color: DT.white },
    inputPlaceholder: { fontFamily: 'Syne_700Bold', fontSize: 15, color: DT.muted },
    // SUBMIT BTN
    submitBtn: {
      backgroundColor: DT.amber, borderRadius: 14, height: 52,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: DT.amber, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    submitBtnDisabled: { backgroundColor: DT.muted },
    submitBtnText: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: DT.bg },
    // HELP CARD
    helpCard: {
      backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,.1)',
      borderRadius: 16, padding: spacing.lg, marginTop: spacing.xl,
      borderTopWidth: 1, borderTopColor: 'rgba(0,229,255,.15)',
    },
    helpTitle: { fontFamily: 'Syne_700Bold', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', color: 'rgba(255,255,255,.35)', marginBottom: spacing.md },
    helpRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
    helpIcon: { marginRight: spacing.sm, color: DT.cyan },
    helpText: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted },
    // SUCCESS
    successContainer: { alignItems: 'center', paddingVertical: spacing.xl },
    successIconWrap: {
      width: 80, height: 80, borderRadius: 22, backgroundColor: 'rgba(0,230,118,.1)',
      borderWidth: 1, borderColor: 'rgba(0,230,118,.25)',
      justifyContent: 'center', alignItems: 'center', marginBottom: spacing.lg,
    },
    successTitle: { fontFamily: 'Syne_700Bold', fontSize: 20, fontWeight: '800', color: DT.green2, textAlign: 'center', marginBottom: spacing.sm },
    successText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.muted, textAlign: 'center', marginBottom: spacing.lg },
    successEmail: { fontFamily: 'Syne_700Bold', fontSize: 13, color: DT.white, fontWeight: '600' },
    backBtn2: {
      backgroundColor: DT.amber, borderRadius: 14, height: 52,
      justifyContent: 'center', alignItems: 'center',
      shadowColor: DT.amber, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    backBtn2Text: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: DT.bg },
    // TRY AGAIN LINK
    tryAgain: { color: DT.cyan, fontWeight: '600' },
    helpCard2: {
      backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(0,229,255,.1)',
      borderRadius: 16, padding: spacing.md,
      borderTopWidth: 1, borderTopColor: 'rgba(0,229,255,.15)',
    },
    helpCard2Text: { fontFamily: 'Syne_700Bold', fontSize: 12, color: DT.muted, textAlign: 'center', lineHeight: 18 },
  });

  if (sent) {
    return (
      <View style={s.container}>
        <Animated.View entering={FadeIn.springify()}>
          <View style={s.header}>
            <View style={s.headerGlow1} />
            <View style={s.headerGlow2} />
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={DT.white} />
            </TouchableOpacity>
            <View style={s.headerBadge}>
              <BreathingDot color={DT.green2} size={7} />
              <Text style={s.headerBadgeText}>Email Sent</Text>
            </View>
          </View>
        </Animated.View>

        <View style={s.content}>
          <Animated.View entering={FadeIn.delay(100).springify()}>
            <View style={s.successContainer}>
              <View style={s.successIconWrap}>
                <Ionicons name="mail" size={36} color={DT.green2} />
              </View>
              <Text style={s.successTitle}>Reset Link Sent!</Text>
              <Text style={s.successText}>
                We've sent a password reset link to{'\n'}
                <Text style={s.successEmail}>{email}</Text>
              </Text>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200).springify()}>
            <View style={s.helpCard2}>
              <Text style={s.helpCard2Text}>
                Didn't receive the email? Check your spam folder, or{' '}
                <Text style={s.tryAgain} onPress={() => { setSent(false); handleResetPassword(); }}>try again</Text>
              </Text>
            </View>
          </Animated.View>

          <Spacer size="lg" />

          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn2}>
            <Text style={s.backBtn2Text}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <Animated.View entering={FadeIn.springify()}>
        <View style={s.header}>
          <View style={s.headerGlow1} />
          <View style={s.headerGlow2} />
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
            <Ionicons name="arrow-back" size={20} color={DT.white} />
          </TouchableOpacity>
          <Text style={s.headerTitle}>Reset Password</Text>
          <Text style={s.headerSub}>We'll help you recover your account</Text>
          <View style={s.headerBadge}>
            <BreathingDot color={DT.amber} size={7} />
            <Text style={s.headerBadgeText}>Account Recovery</Text>
          </View>
        </View>
      </Animated.View>

      <View style={s.content}>
        <Animated.View entering={FadeIn.delay(100).springify()}>
          <View style={s.iconContainer}>
            <View style={s.iconWrap}>
              <Ionicons name="key" size={36} color={DT.amber} />
            </View>
          </View>

          <Text style={s.title}>Forgot Password?</Text>
          <Text style={s.title} />
        </Animated.View>

        <Animated.View entering={FadeIn.delay(150).springify()}>
          <Text style={s.subtitle}>
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(200).springify()}>
          <View style={s.inputWrap}>
            <Ionicons name="mail-outline" size={18} color={DT.cyan} style={s.inputIcon} />
            <TextInput
              style={email ? s.input : s.inputPlaceholder}
              placeholder="Enter your email"
              placeholderTextColor={DT.muted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <TouchableOpacity
            onPress={handleResetPassword}
            disabled={loading}
            style={[s.submitBtn, loading && s.submitBtnDisabled]}
          >
            {loading ? (
              <ActivityIndicator color={DT.bg} size="small" />
            ) : (
              <Text style={s.submitBtnText}>Send Reset Link</Text>
            )}
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeIn.delay(300).springify()}>
          <View style={s.helpCard}>
            <Text style={s.helpTitle}>Need Help?</Text>
            <View style={s.helpRow}>
              <Ionicons name="time" size={16} style={s.helpIcon} />
              <Text style={s.helpText}>Link expires in 1 hour</Text>
            </View>
            <View style={s.helpRow}>
              <Ionicons name="shield-checkmark" size={16} style={s.helpIcon} />
              <Text style={s.helpText}>Check your spam folder</Text>
            </View>
            <View style={s.helpRow}>
              <Ionicons name="help-circle" size={16} style={s.helpIcon} />
              <Text style={s.helpText}>Contact support@scholartrack.co.za</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </KeyboardAvoidingView>
  );
}
