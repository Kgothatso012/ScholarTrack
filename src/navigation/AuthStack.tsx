import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthStackParamList } from './types';
import { DeepLinkContext } from '../context/DeepLinkContext';

const Stack = createNativeStackNavigator<AuthStackParamList>();

// Lazy load screens
const LoginScreen = React.lazy(() => import('../screens/auth/LoginScreen'));
const RegisterScreen = React.lazy(() => import('../screens/auth/RegisterScreen'));
const OnboardingScreen = React.lazy(() => import('../screens/auth/OnboardingScreen'));
const ForgotPasswordScreen = React.lazy(() => import('../screens/auth/ForgotPasswordScreen'));
const ResetPasswordConfirmScreen = React.lazy(() => import('../screens/auth/ResetPasswordConfirmScreen'));

interface AuthStackProps {
  onLogin: (role: string) => void;
  showOnboarding?: boolean;
  onOnboardingComplete?: () => void;
}

const LoadingFallback = () => <React.Fragment />;

// Use a simple state-based approach for navigation
export function AuthStack({ onLogin, showOnboarding = false, onOnboardingComplete }: AuthStackProps) {
  const [showRegister, setShowRegister] = React.useState(false);
  const [showForgotPassword, setShowForgotPassword] = React.useState(false);
  const [showResetConfirm, setShowResetConfirm] = React.useState(false);
  const [showOnboardingLocal, setShowOnboardingLocal] = React.useState(showOnboarding);

  // Custom navigation handlers
  const navigateToRegister = () => setShowRegister(true);
  const navigateToLogin = () => setShowRegister(false);
  const navigateToForgotPassword = () => setShowForgotPassword(true);
  const navigateBackToLogin = () => setShowForgotPassword(false);
  const navigateToResetConfirm = () => setShowResetConfirm(true);
  const navigateBackFromReset = () => setShowResetConfirm(false);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {showResetConfirm ? (
        <Stack.Screen name="ResetPasswordConfirm">
          {() => (
            <React.Suspense fallback={<LoadingFallback />}>
              <ResetPasswordConfirmScreenWrapper onGoBack={navigateBackFromReset} />
            </React.Suspense>
          )}
        </Stack.Screen>
      ) : showForgotPassword ? (
        <Stack.Screen name="ForgotPassword">
          {() => (
            <React.Suspense fallback={<LoadingFallback />}>
              <ForgotPasswordScreenWrapper onGoBack={navigateBackToLogin} onNavigateToResetConfirm={navigateToResetConfirm} />
            </React.Suspense>
          )}
        </Stack.Screen>
      ) : showRegister ? (
        <Stack.Screen name="Register">
          {() => (
            <React.Suspense fallback={<LoadingFallback />}>
              <RegisterScreenWrapper onLogin={onLogin} onNavigateToLogin={navigateToLogin} />
            </React.Suspense>
          )}
        </Stack.Screen>
      ) : showOnboardingLocal ? (
        <Stack.Screen name="Onboarding">
          {() => (
            <React.Suspense fallback={<LoadingFallback />}>
              <OnboardingScreenWrapper onComplete={() => {
                setShowOnboardingLocal(false);
                onOnboardingComplete?.();
              }} />
            </React.Suspense>
          )}
        </Stack.Screen>
      ) : (
        <Stack.Screen name="Login">
          {() => (
            <React.Suspense fallback={<LoadingFallback />}>
              <LoginScreenWrapper onLogin={onLogin} onNavigateToRegister={navigateToRegister} onNavigateToForgotPassword={navigateToForgotPassword} />
            </React.Suspense>
          )}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

// Wrapper components
function LoginScreenWrapper({ onLogin, onNavigateToRegister, onNavigateToForgotPassword }: { onLogin: (role: string) => void; onNavigateToRegister: () => void; onNavigateToForgotPassword: () => void }) {
  const { confirmationError, setConfirmationError } = React.useContext(DeepLinkContext);
  return (
    <LoginScreen
      onLogin={onLogin}
      navigation={{
        onRegister: onNavigateToRegister,
        onForgotPassword: onNavigateToForgotPassword,
        navigate: () => {},
        goBack: () => {}
      }}
      confirmationError={confirmationError}
      onConfirmationErrorHandled={() => setConfirmationError(null)}
    />
  );
}

function RegisterScreenWrapper({ onLogin, onNavigateToLogin }: { onLogin: (role: string) => void; onNavigateToLogin: () => void }) {
  return (
    <RegisterScreen
      onLogin={onLogin}
      navigation={{
        onRegister: () => {},
        navigate: (screen: string) => {
          if (screen === 'Login') {
            onNavigateToLogin();
          }
        },
        goBack: () => onNavigateToLogin()
      }}
    />
  );
}

function OnboardingScreenWrapper({ onComplete }: { onComplete: () => void }) {
  return <OnboardingScreen onComplete={onComplete} />;
}

function ForgotPasswordScreenWrapper({ onGoBack, onNavigateToResetConfirm }: { onGoBack: () => void; onNavigateToResetConfirm: () => void }) {
  return <ForgotPasswordScreen navigation={{ goBack: onGoBack, navigate: onNavigateToResetConfirm }} />;
}

function ResetPasswordConfirmScreenWrapper({ onGoBack }: { onGoBack: () => void }) {
  return <ResetPasswordConfirmScreen navigation={{ goBack: onGoBack, navigate: () => {} }} />;
}
