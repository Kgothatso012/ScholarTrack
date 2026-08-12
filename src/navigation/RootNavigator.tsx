import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { ParentDrawerStack } from './ParentDrawerStack';
import { ElderParentTabs } from './ElderParentTabs';
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
  if (isAuthenticated && userRole) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="App">
          {() => {
            switch (userRole) {
              case 'driver':
                return <DriverStack />;
              case 'admin':
                return <AdminStack />;
              case 'parent-elder':
                return <ElderParentTabs />;
              default:
                return <ElderParentTabs />;
            }
          }}
        </Stack.Screen>
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Auth">
        {() => <AuthStack onLogin={onLogin} showOnboarding={showOnboarding} onOnboardingComplete={onOnboardingComplete} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
