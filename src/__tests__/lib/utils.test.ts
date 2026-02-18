import { describe, it, expect } from 'vitest';
import {
  ensureTextContrast,
  generateSlug,
  generateScanCode,
  getDaysRemaining,
  getTrialStatus,
  formatPhoneNumber,
  validatePhone,
  displayPhoneNumber,
  validateEmail,
  truncate,
  generateReferralCode,
} from '@/lib/utils';

// ---------------------------------------------------------------------------
// getTrialStatus
// ---------------------------------------------------------------------------
describe('getTrialStatus', () => {
  const futureDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString();
  };

  const pastDate = (days: number): string => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString();
  };

  it('returns isActive when trial has 5 days remaining', () => {
    const status = getTrialStatus(futureDate(5), 'trialing');
    expect(status.isActive).toBe(true);
    expect(status.isInGracePeriod).toBe(false);
    expect(status.isFullyExpired).toBe(false);
    expect(status.daysRemaining).toBeGreaterThanOrEqual(4);
  });

  it('returns isActive on the last day of trial', () => {
    const status = getTrialStatus(futureDate(1), 'trialing');
    expect(status.isActive).toBe(true);
    expect(status.isInGracePeriod).toBe(false);
    expect(status.isFullyExpired).toBe(false);
    expect(status.daysRemaining).toBeGreaterThanOrEqual(1);
  });

  it('returns isInGracePeriod when trial expired 1 day ago', () => {
    const status = getTrialStatus(pastDate(1), 'trialing');
    expect(status.isActive).toBe(false);
    expect(status.isInGracePeriod).toBe(true);
    expect(status.isFullyExpired).toBe(false);
    expect(status.daysUntilDeletion).toBeGreaterThan(0);
  });

  it('returns isFullyExpired when trial expired more than 3 days ago', () => {
    const status = getTrialStatus(pastDate(5), 'trialing');
    expect(status.isActive).toBe(false);
    expect(status.isInGracePeriod).toBe(false);
    expect(status.isFullyExpired).toBe(true);
    expect(status.daysUntilDeletion).toBe(0);
  });

  it('returns no restriction when subscriptionStatus is active', () => {
    const status = getTrialStatus(pastDate(10), 'active');
    expect(status.isActive).toBe(false);
    expect(status.isInGracePeriod).toBe(false);
    expect(status.isFullyExpired).toBe(false);
  });

  it('returns no restriction when subscriptionStatus is canceling', () => {
    const status = getTrialStatus(pastDate(10), 'canceling');
    expect(status.isActive).toBe(false);
    expect(status.isInGracePeriod).toBe(false);
    expect(status.isFullyExpired).toBe(false);
  });

  it('returns no restriction when subscriptionStatus is past_due', () => {
    const status = getTrialStatus(pastDate(10), 'past_due');
    expect(status.isActive).toBe(false);
    expect(status.isInGracePeriod).toBe(false);
    expect(status.isFullyExpired).toBe(false);
  });

  it('returns isFullyExpired when trialEndsAt is null', () => {
    const status = getTrialStatus(null, 'trialing');
    expect(status.isActive).toBe(false);
    expect(status.isInGracePeriod).toBe(false);
    expect(status.isFullyExpired).toBe(true);
    expect(status.daysRemaining).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// formatPhoneNumber
// ---------------------------------------------------------------------------
describe('formatPhoneNumber', () => {
  it('converts FR local 06 number to E.164 without +', () => {
    expect(formatPhoneNumber('0612345678', 'FR')).toBe('33612345678');
  });

  it('keeps FR +33 number unchanged (strips +)', () => {
    expect(formatPhoneNumber('+33612345678', 'FR')).toBe('33612345678');
  });

  it('handles FR number with spaces', () => {
    expect(formatPhoneNumber('06 12 34 56 78', 'FR')).toBe('33612345678');
  });

  it('converts BE local 04 number to E.164 without +', () => {
    expect(formatPhoneNumber('0475123456', 'BE')).toBe('32475123456');
  });

  it('converts CH local 07 number to E.164 without +', () => {
    expect(formatPhoneNumber('0791234567', 'CH')).toBe('41791234567');
  });
});

// ---------------------------------------------------------------------------
// validatePhone
// ---------------------------------------------------------------------------
describe('validatePhone', () => {
  it('returns true for a valid FR number', () => {
    expect(validatePhone('33612345678', 'FR')).toBe(true);
  });

  it('returns false for a FR number that is too short', () => {
    expect(validatePhone('3361234567', 'FR')).toBe(false);
  });

  it('returns true for a valid BE mobile number', () => {
    expect(validatePhone('32475123456', 'BE')).toBe(true);
  });

  it('returns false for an invalid prefix', () => {
    expect(validatePhone('44612345678', 'FR')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// displayPhoneNumber
// ---------------------------------------------------------------------------
describe('displayPhoneNumber', () => {
  it('formats FR E.164 number to local display with spaces', () => {
    expect(displayPhoneNumber('33612345678', 'FR')).toBe('06 12 34 56 78');
  });

  it('formats BE E.164 number to local display with spaces', () => {
    expect(displayPhoneNumber('32475123456', 'BE')).toBe('04 75 12 34 56');
  });
});

// ---------------------------------------------------------------------------
// generateSlug
// ---------------------------------------------------------------------------
describe('generateSlug', () => {
  it('converts to lowercase and replaces spaces with hyphens', () => {
    expect(generateSlug('My Great Shop')).toBe('my-great-shop');
  });

  it('removes accents from characters', () => {
    expect(generateSlug('Boulangerie Léon')).toBe('boulangerie-leon');
  });

  it('removes special characters', () => {
    expect(generateSlug("L'Atelier du Pain!")).toBe('latelier-du-pain');
  });

  it('collapses multiple spaces into a single hyphen', () => {
    expect(generateSlug('  Too   Many   Spaces  ')).toBe('too-many-spaces');
  });
});

// ---------------------------------------------------------------------------
// generateScanCode
// ---------------------------------------------------------------------------
describe('generateScanCode', () => {
  it('generates a code of exactly 8 characters', () => {
    const code = generateScanCode();
    expect(code).toHaveLength(8);
  });

  it('does not contain ambiguous characters (0, O, I, l, 1)', () => {
    // Run multiple times to increase confidence
    for (let i = 0; i < 50; i++) {
      const code = generateScanCode();
      expect(code).not.toMatch(/[0OIl1]/);
    }
  });

  it('generates different codes on successive calls', () => {
    const code1 = generateScanCode();
    const code2 = generateScanCode();
    expect(code1).not.toBe(code2);
  });
});

// ---------------------------------------------------------------------------
// generateReferralCode
// ---------------------------------------------------------------------------
describe('generateReferralCode', () => {
  it('generates a code of exactly 6 uppercase/digit characters', () => {
    const code = generateReferralCode();
    expect(code).toHaveLength(6);
    expect(code).toMatch(/^[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]+$/);
  });

  it('generates different codes on successive calls', () => {
    const code1 = generateReferralCode();
    const code2 = generateReferralCode();
    expect(code1).not.toBe(code2);
  });
});

// ---------------------------------------------------------------------------
// ensureTextContrast
// ---------------------------------------------------------------------------
describe('ensureTextContrast', () => {
  it('darkens a light color that has poor contrast against white', () => {
    const result = ensureTextContrast('#FFFF00'); // yellow — very poor contrast on white
    expect(result).not.toBe('#FFFF00');
    // The darkened result should still be a valid hex color
    expect(result).toMatch(/^#[0-9a-f]{6}$/);
  });

  it('keeps a dark color unchanged when contrast is already sufficient', () => {
    const result = ensureTextContrast('#000000'); // black — max contrast on white
    expect(result).toBe('#000000');
  });
});

// ---------------------------------------------------------------------------
// validateEmail
// ---------------------------------------------------------------------------
describe('validateEmail', () => {
  it('returns true for a valid email', () => {
    expect(validateEmail('user@example.com')).toBe(true);
  });

  it('returns false for an email without @', () => {
    expect(validateEmail('userexample.com')).toBe(false);
  });

  it('returns false for an empty string', () => {
    expect(validateEmail('')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getDaysRemaining
// ---------------------------------------------------------------------------
describe('getDaysRemaining', () => {
  it('returns a positive number for a future date', () => {
    const future = new Date();
    future.setDate(future.getDate() + 10);
    const days = getDaysRemaining(future.toISOString());
    expect(days).toBeGreaterThanOrEqual(9);
    expect(days).toBeLessThanOrEqual(11);
  });

  it('returns 0 for a past date', () => {
    const past = new Date();
    past.setDate(past.getDate() - 5);
    expect(getDaysRemaining(past.toISOString())).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// truncate
// ---------------------------------------------------------------------------
describe('truncate', () => {
  it('returns the original string if it is within maxLength', () => {
    expect(truncate('short', 10)).toBe('short');
  });

  it('truncates and appends ellipsis for strings exceeding maxLength', () => {
    expect(truncate('This is a very long string', 10)).toBe('This is...');
  });
});
