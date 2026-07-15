// CrashScreen — global JS error handler. Catches module-load errors,
// async errors, unhandled promise rejections. Shows the actual stack so
// we can SEE the crash instead of guessing. Replace with proper
// Sentry/Crashlytics once we know what's wrong.
// ponytail: stays until first stable release, then swap for Sentry.
import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';

type Props = { error: Error | null; info?: string; onReset?: () => void };

export class CrashScreen extends React.Component<Props> {
  render() {
    const { error, info, onReset } = this.props;
    return (
      <View style={styles.root}>
        <Text style={styles.title}>App crashed</Text>
        <Text style={styles.subtitle}>{error?.message ?? 'Unknown error'}</Text>
        <ScrollView style={styles.box} contentContainerStyle={{ padding: 12 }}>
          <Text style={styles.code} selectable>
            {error?.stack ?? '(no stack)'}
            {info ? `\n\n--- componentStack ---\n${info}` : ''}
          </Text>
        </ScrollView>
        {onReset ? (
          <TouchableOpacity style={styles.btn} onPress={onReset}>
            <Text style={styles.btnText}>Reload</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0a0a0b', padding: 20, paddingTop: 60 },
  title: { color: '#DC2626', fontSize: 22, fontWeight: '700', marginBottom: 6 },
  subtitle: { color: '#FBBF24', fontSize: 14, marginBottom: 16 },
  box: { flex: 1, backgroundColor: '#18181B', borderRadius: 8 },
  code: { color: '#E4E4E7', fontSize: 11, fontFamily: 'monospace' },
  btn: { marginTop: 16, backgroundColor: '#D97706', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#000', fontWeight: '700' },
});

// Hook to install the global handler. Returns an ErrorBoundary-friendly component.
let capturedError: Error | null = null;
let capturedInfo: string | null = null;

export function installGlobalErrorHandler() {
  const g: any = global as any;
  const ErrorUtils = g.ErrorUtils;
  if (!ErrorUtils || ErrorUtils.__scholartrackInstalled) return;
  ErrorUtils.__scholartrackInstalled = true;
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((err: Error, isFatal?: boolean) => {
    capturedError = err;
    capturedInfo = isFatal ? 'FATAL' : 'non-fatal';
    console.error('[GlobalErrorHandler]', err);
    previous?.(err, isFatal);
  });
  const trackingOpts: any = { allRejections: true, onUnhandled: (id: any, err: any) => {
    capturedError = err instanceof Error ? err : new Error(String(err));
    capturedInfo = `unhandledRejection#${id}`;
    console.error('[GlobalErrorHandler] unhandled rejection', err);
  }};
  try {
    g.HermesInternal?.enablePromiseRejectionTracker?.(trackingOpts);
    require('promise/setimmediate/rejection-tracking').enable(trackingOpts);
  } catch {}
}

export function getCapturedError(): { error: Error | null; info: string | null } {
  return { error: capturedError, info: capturedInfo };
}

export function clearCapturedError() {
  capturedError = null;
  capturedInfo = null;
}