// Toast Service - Centralized notifications for ScholarTrack
// Replaces scattered Alert.alert calls with consistent toast notifications

import { ToastAndroid, Platform, Alert } from 'react-native';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastConfig {
  message: string;
  type?: ToastType;
  duration?: number; // ms
  action?: {
    label: string;
    onPress: () => void;
  };
}

class ToastService {
  private static instance: ToastService;

  private constructor() {}

  static getInstance(): ToastService {
    if (!ToastService.instance) {
      ToastService.instance = new ToastService();
    }
    return ToastService.instance;
  }

  /**
   * Show a toast notification
   * On Android: Uses native ToastAndroid
   * On iOS: Falls back to Alert (can be enhanced with react-native-toast)
   */
  show(config: ToastConfig): void {
    const { message, type = 'info', duration = 3000 } = config;

    if (Platform.OS === 'android') {
      // Android native toast
      const gravity = type === 'error' ? 'BOTTOM' : 'CENTER';
      ToastAndroid.showWithGravity(message, duration / 1000, ToastAndroid[gravity] as any);
    } else {
      // iOS fallback - using Alert with auto-dismiss simulation
      Alert.alert(
        this.getTitle(type),
        message,
        [{ text: 'OK', style: 'cancel' }],
        { cancelable: true }
      );
    }
  }

  private getTitle(type: ToastType): string {
    switch (type) {
      case 'success': return '✓ Success';
      case 'error': return '✕ Error';
      case 'warning': return '⚠ Warning';
      default: return 'Info';
    }
  }

  // Convenience methods
  success(message: string, duration?: number): void {
    this.show({ message, type: 'success', duration });
  }

  error(message: string, duration?: number): void {
    this.show({ message, type: 'error', duration: duration || 4000 });
  }

  warning(message: string, duration?: number): void {
    this.show({ message, type: 'warning', duration });
  }

  info(message: string, duration?: number): void {
    this.show({ message, type: 'info', duration });
  }

  /**
   * Show confirmation dialog (replaces Alert.alert for confirmations)
   */
  confirm(
    title: string,
    message: string,
    onConfirm: () => void,
    onCancel?: () => void
  ): void {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'Confirm', onPress: onConfirm },
    ]);
  }

  /**
   * Show destructive action confirmation
   */
  confirmDestructive(
    title: string,
    message: string,
    onConfirm: () => void
  ): void {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
}

export const toast = ToastService.getInstance();
export default toast;