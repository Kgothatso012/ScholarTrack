// Network/Offline Detection Hook
// Handles offline states gracefully for SA market (low connectivity areas)

import { useState, useEffect, useCallback } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface UseNetworkResult {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  connectionType: string | null;
  refresh: () => void;
}

export function useNetwork(): UseNetworkResult {
  const [networkState, setNetworkState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    // Get initial state
    NetInfo.fetch().then(setNetworkState);

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(setNetworkState);

    return () => unsubscribe();
  }, []);

  const refresh = useCallback(() => {
    NetInfo.fetch().then(setNetworkState);
  }, []);

  return {
    isConnected: networkState?.isConnected ?? null,
    isInternetReachable: networkState?.isInternetReachable ?? null,
    connectionType: networkState?.type ?? null,
    refresh,
  };
}

// Form Validation Utilities
// Using Zod (already in dependencies)

import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['parent', 'driver', 'admin']),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Parent schemas
export const childSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  grade: z.string().min(1, 'Grade is required'),
  school_id: z.string().min(1, 'School is required'),
  pickup_address: z.string().min(5, 'Pickup address is required'),
  dropoff_address: z.string().min(5, 'Dropoff address is required'),
});

// Driver schemas
export const driverProfileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().regex(/^\+27[0-9]{9}$/, 'Invalid SA phone number'),
  vehicle_type: z.enum(['sedan', 'suv', 'minibus', 'bus']),
  license_number: z.string().min(5, 'License number is required'),
  permit_number: z.string().min(5, 'Permit number is required'),
});

// Payment schemas  
export const paymentSchema = z.object({
  amount: z.number().min(1, 'Amount must be at least R1'),
  method: z.enum(['card', 'vodacom', 'mtn', 'telkom']),
  reference: z.string().optional(),
});

// Helper function to validate form data
export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors: Record<string, string> = {};
  result.error.issues.forEach(issue => {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  });
  
  return { success: false, errors };
}

// SA-specific phone validation
export function validateSAPhone(phone: string): boolean {
  // Accepts: +27..., 0..., 27...
  const saPhoneRegex = /^(\+27|0|27)[0-9]{9}$/;
  return saPhoneRegex.test(phone.replace(/\s/g, ''));
}

// Format SA phone number
export function formatSAPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('27')) {
    return `+${cleaned}`;
  }
  if (cleaned.startsWith('0')) {
    return `+27${cleaned.slice(1)}`;
  }
  return `+27${cleaned}`;
}

// Currency formatting (ZAR)
export function formatZAR(amount: number): string {
  return new Intl.NumberFormat('en-ZA', {
    style: 'currency',
    currency: 'ZAR',
  }).format(amount);
}

// Date formatting for SA
export function formatSADate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date));
}

export function formatSADateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-ZA', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(date));
}
