/**
 * État courant d'une carte de fidélité, prêt à afficher (badge liste, bande fiche résa,
 * fiche client). Centralise la logique de progression tampons / cagnotte jusqu'ici dupliquée
 * en inline (dashboard clients, carte cliente). Read-only, ne mute rien.
 *
 * À distinguer de `projectBookingLoyalty` (booking-loyalty.ts) qui projette l'état APRÈS un
 * futur +1 (confirmation de résa). Ici on décrit l'état ACTUEL.
 */

type CardInput =
  | { current_stamps?: number | null; current_amount?: number | null }
  | null
  | undefined;

export interface MerchantLoyaltyConfig {
  loyalty_mode?: string | null;
  stamps_required?: number | null;
  tier2_enabled?: boolean | null;
  tier2_stamps_required?: number | null;
  cagnotte_percent?: number | null;
  reward_description?: string | null;
  tier2_reward_description?: string | null;
}

export interface LoyaltyProgress {
  mode: 'visit' | 'cagnotte';
  hasCard: boolean;
  currentStamps: number;
  currentAmount: number;
  /** Cible de tampons courante : palier 2 si le palier 1 est déjà atteint (et tier2 activé), sinon palier 1. */
  target: number;
  /** Tampons restants avant la prochaine récompense. */
  remaining: number;
  /** Progression vers la cible courante (0-100). */
  progressPercent: number;
  isTier1Ready: boolean;
  isTier2Ready: boolean;
  tier2Enabled: boolean;
  /** Une récompense est réclamable maintenant (tient compte d'un palier 1 déjà consommé dans le cycle tier2). */
  rewardReady: boolean;
  /** Libellé de la récompense en jeu (palier 2 si prêt, sinon palier 1). */
  rewardLabel: string | null;
  /** Cashback cagnotte calculé sur le solde courant (0 en mode passage). */
  cashbackValue: number;
}

/**
 * Cashback cagnotte, arrondi au centime. `percent` = entier (ex: 5 pour 5%). Source unique
 * de la formule `Math.round(amount * percent) / 100` (redeem, checkin, affichage carte/dashboard)
 * pour que le montant annoncé et le montant débité ne divergent jamais sur l'arrondi.
 */
export function computeCashback(amount: number | null | undefined, percent: number | null | undefined): number {
  return Math.round(Number(amount || 0) * Number(percent || 0)) / 100;
}

/** Tier 2 réellement actif : activé ET seuil configuré. Règle partagée (dashboard, PWA, snapshot). */
export function isTier2Active(cfg: { tier2_enabled?: boolean | null; tier2_stamps_required?: number | null }): boolean {
  return !!cfg.tier2_enabled && cfg.tier2_stamps_required != null;
}

/**
 * @param tier1Redeemed vrai si le palier 1 a déjà été consommé dans le cycle tier2 courant
 *   (pertinent seulement quand tier2 est activé). Défaut false.
 */
export function getLoyaltyProgress(
  card: CardInput,
  merchant: MerchantLoyaltyConfig,
  tier1Redeemed = false,
): LoyaltyProgress {
  const isCagnotte = merchant.loyalty_mode === 'cagnotte';
  const currentStamps = Number(card?.current_stamps || 0);
  const currentAmount = Number(card?.current_amount || 0);

  const stampsRequired = Number(merchant.stamps_required || 10);
  const tier2Enabled = isTier2Active(merchant);
  const tier2Required = Number(merchant.tier2_stamps_required || 0);

  const isTier1Ready = currentStamps >= stampsRequired;
  const isTier2Ready = tier2Enabled && currentStamps >= tier2Required;

  // Une fois le palier 1 atteint (tier2 activé), la cible affichée devient le palier 2.
  const target = tier2Enabled && isTier1Ready ? tier2Required : stampsRequired;
  const progressPercent = target > 0 ? Math.min(100, (currentStamps / target) * 100) : 0;
  const remaining = Math.max(0, target - currentStamps);

  const rewardReady = isTier2Ready || (isTier1Ready && !tier1Redeemed);
  const rewardLabel = (isTier2Ready ? merchant.tier2_reward_description : merchant.reward_description) || null;

  const cashbackValue = isCagnotte ? computeCashback(currentAmount, merchant.cagnotte_percent) : 0;

  return {
    mode: isCagnotte ? 'cagnotte' : 'visit',
    hasCard: !!card,
    currentStamps,
    currentAmount,
    target,
    remaining,
    progressPercent,
    isTier1Ready,
    isTier2Ready,
    tier2Enabled,
    rewardReady,
    rewardLabel,
    cashbackValue,
  };
}

/**
 * Palier 1 consommé dans le cycle tier2 courant : une récompense palier 1 postérieure au
 * dernier palier 2 (le palier 1 ne se reclame qu'une fois entre deux paliers 2).
 */
export function computeTier1Redeemed(redemptions: { tier: number; redeemed_at: string }[]): boolean {
  const lastTier2 = redemptions
    .filter(r => r.tier === 2)
    .reduce((max, r) => Math.max(max, new Date(r.redeemed_at).getTime()), 0);
  return redemptions.some(r => r.tier === 1 && new Date(r.redeemed_at).getTime() > lastTier2);
}
