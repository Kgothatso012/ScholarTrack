import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { supabase, profileService, Profile } from './src/lib/api';
import { notificationService } from './src/services/NotificationService';
import { ErrorBoundary, LoadingScreen } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation';
import SplashScreen from './src/components/SplashScreen';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from './src/navigation/types';

type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

const linking = {
  prefixes: ['scholartrack://', 'https://scholartrack.co.za'],
};

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
    // Handle deep links for password reset
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      if (url.includes('reset-password') || url.includes('token')) {
        // Navigation will be handled by React Navigation deep linking
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    // Check initial URL
    Linking.getInitialURL().then((url) => {
      if (url && (url.includes('reset-password') || url.includes('token'))) {
        // Initial deep link will be handled by navigation container
      }
    });

    return () => subscription.remove();
  }, []);

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

    setUserRole(role);
    setIsAuthenticated(true);
    await AsyncStorage.setItem('userRole', role);

  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {

    }
    await AsyncStorage.removeItem('userRole');
    setUserRole(null);
    setIsAuthenticated(false);
  };

  // Expose for web fallback
  if (typeof window !== 'undefined') {
    (window as any).__handleLogin = handleLogin;
    (window as any).logout = handleLogout;
  }

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
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

