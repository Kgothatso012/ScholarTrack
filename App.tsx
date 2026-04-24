import React, { useState, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Linking, Alert } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFonts } from 'expo-font';
import { Syne_400Regular, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { DeepLinkContext, DeepLinkProvider } from './src/context/DeepLinkContext';
import { supabase, profileService, Profile } from './src/lib/api';
import { notificationService } from './src/services/NotificationService';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation';
import SplashScreen from './src/components/SplashScreen';

import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from './src/navigation/types';

const linking = {
  prefixes: ['scholartrack://', 'https://scholartrack.co.za'],
  getStateFromPath(path: string) {
    if (path.startsWith('confirm')) {
      const url = new URL('scholartrack://' + path);
      const errorDescription = url.searchParams.get('error_description');
      const errorCode = url.searchParams.get('error_code');
      const error = errorDescription || errorCode || 'Confirmation link is invalid or has expired.';
      return {
        routes: [{
          name: 'Auth',
          state: {
            routes: [{ name: 'Login', params: { confirmationError: error } }],
          },
        }],
      };
    }
    return undefined;
  },
};

function ThemedApp() {
  const { colors } = useTheme();

  return (
    <DeepLinkProvider>
      <ErrorBoundary>
        <SafeAreaProvider>
          <View style={{ flex: 1, backgroundColor: colors.background }}>
            <AppContentWithTheme />
          </View>
        </SafeAreaProvider>
      </ErrorBoundary>
    </DeepLinkProvider>
  );
}

function AppContentWithTheme() {
  const { colors } = useTheme();
  const { setConfirmationError } = React.useContext(DeepLinkContext);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      const { url } = event;
      if (url.includes('confirm') && (url.includes('error=') || url.includes('error_code='))) {
        const parsed = new URL(url);
        const errorDescription = parsed.searchParams.get('error_description');
        const errorCode = parsed.searchParams.get('error_code');
        const error = errorDescription || errorCode || 'Confirmation link is invalid or has expired.';
        setConfirmationError(error);
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    Linking.getInitialURL().then((url) => {
      if (url && url.includes('confirm') && (url.includes('error=') || url.includes('error_code='))) {
        const parsed = new URL(url);
        const errorDescription = parsed.searchParams.get('error_description');
        const errorCode = parsed.searchParams.get('error_code');
        const error = errorDescription || errorCode || 'Confirmation link is invalid or has expired.';
        setConfirmationError(error);
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
  const [fontsLoaded, fontError] = useFonts({
    Syne_400Regular,
    Syne_600SemiBold,
    Syne_700Bold,
    Syne_800ExtraBold,
    DMMono_400Regular,
  });

  if (!fontsLoaded && !fontError) {
    return <SplashScreen />;
  }

  return (
    <ThemeProvider>
      <ThemedApp />
    </ThemeProvider>
  );
}

