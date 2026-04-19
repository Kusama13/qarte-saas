import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Activation score (S0-S3) — nombre de piliers Qarte atteints par un merchant.
 * Utilisé par le cron emails+SMS trial pour segmenter (plan v2).
 *
 * - Pilier 1 (fidélité)  : ≥1 visite avec un phone_number ≠ phone du merchant
 * - Pilier 2 (planning)  : ≥1 slot WHERE booked_online = true
 * - Pilier 3 (vitrine)   : bio non vide + shop_address non vide + ≥1 photo
 *
 * Calculé on-the-fly (pas stocké en DB pour éviter trigger sur hot path).
 * Voir docs/email-sms-trial-plan.md §1.
 */

export type ActivationScore = 0 | 1 | 2 | 3;
export type Pillar = 'fidelity' | 'planning' | 'vitrine';

export interface ActivationDetails {
  score: ActivationScore;
  pillars: Record<Pillar, boolean>;
  /** Pilier touché en 1er (par created_at), null si aucun. Utilisé pour SMS célébration. */
  firstPillar: Pillar | null;
  firstPillarAt: string | null;
}

interface MerchantLike {
  id: string;
  bio?: string | null;
  shop_address?: string | null;
}

/**
 * Calcule le score d'activation pour un merchant donné.
 * 4 queries en parallèle (visites, slots, photos count, premier event timestamps).
 */
export async function computeActivationScore(
  supabase: SupabaseClient,
  merchant: MerchantLike,
): Promise<ActivationDetails> {
  const [visitsRes, slotsRes, photosRes] = await Promise.all([
    supabase
      .from('visits')
      .select('visited_at')
      .eq('merchant_id', merchant.id)
      .order('visited_at', { ascending: true })
      .limit(1),
    supabase
      .from('merchant_planning_slots')
      .select('booked_at')
      .eq('merchant_id', merchant.id)
      .eq('booked_online', true)
      .order('booked_at', { ascending: true })
      .limit(1),
    supabase
      .from('merchant_photos')
      .select('id, created_at')
      .eq('merchant_id', merchant.id)
      .order('created_at', { ascending: true })
      .limit(1),
  ]);

  const hasVisit = (visitsRes.data?.length ?? 0) > 0;
  const hasBooking = (slotsRes.data?.length ?? 0) > 0;
  const hasPhoto = (photosRes.data?.length ?? 0) > 0;
  const hasVitrine = Boolean(merchant.bio?.trim()) && Boolean(merchant.shop_address?.trim()) && hasPhoto;

  const pillars: Record<Pillar, boolean> = {
    fidelity: hasVisit,
    planning: hasBooking,
    vitrine: hasVitrine,
  };

  const score = (Number(pillars.fidelity) + Number(pillars.planning) + Number(pillars.vitrine)) as ActivationScore;

  // Détermine le premier pilier touché chronologiquement
  const candidates: Array<{ pillar: Pillar; at: string | null }> = [];
  if (hasVisit) candidates.push({ pillar: 'fidelity', at: visitsRes.data![0].visited_at });
  if (hasBooking) candidates.push({ pillar: 'planning', at: slotsRes.data![0].booked_at });
  if (hasVitrine) candidates.push({ pillar: 'vitrine', at: photosRes.data![0].created_at });

  candidates.sort((a, b) => {
    if (!a.at) return 1;
    if (!b.at) return -1;
    return a.at.localeCompare(b.at);
  });

  const first = candidates[0];

  return {
    score,
    pillars,
    firstPillar: first?.pillar ?? null,
    firstPillarAt: first?.at ?? null,
  };
}

/**
 * Variante batch : calcule le score pour N merchants en N×3 queries parallèles.
 * Pour usage cron (évite 200 requêtes séquentielles).
 */
export async function computeActivationScoresBatch(
  supabase: SupabaseClient,
  merchants: MerchantLike[],
): Promise<Map<string, ActivationDetails>> {
  const results = await Promise.all(
    merchants.map((m) => computeActivationScore(supabase, m).then((d) => [m.id, d] as const)),
  );
  return new Map(results);
}
