export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getTodayForCountry } from '@/lib/utils';
import { sendMerchantPush } from '@/lib/merchant-push';
import { resend, EMAIL_FROM, EMAIL_HEADERS } from '@/lib/resend';
import { verifyCronAuth, rateLimitDelay } from '@/lib/cron-helpers';
import logger from '@/lib/logger';

// Runs on the 1st of each month — draws winner from previous month's bookings
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = { processed: 0, drawn: 0, skipped: 0, errors: 0 };
  const supabase = getSupabaseAdmin();

  try {
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, country, locale, contest_prize')
      .eq('contest_enabled', true)
      .in('subscription_status', ['active', 'canceling']);

    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ success: true, ...results });
    }

    for (const merchant of merchants) {
      results.processed++;
      try {
        // Calculate previous month in merchant's timezone
        const today = getTodayForCountry(merchant.country);
        const todayDate = new Date(today + 'T12:00:00');
        todayDate.setMonth(todayDate.getMonth() - 1);
        const prevYear = todayDate.getFullYear();
        const prevMonth = String(todayDate.getMonth() + 1).padStart(2, '0');
        const contestMonth = `${prevYear}-${prevMonth}`;

        // Idempotency: skip if already drawn
        const { data: existing } = await supabase
          .from('merchant_contests')
          .select('id')
          .eq('merchant_id', merchant.id)
          .eq('contest_month', contestMonth)
          .single();

        if (existing) {
          results.skipped++;
          continue;
        }

        // Calculate month date range
        const monthStart = `${contestMonth}-01`;
        const nextMonth = new Date(prevYear, todayDate.getMonth() + 1, 1);
        const monthEnd = nextMonth.toISOString().slice(0, 10);

        // Query all booked slots for previous month (main slots only, with customer_id)
        const { data: slots } = await supabase
          .from('merchant_planning_slots')
          .select('customer_id, client_name, client_phone')
          .eq('merchant_id', merchant.id)
          .gte('slot_date', monthStart)
          .lt('slot_date', monthEnd)
          .not('client_name', 'is', null)
          .is('primary_slot_id', null)
          .not('customer_id', 'is', null);

        // Deduplicate by customer_id
        const customerMap = new Map<string, { customer_id: string; client_name: string; client_phone: string | null }>();
        for (const slot of slots || []) {
          if (slot.customer_id && !customerMap.has(slot.customer_id)) {
            customerMap.set(slot.customer_id, {
              customer_id: slot.customer_id,
              client_name: slot.client_name,
              client_phone: slot.client_phone,
            });
          }
        }

        const participants = Array.from(customerMap.values());
        const prize = merchant.contest_prize || '';

        if (participants.length === 0) {
          // No participants — record empty contest
          await supabase.from('merchant_contests').insert({
            merchant_id: merchant.id,
            contest_month: contestMonth,
            prize_description: prize,
            participants_count: 0,
            drawn_at: new Date().toISOString(),
          });
          results.skipped++;
          continue;
        }

        // Random draw
        const winner = participants[Math.floor(Math.random() * participants.length)];

        await supabase.from('merchant_contests').insert({
          merchant_id: merchant.id,
          contest_month: contestMonth,
          prize_description: prize,
          winner_customer_id: winner.customer_id,
          winner_name: winner.client_name,
          winner_phone: winner.client_phone,
          participants_count: participants.length,
          drawn_at: new Date().toISOString(),
        });

        results.drawn++;

        // Notify merchant — push
        const isEN = merchant.locale === 'en';
        await sendMerchantPush({
          supabase,
          merchantId: merchant.id,
          notificationType: 'contest_winner',
          referenceId: contestMonth,
          title: isEN ? 'Monthly draw completed!' : 'Tirage du mois terminé !',
          body: isEN
            ? `${winner.client_name} won: ${prize}`
            : `${winner.client_name} a gagné : ${prize}`,
          url: '/dashboard/contest',
          tag: 'qarte-merchant-contest',
        });

        // Notify merchant — email
        if (merchant.user_id) {
          try {
            const { data: authUser } = await supabase.auth.admin.getUserById(merchant.user_id);
            if (authUser?.user?.email) {
              const subject = isEN
                ? `${merchant.shop_name} — Draw winner: ${winner.client_name}`
                : `${merchant.shop_name} — Gagnant(e) du tirage : ${winner.client_name}`;
              const text = isEN
                ? `The monthly draw for ${merchant.shop_name} is done!\n\nWinner: ${winner.client_name}\nPrize: ${prize}\nParticipants: ${participants.length}\n\nLog in to generate the announcement story:\nhttps://getqarte.com/dashboard/contest`
                : `Le tirage mensuel de ${merchant.shop_name} est terminé !\n\nGagnant(e) : ${winner.client_name}\nLot : ${prize}\nParticipants : ${participants.length}\n\nConnecte-toi pour générer la story d'annonce :\nhttps://getqarte.com/dashboard/contest`;

              await resend?.emails.send({
                from: EMAIL_FROM,
                to: authUser.user.email,
                subject,
                text,
                headers: EMAIL_HEADERS,
              });
            }
          } catch (emailErr) {
            logger.error(`Contest email error for ${merchant.id}:`, emailErr);
          }
        }

        await rateLimitDelay();
      } catch (err) {
        results.errors++;
        logger.error(`Contest draw error for ${merchant.id}:`, err);
      }
    }

    logger.info('Monthly contest cron completed', results);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    logger.error('Monthly contest cron error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
