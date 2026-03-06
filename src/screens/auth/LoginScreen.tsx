import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, Modal } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

export default function LoginScreen({ navigation, onLogin }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);

    // Try Supabase auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Get user role from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', data.user?.id)
        .single();

      // Use profile data if available, otherwise get from user metadata
      const userRole = profileData?.role || data.user?.user_metadata?.role || 'parent';
      const userName = profileData?.full_name || data.user?.user_metadata?.full_name || '';

      if (userRole) {
        await AsyncStorage.setItem('userRole', userRole);
        await AsyncStorage.setItem('userEmail', data.user?.email || '');
        await AsyncStorage.setItem('userName', userName);
        await AsyncStorage.setItem('userId', data.user?.id || '');

        // Create profile if it doesn't exist
        if (!profileData && data.user) {
          try {
            await supabase.from('profiles').insert({
              id: data.user.id,
              email: data.user.email,
              role: userRole,
              full_name: userName,
              phone: data.user?.user_metadata?.phone || ''
            });
          } catch (err) {
            console.log('Profile creation error:', err);
          }
        }

        if (onLogin) {
          onLogin(userRole);
        }
      } else {
        Alert.alert('Error', 'User profile not found.');
      }
    } catch (error: any) {
      // Check for specific error messages
      const errorMessage = error?.message?.toLowerCase() || '';
      if (errorMessage.includes('email not confirmed') || errorMessage.includes('invalid email')) {
        Alert.alert('Email Not Confirmed', 'Please check your email and click the confirmation link to activate your account.');
      } else if (errorMessage.includes('invalid login credentials') || errorMessage.includes('invalid email') || errorMessage.includes('wrong password')) {
        Alert.alert('Email or Password Incorrect', 'Please check your credentials and try again. If you forgot your password, use the "Forgot Password" link below.');
      } else if (errorMessage.includes('network')) {
        Alert.alert('Connection Error', 'Please check your internet connection and try again.');
      } else {
        Alert.alert('Login Failed', 'Something went wrong. Please try again or contact support.');
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

      Alert.alert('Check Your Email', 'Password reset link has been sent to your email.');
      setShowResetModal(false);
      setResetEmail('');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollView} keyboardShouldPersistTaps="handled">
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Ionicons name="school" size={40} color="#000000" />
          </View>
          <Text style={styles.appTitle}>ScholarTrack</Text>
          <Text style={styles.appSubtitle}>Safe Student Transport</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>Login to your account</Text>

          {/* What is ScholarTrack? Toggle */}
          <TouchableOpacity style={styles.infoButton} onPress={() => setShowInfo(!showInfo)}>
            <Ionicons name="information-circle-outline" size={18} color="#FFB81C" />
            <Text style={styles.infoButtonText}>{showInfo ? 'Hide Info' : 'What is ScholarTrack?'}</Text>
          </TouchableOpacity>

          {showInfo && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Safe Student Transport</Text>
              <Text style={styles.infoText}>• Track your child's school bus in real-time</Text>
              <Text style={styles.infoText}>• Hire trusted, verified drivers</Text>
              <Text style={styles.infoText}>• Get instant alerts when your child arrives</Text>
              <Text style={styles.infoText}>• Emergency SOS button for instant help</Text>
              <Text style={styles.infoText}>• View payments and trip history</Text>
            </View>
          )}

          {/* Demo Login Button */}
          <TouchableOpacity
            style={styles.demoButton}
            onPress={() => {
              setEmail('parent@test.com');
              setPassword('password123');
            }}
          >
            <Ionicons name="play-circle-outline" size={20} color="#FFB81C" />
            <Text style={styles.demoButtonText}>Try Demo Account</Text>
          </TouchableOpacity>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#FFB81C" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#666666"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

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

          <TouchableOpacity style={styles.forgotPassword} onPress={() => setShowResetModal(true)}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleRegister} style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Password Reset Modal */}
      <Modal visible={showResetModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity style={styles.modalClose} onPress={() => setShowResetModal(false)}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Reset Password</Text>
            <Text style={styles.modalSubtitle}>Enter your email to receive a password reset link</Text>

            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={20} color="#FFB81C" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#666666"
                value={resetEmail}
                onChangeText={setResetEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, resetLoading && styles.loginButtonDisabled]}
              onPress={handlePasswordReset}
              disabled={resetLoading}
            >
              <Text style={styles.loginButtonText}>
                {resetLoading ? 'Sending...' : 'Send Reset Link'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  scrollView: { flexGrow: 1, justifyContent: 'center' },
  logoContainer: { alignItems: 'center', marginBottom: 30 },
  logoCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFB81C', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  appTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  appSubtitle: { fontSize: 14, color: '#888888', marginTop: 5 },
  formContainer: { backgroundColor: '#111111', borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 24, paddingTop: 30, paddingBottom: 40 },
  welcomeText: { fontSize: 24, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 5 },
  subtitleText: { fontSize: 14, color: '#888888', marginBottom: 25 },
  infoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 15 },
  infoButtonText: { color: '#FFB81C', fontSize: 14, marginLeft: 5 },
  infoBox: { backgroundColor: '#1a1a1a', borderRadius: 10, padding: 15, marginBottom: 15, borderLeftWidth: 3, borderLeftColor: '#FFB81C' },
  infoTitle: { fontSize: 16, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  infoText: { fontSize: 13, color: '#aaa', marginBottom: 5 },
  demoButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#FFB81C', borderRadius: 12, paddingVertical: 12, marginBottom: 20 },
  demoButtonText: { color: '#FFB81C', fontSize: 14, fontWeight: '600', marginLeft: 8 },
  inputWrapper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#333333', borderRadius: 12, paddingHorizontal: 16, marginBottom: 12, backgroundColor: '#1a1a1a', height: 50 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#FFFFFF' },
  eyeIcon: { padding: 8 },
  forgotPassword: { alignSelf: 'flex-end', marginBottom: 20 },
  forgotPasswordText: { color: '#FFB81C', fontSize: 14 },
  loginButton: { backgroundColor: '#FFB81C', borderRadius: 12, height: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#000000', fontSize: 16, fontWeight: 'bold' },
  signupContainer: { alignItems: 'center', marginBottom: 25 },
  signupText: { color: '#888888', fontSize: 14 },
  signupLink: { color: '#FFB81C', fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#111111', borderRadius: 20, padding: 25, width: '100%', maxWidth: 400, alignItems: 'center' },
  modalClose: { position: 'absolute', top: 15, right: 15, padding: 5 },
  modalTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: '#888888', textAlign: 'center', marginBottom: 25 },
});
