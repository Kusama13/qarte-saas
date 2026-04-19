import { describe, it, expect, vi } from 'vitest';
import { recommendTierForMerchant } from '../trial-tier-reco';

/** Build a stub Supabase client whose `.from()` returns the given counts
 *  for merchant_planning_slots and visits in order. */
function stubSupabase(slotsCount: number, visitsCount: number) {
  const calls: string[] = [];
  const builder = (count: number) => ({
    select: () => builder(count),
    eq: () => builder(count),
    not: () => Promise.resolve({ count, data: null, error: null }),
  });
  return {
    calls,
    from: (table: string) => {
      calls.push(table);
      if (table === 'merchant_planning_slots') return builder(slotsCount);
      if (table === 'visits') {
        // visits chains: select → eq → eq (no .not)
        return {
          select: () => ({
            eq: () => ({
              eq: () => Promise.resolve({ count: visitsCount, data: null, error: null }),
            }),
          }),
        };
      }
      throw new Error(`Unexpected table: ${table}`);
    },
  };
}

describe('recommendTierForMerchant', () => {
  it('returns "all_in" when merchant has at least one planning booking', async () => {
    const supa = stubSupabase(3, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await recommendTierForMerchant(supa as any, 'merchant-1');
    expect(result).toBe('all_in');
  });

  it('returns "fidelity" when merchant has visits but no planning bookings', async () => {
    const supa = stubSupabase(0, 5);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await recommendTierForMerchant(supa as any, 'merchant-2');
    expect(result).toBe('fidelity');
  });

  it('returns null when merchant has no engagement (no bookings, no visits)', async () => {
    const supa = stubSupabase(0, 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await recommendTierForMerchant(supa as any, 'merchant-3');
    expect(result).toBeNull();
  });

  it('prefers "all_in" when merchant has both planning bookings and visits', async () => {
    const supa = stubSupabase(2, 8);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await recommendTierForMerchant(supa as any, 'merchant-4');
    expect(result).toBe('all_in');
  });

  it('handles null counts safely (treats as 0)', async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supa = stubSupabase(null as any, null as any);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await recommendTierForMerchant(supa as any, 'merchant-5');
    expect(result).toBeNull();
  });
});

// Suppress unused warning
void vi;
