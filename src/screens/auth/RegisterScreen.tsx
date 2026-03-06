import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function RegisterScreen({ navigation, onLogin }: any) {
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
  const [usePhoneAuth, setUsePhoneAuth] = useState(true);

  const roles = [
    { id: 'parent', name: 'Parent', icon: 'people', description: 'Hire drivers for your children' },
    { id: 'driver', name: 'Driver', icon: 'car', description: 'Provide transport services' },
  ];

  const handleSendOTP = async () => {
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

    // Validate phone number (South African format)
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 10) {
      Alert.alert('Error', 'Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      // Format phone for South Africa
      let formattedPhone = cleanPhone;
      if (cleanPhone.startsWith('0')) {
        formattedPhone = '+27' + cleanPhone.substring(1);
      } else if (!cleanPhone.startsWith('+')) {
        formattedPhone = '+27' + cleanPhone;
      }

      // Sign up with phone - Supabase will send OTP
      const { data, error } = await supabase.auth.signUp({
        phone: formattedPhone,
        password,
        options: {
          data: {
            full_name: name,
            role: selectedRole
          }
        }
      });

      if (error) {
        // If phone auth fails (no SMS provider), fall back to email
        if (error.message.includes('phone') || error.message.includes('SMS')) {
          Alert.alert(
            'SMS Not Available',
            'Phone verification requires SMS provider setup. Would you like to register with email instead?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Use Email', onPress: () => {
                setUsePhoneAuth(false);
                handleEmailRegister();
              }}
            ]
          );
          setLoading(false);
          return;
        }
        throw error;
      }

      if (data.session) {
        // No OTP needed, auto-confirmed
        await AsyncStorage.setItem('userRole', selectedRole);
        await AsyncStorage.setItem('userName', name);
        await AsyncStorage.setItem('userEmail', formattedPhone);
        if (data.user) {
          await AsyncStorage.setItem('userId', data.user.id);
        }

        Alert.alert('Success', 'You have successfully registered!', [
          { text: 'OK', onPress: () => {
            if (onLogin) {
              onLogin(selectedRole);
            }
          }}
        ]);
      } else {
        // OTP required - show OTP screen
        setPendingPhone(formattedPhone);
        setStep('otp');
      }
    } catch (error: any) {
      console.error('OTP send error:', error);
      Alert.alert('Error', error.message || 'Failed to send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailRegister = async () => {
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
          data: {
            full_name: name,
            phone: phone || '',
            role: selectedRole
          }
        }
      });

      if (error) throw error;

      // Check if email confirmation required
      if (!data.session) {
        Alert.alert('Registration Successful', 'Please check your email to confirm your account, then login.', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
        setLoading(false);
        return;
      }

      // Auto login
      await AsyncStorage.setItem('userRole', selectedRole);
      await AsyncStorage.setItem('userName', name);
      await AsyncStorage.setItem('userEmail', email);
      if (data.user) {
        await AsyncStorage.setItem('userId', data.user.id);
      }

      Alert.alert('Success', 'You have successfully registered!', [
        { text: 'OK', onPress: () => {
          if (onLogin) {
            onLogin(selectedRole);
          }
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create account.');
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
      if (data.user) {
        await AsyncStorage.setItem('userId', data.user.id);
      }

      Alert.alert('Success', 'Phone verified! Welcome to ScholarTrack.', [
        { text: 'OK', onPress: () => {
          if (onLogin) {
            onLogin(selectedRole);
          }
        }}
      ]);
    } catch (error: any) {
      Alert.alert('Error', 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      const { error } = await supabase.auth.signUp({
        phone: pendingPhone,
        password,
      });

      if (error) throw error;
      Alert.alert('OTP Resent', 'A new verification code has been sent');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend code.');
    }
  };

  // OTP Verification Screen
  if (step === 'otp') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <TouchableOpacity onPress={() => setStep('register')} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Verify Phone</Text>
            <Text style={styles.headerSubtitle}>Enter the code sent to {pendingPhone}</Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.otpContainer}>
              {otp.map((digit, index) => (
                <TextInput
                  key={index}
                  ref={(el: any) => otpInputRefs.current[index] = el}
                  style={styles.otpInput}
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
                  placeholderTextColor="#666"
                />
              ))}
            </View>

            <TouchableOpacity
              style={[styles.registerButton, loading && styles.registerButtonDisabled]}
              onPress={handleVerifyOTP}
              disabled={loading}
            >
              <Text style={styles.registerButtonText}>
                {loading ? 'Verifying...' : 'Verify Code'}
              </Text>
            </TouchableOpacity>

            <View style={styles.resendContainer}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>
              <TouchableOpacity onPress={handleResendOTP}>
                <Text style={styles.resendLink}> Resend</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={() => setStep('register')} style={styles.loginContainer}>
              <Text style={styles.loginText}>
                Wrong number? <Text style={styles.loginLink}>Go Back</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  // Registration Screen
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create Account</Text>
          <Text style={styles.headerSubtitle}>Join ScholarTrack SA</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>I am a...</Text>
          <View style={styles.roleContainer}>
            {roles.map((role) => (
              <TouchableOpacity
                key={role.id}
                style={[
                  styles.roleCard,
                  selectedRole === role.id && styles.roleCardSelected
                ]}
                onPress={() => setSelectedRole(role.id as 'parent' | 'driver')}
              >
                <View style={[
                  styles.roleIcon,
                  selectedRole === role.id && styles.roleIconSelected
                ]}>
                  <Ionicons
                    name={role.icon as any}
                    size={24}
                    color={selectedRole === role.id ? '#fff' : '#002395'}
                  />
                </View>
                <View style={styles.roleInfo}>
                  <Text style={[
                    styles.roleName,
                    selectedRole === role.id && styles.roleNameSelected
                  ]}>{role.name}</Text>
                  <Text style={styles.roleDesc}>{role.description}</Text>
                </View>
                {selectedRole === role.id && (
                  <Ionicons name="checkmark-circle" size={24} color="#FFB81C" />
                )}
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.sectionTitle}>Personal Details</Text>

          {/* Auth Method Toggle */}
          <View style={styles.authToggle}>
            <TouchableOpacity
              style={[styles.authToggleBtn, usePhoneAuth && styles.authToggleActive]}
              onPress={() => setUsePhoneAuth(true)}
            >
              <Ionicons name="call-outline" size={18} color={usePhoneAuth ? '#000' : '#666'} />
              <Text style={[styles.authToggleText, usePhoneAuth && styles.authToggleTextActive]}>Phone</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.authToggleBtn, !usePhoneAuth && styles.authToggleActive]}
              onPress={() => setUsePhoneAuth(false)}
            >
              <Ionicons name="mail-outline" size={18} color={!usePhoneAuth ? '#000' : '#666'} />
              <Text style={[styles.authToggleText, !usePhoneAuth && styles.authToggleTextActive]}>Email</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#FFB81C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Full Name"
              placeholderTextColor="#666666"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          {usePhoneAuth ? (
          <View style={styles.inputWrapper}>
            <Ionicons name="call-outline" size={20} color="#FFB81C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Phone Number (e.g., 0821234567)"
              placeholderTextColor="#666666"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          ) : (
          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#FFB81C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>
          )}

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#FFB81C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#666666"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#FFB81C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              placeholderTextColor="#666666"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
            />
          </View>

          <TouchableOpacity
            style={[styles.registerButton, loading && styles.registerButtonDisabled]}
            onPress={() => usePhoneAuth ? handleSendOTP() : handleEmailRegister()}
            disabled={loading}
          >
            <Text style={styles.registerButtonText}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </Text>
          </TouchableOpacity>

          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By signing up, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.loginContainer}>
            <Text style={styles.loginText}>
              Already have an account? <Text style={styles.loginLink}>Login</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flexGrow: 1,
  },
  header: {
    padding: 20,
    paddingTop: 50,
  },
  backButton: {
    marginBottom: 15,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFB81C',
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 25,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFB81C',
    marginBottom: 12,
    marginTop: 10,
  },
  roleContainer: {
    marginBottom: 20,
  },
  roleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#333333',
    marginBottom: 10,
    backgroundColor: '#0a0a0a',
  },
  roleCardSelected: {
    borderColor: '#FFB81C',
    backgroundColor: '#1a1a1a',
  },
  roleIcon: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#333333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleIconSelected: {
    backgroundColor: '#FFB81C',
  },
  roleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  roleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  roleNameSelected: {
    color: '#FFB81C',
  },
  roleDesc: {
    fontSize: 12,
    color: '#999999',
    marginTop: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    backgroundColor: '#0a0a0a',
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  eyeIcon: {
    padding: 8,
  },
  orContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#333',
  },
  orText: {
    color: '#666',
    marginHorizontal: 15,
    fontSize: 12,
  },
  registerButton: {
    backgroundColor: '#FFB81C',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#FFB81C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  registerButtonDisabled: {
    backgroundColor: '#666666',
  },
  registerButtonText: {
    color: '#000000',
    fontSize: 17,
    fontWeight: '600',
  },
  termsContainer: {
    marginTop: 20,
    textAlign: 'center',
  },
  termsText: {
    fontSize: 12,
    color: '#999999',
    textAlign: 'center',
    lineHeight: 18,
  },
  termsLink: {
    color: '#FFB81C',
    fontWeight: '600',
  },
  loginContainer: {
    alignItems: 'center',
    marginTop: 25,
    marginBottom: 10,
  },
  loginText: {
    fontSize: 14,
    color: '#999999',
  },
  loginLink: {
    color: '#FFB81C',
    fontWeight: '700',
  },
  // OTP Styles
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 30,
  },
  otpInput: {
    width: 50,
    height: 55,
    borderWidth: 2,
    borderColor: '#FFB81C',
    borderRadius: 12,
    marginHorizontal: 4,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    backgroundColor: '#0a0a0a',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
  },
  resendText: {
    color: '#999999',
    fontSize: 14,
  },
  resendLink: {
    color: '#FFB81C',
    fontWeight: '600',
    fontSize: 14,
  },
  // Auth Toggle
  authToggle: {
    flexDirection: 'row',
    backgroundColor: '#0a0a0a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  authToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  authToggleActive: {
    backgroundColor: '#FFB81C',
  },
  authToggleText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
  },
  authToggleTextActive: {
    color: '#000',
  },
});
