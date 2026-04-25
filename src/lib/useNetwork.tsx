// Offline Detection Hook with App-wide State
// Provides network status throughout the app with a provider

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('dark');

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string | null;
  isOffline: boolean;
  refresh: () => void;
}

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isInternetReachable: true,
  connectionType: null,
  isOffline: false,
  refresh: () => {},
});

export function useNetworkStatus() {
  return useContext(NetworkContext);
}

interface NetworkProviderProps {
  children: ReactNode;
}

export function NetworkProvider({ children }: NetworkProviderProps) {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(setNetworkState);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(setNetworkState);

    return () => unsubscribe();
  }, []);

  const value: NetworkContextType = {
    isConnected: networkState?.isConnected ?? true,
    isInternetReachable: networkState?.isInternetReachable ?? true,
    connectionType: networkState?.type ?? null,
    isOffline: !(networkState?.isConnected && networkState?.isInternetReachable),
    refresh: () => NetInfo.fetch().then(setNetworkState),
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
}

// Offline Banner Component
// Shows a banner when the app is offline

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface OfflineBannerProps {
  onRetry?: () => void;
}

export function OfflineBanner({ onRetry }: OfflineBannerProps) {
  const { isOffline, refresh } = useNetworkStatus();

  if (!isOffline) return null;

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      refresh();
    }
  };

  return (
    <View style={styles(C).banner}>
      <View style={styles(C).bannerContent}>
        <Ionicons name="cloud-offline" size={20} color="#fff" />
        <Text style={styles(C).bannerText}>No internet connection</Text>
      </View>
      <TouchableOpacity onPress={handleRetry} style={styles(C).retryButton}>
        <Text style={styles(C).retryText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = (colors: typeof C) => StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerText: {
    color: '#fff',
    marginLeft: 8,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
});

// Hook to auto-retry failed requests when back online
import { useCallback } from 'react';

export function useOfflineRetry<T>(
  fetchFn: () => Promise<T>,
  dependencies: React.DependencyList = []
) {
  const { isOffline } = useNetworkStatus();

  const retryFn = useCallback(async (): Promise<T | null> => {
    if (isOffline) {
      console.debug('Skipping request - offline');
      return null;
    }

    try {
      return await fetchFn();
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }, [isOffline, ...dependencies]);

  return { retryFn, isOffline };
}
