import React, { useState } from 'react';
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
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (userData?.role) {
        await AsyncStorage.setItem('userRole', userData.role);
        navigation.reset({
          index: 0,
          routes: [{ name: getRouteName(userData.role) }],
        });
      } else {
        await handleDemoLogin();
      }
    } catch (error: any) {
      await handleDemoLogin();
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    if (email.toLowerCase().includes('admin')) {
      await AsyncStorage.setItem('userRole', 'admin');
      navigation.reset({ index: 0, routes: [{ name: 'AdminApp' }] });
    } else if (email.toLowerCase().includes('dev')) {
      await AsyncStorage.setItem('userRole', 'dev');
      navigation.reset({ index: 0, routes: [{ name: 'DevApp' }] });
    } else if (email.toLowerCase().includes('driver')) {
      await AsyncStorage.setItem('userRole', 'driver');
      navigation.reset({ index: 0, routes: [{ name: 'DriverApp' }] });
    } else if (email.toLowerCase().includes('parent')) {
      await AsyncStorage.setItem('userRole', 'parent');
      navigation.reset({ index: 0, routes: [{ name: 'ParentApp' }] });
    } else {
      Alert.alert('Error', 'Use email containing: parent, driver, admin, or dev');
    }
  };

  const getRouteName = (role: string) => {
    switch (role) {
      case 'parent': return 'ParentApp';
      case 'driver': return 'DriverApp';
      case 'admin': return 'AdminApp';
      case 'dev': return 'DevApp';
      default: return 'RoleSelection';
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollView} 
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Text style={styles.logoText}>🚗</Text>
          </View>
          <Text style={styles.appTitle}>ScholarTrack SA</Text>
          <Text style={styles.appSubtitle}>Safe Student Transport</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.welcomeText}>Welcome Back</Text>
          <Text style={styles.subtitleText}>Login to your account</Text>

          <View style={styles.inputWrapper}>
            <Ionicons name="mail-outline" size={20} color="#007749" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Ionicons name="lock-closed-outline" size={20} color="#007749" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete="password"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
              <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#666" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
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

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="logo-google" size={20} color="#DB4437" />
            <Text style={styles.socialButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.signupContainer}>
            <Text style={styles.signupText}>
              Don't have an account? <Text style={styles.signupLink}>Sign Up</Text>
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.demoBox}>
          <Text style={styles.demoTitle}>Demo Credentials:</Text>
          <Text style={styles.demoText}>parent@test.com | driver@test.com</Text>
          <Text style={styles.demoText}>admin@test.com | dev@test.com</Text>
          <Text style={styles.demoText}>Password: any</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#002395',
  },
  scrollView: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#FFB81C',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  logoText: {
    fontSize: 32,
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  appSubtitle: {
    fontSize: 13,
    color: '#FFB81C',
    letterSpacing: 1,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 25,
    width: width > 500 ? 400 : '85%',
    maxWidth: 420,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#002395',
    marginBottom: 5,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 10,
    backgroundColor: '#F8F8F8',
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#333333',
  },
  eyeIcon: {
    padding: 6,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 12,
  },
  forgotPasswordText: {
    color: '#007749',
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#007749',
    borderRadius: 10,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: '#007749',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginButtonDisabled: {
    backgroundColor: '#A3D0B0',
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 11,
    fontWeight: '600',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    height: 44,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  socialButtonText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  signupContainer: {
    alignItems: 'center',
    marginTop: 5,
  },
  signupText: {
    fontSize: 13,
    color: '#666666',
  },
  signupLink: {
    color: '#007749',
    fontWeight: '700',
  },
  demoBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#FFF4E0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FFB81C',
    width: width > 500 ? 400 : '85%',
    maxWidth: 420,
  },
  demoTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#002395',
    marginBottom: 5,
  },
  demoText: {
    fontSize: 11,
    color: '#666666',
    marginBottom: 2,
  },
});
