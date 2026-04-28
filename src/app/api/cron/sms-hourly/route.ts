import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { sendBookingSms, sendMarketingSms, getGlobalSmsConfig, PAID_STATUSES } from '@/lib/sms';
import { fetchOptedOutPhones, hasSmsLog, type CustomerEmbed } from '@/lib/sms-audience';
import { getTimezoneForCountry } from '@/lib/utils';
import { isLegalSendTime } from '@/lib/sms-compliance';
import logger from '@/lib/logger';

export const maxDuration = 300;

const HARD_CAP_PER_RUN = 500;
const REFERRAL_INVITE_VISIT_THRESHOLD = 5;
const INACTIVE_MIN_DAYS = 30;
const INACTIVE_MAX_DAYS = 45;

function getEmbeddedCustomer(row: unknown): CustomerEmbed | null {
  return (row as { customers?: CustomerEmbed | null })?.customers || null;
}

interface MerchantRow {
  id: string;
  shop_name: string;
  country: string | null;
  locale: string | null;
  subscription_status: string;
  billing_period_start: string | null;
  reminder_j0_enabled: boolean | null;
  post_visit_review_enabled: boolean | null;
  voucher_expiry_sms_enabled: boolean | null;
  referral_invite_sms_enabled: boolean | null;
  inactive_sms_enabled: boolean | null;
  near_reward_sms_enabled: boolean | null;
  referral_program_enabled: boolean | null;
  planning_enabled: boolean | null;
  review_link: string | null;
  stamps_required: number | null;
  reward_description: string | null;
  tier2_enabled: boolean | null;
  tier2_stamps_required: number | null;
  tier2_reward_description: string | null;
  birthday_gift_enabled: boolean | null;
  birthday_gift_description: string | null;
}

const NEAR_REWARD_MIN_DAYS_SINCE_VISIT = 15;
// Toutes les automatisations marketing (welcome, review, referral invite,
// near reward, inactive) utilisent la meme fenetre de dedup de 60 jours :
// un client ne recoit pas deux fois le meme type de SMS sous 60j.
const MARKETING_DEDUP_DAYS = 60;

// Cap anti-spam : max 1 SMS marketing par telephone par jour, tous types
// confondus. Si bloque, la dedup 60j n'est PAS incrementee → retry au
// prochain cron (demain, ou plus tard tant que la condition du trigger tient).
const MARKETING_SMS_TYPES_FOR_DAILY_CAP = [
  'review_request', 'voucher_expiry', 'referral_invite',
  'inactive_reminder', 'near_reward', 'campaign',
];

async function fetchPhonesWithMarketingToday(
  supabase: SupabaseClient,
  merchantId: string,
  todayStartIso: string,
): Promise<Set<string>> {
  const { data } = await supabase
    .from('sms_logs')
    .select('phone_to')
    .eq('merchant_id', merchantId)
    .in('sms_type', MARKETING_SMS_TYPES_FOR_DAILY_CAP)
    .gte('created_at', todayStartIso);
  return new Set((data || []).map((r: { phone_to: string }) => r.phone_to));
}

function todayStartIsoUtc(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
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
    reviewSent: 0,
    voucherExpirySent: 0,
    referralInviteSent: 0,
    inactiveSent: 0,
    nearRewardSent: 0,
    birthdaySent: 0,
    skipped: 0,
    errors: 0,
  };

  const { data: merchants } = await supabase
    .from('merchants')
    .select('id, shop_name, country, locale, subscription_status, billing_period_start, reminder_j0_enabled, post_visit_review_enabled, voucher_expiry_sms_enabled, referral_invite_sms_enabled, inactive_sms_enabled, near_reward_sms_enabled, referral_program_enabled, planning_enabled, review_link, stamps_required, reward_description, tier2_enabled, tier2_stamps_required, tier2_reward_description, birthday_gift_enabled, birthday_gift_description')
    .in('subscription_status', PAID_STATUSES);

  const activeMerchants = (merchants || []) as MerchantRow[];

  // ── 1. J-0 REMINDER (transactional) ──
  // Fires H-3 before each RDV today, but never before 7h local (courtoisie, pas légal).
  if (globalSmsConfig.reminder_enabled) {
    for (const m of activeMerchants) {
      if (Date.now() - startedAt > 250_000) break;
      if (!m.reminder_j0_enabled) continue;
      if (!m.planning_enabled) continue;

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
        // offsetMs = -(tz offset in ms). Add (not subtract) to shift local→UTC.
        const slotStartUtc = new Date(slotStart.getTime() + offsetMs);
        const minutesUntil = minutesBetween(slotStartUtc, now);

        // Window: [30, 210] min before slot start.
        // Combined with localHour >= 7 above, this means: fire at the first legal
        // cron run after 7h that's <= 3h30 before the slot. So a 8h slot gets its
        // SMS at 7h (60 min before) — best we can do given the 7h legal floor —
        // while a 14h slot gets it at 11h (180 min before, H-3 ideal).
        // Dedup on slot_id in sendBookingSms guarantees 1 SMS per slot.
        if (minutesUntil < 30 || minutesUntil > 210) continue;

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

  // ── 2. (retire) — l'automatisation WELCOME SMS n'a pas de toggle UI.
  // Column welcome_sms_enabled conservee en DB (default false) pour eviter
  // une migration ; a dropper dans un futur cleanup si aucun merchant actif.

  // ── 3. REVIEW REQUEST SMS (marketing) — post-recompense H+2 ──
  // Trigger : quand un client vient de recuperer sa recompense (palier 1 ou 2).
  // Moment "peak happiness" = meilleur taux de conversion avis Google.
  // Marketing → plancher legal 10h (isLegalSendTime). Fenetre [H-2h, H-36h]
  // pour donner plusieurs tentatives si le cap daily bloque aujourd'hui.
  // Dedup 60j par phone+merchant. Cap 1 marketing/jour cross-types.
  for (const m of activeMerchants) {
    if (Date.now() - startedAt > 285_000) break;
    if (!m.post_visit_review_enabled) continue;
    const reviewLink = m.review_link?.trim();
    if (!reviewLink) continue;
    if (!isLegalSendTime(now, m.country || 'FR').ok) continue;

    const minAgo = new Date(now.getTime() - 36 * 60 * 60 * 1000).toISOString();
    const maxAgo = new Date(now.getTime() - 120 * 60 * 1000).toISOString();

    const { data: redemptions } = await supabase
      .from('redemptions')
      .select('id, customer_id, redeemed_at, tier, customers(first_name, phone_number)')
      .eq('merchant_id', m.id)
      .gte('redeemed_at', minAgo)
      .lt('redeemed_at', maxAgo);

    if (!redemptions || redemptions.length === 0) continue;
    const optOuts = await fetchOptedOutPhones(supabase, m.id);
    const sentMarketingToday = await fetchPhonesWithMarketingToday(supabase, m.id, todayStartIsoUtc());

    for (const r of redemptions) {
      const customer = getEmbeddedCustomer(r);
      const phone = customer?.phone_number;
      if (!phone || optOuts.has(phone)) continue;
      if (sentMarketingToday.has(phone)) continue; // cap daily — retry demain

      const reviewDedupSince = new Date(now.getTime() - MARKETING_DEDUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
      if (await hasSmsLog(supabase, m.id, 'review_request', phone, reviewDedupSince)) continue;

      const locale = m.locale || 'fr';
      const first = customer?.first_name ? `${customer.first_name}, ` : '';
      const body = locale === 'en'
        ? `${first}congrats on your reward at ${m.shop_name}! A quick Google review would mean a lot: ${reviewLink}. STOP SMS`
        : `${first}félicitations pour votre récompense chez ${m.shop_name} ! Votre avis Google ferait la différence : ${reviewLink}. STOP SMS`;

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

  // ── 4. (retire) — EVENT SMS J-7 avant Saint-Val/Noël/etc. supprime (avril 2026).

  // ── 5. VOUCHER EXPIRY (marketing) — J-7 avant expiration ──
  // Fire uniquement à 10h local. Dedup par phone+type+today.
  for (const m of activeMerchants) {
    if (Date.now() - startedAt > 292_000) break;
    if (!m.voucher_expiry_sms_enabled) continue;

    const tz = getTimezoneForCountry(m.country || 'FR');
    { const lh = localHourFor(now, tz); if (lh < 10 || lh > 11) continue; }
    if (!isLegalSendTime(now, m.country || 'FR').ok) continue;

    const minExpires = new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString();
    const maxExpires = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000).toISOString();

    const { data: vouchers } = await supabase
      .from('vouchers')
      .select('id, expires_at, customer_id, reward_description, customers(first_name, phone_number)')
      .eq('merchant_id', m.id)
      .eq('is_used', false)
      .gte('expires_at', minExpires)
      .lte('expires_at', maxExpires);

    if (!vouchers || vouchers.length === 0) continue;
    const optOuts = await fetchOptedOutPhones(supabase, m.id);
    const todayStart = new Date();
    todayStart.setUTCHours(0, 0, 0, 0);
    const sentMarketingToday = await fetchPhonesWithMarketingToday(supabase, m.id, todayStartIsoUtc());

    for (const v of vouchers) {
      const customer = getEmbeddedCustomer(v);
      const phone = customer?.phone_number;
      if (!phone || optOuts.has(phone)) continue;
      if (sentMarketingToday.has(phone)) continue; // cap daily — retry demain

      if (await hasSmsLog(supabase, m.id, 'voucher_expiry', phone, todayStart.toISOString())) continue;

      const locale = m.locale || 'fr';
      const first = customer?.first_name ? `${customer.first_name}, ` : '';
      const body = locale === 'en'
        ? `${first}your reward at ${m.shop_name} expires in 7 days. Come pick it up! STOP SMS`
        : `${first}votre cadeau chez ${m.shop_name} expire dans 7 jours. Passez vite en profiter ! STOP SMS`;

      const result = await sendMarketingSms(supabase, {
        merchantId: m.id,
        phone,
        body,
        billingPeriodStart: m.billing_period_start,
        smsType: 'voucher_expiry',
      });
      if (result.success) results.voucherExpirySent++;
      else if (result.blocked) { results.errors++; break; }
      else results.skipped++;
    }
  }

  // ── 6. REFERRAL INVITE (marketing) — après N visites fidèles ──
  // Fire à 10h local. Cherche clients avec visite dans les dernières 24h
  // dont le total de visites a atteint le seuil. Dedup lifetime par phone+type+merchant.
  for (const m of activeMerchants) {
    if (Date.now() - startedAt > 295_000) break;
    if (!m.referral_invite_sms_enabled) continue;
    if (!m.referral_program_enabled) continue;

    const tz = getTimezoneForCountry(m.country || 'FR');
    { const lh = localHourFor(now, tz); if (lh < 10 || lh > 11) continue; }
    if (!isLegalSendTime(now, m.country || 'FR').ok) continue;

    const { data: merchantRefs } = await supabase
      .from('merchants')
      .select('referral_reward_referred, referral_reward_referrer')
      .eq('id', m.id)
      .single();
    if (!merchantRefs?.referral_reward_referred || !merchantRefs?.referral_reward_referrer) continue;

    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
    const { data: recentVisits } = await supabase
      .from('visits')
      .select('customer_id')
      .eq('merchant_id', m.id)
      .gte('visited_at', dayAgo);

    const recentCustomerIds = Array.from(new Set((recentVisits || []).map((v) => v.customer_id).filter(Boolean)));
    if (recentCustomerIds.length === 0) continue;

    // Batch-count total visits per recent customer, keep only those above threshold.
    const { data: totalVisitsRows } = await supabase
      .from('visits')
      .select('customer_id')
      .eq('merchant_id', m.id)
      .in('customer_id', recentCustomerIds);
    const visitCountByCustomer = new Map<string, number>();
    for (const r of totalVisitsRows || []) {
      visitCountByCustomer.set(r.customer_id, (visitCountByCustomer.get(r.customer_id) || 0) + 1);
    }
    const eligibleIds = recentCustomerIds.filter(
      (id) => (visitCountByCustomer.get(id) || 0) >= REFERRAL_INVITE_VISIT_THRESHOLD
    );
    if (eligibleIds.length === 0) continue;

    const [optOuts, customersRes] = await Promise.all([
      fetchOptedOutPhones(supabase, m.id),
      supabase.from('customers').select('id, first_name, phone_number').in('id', eligibleIds),
    ]);
    const customers = customersRes.data || [];
    const eligiblePhones = customers.map((c) => c.phone_number).filter((p): p is string => !!p);
    if (eligiblePhones.length === 0) continue;
    const referralDedupSince = new Date(now.getTime() - MARKETING_DEDUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const { data: existingLogs } = await supabase
      .from('sms_logs')
      .select('phone_to')
      .eq('merchant_id', m.id)
      .eq('sms_type', 'referral_invite')
      .gte('created_at', referralDedupSince)
      .in('phone_to', eligiblePhones);
    const alreadySent = new Set((existingLogs || []).map((r: { phone_to: string }) => r.phone_to));
    const sentMarketingToday = await fetchPhonesWithMarketingToday(supabase, m.id, todayStartIsoUtc());

    for (const customer of customers) {
      const phone = customer.phone_number;
      if (!phone || optOuts.has(phone) || alreadySent.has(phone)) continue;
      if (sentMarketingToday.has(phone)) continue; // cap daily — retry demain

      const locale = m.locale || 'fr';
      const first = customer.first_name ? `${customer.first_name}, ` : '';
      const rFor = merchantRefs.referral_reward_referred;
      const rYou = merchantRefs.referral_reward_referrer;
      const body = locale === 'en'
        ? `${first}love ${m.shop_name}? Refer a friend — she gets ${rFor}, you get ${rYou}. STOP SMS`
        : `${first}vous aimez ${m.shop_name} ? Parrainez une amie — elle obtient ${rFor}, vous ${rYou}. STOP SMS`;

      const result = await sendMarketingSms(supabase, {
        merchantId: m.id,
        phone,
        body,
        billingPeriodStart: m.billing_period_start,
        smsType: 'referral_invite',
      });
      if (result.success) results.referralInviteSent++;
      else if (result.blocked) { results.errors++; break; }
      else results.skipped++;
    }
  }

  // ── 7. INACTIVE REMINDER (marketing) — relance clients sans visite depuis 30j ──
  // Fire à 10h local. Cible customers dont MAX(visited_at) tombe dans [30j, 45j].
  for (const m of activeMerchants) {
    if (Date.now() - startedAt > 298_000) break;
    if (!m.inactive_sms_enabled) continue;

    const tz = getTimezoneForCountry(m.country || 'FR');
    { const lh = localHourFor(now, tz); if (lh < 10 || lh > 11) continue; }
    if (!isLegalSendTime(now, m.country || 'FR').ok) continue;

    const maxLookback = new Date(now.getTime() - (INACTIVE_MAX_DAYS + 15) * 24 * 60 * 60 * 1000).toISOString();
    const inactiveMinDate = new Date(now.getTime() - INACTIVE_MAX_DAYS * 24 * 60 * 60 * 1000);
    const inactiveMaxDate = new Date(now.getTime() - INACTIVE_MIN_DAYS * 24 * 60 * 60 * 1000);

    const { data: allVisits } = await supabase
      .from('visits')
      .select('customer_id, visited_at')
      .eq('merchant_id', m.id)
      .gte('visited_at', maxLookback)
      .order('visited_at', { ascending: false });

    const latestByCustomer = new Map<string, Date>();
    for (const v of allVisits || []) {
      if (!v.customer_id) continue;
      if (!latestByCustomer.has(v.customer_id)) {
        latestByCustomer.set(v.customer_id, new Date(v.visited_at));
      }
    }
    const eligibleIds: string[] = [];
    for (const [customerId, lastVisit] of latestByCustomer) {
      if (lastVisit >= inactiveMinDate && lastVisit <= inactiveMaxDate) eligibleIds.push(customerId);
    }
    if (eligibleIds.length === 0) continue;

    const dedupSince = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000).toISOString();
    const [optOuts, customersRes] = await Promise.all([
      fetchOptedOutPhones(supabase, m.id),
      supabase.from('customers').select('id, first_name, phone_number').in('id', eligibleIds),
    ]);
    const customers = customersRes.data || [];
    const candidatePhones = customers.map((c) => c.phone_number).filter((p): p is string => !!p);
    if (candidatePhones.length === 0) continue;
    const { data: existingLogs } = await supabase
      .from('sms_logs')
      .select('phone_to')
      .eq('merchant_id', m.id)
      .eq('sms_type', 'inactive_reminder')
      .gte('created_at', dedupSince)
      .in('phone_to', candidatePhones);
    const alreadySent = new Set((existingLogs || []).map((r: { phone_to: string }) => r.phone_to));
    const sentMarketingToday = await fetchPhonesWithMarketingToday(supabase, m.id, todayStartIsoUtc());

    for (const customer of customers) {
      const phone = customer.phone_number;
      if (!phone || optOuts.has(phone) || alreadySent.has(phone)) continue;
      if (sentMarketingToday.has(phone)) continue; // cap daily — retry demain

      const locale = m.locale || 'fr';
      const first = customer.first_name ? `${customer.first_name}, ` : '';
      const body = locale === 'en'
        ? `${first}it's been a while! We'd love to see you back at ${m.shop_name}. STOP SMS`
        : `${first}ça fait un moment ! Nous serions ravis de vous revoir chez ${m.shop_name}. STOP SMS`;

      const result = await sendMarketingSms(supabase, {
        merchantId: m.id,
        phone,
        body,
        billingPeriodStart: m.billing_period_start,
        smsType: 'inactive_reminder',
      });
      if (result.success) results.inactiveSent++;
      else if (result.blocked) { results.errors++; break; }
      else results.skipped++;
    }
  }

  // ── 8. NEAR REWARD (marketing) — client à 1 tampon de la récompense ──
  // Fire à 10h local. Cible cartes avec current_stamps = stamps_required - 1
  // (palier 1) OU tier2_stamps_required - 1 (palier 2), ET last_visit ≥ 15j.
  // Dedup 90j par phone+type+merchant.
  for (const m of activeMerchants) {
    if (Date.now() - startedAt > 299_000) break;
    if (!m.near_reward_sms_enabled) continue;
    if (!m.stamps_required || !m.reward_description) continue;

    const tz = getTimezoneForCountry(m.country || 'FR');
    { const lh = localHourFor(now, tz); if (lh < 10 || lh > 11) continue; }
    if (!isLegalSendTime(now, m.country || 'FR').ok) continue;

    const cutoff = new Date(now.getTime() - NEAR_REWARD_MIN_DAYS_SINCE_VISIT * 24 * 60 * 60 * 1000)
      .toISOString().slice(0, 10);

    const thresholds: Array<{ stamps: number; reward: string; tier: 1 | 2 }> = [
      { stamps: m.stamps_required - 1, reward: m.reward_description, tier: 1 },
    ];
    if (m.tier2_enabled && m.tier2_stamps_required && m.tier2_reward_description) {
      thresholds.push({ stamps: m.tier2_stamps_required - 1, reward: m.tier2_reward_description, tier: 2 });
    }

    const { data: cards } = await supabase
      .from('loyalty_cards')
      .select('customer_id, current_stamps, last_visit_date, customers(first_name, phone_number)')
      .eq('merchant_id', m.id)
      .in('current_stamps', thresholds.map((t) => t.stamps))
      .lte('last_visit_date', cutoff);

    if (!cards || cards.length === 0) continue;

    const candidatePhones = (cards as unknown as Array<{ customers?: CustomerEmbed | null }>)
      .map((r) => r.customers?.phone_number)
      .filter((p): p is string => !!p);
    if (candidatePhones.length === 0) continue;

    const dedupSince = new Date(now.getTime() - MARKETING_DEDUP_DAYS * 24 * 60 * 60 * 1000).toISOString();
    const [optOuts, existingLogsRes] = await Promise.all([
      fetchOptedOutPhones(supabase, m.id),
      supabase.from('sms_logs').select('phone_to').eq('merchant_id', m.id).eq('sms_type', 'near_reward')
        .gte('created_at', dedupSince).in('phone_to', candidatePhones),
    ]);
    const alreadySent = new Set((existingLogsRes.data || []).map((r: { phone_to: string }) => r.phone_to));
    const sentMarketingToday = await fetchPhonesWithMarketingToday(supabase, m.id, todayStartIsoUtc());

    for (const card of cards) {
      const customer = getEmbeddedCustomer(card);
      const phone = customer?.phone_number;
      const currentStamps = (card as { current_stamps?: number }).current_stamps ?? -1;
      if (!phone || optOuts.has(phone) || alreadySent.has(phone)) continue;
      if (sentMarketingToday.has(phone)) continue; // cap daily — retry demain

      const match = thresholds.find((t) => t.stamps === currentStamps);
      if (!match) continue;

      const locale = m.locale || 'fr';
      const first = customer?.first_name ? `${customer.first_name}, ` : '';
      const tierSuffix = match.tier === 2 ? (locale === 'en' ? ' (level 2)' : ' (palier 2)') : '';
      const body = locale === 'en'
        ? `${first}one more stamp before your reward${tierSuffix} at ${m.shop_name}: ${match.reward}! See you soon. STOP SMS`
        : `${first}plus qu'un tampon avant votre récompense${tierSuffix} chez ${m.shop_name} : ${match.reward} ! À bientôt. STOP SMS`;

      const result = await sendMarketingSms(supabase, {
        merchantId: m.id,
        phone,
        body,
        billingPeriodStart: m.billing_period_start,
        smsType: 'near_reward',
      });
      if (result.success) results.nearRewardSent++;
      else if (result.blocked) { results.errors++; break; }
      else results.skipped++;
    }
  }

  // ── 9. BIRTHDAY SMS (transactional) — fenetre 10h-11h local ──
  // Voeu d'anniversaire personnalise + cadeau = transactionnel (client l'attend).
  // Pas de check isLegalSendTime : on envoie meme dim/jour ferie sinon on rate
  // ~14% des anniversaires (1 dim/7 + ~11 feries/an). Dedup via sendBookingSms
  // (phone+type+merchant meme jour). Voucher + email + push crees par
  // /api/cron/morning-jobs a 7h UTC ; ici uniquement le SMS.
  for (const m of activeMerchants) {
    if (Date.now() - startedAt > 295_000) break;
    if (!m.birthday_gift_enabled) continue;

    const tz = getTimezoneForCountry(m.country || 'FR');
    const localHour = localHourFor(now, tz);
    if (localHour < 10 || localHour > 11) continue;

    const todayLocal = localDateFor(now, tz);
    const [, monthStr, dayStr] = todayLocal.split('-');
    const targetMonth = parseInt(monthStr, 10);
    const targetDay = parseInt(dayStr, 10);

    const { data: bdayCustomers } = await supabase
      .from('customers')
      .select('first_name, phone_number')
      .eq('merchant_id', m.id)
      .eq('birth_month', targetMonth)
      .eq('birth_day', targetDay)
      .not('phone_number', 'is', null);

    if (!bdayCustomers || bdayCustomers.length === 0) continue;

    for (const customer of bdayCustomers) {
      if (!customer.phone_number) continue;
      const sent = await sendBookingSms(supabase, {
        merchantId: m.id,
        phone: customer.phone_number,
        shopName: m.shop_name,
        smsType: 'birthday',
        locale: m.locale || 'fr',
        subscriptionStatus: m.subscription_status,
        gift: m.birthday_gift_description || (m.locale === 'en' ? 'a gift' : 'un cadeau'),
        clientName: customer.first_name || '',
      });
      if (sent) results.birthdaySent++;
      else results.skipped++;
    }
  }

  logger.debug('[sms-hourly] done', results);
  return NextResponse.json({ ok: true, ...results });
}
