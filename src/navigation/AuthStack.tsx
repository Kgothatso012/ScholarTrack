import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Lazy load screens
const LoginScreen = React.lazy(() => import('../screens/auth/LoginScreen'));
const RegisterScreen = React.lazy(() => import('../screens/auth/RegisterScreen'));
const OnboardingScreen = React.lazy(() => import('../screens/auth/OnboardingScreen'));

interface AuthStackProps {
  onLogin: (role: string) => void;
}

const LoadingFallback = () => <React.Fragment />;

export function AuthStack({ onLogin }: AuthStackProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {() => (
          <React.Suspense fallback={<LoadingFallback />}>
            <LoginScreen
              onLogin={onLogin}
              navigation={{ 
                navigate: () => {}, 
                goBack: () => {}, 
                onRegister: () => {} 
              }}
            />
          </React.Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {() => (
          <React.Suspense fallback={<LoadingFallback />}>
            <RegisterScreen
              onLogin={onLogin}
              navigation={{ 
                goBack: () => {}, 
                navigate: () => {} 
              }}
            />
          </React.Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="Onboarding">
        {() => (
          <React.Suspense fallback={<LoadingFallback />}>
            <OnboardingScreen onComplete={() => {}} />
          </React.Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
