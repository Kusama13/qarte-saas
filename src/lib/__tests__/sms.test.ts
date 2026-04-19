import { describe, it, expect } from 'vitest';
import { isFidelityFreeSms } from '../sms';

describe('isFidelityFreeSms', () => {
  it('returns true for Fidélité merchant + birthday', () => {
    expect(isFidelityFreeSms({ plan_tier: 'fidelity' }, 'birthday')).toBe(true);
  });

  it('returns true for Fidélité merchant + referral_reward', () => {
    expect(isFidelityFreeSms({ plan_tier: 'fidelity' }, 'referral_reward')).toBe(true);
  });

  it('returns false for Fidélité merchant + non-auto SMS type', () => {
    expect(isFidelityFreeSms({ plan_tier: 'fidelity' }, 'reminder_j1')).toBe(false);
    expect(isFidelityFreeSms({ plan_tier: 'fidelity' }, 'confirmation_no_deposit')).toBe(false);
    expect(isFidelityFreeSms({ plan_tier: 'fidelity' }, 'booking_cancelled')).toBe(false);
  });

  it('returns false for Tout-en-un merchant — quota normal applies', () => {
    expect(isFidelityFreeSms({ plan_tier: 'all_in' }, 'birthday')).toBe(false);
    expect(isFidelityFreeSms({ plan_tier: 'all_in' }, 'referral_reward')).toBe(false);
  });

  it('returns false for null merchant', () => {
    expect(isFidelityFreeSms(null, 'birthday')).toBe(false);
  });

  it('returns false for merchant with missing plan_tier', () => {
    expect(isFidelityFreeSms({}, 'birthday')).toBe(false);
    expect(isFidelityFreeSms({ plan_tier: null }, 'birthday')).toBe(false);
  });
});
