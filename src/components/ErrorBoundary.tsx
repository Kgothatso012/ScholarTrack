// Error Boundary Component
import React, { Component, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// Simple dark styles (will be replaced by theme when needed)
const darkStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginTop: 16,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FFB81C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#000000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  loadingText: {
    color: '#FFB81C',
    marginTop: 12,
    fontSize: 16,
  },
});

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
        <View style={darkStyles.container}>
          <Ionicons name="warning" size={64} color="#FFB81C" />
          <Text style={darkStyles.title}>Something went wrong</Text>
          <Text style={darkStyles.message}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </Text>
          <TouchableOpacity style={darkStyles.button} onPress={this.handleRetry}>
            <Text style={darkStyles.buttonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export const LoadingScreen = ({ message = 'Loading...' }: { message?: string }) => (
  <View style={darkStyles.loadingContainer}>
    <ActivityIndicator size="large" color="#FFB81C" />
    <Text style={darkStyles.loadingText}>{message}</Text>
  </View>
);

export const ErrorFallback = ({
  message = 'Something went wrong',
  onRetry
}: {
  message?: string;
  onRetry?: () => void;
}) => (
  <View style={darkStyles.container}>
    <Ionicons name="warning" size={64} color="#FFB81C" />
    <Text style={darkStyles.title}>{message}</Text>
    {onRetry && (
      <TouchableOpacity style={darkStyles.button} onPress={onRetry}>
        <Text style={darkStyles.buttonText}>Try Again</Text>
      </TouchableOpacity>
    )}
  </View>
);