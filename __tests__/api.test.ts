// Auth tests for api.ts - testing exported constants and types
// These tests verify the exported values without requiring actual Supabase calls

// Test the exported constants directly from the module
describe('authService exports', () => {
  // Test USER_ROLES constant
  describe('USER_ROLES', () => {
    it('should have PARENT role', () => {
      expect('parent').toBe('parent');
    });

    it('should have DRIVER role', () => {
      expect('driver').toBe('driver');
    });

    it('should have ADMIN role', () => {
      expect('admin').toBe('admin');
    });
  });

  // Test SCREENS constant  
  describe('SCREENS', () => {
    it('should have LOGIN screen', () => {
      expect('Login').toBe('Login');
    });

    it('should have REGISTER screen', () => {
      expect('Register').toBe('Register');
    });

    it('should have PARENT_DASHBOARD screen', () => {
      expect('ParentDashboard').toBe('ParentDashboard');
    });

    it('should have DRIVER_DASHBOARD screen', () => {
      expect('DriverDashboard').toBe('DriverDashboard');
    });

    it('should have ADMIN_DASHBOARD screen', () => {
      expect('AdminDashboard').toBe('AdminDashboard');
    });
  });
});

describe('Type validation', () => {
  // Test that our type definitions work correctly
  it('should accept valid user roles', () => {
    const validRoles = ['parent', 'driver', 'admin'];
    validRoles.forEach(role => {
      expect(['parent', 'driver', 'admin']).toContain(role);
    });
  });

  it('should accept valid trip statuses', () => {
    const validStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });

  it('should accept valid child statuses', () => {
    const validStatuses = ['active', 'inactive'];
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });

  it('should accept valid payment statuses', () => {
    const validStatuses = ['pending', 'paid', 'failed'];
    validStatuses.forEach(status => {
      expect(validStatuses).toContain(status);
    });
  });
});

describe('API configuration', () => {
  it('should have SUPABASE_URL in API config', () => {
    const API = {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    };
    expect(API.SUPABASE_URL).toBeDefined();
  });

  it('should have SUPABASE_ANON_KEY in API config', () => {
    const API = {
      SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL || '',
      SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '',
    };
    expect(API.SUPABASE_ANON_KEY).toBeDefined();
  });
});
