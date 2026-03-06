import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { ParentStack } from './ParentStack';
import { DriverStack } from './DriverStack';
import { AdminStack } from './AdminStack';

const Stack = createNativeStackNavigator<RootStackParamList>();

export type RootNavigatorProps = {
  userRole: string | null;
  isAuthenticated: boolean;
  showOnboarding: boolean;
  onLogin: (role: string) => void;
  onOnboardingComplete: () => void;
};

export function RootNavigator({ 
  userRole, 
  isAuthenticated, 
  showOnboarding,
  onLogin,
  onOnboardingComplete
}: RootNavigatorProps) {
  // Show onboarding first
  if (showOnboarding) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth">
          {() => <AuthStack onLogin={onLogin} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  // Not authenticated - show auth stack
  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Auth">
          {() => <AuthStack onLogin={onLogin} />}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  // Authenticated - show appropriate stack based on role
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main">
        {() => {
          switch (userRole) {
            case 'driver':
              return <DriverStack />;
            case 'admin':
              return <AdminStack />;
            default:
              return <ParentStack />;
          }
        }}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
