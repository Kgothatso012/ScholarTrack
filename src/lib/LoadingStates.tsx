// Loading States Component
// Reusable loading, empty, and error states

import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from './theme';

interface LoadingProps {
  message?: string;
}

interface EmptyProps {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface ErrorProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

interface StateWrapperProps {
  loading?: boolean;
  error?: Error | null;
  data?: unknown[] | object | null;
  loadingMessage?: string;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: string;
  children: ReactNode;
}

export function Loading({ message = 'Loading...' }: LoadingProps) {
  return (
    <View style={styles(colors).center}>
      <ActivityIndicator size="large" color={colors.accent} />
      <Text style={styles(colors).loadingText}>{message}</Text>
    </View>
  );
}

export function Empty({ 
  title, 
  message, 
  icon = '📭', 
  actionLabel, 
  onAction 
}: EmptyProps) {
  return (
    <View style={styles(colors).center}>
      <Text style={styles(colors).emptyIcon}>{icon}</Text>
      <Text style={styles(colors).emptyTitle}>{title}</Text>
      {message && <Text style={styles(colors).emptyMessage}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles(colors).actionButton} onPress={onAction}>
          <Text style={styles(colors).actionText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function Error({ 
  title = 'Oops!', 
  message = 'Something went wrong', 
  onRetry 
}: ErrorProps) {
  return (
    <View style={styles(colors).center}>
      <Ionicons name="warning" size={32} color="#f59e0b" />
      <Text style={styles(colors).errorTitle}>{title}</Text>
      <Text style={styles(colors).errorMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles(colors).retryButton} onPress={onRetry}>
          <Text style={styles(colors).retryText}>Try Again</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function StateWrapper({
  loading = false,
  error = null,
  data,
  loadingMessage,
  emptyTitle,
  emptyMessage,
  emptyIcon,
  children,
}: StateWrapperProps) {
  if (loading) {
    return <Loading message={loadingMessage} />;
  }

  if (error) {
    return <Error message={error.message} onRetry={() => window.location.reload()} />;
  }

  if (data === null || data === undefined || (Array.isArray(data) && data.length === 0)) {
    return (
      <Empty
        icon={emptyIcon}
        title={emptyTitle || 'No data'}
        message={emptyMessage}
      />
    );
  }

  return <>{children}</>;
}

const styles = (colors: any) => StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: colors.dark.background,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.dark.textSecondary,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyMessage: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  actionButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionText: {
    color: colors.primary,
    fontWeight: '600',
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.dark.text,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: colors.dark.textSecondary,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    borderWidth: 1,
    borderColor: colors.accent,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: colors.accent,
    fontWeight: '600',
  },
});
