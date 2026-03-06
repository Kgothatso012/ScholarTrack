import React from 'react';
import { createNativeStackNavigator, NativeStackNavigationProp } from '@react-navigation/native-stack';
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

// Screen components with proper navigation
function LoginScreenWithNav({ onLogin }: { onLogin: (role: string) => void }) {
  const navigation = React.useRef<NativeStackNavigationProp<AuthStackParamList>>(null);
  
  return (
    <LoginScreen
      onLogin={onLogin}
      navigation={{
        navigate: (screen: string) => {
          if (screen === 'Register') {
            navigation.current?.navigate('Register');
          }
        },
        goBack: () => {
          navigation.current?.goBack();
        }
      }}
    />
  );
}

function RegisterScreenWithNav({ onLogin }: { onLogin: (role: string) => void }) {
  const navigation = React.useRef<NativeStackNavigationProp<AuthStackParamList>>(null);
  
  return (
    <RegisterScreen
      onLogin={onLogin}
      navigation={{
        goBack: () => {
          navigation.current?.goBack();
        },
        navigate: (screen: string) => {
          if (screen === 'Login') {
            navigation.current?.navigate('Login');
          }
        }
      }}
    />
  );
}

function OnboardingScreenWithNav({ onLogin }: { onLogin: (role: string) => void }) {
  return <OnboardingScreen onComplete={() => onLogin('')} />;
}

export function AuthStack({ onLogin }: AuthStackProps) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {() => (
          <React.Suspense fallback={<LoadingFallback />}>
            <LoginScreenWithNav onLogin={onLogin} />
          </React.Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {() => (
          <React.Suspense fallback={<LoadingFallback />}>
            <RegisterScreenWithNav onLogin={onLogin} />
          </React.Suspense>
        )}
      </Stack.Screen>
      <Stack.Screen name="Onboarding">
        {() => (
          <React.Suspense fallback={<LoadingFallback />}>
            <OnboardingScreenWithNav onLogin={onLogin} />
          </React.Suspense>
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
