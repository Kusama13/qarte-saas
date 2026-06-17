import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sendFollowupRecapEmail } from '@/lib/email';
import { formatTime, getAppUrl } from '@/lib/utils';
import type { EmailLocale } from '@/emails/translations';
import logger from '@/lib/logger';

/**
 * Envoie UN email récapitulatif des RDV de suivi (+3/+6 sem.) réservés à la fin
 * d'une réservation en ligne (mig 177). Appelé une fois par FollowupScheduler
 * quand la cliente a terminé. L'email rappelle qu'un rappel partira avant chaque
 * RDV (J-7 pour régler l'acompte si acompte, sinon simple rappel) et qu'elle peut
 * reporter/annuler depuis sa carte.
 *
 * Le destinataire n'est jamais choisi par l'appelant : on lit `customer_email`
 * snapshoté sur les slots, et on se limite aux slots réservés très récemment.
 */
const schema = z.object({
  merchant_id: z.string().uuid(),
  slot_ids: z.array(z.string().uuid()).min(1).max(2),
});

const RECENT_WINDOW_MS = 2 * 60 * 60 * 1000; // 2h

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(`followup-recap:${ip}`, { maxRequests: 5, windowMs: 60_000 });
    if (!rl.success) return rateLimitResponse(rl.resetTime);

    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    const { merchant_id, slot_ids } = parsed.data;

    const supabaseAdmin = getSupabaseAdmin();

    const { data: slots } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('id, slot_date, start_time, client_name, customer_email, deposit_deferred, booked_at, custom_service_name, planning_slot_services(service_id)')
      .eq('merchant_id', merchant_id)
      .in('id', slot_ids)
      .not('client_name', 'is', null);

    if (!slots || slots.length === 0) return NextResponse.json({ success: true });

    // Garde anti-abus léger : slots réservés très récemment uniquement.
    const cutoff = Date.now() - RECENT_WINDOW_MS;
    const recent = slots.filter(s => s.booked_at && new Date(s.booked_at).getTime() >= cutoff);
    if (recent.length === 0) return NextResponse.json({ success: true });

    const customerEmail = recent.find(s => s.customer_email)?.customer_email;
    if (!customerEmail) return NextResponse.json({ success: true });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('shop_name, locale, deposit_link, allow_customer_cancel, allow_customer_reschedule')
      .eq('id', merchant_id)
      .maybeSingle();
    if (!merchant) return NextResponse.json({ success: true });

    const locale = (merchant.locale as EmailLocale) || 'fr';

    // Noms des prestations
    const serviceIds = [...new Set(recent.flatMap(s => (s.planning_slot_services || []).map((x: { service_id: string }) => x.service_id)))];
    const serviceNameMap = new Map<string, string>();
    if (serviceIds.length > 0) {
      const { data: services } = await supabaseAdmin
        .from('merchant_services')
        .select('id, name')
        .in('id', serviceIds);
      for (const s of (services || []) as { id: string; name: string }[]) serviceNameMap.set(s.id, s.name);
    }

    const dateFmt = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
    const appointments = recent
      .sort((a, b) => (a.slot_date + a.start_time).localeCompare(b.slot_date + b.start_time))
      .map(s => {
        const names = (s.planning_slot_services || [])
          .map((x: { service_id: string }) => serviceNameMap.get(x.service_id))
          .filter((n: string | undefined): n is string => !!n);
        if (s.custom_service_name) names.push(s.custom_service_name);
        return {
          date: dateFmt.format(new Date(s.slot_date + 'T00:00:00')),
          time: formatTime(s.start_time, locale),
          services: names,
        };
      });

    const hasDeposit = recent.some(s => s.deposit_deferred === true);

    await sendFollowupRecapEmail(customerEmail, {
      shopName: merchant.shop_name,
      clientFirstName: (recent[0].client_name || 'Cliente').split(' ')[0],
      appointments,
      hasDeposit,
      canCancel: !!merchant.allow_customer_cancel,
      canReschedule: !!merchant.allow_customer_reschedule,
      loyaltyCardUrl: `${getAppUrl()}/customer/card/${merchant_id}`,
      locale,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('followup-recap error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
