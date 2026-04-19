import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlanTier } from '@/types';

/**
 * Recommend a tier based on what the merchant actually used during trial.
 *
 * Logic (skill: marketing-psychology — Default effect + Personalization):
 *   - Booked at least 1 RDV via the planning module → all_in
 *   - At least 1 confirmed visit but no online booking → fidelity (likely paper agenda or other tool)
 *   - No engagement signal → null (caller falls back to legacy generic block)
 */
export async function recommendTierForMerchant(
  supabase: SupabaseClient,
  merchantId: string,
): Promise<PlanTier | null> {
  const [bookings, visits] = await Promise.all([
    supabase
      .from('merchant_planning_slots')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .not('client_name', 'is', null),
    supabase
      .from('visits')
      .select('id', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('status', 'confirmed'),
  ]);

  const bookingCount = bookings.count || 0;
  const visitCount = visits.count || 0;

  if (bookingCount >= 1) return 'all_in';
  if (visitCount >= 1) return 'fidelity';
  return null;
}
