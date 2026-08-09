// ScholarTrack RegisterScreen — Design System: Dark SA Transport
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Linking } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, withSpring, FadeIn, Easing } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { CONSENT_VERSION, PRIVACY_POLICY_URL, TERMS_OF_SERVICE_URL } from '../../constants/app';
import { spacing, getTheme } from '../../ui-plugin/theme';

const { colors: C, spacing: S } = getTheme('dark');

interface Props {
  navigation: { goBack: () => void; navigate: (s: string) => void; onRegister?: () => void };
  onLogin?: (role: string) => void;
}

const SPRING = { damping: 15, stiffness: 150 };

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

// Spring press wrapper
const SpringTouchable = ({ children, onPress, style }: { children: React.ReactNode; onPress: () => void; style?: object }) => {
  const pressed = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: withSpring(1 - pressed.value * 0.04, SPRING) }] }));
  return (
    <TouchableOpacity onPress={onPress} onPressIn={() => { pressed.value = 1; }} onPressOut={() => { pressed.value = 0; }} activeOpacity={1} style={style}>
      <Animated.View style={animStyle}>{children}</Animated.View>
    </TouchableOpacity>
  );
};

// Role card
const RoleCard = ({ role, selected, onPress }: { role: { id: string; name: string; icon: string; description: string }; selected: boolean; onPress: () => void }) => {
  const cardStyle = {
    backgroundColor: selected ? 'rgba(255,183,0,.08)' : 'rgba(255,255,255,.04)',
    borderWidth: 1,
    borderColor: selected ? 'rgba(255,183,0,.4)' : 'rgba(255,255,255,.08)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  };
  const iconStyle = {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: selected ? 'rgba(255,183,0,.2)' : 'rgba(255,255,255,.06)',
    borderWidth: 1,
    borderColor: selected ? 'rgba(255,183,0,.35)' : 'rgba(255,255,255,.08)',
    justifyContent: 'center' as const, alignItems: 'center' as const,
  };
  const nameStyle = { fontFamily: 'Syne_700Bold', fontSize: 15, fontWeight: '600' as const, color: selected ? C.primary : C.text };
  const descStyle = { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, marginTop: 2 };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View style={cardStyle}>
        <View style={iconStyle}>
          <Ionicons name={role.icon as keyof typeof Ionicons.glyphMap} size={22} color={selected ? C.primary : C.textMuted} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={nameStyle}>{role.name}</Text>
          <Text style={descStyle}>{role.description}</Text>
        </View>
        {selected && <Ionicons name="checkmark-circle" size={22} color={C.primary} />}
      </View>
    </TouchableOpacity>
  );
};

export default function RegisterScreen({ navigation, onLogin }: Props) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'parent' | 'driver'>('parent');
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpInputRefs = useRef<(TextInput | null)[]>([]);
  const [pendingPhone, setPendingPhone] = useState('');
  const [usePhoneAuth, setUsePhoneAuth] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(false);

  const roles = [
    { id: 'parent', name: 'Parent', icon: 'people', description: 'Hire drivers for your children' },
    { id: 'driver', name: 'Driver', icon: 'car', description: 'Provide transport services' },
  ];

  const handleSendOTP = async () => {
    if (!consentAccepted) {
      Alert.alert('Consent required', 'Please accept the Privacy Policy and Terms of Service to continue.');
      return;
    }
    if (!name || !phone || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      let formattedPhone = cleanPhone;
      if (cleanPhone.startsWith('0')) {
        formattedPhone = '+27' + cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith('+')) {
        formattedPhone = '+27' + cleanPhone;
      }

      const { data, error } = await supabase.auth.signUp({
        phone: formattedPhone,
        password,
        options: {
          data: { full_name: name, role: selectedRole, consent_version: CONSENT_VERSION },
          emailRedirectTo: 'scholartrack://confirm'
        }
      });

      if (error) {
        if (error.message.includes('phone') || error.message.includes('SMS') || error.message.includes('disabled')) {
          Alert.alert(
            'SMS Not Available',
            'Phone verification requires SMS provider setup. Would you like to register with email instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Use Email', onPress: () => { setUsePhoneAuth(false); handleEmailRegister(); }}
            ]
          );
          setLoading(false);
          return;
        }
        throw error;
      }

      if (data.session) {
        await AsyncStorage.setItem('userRole', selectedRole);
        await AsyncStorage.setItem('userName', name);
        await AsyncStorage.setItem('userEmail', formattedPhone);
        if (data.user) { await AsyncStorage.setItem('userId', data.user.id); }
        (async () => { try { await supabase.rpc('record_consent', { p_version: CONSENT_VERSION, p_policy_url: PRIVACY_POLICY_URL }); } catch { /* consent recorded via metadata; persisted on next gate */ } })();
        Alert.alert('Success', 'You have successfully registered!', [
          { text: 'OK', onPress: () => { if (onLogin) { onLogin(selectedRole); } }}
        ]);
      } else {
        setPendingPhone(formattedPhone);
        setStep('otp');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async () => {
    if (!consentAccepted) {
      Alert.alert('Consent required', 'Please accept the Privacy Policy and Terms of Service to continue.');
      return;
    }
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: name, phone: phone || '', role: selectedRole },
          emailRedirectTo: 'scholartrack://confirm'
        }
      });

      if (error) throw error;

      if (!data.session) {
        Alert.alert('Registration Successful', 'Please check your email to confirm your account, then login.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        setLoading(false);
        return;
      }

      await AsyncStorage.setItem('userRole', selectedRole);
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userEmail', email);
      if (data.user) { await AsyncStorage.setItem('userId', data.user.id); }
      Alert.alert('Success', 'You have successfully registered!', [
        { text: 'OK', onPress: () => { if (onLogin) { onLogin(selectedRole); } }}
      ]);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : (error as { error_description?: string })?.error_description || '';
      if (errorMsg.toLowerCase().includes('already registered') ||
          errorMsg.toLowerCase().includes('already exists') ||
          errorMsg.toLowerCase().includes('user already')) {
        Alert.alert('Email Already Registered', 'This email is already in use. Please login instead or use a different email.');
      } else if (errorMsg.toLowerCase().includes('invalid email')) {
        Alert.alert('Invalid Email', 'Please enter a valid email address.');
      } else {
        Alert.alert('Registration Error', errorMsg || 'Failed to create account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the 6-digit code');
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone: pendingPhone,
        token: otpCode,
        type: 'sms'
      });
      if (error) throw error;
      await AsyncStorage.setItem('userRole', selectedRole);
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userEmail', pendingPhone);
      if (data.user) { await AsyncStorage.setItem('userId', data.user.id); }
      Alert.alert('Success', 'Phone verified! Welcome to ScholarTrack.', [
        { text: 'OK', onPress: () => { if (onLogin) { onLogin(selectedRole); } }}
      ]);
    } catch (error) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const { error } = await supabase.auth.signUp({ phone: pendingPhone, password });
      if (error) throw error;
      Alert.alert('OTP Resent', 'A new verification code has been sent');
    } catch (error) {
      Alert.alert('Error', 'Failed to resend code.');
    }
  };

  // Styles
  const s = StyleSheet.create({
    container: { flex: 1, backgroundColor: C.background },
    scroll: { flex: 1 },
    // HEADER
    header: {
      backgroundColor: C.backgroundAlt,
      padding: S.lg,
      paddingTop: S.xxl,
      borderBottomLeftRadius: 28,
      borderBottomRightRadius: 28,
      position: 'relative',
      overflow: 'hidden',
    },
    headerGlow1: { position: 'absolute', top: -60, right: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(255,183,0,.06)' },
    headerGlow2: { position: 'absolute', bottom: -50, left: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,35,149,.1)' },
    backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,.08)', borderWidth: 1, borderColor: 'rgba(255,255,255,.1)', justifyContent: 'center', alignItems: 'center', marginBottom: S.md },
    headerTitle: { fontFamily: 'Syne_700Bold', fontSize: 26, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
    headerSub: { fontFamily: 'Syne_700Bold', fontSize: 12, color: C.primary, marginTop: S.xs },
    headerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: S.sm },
    headerBadgeText: { fontFamily: 'Syne_700Bold', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.4)' },
    // FORM
    form: { padding: S.lg, flex: 1 },
    sectionLabel: { fontFamily: 'Syne_700Bold', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase' as const, color: 'rgba(255,255,255,.2)', marginBottom: S.sm, marginTop: S.md },
    // AUTH TOGGLE
    authToggle: { flexDirection: 'row' as const, backgroundColor: 'rgba(255,255,255,.04)', borderRadius: 14, padding: 4, marginBottom: S.md, borderWidth: 1, borderColor: 'rgba(255,255,255,.08)' },
    authToggleBtn: { flex: 1, flexDirection: 'row' as const, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 11, gap: 6 },
    authToggleActive: { backgroundColor: C.primary },
    authToggleText: { fontFamily: 'Syne_700Bold', fontSize: 13, fontWeight: '600' as const, color: C.textMuted },
    authToggleTextActive: { color: C.background },
    // INPUT
    inputWrap: { flexDirection: 'row' as const, alignItems: 'center', backgroundColor: 'rgba(255,255,255,.04)', borderWidth: 1, borderColor: 'rgba(255,183,0,.1)', borderRadius: 14, paddingHorizontal: 14, marginBottom: 12, height: 52 },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, fontFamily: 'Syne_700Bold', fontSize: 15, color: C.text },
    inputPlaceholder: { fontFamily: 'Syne_700Bold', fontSize: 15, color: C.textMuted },
    // REGISTER BTN
    registerBtn: {
      backgroundColor: C.primary, borderRadius: 14, height: 52,
      justifyContent: 'center', alignItems: 'center', marginTop: S.md,
      shadowColor: C.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 4,
    },
    registerBtnDisabled: { backgroundColor: C.textMuted },
    registerBtnText: { fontFamily: 'Syne_700Bold', fontSize: 16, fontWeight: '700', color: C.background },
    // TERMS
    termsContainer: { marginTop: S.lg, alignItems: 'center' },
    termsText: { fontFamily: 'Syne_700Bold', fontSize: 11, color: C.textMuted, textAlign: 'center', lineHeight: 18 },
    termsLink: { color: C.primary, fontWeight: '600' },
    // LOGIN LINK
    loginContainer: { alignItems: 'center', marginTop: S.lg, marginBottom: S.xl },
    loginText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted },
    loginLink: { color: C.cyan, fontWeight: '700' },
    // OTP
    otpContainer: { flexDirection: 'row' as const, justifyContent: 'center', marginVertical: S.xl },
    otpInput: {
      width: 48, height: 54, borderWidth: 1, borderColor: 'rgba(255,183,0,.3)',
      borderRadius: 12, marginHorizontal: 4, fontFamily: 'Syne_700Bold', fontSize: 22,
      fontWeight: '700', color: C.text, textAlign: 'center' as const,
      backgroundColor: 'rgba(255,255,255,.04)',
    },
    resendContainer: { flexDirection: 'row' as const, justifyContent: 'center', marginTop: S.lg },
    resendText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted },
    resendLink: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.cyan, fontWeight: '600' },
    goBackContainer: { alignItems: 'center', marginTop: S.lg },
    goBackText: { fontFamily: 'Syne_700Bold', fontSize: 13, color: C.textMuted },
    goBackLink: { color: C.primary, fontWeight: '600' },
  });

  // ─── OTP Verification Screen ────────────────────────────────────────────────
  if (step === 'otp') {
    return (
      <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View entering={FadeIn.springify()}>
          <View style={s.header}>
            <View style={s.headerGlow1} />
            <View style={s.headerGlow2} />
            <TouchableOpacity onPress={() => setStep('register')} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={C.text} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Verify Phone</Text>
            <Text style={s.headerSub}>Enter the code sent to {pendingPhone}</Text>
            <View style={s.headerBadge}>
              <BreathingDot color={C.primary} size={7} />
              <Text style={s.headerBadgeText}>Verification</Text>
            </View>
          </View>
        </Animated.View>

        <View style={s.form}>
          <Animated.View entering={FadeIn.delay(100).springify()}>
            <View style={s.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el: TextInput | null) => { otpInputRefs.current[index] = el; }}
                  style={s.otpInput}
                  value={digit}
                  onChangeText={(value) => {
                    const newOtp = [...otp];
                    newOtp[index] = value.replace(/[^0-9]/g, '');
                    setOtp(newOtp);
                    if (value && index < 5) {
                      otpInputRefs.current[index + 1]?.focus();
                    }
                  }}
                  onKeyPress={(e) => {
                    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
                      otpInputRefs.current[index - 1]?.focus();
                    }
                  }}
                  keyboardType="numeric"
                  maxLength={1}
                  placeholder="0"
                  placeholderTextColor={C.textMuted}
                />
              ))}
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(150).springify()}>
            <TouchableOpacity
              onPress={handleVerifyOTP}
              disabled={loading}
              style={[s.registerBtn, loading && s.registerBtnDisabled]}
            >
              <Text style={s.registerBtnText}>{loading ? 'Verifying…' : 'Verify Code'}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(200).springify()}>
            <View style={s.resendContainer}>
              <Text style={s.resendText}>Didn't receive the code?</Text>
              <TouchableOpacity onPress={handleResendOTP}>
                <Text style={s.resendLink}> Resend</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          <Animated.View entering={FadeIn.delay(250).springify()}>
            <View style={s.goBackContainer}>
              <Text style={s.goBackText}>
                Wrong number? <Text style={s.goBackLink} onPress={() => setStep('register')}>Go Back</Text>
              </Text>
            </View>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─── Registration Screen ────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={s.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.springify()}>
          <View style={s.header}>
            <View style={s.headerGlow1} />
            <View style={s.headerGlow2} />
            <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
              <Ionicons name="arrow-back" size={20} color={C.text} />
            </TouchableOpacity>
            <Text style={s.headerTitle}>Create Account</Text>
            <Text style={s.headerSub}>Join ScholarTrack SA</Text>
            <View style={s.headerBadge}>
              <BreathingDot color={C.success} size={7} />
              <Text style={s.headerBadgeText}>Get Started</Text>
            </View>
          </View>
        </Animated.View>

        <View style={s.form}>
          {/* Role Selection */}
          <Text style={s.sectionLabel}>I am a…</Text>
          {roles.map((role, index) => (
            <Animated.View key={role.id} entering={FadeIn.delay(index * 60).springify()}>
              <RoleCard
                role={role}
                selected={selectedRole === role.id}
                onPress={() => setSelectedRole(role.id as 'parent' | 'driver')}
              />
            </Animated.View>
          ))}

          <Text style={s.sectionLabel}>Personal Details</Text>

          {/* Auth Method Toggle */}
          <Animated.View entering={FadeIn.delay(100).springify()}>
            <View style={s.authToggle}>
              <TouchableOpacity
                style={[s.authToggleBtn, usePhoneAuth && s.authToggleActive]}
                onPress={() => setUsePhoneAuth(true)}
              >
                <Ionicons name="call-outline" size={16} color={usePhoneAuth ? C.background : C.textMuted} />
                <Text style={usePhoneAuth ? s.authToggleTextActive : s.authToggleText}>Phone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.authToggleBtn, !usePhoneAuth && s.authToggleActive]}
                onPress={() => setUsePhoneAuth(false)}
              >
                <Ionicons name="mail-outline" size={16} color={!usePhoneAuth ? C.background : C.textMuted} />
                <Text style={!usePhoneAuth ? s.authToggleTextActive : s.authToggleText}>Email</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Name Input */}
          <Animated.View entering={FadeIn.delay(130).springify()}>
            <View style={s.inputWrap}>
              <Ionicons name="person-outline" size={18} color={C.primary} style={s.inputIcon} />
              <TextInput
                style={name ? s.input : s.inputPlaceholder}
                placeholder="Full Name"
                placeholderTextColor={C.textMuted}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </Animated.View>

          {/* Phone / Email Input */}
          <Animated.View entering={FadeIn.delay(160).springify()}>
            {usePhoneAuth ? (
              <View style={s.inputWrap}>
                <Ionicons name="call-outline" size={18} color={C.cyan} style={s.inputIcon} />
                <TextInput
                  style={phone ? s.input : s.inputPlaceholder}
                  placeholder="Phone Number (e.g., 0821234567)"
                  placeholderTextColor={C.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            ) : (
              <View style={s.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={C.cyan} style={s.inputIcon} />
                <TextInput
                  style={email ? s.input : s.inputPlaceholder}
                  placeholder="Email Address"
                  placeholderTextColor={C.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            )}
          </Animated.View>

          {/* Password Input */}
          <Animated.View entering={FadeIn.delay(190).springify()}>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={C.primary} style={s.inputIcon} />
              <TextInput
                style={password ? s.input : s.inputPlaceholder}
                placeholder="Password"
                placeholderTextColor={C.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={{ padding: 4 }}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={C.textMuted} />
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Confirm Password Input */}
          <Animated.View entering={FadeIn.delay(220).springify()}>
            <View style={s.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={C.primary} style={s.inputIcon} />
              <TextInput
                style={confirmPassword ? s.input : s.inputPlaceholder}
                placeholder="Confirm Password"
                placeholderTextColor={C.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
          </Animated.View>

          {/* Register Button */}
          <Animated.View entering={FadeIn.delay(250).springify()}>
            <SpringTouchable onPress={() => usePhoneAuth ? handleSendOTP() : handleEmailRegister()} style={{}}>
              <TouchableOpacity
                disabled={loading || !consentAccepted}
                style={[s.registerBtn, loading && s.registerBtnDisabled]}
              >
                <Text style={s.registerBtnText}>{loading ? 'Creating Account…' : 'Create Account'}</Text>
              </TouchableOpacity>
            </SpringTouchable>
          </Animated.View>

          {/* Consent */}
          <Animated.View entering={FadeIn.delay(280).springify()}>
            <View style={s.termsContainer}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'flex-start' }}
                onPress={() => setConsentAccepted(v => !v)}
                activeOpacity={0.7}
              >
                <View style={{
                  width: 22, height: 22, borderRadius: 6, borderWidth: 2,
                  borderColor: consentAccepted ? C.success : C.textMuted,
                  backgroundColor: consentAccepted ? C.success : 'transparent',
                  marginRight: 10, marginTop: 2, alignItems: 'center', justifyContent: 'center',
                }}>
                  {consentAccepted ? <Ionicons name="checkmark" size={16} color="#fff" /> : null}
                </View>
                <Text style={[s.termsText, { flex: 1 }]}>
                  I have read and agree to the{' '}
                  <Text style={s.termsLink} onPress={() => Linking.openURL(TERMS_OF_SERVICE_URL)}>Terms of Service</Text> and{' '}
                  <Text style={s.termsLink} onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}>Privacy Policy</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Login Link */}
          <Animated.View entering={FadeIn.delay(310).springify()}>
            <View style={s.loginContainer}>
              <Text style={s.loginText}>
                Already have an account?{' '}
                <Text style={s.loginLink} onPress={() => navigation.navigate('Login')}>Login</Text>
              </Text>
            </View>
          </Animated.View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
