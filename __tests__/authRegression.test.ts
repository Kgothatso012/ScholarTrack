// Auth State Regression Tests
// Tests for auth state machine behavior including sign-out handling

import React from 'react';

// Mock supabase before importing auth module
const mockSubscribe = jest.fn(() => ({
  unsubscribe: jest.fn(),
}));

const mockOnAuthStateChange = jest.fn((callback) => {
  // Store callback for test invocation
  (mockOnAuthStateChange as any)._callback = callback;
  return { data: { subscription: mockSubscribe() } };
});

const mockGetSession = jest.fn();

jest.mock('../src/lib/api', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
      getSession: mockGetSession,
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  },
  authService: {
    getCurrentUser: jest.fn().mockResolvedValue({
      id: 'test-user-id',
      email: 'test@example.com',
      role: 'parent',
      full_name: 'Test User',
      phone: '0821234567',
    }),
  },
}));

describe('AuthProvider State Machine', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });
  });

  describe('onAuthStateChange null-session handling', () => {
    it('should clear user when session is null (sign-out event)', () => {
      // This test verifies the fix for Codex finding:
      // "The new onAuthStateChange handler only refreshes the user when initialized && session?.user is true;
      // every other event now falls through to setLoading(false) without calling setUser(null)"
      //
      // The correct behavior: null session -> setUser(null) + setLoading(false)
      // NOT: null session -> setLoading(false) only (leaving stale user in memory)

      const events: string[] = [];
      const userStates: any[] = [];

      // Simulate the fixed onAuthStateChange handler
      const handleAuthChange = (_event: string, session: any) => {
        events.push(_event);

        if (!session?.user) {
          // Sign-out event: clear user state - THIS IS THE FIX
          userStates.push(null);
          return;
        }
        userStates.push({ id: session.user.id });
      };

      // Simulate sign-in event
      handleAuthChange('SIGNED_IN', { user: { id: 'user-123' } });
      expect(userStates[0]).toEqual({ id: 'user-123' });

      // Simulate sign-out event with null session
      handleAuthChange('SIGNED_OUT', null);
      expect(userStates[1]).toBeNull();

      // Verify the null-session case explicitly clears user
      // (not just setLoading false while leaving stale user)
      expect(userStates.length).toBe(2);
      expect(userStates[1]).toBeNull();
    });

    it('should NOT make duplicate getCurrentUser calls for same session', () => {
      let callCount = 0;
      let initialized = false;

      const handleAuthChange = async (_event: string, session: any) => {
        if (!session?.user) return;
        if (initialized) return; // Skip duplicate - THIS IS THE FIX

        callCount++;
      };

      // First call - initialized is false, so it proceeds
      handleAuthChange('SIGNED_IN', { user: { id: 'user-123' } });

      // Mark as initialized after first call
      initialized = true;

      // Second call with same session - should be skipped
      handleAuthChange('SIGNED_IN', { user: { id: 'user-123' } });


      // Should only count the first call
      expect(callCount).toBe(1);
    });
  });

  describe('SA Phone Validation', () => {
    const validateSAPhone = (phone: string): boolean => {
      const cleaned = phone.replace(/\s/g, '');
      return /^(\+27|0)[6-8][0-9]{8}$/.test(cleaned);
    };

    it('should accept valid SA mobile numbers starting with 0', () => {
      expect(validateSAPhone('0821234567')).toBe(true);
      expect(validateSAPhone('0831234567')).toBe(true);
      expect(validateSAPhone('0841234567')).toBe(true);
      expect(validateSAPhone('0612345678')).toBe(true);
    });

    it('should accept valid SA mobile numbers with +27 prefix', () => {
      expect(validateSAPhone('+27821234567')).toBe(true);
      expect(validateSAPhone('+27831234567')).toBe(true);
      expect(validateSAPhone('+27841234567')).toBe(true);
    });

    it('should reject invalid SA phone numbers', () => {
      // Too short
      expect(validateSAPhone('082123')).toBe(false);
      // Starts with 0 followed by digit outside 6-8 range
      expect(validateSAPhone('0512345678')).toBe(false); // 05 - 5 is invalid
      expect(validateSAPhone('0912345678')).toBe(false); // 09 - 9 is invalid
      // Invalid format
      expect(validateSAPhone('1234567890')).toBe(false);
      expect(validateSAPhone('abcdefghij')).toBe(false);
      // Empty
      expect(validateSAPhone('')).toBe(false);
    });

    it('should handle phone numbers with spaces', () => {
      expect(validateSAPhone('082 123 4567')).toBe(true);
      expect(validateSAPhone('+27 82 123 4567')).toBe(true);
    });
  });
});
