import type { SupabaseClient } from '@supabase/supabase-js';
import { getTodayForCountry, generateReferralCode } from '@/lib/utils';
import { PG_UNIQUE_VIOLATION } from '@/lib/postgres-errors';
import logger from '@/lib/logger';

/**
 * Symbiose Réservation → Fidélité ("le point suit la présence").
 *
 * Une réservation honorée (attendance_status='attended', marquée manuellement OU par
 * l'auto-mark de morning-jobs à J+1) crédite un point de fidélité — +1 tampon, ou le prix
 * de la presta (total_price) en mode cagnotte. Le passage porte source='booking' +
 * planning_slot_id (libellé "Réservation du X" + idempotence + réversibilité).
 *
 * Garde-fous : merchant.booking_earns_loyalty=true, créneau primary réservé avec customer_id,
 * non déjà crédité, dédup jour (si un passage confirmé existe déjà ce jour-là, le scan gagne).
 * Idempotence garantie par l'index unique partiel visits(planning_slot_id) (fail-safe : au pire
 * un point manquant, jamais de double ni de corruption).
 */

type Admin = SupabaseClient;

export type CreditResult = 'credited' | 'skipped' | 'already' | 'error';
export type RevokeResult = 'revoked' | 'none' | 'error';

export async function creditBookingLoyalty(admin: Admin, slotId: string): Promise<CreditResult> {
  const { data: slot } = await admin
    .from('merchant_planning_slots')
    .select('id, merchant_id, customer_id, total_price, slot_date, start_time, attendance_status, primary_slot_id, client_name')
    .eq('id', slotId)
    .maybeSingle();

  // Garde-fous créneau : réservé, primary (pas un filler), honoré, relié à une cliente.
  if (!slot) return 'skipped';
  if (!slot.customer_id || slot.primary_slot_id) return 'skipped';
  if (slot.attendance_status !== 'attended') return 'skipped';
  if (!slot.client_name || slot.client_name === '__blocked__') return 'skipped';

  const { data: merchant } = await admin
    .from('merchants')
    .select('id, loyalty_mode, booking_earns_loyalty, stamps_required, country')
    .eq('id', slot.merchant_id)
    .maybeSingle();
  if (!merchant || merchant.booking_earns_loyalty !== true) return 'skipped';

  // Idempotence : ce créneau a-t-il déjà crédité ?
  const { data: existing } = await admin
    .from('visits')
    .select('id')
    .eq('planning_slot_id', slotId)
    .maybeSingle();
  if (existing) return 'already';

  // Dédup jour : si la cliente a déjà un passage confirmé ce jour-là (scan), on ne recrédite pas.
  const dayStart = `${slot.slot_date}T00:00:00Z`;
  const nextDay = new Date(new Date(dayStart).getTime() + 86_400_000).toISOString();
  const { count: sameDay } = await admin
    .from('visits')
    .select('id', { count: 'exact', head: true })
    .eq('customer_id', slot.customer_id)
    .eq('merchant_id', merchant.id)
    .eq('status', 'confirmed')
    .gte('visited_at', dayStart)
    .lt('visited_at', nextDay);
  if ((sameDay || 0) > 0) return 'skipped';

  // Get-or-create carte de fidélité.
  let card: { id: string; current_stamps: number; current_amount: number };
  const { data: existingCard } = await admin
    .from('loyalty_cards')
    .select('id, current_stamps, current_amount')
    .eq('customer_id', slot.customer_id)
    .eq('merchant_id', merchant.id)
    .maybeSingle();
  if (existingCard) {
    card = existingCard;
  } else {
    const { data: newCard, error: cardErr } = await admin
      .from('loyalty_cards')
      .insert({
        customer_id: slot.customer_id,
        merchant_id: merchant.id,
        current_stamps: 0,
        current_amount: 0,
        stamps_target: merchant.stamps_required,
        referral_code: generateReferralCode(),
      })
      .select('id, current_stamps, current_amount')
      .single();
    if (cardErr || !newCard) {
      logger.error('booking-loyalty: card create failed', cardErr);
      return 'error';
    }
    card = newCard;
  }

  const isCagnotte = merchant.loyalty_mode === 'cagnotte';
  const amount = isCagnotte ? Number(slot.total_price || 0) : 0;
  const visitedAt = `${slot.slot_date}T${(slot.start_time || '12:00').slice(0, 5)}:00`;

  const { error: visitErr } = await admin.from('visits').insert({
    loyalty_card_id: card.id,
    merchant_id: merchant.id,
    customer_id: slot.customer_id,
    points_earned: 1,
    amount_spent: isCagnotte ? amount : null,
    status: 'confirmed',
    source: 'booking',
    planning_slot_id: slotId,
    visited_at: visitedAt,
  });
  if (visitErr) {
    // Course avec un autre chemin (auto-mark vs Venue manuel) : l'index unique a bloqué → déjà crédité.
    if ((visitErr as { code?: string }).code === PG_UNIQUE_VIOLATION) return 'already';
    logger.error('booking-loyalty: visit insert failed', visitErr);
    return 'error';
  }

  const update: Record<string, unknown> = {
    current_stamps: Number(card.current_stamps || 0) + 1,
    last_visit_date: getTodayForCountry(merchant.country),
  };
  if (isCagnotte) update.current_amount = Number(card.current_amount || 0) + amount;

  const { error: updErr } = await admin.from('loyalty_cards').update(update).eq('id', card.id);
  if (updErr) {
    // Rollback du passage pour ne pas laisser un point non répercuté sur la carte.
    await admin.from('visits').delete().eq('planning_slot_id', slotId).eq('source', 'booking');
    logger.error('booking-loyalty: card update failed', updErr);
    return 'error';
  }

  return 'credited';
}

/**
 * Retire le point crédité par une réservation (passage no_show/annulé, RDV supprimé ou
 * replanifié vers le futur). Décrémente la carte (plancher 0) puis supprime le passage.
 * No-op si aucun point n'avait été crédité pour ce créneau.
 */
export async function revokeBookingLoyalty(admin: Admin, slotId: string): Promise<RevokeResult> {
  const { data: visit } = await admin
    .from('visits')
    .select('id, loyalty_card_id, points_earned, amount_spent, status')
    .eq('planning_slot_id', slotId)
    .eq('source', 'booking')
    .maybeSingle();
  if (!visit) return 'none';

  if (visit.status === 'confirmed') {
    const { data: card } = await admin
      .from('loyalty_cards')
      .select('id, current_stamps, current_amount')
      .eq('id', visit.loyalty_card_id)
      .maybeSingle();
    if (card) {
      const { error: updErr } = await admin
        .from('loyalty_cards')
        .update({
          current_stamps: Math.max(0, Number(card.current_stamps || 0) - (visit.points_earned || 1)),
          current_amount: Math.max(0, Number(card.current_amount || 0) - Number(visit.amount_spent || 0)),
        })
        .eq('id', card.id);
      if (updErr) {
        logger.error('booking-loyalty: revoke card update failed', updErr);
        return 'error';
      }
    }
  }

  const { error: delErr } = await admin.from('visits').delete().eq('id', visit.id);
  if (delErr) {
    logger.error('booking-loyalty: revoke delete failed', delErr);
    return 'error';
  }
  return 'revoked';
}

/**
 * Wrappers "ne jettent jamais" pour les hooks (annulation, déplacement, présence). Le crédit
 * et le retrait ne doivent jamais faire échouer l'action métier qui les déclenche ; les helpers
 * gèrent déjà leurs erreurs DB, ceux-ci n'attrapent que l'exception inattendue.
 */
export async function safeRevoke(admin: Admin, slotId: string): Promise<RevokeResult> {
  try {
    return await revokeBookingLoyalty(admin, slotId);
  } catch (e) {
    logger.error('booking-loyalty: safeRevoke error', e);
    return 'error';
  }
}

/** Réconcilie le point d'un créneau selon sa présence : Venue → crédite, tout le reste → retire. */
export async function syncBookingLoyalty(admin: Admin, slotId: string, attended: boolean): Promise<void> {
  try {
    if (attended) await creditBookingLoyalty(admin, slotId);
    else await revokeBookingLoyalty(admin, slotId);
  } catch (e) {
    logger.error('booking-loyalty: syncBookingLoyalty error', e);
  }
}
