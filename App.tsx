import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { supabase, profileService, Profile } from './src/lib/api';
import { notificationService } from './src/services/NotificationService';
import ErrorBoundary, { LoadingScreen } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation';

function ThemedApp() {
  const { colors } = useTheme();

  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <AppContentWithTheme />
        </View>
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

function AppContentWithTheme() {
  const { colors } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    init();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          const profile = await profileService.getProfile(session.user.id);
          setUserRole(profile.role);
          setIsAuthenticated(true);
          await AsyncStorage.setItem('userRole', profile.role);
          
          // Register push token
          const pushToken = await notificationService.getPushToken();
          if (pushToken) {
            await notificationService.registerPushToken(session.user.id, pushToken);
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
        }
      } else {
        setUserRole(null);
        setIsAuthenticated(false);
      }
    });
    
    return () => subscription.unsubscribe();
  }, []);

  const init = async () => {
    try {
      // Check if onboarding is complete
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      if (onboardingComplete !== 'true') {
        setShowOnboarding(true);
        setLoading(false);
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const profile = await profileService.getProfile(session.user.id);
        setUserRole(profile.role);
        setIsAuthenticated(true);

        const pushToken = await notificationService.getPushToken();
        if (pushToken) {
          await notificationService.registerPushToken(session.user.id, pushToken);
        }
      } else {
        setUserRole(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Init error:', error);
      const onboardingComplete = await AsyncStorage.getItem('onboardingComplete');
      if (onboardingComplete !== 'true') {
        setShowOnboarding(true);
      } else {
        setIsAuthenticated(false);
      }
    }
    setLoading(false);
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    AsyncStorage.setItem('onboardingComplete', 'true');
  };

  const handleLogin = async (role: string) => {
    console.log('handleLogin called with role:', role);
    setUserRole(role);
    setIsAuthenticated(true);
    await AsyncStorage.setItem('userRole', role);
    console.log('State updated - role:', role, 'isAuthenticated:', true);
  };

  // Expose for web fallback
  if (typeof window !== 'undefined') {
    (window as any).__handleLogin = handleLogin;
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.log('Logout error:', error);
    }
    await AsyncStorage.removeItem('userRole');
    setUserRole(null);
    setIsAuthenticated(false);
  };

  if (loading) {
    return (
      <View style={[styles.splash, { backgroundColor: '#002395' }]}>
        <Text style={styles.splashText}>ScholarTrack</Text>
        <ActivityIndicator size="small" color="#FFB81C" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootNavigator
        userRole={userRole}
        isAuthenticated={isAuthenticated}
        showOnboarding={showOnboarding}
        onLogin={handleLogin}
        onOnboardingComplete={handleOnboardingComplete}
      />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFB81C',
  },
});
