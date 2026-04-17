import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { sendBookingSms, sendMarketingSms, getGlobalSmsConfig } from '@/lib/sms';
import { getTimezoneForCountry } from '@/lib/utils';
import { getUpcomingEvent } from '@/lib/push-automation';
import logger from '@/lib/logger';

export const maxDuration = 300;

const PAID_STATUSES = ['active', 'canceling', 'past_due'];
const HARD_CAP_PER_RUN = 500;

interface MerchantRow {
  id: string;
  shop_name: string;
  country: string | null;
  locale: string | null;
  subscription_status: string;
  billing_period_start: string | null;
  reminder_j0_enabled: boolean | null;
  welcome_sms_enabled: boolean | null;
  post_visit_review_enabled: boolean | null;
  events_sms_enabled: boolean | null;
  events_sms_offer_text: string | null;
  events_sms_last_event_id: string | null;
}

function localHourFor(now: Date, tz: string): number {
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', hour12: false });
  const parts = fmt.formatToParts(now);
  const h = parts.find((p) => p.type === 'hour')?.value || '0';
  return parseInt(h, 10);
}

function localDateFor(now: Date, tz: string): string {
  const fmt = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit',
  });
  const parts = fmt.formatToParts(now);
  const y = parts.find((p) => p.type === 'year')?.value || '';
  const m = parts.find((p) => p.type === 'month')?.value || '';
  const d = parts.find((p) => p.type === 'day')?.value || '';
  return `${y}-${m}-${d}`;
}

function minutesBetween(a: Date, b: Date): number {
  return Math.round((a.getTime() - b.getTime()) / 60000);
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const supabase = getSupabaseAdmin();
  const globalSmsConfig = await getGlobalSmsConfig(supabase);
  const now = new Date();

  const results = {
    j0Sent: 0,
    welcomeSent: 0,
    reviewSent: 0,
    eventSent: 0,
    skipped: 0,
    errors: 0,
  };

  const { data: merchants } = await supabase
    .from('merchants')
    .select('id, shop_name, country, locale, subscription_status, billing_period_start, reminder_j0_enabled, welcome_sms_enabled, post_visit_review_enabled, events_sms_enabled, events_sms_offer_text, events_sms_last_event_id')
    .in('subscription_status', PAID_STATUSES);

  const activeMerchants = (merchants || []) as MerchantRow[];

  // ── 1. J-0 REMINDER (transactional) ──
  // Fires H-3 before each RDV today, but never before 7h local (courtoisie, pas légal).
  if (globalSmsConfig.reminder_enabled) {
    for (const m of activeMerchants) {
      if (Date.now() - startedAt > 250_000) break;
      if (!m.reminder_j0_enabled) continue;

      const tz = getTimezoneForCountry(m.country || 'FR');
      const localHour = localHourFor(now, tz);
      if (localHour < 7) continue; // never before 7h local
      const today = localDateFor(now, tz);

      const { data: slots } = await supabase
        .from('merchant_planning_slots')
        .select('id, client_phone, start_time, slot_date')
        .eq('merchant_id', m.id)
        .eq('slot_date', today)
        .not('client_name', 'is', null)
        .not('client_phone', 'is', null)
        .is('primary_slot_id', null);

      for (const slot of slots || []) {
        if (!slot.client_phone || !slot.start_time) continue;
        // Compute minutes until slot start in the merchant's tz.
        const slotStart = new Date(`${slot.slot_date}T${slot.start_time}:00`);
        // Approximate: we assume start_time is already merchant-local wall clock.
        // Shift by tz offset to compare against UTC now.
        const offsetMs = slotStart.getTime() - new Date(slotStart.toLocaleString('en-US', { timeZone: tz })).getTime();
        const slotStartUtc = new Date(slotStart.getTime() - offsetMs);
        const minutesUntil = minutesBetween(slotStartUtc, now);

        // Window: [120, 210] minutes = 2h → 3h30 before start → roughly H-3
        if (minutesUntil < 120 || minutesUntil > 210) continue;

        const sent = await sendBookingSms(supabase, {
          merchantId: m.id,
          slotId: slot.id,
          phone: slot.client_phone,
          shopName: m.shop_name,
          date: slot.slot_date,
          time: slot.start_time,
          smsType: 'reminder_j0',
          locale: m.locale || 'fr',
          subscriptionStatus: m.subscription_status,
          globalConfig: globalSmsConfig,
        });
        if (sent) {
          results.j0Sent++;
          if (results.j0Sent >= HARD_CAP_PER_RUN) break;
        } else {
          results.skipped++;
        }
      }
    }
  }

  // ── 2. WELCOME SMS (marketing) — 1er scan H+1 ──
  for (const m of activeMerchants) {
    if (Date.now() - startedAt > 270_000) break;
    if (!m.welcome_sms_enabled) continue;

    // Customers scanned/registered 60–120 min ago for this merchant
    const minAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString();
    const maxAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();

    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('customer_id, created_at, customers(first_name, phone_number, no_contact)')
      .eq('merchant_id', m.id)
      .gte('created_at', minAgo)
      .lt('created_at', maxAgo);

    for (const card of cards || []) {
      const customer = (card as unknown as { customers?: { first_name?: string | null; phone_number?: string | null; no_contact?: boolean | null } | null }).customers;
      const phone = customer?.phone_number;
      if (!phone || customer?.no_contact) continue;

      // Dedup: already sent welcome to this phone for this merchant?
      const { data: existing } = await supabase
        .from('sms_logs')
        .select('id')
        .eq('merchant_id', m.id)
        .eq('sms_type', 'welcome')
        .eq('phone_to', phone)
        .maybeSingle();
      if (existing) continue;

      // Check opt-out
      const { data: optOut } = await supabase
        .from('sms_opt_outs')
        .select('phone_number')
        .eq('merchant_id', m.id)
        .eq('phone_number', phone)
        .maybeSingle();
      if (optOut) continue;

      const locale = m.locale || 'fr';
      const first = customer?.first_name ? `${customer.first_name}, ` : '';
      const body = locale === 'en'
        ? `${first}welcome to ${m.shop_name}'s loyalty card! Earn points on every visit. STOP SMS`
        : `${first}bienvenue dans la carte fidélité ${m.shop_name} ! Cumule des points à chaque visite. STOP SMS`;

      const result = await sendMarketingSms(supabase, {
        merchantId: m.id,
        phone,
        body,
        billingPeriodStart: m.billing_period_start,
        smsType: 'welcome',
      });
      if (result.success) results.welcomeSent++;
      else if (result.blocked) { results.errors++; break; }
      else results.skipped++;
    }
  }

  // ── 3. REVIEW REQUEST SMS (marketing) — post-visite H+2 ──
  for (const m of activeMerchants) {
    if (Date.now() - startedAt > 285_000) break;
    if (!m.post_visit_review_enabled) continue;

    const minAgo = new Date(now.getTime() - 180 * 60 * 1000).toISOString();
    const maxAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString();

    const { data: visits } = await supabase
      .from('visits')
      .select('id, customer_id, visited_at, customers(first_name, phone_number, no_contact)')
      .eq('merchant_id', m.id)
      .gte('visited_at', minAgo)
      .lt('visited_at', maxAgo);

    for (const v of visits || []) {
      const customer = (v as unknown as { customers?: { first_name?: string | null; phone_number?: string | null; no_contact?: boolean | null } | null }).customers;
      const phone = customer?.phone_number;
      if (!phone || customer?.no_contact) continue;

      // Dedup per phone per type per day
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const { data: existing } = await supabase
        .from('sms_logs')
        .select('id')
        .eq('merchant_id', m.id)
        .eq('sms_type', 'review_request')
        .eq('phone_to', phone)
        .gte('created_at', todayStart.toISOString())
        .maybeSingle();
      if (existing) continue;

      const { data: optOut } = await supabase
        .from('sms_opt_outs')
        .select('phone_number')
        .eq('merchant_id', m.id)
        .eq('phone_number', phone)
        .maybeSingle();
      if (optOut) continue;

      const locale = m.locale || 'fr';
      const first = customer?.first_name ? `${customer.first_name}, ` : '';
      const body = locale === 'en'
        ? `${first}thanks for your visit at ${m.shop_name}! A quick Google review would mean a lot. STOP SMS`
        : `${first}merci pour votre visite chez ${m.shop_name} ! Un avis Google nous aiderait beaucoup. STOP SMS`;

      const result = await sendMarketingSms(supabase, {
        merchantId: m.id,
        phone,
        body,
        billingPeriodStart: m.billing_period_start,
        smsType: 'review_request',
      });
      if (result.success) results.reviewSent++;
      else if (result.blocked) { results.errors++; break; }
      else results.skipped++;
    }
  }

  // ── 4. EVENT SMS (marketing) — J-7 avant Saint-Valentin, Noël, etc. ──
  // Déclenche uniquement à 10h local pour éviter de spammer à chaque heure.
  for (const m of activeMerchants) {
    if (Date.now() - startedAt > 290_000) break;
    if (!m.events_sms_enabled) continue;

    const tz = getTimezoneForCountry(m.country || 'FR');
    const localHour = localHourFor(now, tz);
    if (localHour !== 10) continue; // fire once per day at 10h local

    // Paris as neutral anchor for event detection (event dates fixed in FR cal).
    const nowParis = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
    const upcomingEvent = getUpcomingEvent(nowParis, m.locale === 'en' ? 'en' : 'fr');
    if (!upcomingEvent) continue;

    // Idempotency: once the event is stored in events_sms_last_event_id + today, skip.
    const today = localDateFor(now, tz);
    const eventKey = `${upcomingEvent.id}:${today}`;
    if (m.events_sms_last_event_id === eventKey) continue;

    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('customer_id, customers(first_name, phone_number, no_contact)')
      .eq('merchant_id', m.id);

    const locale = m.locale || 'fr';
    const offerText = m.events_sms_offer_text || '';
    let anySent = false;

    for (const card of cards || []) {
      const customer = (card as unknown as { customers?: { first_name?: string | null; phone_number?: string | null; no_contact?: boolean | null } | null }).customers;
      const phone = customer?.phone_number;
      if (!phone || customer?.no_contact) continue;

      const { data: optOut } = await supabase
        .from('sms_opt_outs')
        .select('phone_number')
        .eq('merchant_id', m.id)
        .eq('phone_number', phone)
        .maybeSingle();
      if (optOut) continue;

      const first = customer?.first_name ? `${customer.first_name}, ` : '';
      const intro = locale === 'en'
        ? `${upcomingEvent.name} is coming up at ${m.shop_name}!`
        : `C'est bientôt ${upcomingEvent.name} chez ${m.shop_name} !`;
      const closing = offerText || (locale === 'en'
        ? 'Book your slot before the agenda fills up.'
        : 'Pense à réserver ton créneau avant que le planning ne soit complet.');
      const body = `${first}${intro} ${closing} STOP SMS`;

      const result = await sendMarketingSms(supabase, {
        merchantId: m.id,
        phone,
        body,
        billingPeriodStart: m.billing_period_start,
        smsType: 'campaign',
      });
      if (result.success) {
        results.eventSent++;
        anySent = true;
      } else if (result.blocked) {
        results.errors++;
        break;
      } else {
        results.skipped++;
      }
    }

    if (anySent) {
      await supabase.from('merchants').update({ events_sms_last_event_id: eventKey }).eq('id', m.id);
    }
  }

  logger.debug('[sms-hourly] done', results);
  return NextResponse.json({ ok: true, ...results });
}
