export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getTodayForCountry, getAppUrl } from '@/lib/utils';
import { sendBookingReminderEmail } from '@/lib/email';
import { verifyCronAuth, rateLimitDelay } from '@/lib/cron-helpers';
import type { EmailLocale } from '@/emails/translations';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Rappel de RDV par email envoyé la veille au matin (9h Paris, cron `0 7 * * *`).
// Frère jumeau (canal email) du SMS J-1 du cron `evening`, mais gratuit et riche :
// il porte les infos pratiques du merchant (`booking_reminder_details`). Opt-in via
// `booking_reminder_email_enabled`. Ne touche que les résas ayant un email au dossier.
export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const EMAIL_CAP = 300;
  const results = { processed: 0, sent: 0, skipped: 0, errors: 0 };

  try {
    const { data: merchants } = await supabase
      .from('merchants')
      .select('id, shop_name, shop_address, country, locale, home_service_enabled, booking_reminder_details, allow_customer_cancel, cancel_deadline_days, allow_customer_reschedule, reschedule_deadline_days')
      .in('subscription_status', ['trial', 'active', 'canceling', 'past_due'])
      .eq('booking_reminder_email_enabled', true)
      .eq('planning_enabled', true)
      .is('deleted_at', null);

    for (const m of merchants || []) {
      if (results.sent >= EMAIL_CAP) break;

      // "Demain" dans le fuseau du merchant (au matin, on cible le lendemain).
      const today = getTodayForCountry(m.country);
      const tomorrowDate = new Date(today + 'T12:00:00');
      tomorrowDate.setDate(tomorrowDate.getDate() + 1);
      const tomorrowStr = tomorrowDate.toISOString().slice(0, 10);

      const { data: slots } = await supabase
        .from('merchant_planning_slots')
        .select('id, slot_date, start_time, client_name, customer_email, custom_service_name, customer:customers!customer_id(email, first_name), planning_slot_services(service:merchant_services!service_id(name))')
        .eq('merchant_id', m.id)
        .eq('slot_date', tomorrowStr)
        .not('client_name', 'is', null)
        // Pas de rappel pour les résas en attente d'acompte (deposit_confirmed = false).
        .not('deposit_confirmed', 'is', false)
        .is('primary_slot_id', null)
        .is('reminder_email_sent_at', null);

      for (const slot of slots || []) {
        if (results.sent >= EMAIL_CAP) break;
        results.processed++;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const customer = slot.customer as any;
        const email: string | null = slot.customer_email || customer?.email || null;
        if (!email) { results.skipped++; continue; }

        const firstName = customer?.first_name || (slot.client_name || '').split(' ')[0] || '';
        const services: string[] = slot.custom_service_name
          ? [slot.custom_service_name]
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          : ((slot.planning_slot_services as any[]) || [])
              .map((ps) => ps.service?.name)
              .filter((n): n is string => !!n);

        try {
          const res = await sendBookingReminderEmail(email, {
            shopName: m.shop_name,
            clientFirstName: firstName,
            date: slot.slot_date,
            time: slot.start_time,
            services,
            salonAddress: m.home_service_enabled ? null : (m.shop_address || null),
            practicalDetails: m.booking_reminder_details || null,
            loyaltyCardUrl: `${getAppUrl()}/customer/card/${m.id}`,
            cancelPolicyDays: m.allow_customer_cancel ? (m.cancel_deadline_days ?? 1) : null,
            reschedulePolicyDays: m.allow_customer_reschedule ? (m.reschedule_deadline_days ?? 1) : null,
            locale: (m.locale as EmailLocale) || 'fr',
          });

          if (res.success) {
            await supabase
              .from('merchant_planning_slots')
              .update({ reminder_email_sent_at: new Date().toISOString() })
              .eq('id', slot.id);
            results.sent++;
            await rateLimitDelay();
          } else {
            results.errors++;
          }
        } catch (err) {
          results.errors++;
          logger.error('Booking reminder email failed:', err);
        }
      }
    }

    logger.info('Booking reminder email cron completed', results);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    logger.error('Booking reminder email cron error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
