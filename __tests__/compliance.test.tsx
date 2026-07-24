/**
 * Compliance Feature Tests
 *
 * Tests for:
 * - RSA ID validation
 * - PDP number validation
 * - SA cell number validation
 * - Expiry date calculations
 * - Compliance status calculation
 */

import {
  validateRSAId,
  validateSACellNumber,
  validatePDPNumber,
  getDaysUntilExpiry,
  getExpiryStatusColor,
  formatDate,
} from '../src/lib/rsaValidation';

// ============ RSA ID VALIDATION TESTS ============

describe('validateRSAId', () => {
  describe('valid RSA IDs', () => {
    test('accepts valid 13-digit RSA ID', () => {
      // Valid ID with valid Luhn checksum (8601205239082)
      const result = validateRSAId('8601205239082');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('accepts valid ID with spaces', () => {
      // Same ID with spaces
      const result = validateRSAId('860120 5239082');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid RSA IDs', () => {
    test('rejects ID shorter than 13 digits', () => {
      const result = validateRSAId('850101123456');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('13 digits');
    });

    test('rejects ID longer than 13 digits', () => {
      const result = validateRSAId('85010112345678');
      expect(result.valid).toBe(false);
    });

    test('rejects ID with letters', () => {
      const result = validateRSAId('850101123456a');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('numbers');
    });

    test('rejects empty ID', () => {
      const result = validateRSAId('');
      expect(result.valid).toBe(false);
    });

    test('rejects invalid date in ID (month 13)', () => {
      const result = validateRSAId('8513011234567');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('date');
    });

    test('rejects invalid date in ID (day 32)', () => {
      const result = validateRSAId('8501321234567');
      expect(result.valid).toBe(false);
    });
  });
});

// ============ PDP NUMBER VALIDATION TESTS ============

describe('validatePDPNumber', () => {
  describe('valid PDP numbers', () => {
    test('accepts valid PDP format', () => {
      const result = validatePDPNumber('PDP12345678');
      expect(result.valid).toBe(true);
    });

    test('accepts PDP with spaces', () => {
      const result = validatePDPNumber('PDP 1234 5678');
      expect(result.valid).toBe(true);
    });

    test('accepts lowercase pdp', () => {
      const result = validatePDPNumber('pdp12345678');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid PDP numbers', () => {
    test('rejects empty PDP', () => {
      const result = validatePDPNumber('');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('required');
    });

    test('rejects missing PDP prefix', () => {
      const result = validatePDPNumber('12345678');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('format');
    });

    test('rejects too few digits', () => {
      const result = validatePDPNumber('PDP1234567');
      expect(result.valid).toBe(false);
    });

    test('rejects too many digits', () => {
      const result = validatePDPNumber('PDP123456789');
      expect(result.valid).toBe(false);
    });

    test('rejects letters in number portion', () => {
      const result = validatePDPNumber('PDP1234ABCD');
      expect(result.valid).toBe(false);
    });
  });
});

// ============ SA CELL NUMBER VALIDATION TESTS ============

describe('validateSACellNumber', () => {
  describe('valid SA cell numbers', () => {
    test('accepts standard SA cell (0821234567)', () => {
      const result = validateSACellNumber('0821234567');
      expect(result.valid).toBe(true);
    });

    test('accepts cell with +27 prefix', () => {
      const result = validateSACellNumber('+27821234567');
      expect(result.valid).toBe(true);
    });

    test('accepts 083 number', () => {
      const result = validateSACellNumber('0831234567');
      expect(result.valid).toBe(true);
    });

    test('accepts 084 number', () => {
      const result = validateSACellNumber('0841234567');
      expect(result.valid).toBe(true);
    });
  });

  describe('invalid SA cell numbers', () => {
    test('rejects landline (012 number)', () => {
      const result = validateSACellNumber('0121234567');
      expect(result.valid).toBe(false);
    });

    test('rejects too short', () => {
      const result = validateSACellNumber('082123456');
      expect(result.valid).toBe(false);
    });

    test('rejects wrong prefix (09)', () => {
      const result = validateSACellNumber('0912345678');
      expect(result.valid).toBe(false);
    });
  });
});

// ============ EXPIRY DATE CALCULATION TESTS ============

describe('Expiry Date Calculations', () => {
  describe('getDaysUntilExpiry', () => {
    test('returns null for undefined date', () => {
      expect(getDaysUntilExpiry(undefined)).toBeNull();
    });

    test('returns positive for future date', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);
      const days = getDaysUntilExpiry(futureDate);
      expect(days).toBeGreaterThan(0);
    });

    test('returns negative for past date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);
      const days = getDaysUntilExpiry(pastDate);
      expect(days).toBeLessThan(0);
    });

    test('returns 0 for today', () => {
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      const days = getDaysUntilExpiry(today);
      expect(days).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getExpiryStatusColor', () => {
    test('returns gray for null date', () => {
      expect(getExpiryStatusColor(undefined)).toBe('#999999');
    });

    test('returns red for expired date', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 5);
      const result = getExpiryStatusColor(pastDate);
      expect(result).toBe('#DC2626'); // error red
    });

    test('returns yellow for date within 30 days', () => {
      const soonDate = new Date();
      soonDate.setDate(soonDate.getDate() + 15);
      expect(getExpiryStatusColor(soonDate)).toBe('#D97706'); // primary amber
    });

    test('returns green for date beyond 30 days', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 60);
      expect(getExpiryStatusColor(futureDate)).toBe('#059669'); // success green
    });
  });

  describe('formatDate', () => {
    test('returns null for undefined date', () => {
      expect(formatDate(undefined)).toBeNull();
    });

    test('formats date correctly', () => {
      const date = new Date('2026-03-15');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/2026/);
      expect(formatted).toMatch(/03/);
      expect(formatted).toMatch(/15/);
    });
  });
});

// ============ COMPLIANCE STATUS CALCULATION TESTS ============

describe('Compliance Status Calculation', () => {
  // Simulates dashboard logic
  const calculateDriverStatus = (documents: Record<string, { status: string; expiry_date?: string }>) => {
    const requiredDocs = ['pdp_certificate', 'roadworthy', 'drivers_license', 'insurance', 'operating_license'];
    const hasAllDocs = requiredDocs.every(docType => documents[docType]?.status === 'approved');

    if (!hasAllDocs) return { status: 'pending', color: '#FF9500' };

    const today = new Date();
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    for (const docType of requiredDocs) {
      if (documents[docType]?.expiry_date) {
        const expiryDate = new Date(documents[docType].expiry_date);
        if (expiryDate < today) {
          return { status: 'expired', color: '#E03C31' };
        }
        if (expiryDate <= thirtyDaysFromNow) {
          return { status: 'expiring', color: '#FFB81C' };
        }
      }
    }

    return { status: 'compliant', color: '#007749' };
  };

  test('returns pending when missing documents', () => {
    const docs = { pdp_certificate: { status: 'approved' } };
    const result = calculateDriverStatus(docs);
    expect(result.status).toBe('pending');
  });

  test('returns pending when document not approved', () => {
    const docs = {
      pdp_certificate: { status: 'pending' },
      roadworthy: { status: 'approved' },
      drivers_license: { status: 'approved' },
      insurance: { status: 'approved' },
      operating_license: { status: 'approved' },
    };
    const result = calculateDriverStatus(docs);
    expect(result.status).toBe('pending');
  });

  test('returns compliant when all approved and not expiring', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 365);

    const docs = {
      pdp_certificate: { status: 'approved', expiry_date: futureDate.toISOString() },
      roadworthy: { status: 'approved', expiry_date: futureDate.toISOString() },
      drivers_license: { status: 'approved', expiry_date: futureDate.toISOString() },
      insurance: { status: 'approved', expiry_date: futureDate.toISOString() },
      operating_license: { status: 'approved', expiry_date: futureDate.toISOString() },
    };
    const result = calculateDriverStatus(docs);
    expect(result.status).toBe('compliant');
  });

  test('returns expiring when document expires within 30 days', () => {
    const soonDate = new Date();
    soonDate.setDate(soonDate.getDate() + 15);

    const docs = {
      pdp_certificate: { status: 'approved', expiry_date: soonDate.toISOString() },
      roadworthy: { status: 'approved', expiry_date: soonDate.toISOString() },
      drivers_license: { status: 'approved', expiry_date: soonDate.toISOString() },
      insurance: { status: 'approved', expiry_date: soonDate.toISOString() },
      operating_license: { status: 'approved', expiry_date: soonDate.toISOString() },
    };
    const result = calculateDriverStatus(docs);
    expect(result.status).toBe('expiring');
  });

  test('returns expired when document is past expiry', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);

    const docs = {
      pdp_certificate: { status: 'approved', expiry_date: pastDate.toISOString() },
      roadworthy: { status: 'approved', expiry_date: pastDate.toISOString() },
      drivers_license: { status: 'approved', expiry_date: pastDate.toString() },
      insurance: { status: 'approved', expiry_date: pastDate.toISOString() },
      operating_license: { status: 'approved', expiry_date: pastDate.toISOString() },
    };
    const result = calculateDriverStatus(docs);
    expect(result.status).toBe('expired');
  });
});
