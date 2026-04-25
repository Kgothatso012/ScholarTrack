// Error Boundary Component
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getTheme } from '../ui-plugin/theme';

const { colors: C } = getTheme('dark');

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Ionicons name="warning" size={64} color={C.primary} />
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleRetry}>
            <Text style={styles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export const LoadingScreen = ({ message = 'Loading...' }: { message?: string }) => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={C.primary} />
    <Text style={styles.loadingText}>{message}</Text>
  </View>
);

export const ErrorFallback = ({
  message = 'Something went wrong',
  onRetry
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <View style={styles.container}>
    <Ionicons name="warning" size={64} color={C.primary} />
    <Text style={styles.title}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={styles.button} onPress={onRetry}>
        <Text style={styles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.background,
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: C.text,
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: C.textMuted,
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: C.textInverse,
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: C.background,
  },
  loadingText: {
    color: C.primary,
    marginTop: 12,
    fontSize: 16,
  },
});