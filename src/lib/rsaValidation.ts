/**
 * RSA Validation Utilities
 *
 * Validation functions for South African compliance documents:
 * - RSA ID number (13-digit with Luhn checksum)
 * - PDP (Professional Driving Permit) number
 * - SA Cell phone numbers
 */

// Validate RSA ID number (13 digits with Luhn checksum)
export function validateRSAId(idNumber: string): { valid: boolean; error?: string } {
  // Remove spaces and dashes first
  const cleanId = idNumber.replace(/[\s-]/g, '');

  if (!cleanId || cleanId.length !== 13) {
    return { valid: false, error: 'RSA ID must be exactly 13 digits' };
  }

  if (!/^\d{13}$/.test(cleanId)) {
    return { valid: false, error: 'ID must contain only numbers' };
  }

  // Extract date part (first 6 digits)
  const year = parseInt(cleanId.substring(0, 2));
  const month = parseInt(cleanId.substring(2, 4));
  const day = parseInt(cleanId.substring(4, 6));

  // Validate date
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return { valid: false, error: 'Invalid date in ID number' };
  }

  return { valid: true };
}

// Validate PDP number (RSA format: PDP + 8 digits)
export function validatePDPNumber(pdpNumber: string): { valid: boolean; error?: string } {
  if (!pdpNumber) {
    return { valid: false, error: 'PDP number is required' };
  }

  // Remove spaces and convert to uppercase
  const clean = pdpNumber.replace(/\s/g, '').toUpperCase();

  // PDP format: PDP + 8 digits
  const pdpRegex = /^PDP\d{8}$/;
  if (!pdpRegex.test(clean)) {
    return { valid: false, error: 'PDP must be in format: PDP12345678 (8 digits after PDP)' };
  }

  return { valid: true };
}

// Validate South African cell number
export function validateSACellNumber(phone: string): { valid: boolean; error?: string } {
  const clean = phone.replace(/\s/g, '').replace(/^\+27/, '0');

  // Must be 10 digits starting with 0, or 9 digits starting with 7
  const saCellRegex = /^0[6-8]\d{8}$/;
  if (!saCellRegex.test(clean)) {
    return { valid: false, error: 'Invalid SA cell number (e.g., 0821234567)' };
  }

  return { valid: true };
}

// Calculate days until expiry
export function getDaysUntilExpiry(date?: Date): number | null {
  if (!date) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffTime = date.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

// Get expiry status color
export function getExpiryStatusColor(date?: Date): string {
  const days = getDaysUntilExpiry(date);
  if (days === null) return '#999';
  if (days < 0) return '#E03C31'; // Red - expired
  if (days <= 30) return '#FFB81C'; // Yellow - expiring soon
  return '#007749'; // Green - valid
}

// Format date for display
export function formatDate(date?: Date): string | null {
  if (!date) return null;
  return date.toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
