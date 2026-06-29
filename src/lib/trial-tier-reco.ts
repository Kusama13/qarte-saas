import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Recommend a tier based on what the merchant actually used during trial.
 *
 * Le plan Fidélité n'est plus proposé aux nouveaux (juillet 2026) : seul Tout-en-un
 * peut être recommandé.
 *   - A réservé au moins 1 RDV via le planning → all_in (reco personnalisée badgée)
 *   - Aucun signal de réservation → null (le caller affiche le bloc prix générique)
 */
export async function recommendTierForMerchant(
  supabase: SupabaseClient,
  merchantId: string,
): Promise<'all_in' | null> {
  const bookings = await supabase
    .from('merchant_planning_slots')
    .select('id', { count: 'exact', head: true })
    .eq('merchant_id', merchantId)
    .not('client_name', 'is', null);

  return (bookings.count || 0) >= 1 ? 'all_in' : null;
}
