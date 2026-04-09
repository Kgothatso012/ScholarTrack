// Loading States Component
// Reusable loading, empty, and error states

import React, { ReactNode } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors as themeColors } from './theme';

type ThemeColors = typeof themeColors;

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
    <View style={styles(themeColors).center}>
      <ActivityIndicator size="large" color={themeColors.accent} />
      <Text style={styles(themeColors).loadingText}>{message}</Text>
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
    <View style={styles(themeColors).center}>
      <Text style={styles(themeColors).emptyIcon}>{icon}</Text>
      <Text style={styles(themeColors).emptyTitle}>{title}</Text>
      {message && <Text style={styles(themeColors).emptyMessage}>{message}</Text>}
      {actionLabel && onAction && (
        <TouchableOpacity style={styles(themeColors).actionButton} onPress={onAction}>
          <Text style={styles(themeColors).actionText}>{actionLabel}</Text>
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
    <View style={styles(themeColors).center}>
      <Ionicons name="warning" size={32} color="#f59e0b" />
      <Text style={styles(themeColors).errorTitle}>{title}</Text>
      <Text style={styles(themeColors).errorMessage}>{message}</Text>
      {onRetry && (
        <TouchableOpacity style={styles(themeColors).retryButton} onPress={onRetry}>
          <Text style={styles(themeColors).retryText}>Try Again</Text>
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

const styles = (colors: ThemeColors) => StyleSheet.create({
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