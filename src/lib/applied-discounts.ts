import type { SupabaseClient } from '@supabase/supabase-js';
import type { ServiceLine } from './booking-pricing';

/**
 * Validation server-side des réductions appliquées sur un slot de planning.
 * Empêche le spoofing : un client malveillant ne peut pas envoyer un
 * applied_offer_percent supérieur à celui de l'offre, ni appliquer welcome
 * sur un client qui a déjà une loyalty_card chez le merchant.
 *
 * Mig 157 : si l'offre est ciblée (`target_service_ids`), recalcule le montant
 * € économisé per-line. Le résultat (`applied_offer_amount`) est retourné pour
 * que la route appelante puisse le snapshoter sur le slot.
 *
 * Réutilisé par /api/planning/manual-booking + /api/planning PATCH.
 */

export type AppliedDiscountPayload = {
  applied_offer_id?: string | null;
  applied_offer_percent?: number | null;
  applied_welcome_percent?: number | null;
};

export type AppliedDiscountValidation =
  | { ok: true; applied_offer_amount: number | null }
  | { ok: false; error: string; status: number };

export async function validateAppliedDiscounts(
  supabase: SupabaseClient,
  merchantId: string,
  customerId: string | null | undefined,
  payload: AppliedDiscountPayload,
  serviceLines: ServiceLine[] = [],
): Promise<AppliedDiscountValidation> {
  const { applied_offer_id, applied_offer_percent, applied_welcome_percent } = payload;

  if ((applied_offer_id && !applied_offer_percent) || (!applied_offer_id && applied_offer_percent)) {
    return { ok: false, error: 'applied_offer_id et applied_offer_percent doivent être fournis ensemble', status: 400 };
  }

  // Pas de cumul : une seule offre par booking. Rejette si promo + welcome sont
  // tous les 2 set. La cliente ne peut beneficier que de la meilleure des deux
  // (calcule par computeBookingPrice cote client).
  if (applied_offer_percent && applied_welcome_percent) {
    return { ok: false, error: 'Une seule offre peut être appliquée par booking (pas de cumul)', status: 400 };
  }

  let appliedOfferAmount: number | null = null;
  if (applied_offer_id && applied_offer_percent) {
    const { data: offer } = await supabase
      .from('merchant_offers')
      .select('id, discount_percent, active, expires_at, target_service_ids')
      .eq('id', applied_offer_id)
      .eq('merchant_id', merchantId)
      .maybeSingle();
    if (!offer || !offer.active || offer.discount_percent !== applied_offer_percent) {
      return { ok: false, error: 'Offre invalide ou réduction non cohérente', status: 400 };
    }
    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      return { ok: false, error: 'Offre expirée', status: 400 };
    }
    // Precision centime (pas euro) : cohérent avec computeBookingPrice, sinon le
    // montant stocké (applied_offer_amount) diverge de l'affiché côté client.
    const roundCents = (x: number) => Math.round(x * 100) / 100;
    const targets = (offer.target_service_ids as string[] | null) || null;
    if (targets && targets.length > 0) {
      const set = new Set(targets);
      const targeted = serviceLines.filter((l) => set.has(l.id));
      appliedOfferAmount = roundCents(
        targeted.reduce((s, l) => s + Number(l.price || 0) * applied_offer_percent / 100, 0),
      );
    } else {
      const total = serviceLines.reduce((s, l) => s + Number(l.price || 0), 0);
      appliedOfferAmount = roundCents(total * applied_offer_percent / 100);
    }
  }

  if (applied_welcome_percent) {
    const { data: merchant } = await supabase
      .from('merchants')
      .select('welcome_offer_enabled, welcome_offer_discount_percent')
      .eq('id', merchantId)
      .maybeSingle();
    if (!merchant?.welcome_offer_enabled || merchant.welcome_offer_discount_percent !== applied_welcome_percent) {
      return { ok: false, error: 'Welcome non disponible ou pourcentage incohérent', status: 400 };
    }
    if (customerId) {
      const { data: existingCard } = await supabase
        .from('loyalty_cards')
        .select('id')
        .eq('customer_id', customerId)
        .eq('merchant_id', merchantId)
        .maybeSingle();
      if (existingCard) {
        return { ok: false, error: 'Welcome non applicable : client déjà inscrit', status: 400 };
      }
    }
  }

  return { ok: true, applied_offer_amount: appliedOfferAmount };
}
