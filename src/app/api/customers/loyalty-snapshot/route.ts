import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { getCurrencyForCountry, getTodayForCountry } from '@/lib/utils';
import { getLoyaltyProgress, computeTier1Redeemed } from '@/lib/loyalty-progress';
import logger from '@/lib/logger';

/**
 * Snapshot fidélité d'une cliente côté merchant, pour la bande « Fidélité » de la fiche résa.
 * Auth merchant (propriété vérifiée). Renvoie : progression (via getLoyaltyProgress), nb de
 * visites, dernière visite, dépensé, statut membre, bons dispo, récompenses obtenues.
 *
 * « Dépensé » : en cagnotte = cumul réel des passages (SUM visits.amount_spent, inclut les
 * scans en salon) ; en mode passage la donnée n'existe pas → on renvoie le dépensé en
 * réservations honorées (SUM total_price), toujours disponible.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customerId');
    const merchantId = searchParams.get('merchantId');
    if (!customerId || !merchantId) {
      return NextResponse.json({ error: 'Paramètres requis' }, { status: 400 });
    }

    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const admin = getSupabaseAdmin();
    const { data: merchant } = await admin
      .from('merchants')
      .select('id, user_id, country, loyalty_mode, stamps_required, tier2_enabled, tier2_stamps_required, cagnotte_percent, reward_description, tier2_reward_description, booking_earns_loyalty')
      .eq('id', merchantId)
      .single();
    if (!merchant || merchant.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data: card } = await admin
      .from('loyalty_cards')
      .select('id, current_stamps, current_amount, last_visit_date')
      .eq('customer_id', customerId)
      .eq('merchant_id', merchantId)
      .maybeSingle();

    const isCagnotte = merchant.loyalty_mode === 'cagnotte';
    const nowIso = new Date().toISOString();

    // Requêtes indépendantes en parallèle.
    const [redemptionsRes, visitsRes, bookingsRes, memberRes, vouchersRes, customerRes] = await Promise.all([
      card
        ? admin.from('redemptions').select('tier, redeemed_at').eq('loyalty_card_id', card.id)
        : Promise.resolve({ data: [] as { tier: number; redeemed_at: string }[] }),
      admin.from('visits').select('amount_spent').eq('customer_id', customerId).eq('merchant_id', merchantId).eq('status', 'confirmed'),
      // Dépensé en réservations : ses résas passées (jusqu'à aujourd'hui, fuseau merchant), non
      // annulées (client_name conservé), hors filler, hors no-show. On exclut les RDV FUTURS
      // (pas encore honorés) pour ne pas gonfler le « dépensé ». Prix = total_price snapshot,
      // sinon somme des prestations (fallback identique à l'analytics, sinon 0 → faux zéro).
      admin.from('merchant_planning_slots')
        .select('total_price, custom_service_price, attendance_status, planning_slot_services(service:merchant_services!service_id(price))')
        .eq('customer_id', customerId).eq('merchant_id', merchantId)
        .lte('slot_date', getTodayForCountry(merchant.country))
        .is('primary_slot_id', null).not('client_name', 'is', null).neq('client_name', '__blocked__'),
      admin.from('member_cards').select('valid_until, program:member_programs!inner(name, benefit_label, discount_percent, merchant_id)')
        .eq('customer_id', customerId).eq('program.merchant_id', merchantId).gt('valid_until', nowIso).maybeSingle(),
      admin.from('vouchers').select('id', { count: 'exact', head: true })
        .eq('customer_id', customerId).eq('merchant_id', merchantId).eq('is_used', false)
        .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
      admin.from('customers').select('first_name, last_name, phone_number, birth_month, birth_day').eq('id', customerId).eq('merchant_id', merchantId).maybeSingle(),
    ]);

    const redemptions = redemptionsRes.data || [];
    const tier1Redeemed = computeTier1Redeemed(redemptions);
    const progress = getLoyaltyProgress(card, merchant, tier1Redeemed);

    const visits = visitsRes.data || [];
    const cagnotteLifetime = visits.reduce((sum, v) => sum + Number(v.amount_spent || 0), 0);
    // Revenu réservations (même calcul que l'analytics : prix snapshot ou fallback prestations).
    const bookingSpend = (bookingsRes.data || [])
      .filter(s => s.attendance_status !== 'no_show' && s.attendance_status !== 'cancelled')
      .reduce((sum, s) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const catalog = ((s.planning_slot_services as any[]) || []).reduce((a, ps) => {
          const svc = Array.isArray(ps.service) ? ps.service[0] : ps.service;
          return a + Number(svc?.price || 0);
        }, 0);
        const raw = catalog + Number(s.custom_service_price || 0);
        return sum + (s.total_price != null ? Number(s.total_price) : raw);
      }, 0);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const memberProgram = (memberRes.data as any)?.program || null;
    const cust = customerRes.data;

    return NextResponse.json({
      hasCard: !!card,
      progress,
      visitsCount: visits.length,
      lastVisitDate: card?.last_visit_date || null,
      spent: isCagnotte ? cagnotteLifetime : bookingSpend,
      spentScope: isCagnotte ? 'all' : 'bookings',
      currency: getCurrencyForCountry(merchant.country),
      rewardsEarned: redemptions.length,
      vouchersCount: vouchersRes.count || 0,
      member: memberProgram
        ? { programName: memberProgram.name, benefitLabel: memberProgram.benefit_label, discountPercent: memberProgram.discount_percent }
        : null,
      bookingEarnsLoyalty: merchant.booking_earns_loyalty === true,
      // Données pour ouvrir la fiche complète (CustomerManagementModal) directement depuis le planning.
      card: card
        ? { loyaltyCardId: card.id, currentStamps: Number(card.current_stamps || 0), currentAmount: Number(card.current_amount || 0), tier1Redeemed }
        : null,
      customer: cust
        ? { firstName: cust.first_name || '', lastName: cust.last_name || '', phoneNumber: cust.phone_number || '', birthMonth: cust.birth_month, birthDay: cust.birth_day }
        : null,
    });
  } catch (error) {
    logger.error('Loyalty snapshot error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
