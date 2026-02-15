import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

// Import screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import ComplianceUploadScreen from './src/screens/driver/ComplianceUploadScreen';
import DriverDashboard from './src/screens/driver/DriverDashboard';
import TripScreen from './src/screens/driver/TripScreen';
import EarningsScreen from './src/screens/driver/EarningsScreen';
import AdminDashboard from './src/screens/admin/AdminDashboard';
import ManageDriversScreen from './src/screens/admin/ManageDriversScreen';
import AdminPaymentsScreen from './src/screens/admin/AdminPaymentsScreen';
import AdminReportsScreen from './src/screens/admin/AdminReportsScreen';
import DevDashboard from './src/screens/dev/DevDashboard';
import DevDatabaseScreen from './src/screens/dev/DevDatabaseScreen';
import ParentDashboard from './src/screens/parent/ParentDashboard';
import TrackChildScreen from './src/screens/parent/TrackChildScreen';
import HireDriverScreen from './src/screens/parent/HireDriverScreen';
import ReviewDriverScreen from './src/screens/parent/ReviewDriverScreen';
import PaymentScreen from './src/screens/parent/PaymentScreen';

const RoleSelectionScreen = () => {
  const roles = [
    { id: 'parent', name: 'Parent', icon: 'people', color: '#007749' },
    { id: 'driver', name: 'Driver', icon: 'car', color: '#002395' },
    { id: 'admin', name: 'School Admin', icon: 'school', color: '#FFB81C' },
    { id: 'dev', name: 'Developer', icon: 'code-slash', color: '#666' },
  ];

  const selectRole = async (roleId: string) => {
    await AsyncStorage.setItem('userRole', roleId);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.placeholderText}>Select Your Role</Text>
      <View style={styles.roleContainer}>
        {roles.map((role) => (
          <TouchableOpacity key={role.id} style={[styles.roleButton, { borderColor: role.color }]} onPress={() => selectRole(role.id)}>
            <Ionicons name={role.icon as keyof typeof Ionicons.glyphMap} size={32} color={role.color} />
            <Text style={[styles.roleText, { color: role.color }]}>{role.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const DevTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'code-slash';
        if (route.name === 'Dashboard') {
          iconName = focused ? 'code-slash' : 'code-slash-outline';
        } else if (route.name === 'Database') {
          iconName = focused ? 'server' : 'server-outline';
        } else if (route.name === 'Logs') {
          iconName = focused ? 'list' : 'list-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007749',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      headerStyle: {
        backgroundColor: '#002395',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={DevDashboard} />
    <Tab.Screen name="Database" component={DevDatabaseScreen} />
    <Tab.Screen name="Logs" component={() => <View style={styles.container}><Text>Logs</Text></View>} />
  </Tab.Navigator>
);

const AdminTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: keyof typeof Ionicons.glyphMap = 'school';
        if (route.name === 'Dashboard') {
          iconName = focused ? 'school' : 'school-outline';
        } else if (route.name === 'Drivers') {
          iconName = focused ? 'car' : 'car-outline';
        } else if (route.name === 'Payments') {
          iconName = focused ? 'card' : 'card-outline';
        } else if (route.name === 'Reports') {
          iconName = focused ? 'document-text' : 'document-text-outline';
        }
        return <Ionicons name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007749',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        backgroundColor: '#fff',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      headerStyle: {
        backgroundColor: '#002395',
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
      },
    })}
  >
    <Tab.Screen name="Dashboard" component={AdminDashboard} />
    <Tab.Screen name="Drivers" component={ManageDriversScreen} />
    <Tab.Screen name="Payments" component={AdminPaymentsScreen} />
    <Tab.Screen name="Reports" component={AdminReportsScreen} />
  </Tab.Navigator>
);

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Parent Tab Navigator with Icons
function ParentTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Track') {
            iconName = focused ? 'map' : 'map-outline';
          } else if (route.name === 'Hire') {
            iconName = focused ? 'car' : 'car-outline';
          } else if (route.name === 'Review') {
            iconName = focused ? 'star' : 'star-outline';
          } else if (route.name === 'Payments') {
            iconName = focused ? 'card' : 'card-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007749',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#002395',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={ParentDashboard} />
      <Tab.Screen name="Track" component={TrackChildScreen} />
      <Tab.Screen name="Hire" component={HireDriverScreen} />
      <Tab.Screen name="Review" component={ReviewDriverScreen} />
      <Tab.Screen name="Payments" component={PaymentScreen} />
    </Tab.Navigator>
  );
}

// Driver Tab Navigator with Icons
function DriverTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';
          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Compliance') {
            iconName = focused ? 'document' : 'document-outline';
          } else if (route.name === 'Trip') {
            iconName = focused ? 'navigate' : 'navigate-outline';
          } else if (route.name === 'Earnings') {
            iconName = focused ? 'cash' : 'cash-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007749',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#e0e0e0',
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        headerStyle: {
          backgroundColor: '#002395',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DriverDashboard} />
      <Tab.Screen name="Compliance" component={ComplianceUploadScreen} />
      <Tab.Screen name="Trip" component={TripScreen} />
      <Tab.Screen name="Earnings" component={EarningsScreen} />
    </Tab.Navigator>
  );
}

// Main App Navigator with Authentication Flow
function AppNavigator() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkUserRole();
  }, []);

  const checkUserRole = async () => {
    try {
      const role = await AsyncStorage.getItem('userRole');
      setUserRole(role);
    } catch (error) {
      console.error('Error loading user role:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>🚗 ScholarTrack SA</Text>
        <Text style={styles.loadingSubtext}>Loading...</Text>
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!userRole ? (
        // Auth Stack
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
        </>
      ) : userRole === 'parent' ? (
        // Parent Stack
        <Stack.Screen name="ParentApp" component={ParentTabs} />
      ) : userRole === 'driver' ? (
        // Driver Stack
        <Stack.Screen name="DriverApp" component={DriverTabs} />
      ) : userRole === 'admin' ? (
        // Admin Stack
        <Stack.Screen name="AdminApp" component={AdminTabs} />
      ) : userRole === 'dev' ? (
        // Dev Stack
        <Stack.Screen name="DevApp" component={DevTabs} />
      ) : (
        // Default to role selection
        <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#002395',
  },
  loadingText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  loadingSubtext: {
    fontSize: 16,
    color: '#FFB81C',
  },
  placeholderText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#002395',
    marginBottom: 10,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
  },
  roleContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginTop: 30,
    paddingHorizontal: 20,
  },
  roleButton: {
    width: '40%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 10,
    borderRadius: 15,
    borderWidth: 3,
    backgroundColor: '#fff',
    elevation: 3,
  },
  roleText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
