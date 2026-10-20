import React, { useEffect, useState } from 'react';
import { View, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import { Syne_400Regular, Syne_600SemiBold, Syne_700Bold, Syne_800ExtraBold } from '@expo-google-fonts/syne';
import { DMMono_400Regular } from '@expo-google-fonts/dm-mono';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { DeepLinkContext, DeepLinkProvider } from './src/context/DeepLinkContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { RootNavigator } from './src/navigation';
import ConsentGate from './src/components/ConsentGate';
import SplashScreen from './src/components/SplashScreen';
import { AuthProvider, useAuth } from './src/lib/auth';
import { CrashScreen, installGlobalErrorHandler, getCapturedError } from './src/components/CrashScreen';
import { NetworkProvider } from './src/lib/useNetwork';

// Install BEFORE React mounts — catches module-load + async errors.
installGlobalErrorHandler();

const linking = {
  prefixes: ['malumescholartrack://', 'https://malumescholartrack.co.za'],
  getStateFromPath(path: string) {
    if (path.startsWith('confirm')) {
      const url = new URL('malumescholartrack://' + path);
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
    <AuthProvider>
      <DeepLinkProvider>
        <ErrorBoundary>
          <SafeAreaProvider>
            <View style={{ flex: 1, backgroundColor: colors.background }}>
              <AppContentWithTheme />
            </View>
          </SafeAreaProvider>
        </ErrorBoundary>
      </DeepLinkProvider>
    </AuthProvider>
  );
}

function AppContentWithTheme() {
  const { colors } = useTheme();
  const { setConfirmationError } = React.useContext(DeepLinkContext);
  const { user: authUser, initializing } = useAuth();
  const [showOnboarding] = useState(false);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      if (event.url.includes('confirm') && (event.url.includes('error=') || event.url.includes('error_code='))) {
        const parsed = new URL(event.url);
        setConfirmationError(parsed.searchParams.get('error_description') || parsed.searchParams.get('error_code') || 'Confirmation link is invalid or has expired.');
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);
    Linking.getInitialURL().then((url: string | null) => {
      if (url?.includes('confirm') && (url.includes('error=') || url.includes('error_code='))) {
        const parsed = new URL(url);
        setConfirmationError(parsed.searchParams.get('error_description') || parsed.searchParams.get('error_code') || 'Confirmation link is invalid or has expired.');
      }
    });

    return () => subscription.remove();
  }, [setConfirmationError]);

  if (initializing) return <SplashScreen />;

  const userRole = authUser?.role ?? null;
  const isAuthenticated = Boolean(authUser);

  return (
    <NavigationContainer linking={linking}>
      <RootNavigator
        userRole={userRole}
        isAuthenticated={isAuthenticated}
        showOnboarding={showOnboarding}
        onLogin={() => {}}
        onOnboardingComplete={() => {}}
      />
      {isAuthenticated && <ConsentGate />}
    </NavigationContainer>
  );
}

export default function App() {
  // Mobicel-safe: if global handler caught a crash, show it instead of crashing silently.
  const [captured] = useState(() => getCapturedError());

  if (captured.error) {
    return <CrashScreen error={captured.error} info={captured.info ?? undefined} />;
  }

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
    <NetworkProvider>
      <ThemeProvider>
        <ThemedApp />
      </ThemeProvider>
    </NetworkProvider>
  );
}