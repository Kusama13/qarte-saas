import { SupabaseClient } from '@supabase/supabase-js';
import webpush from 'web-push';

// Configure web-push (same as cron)
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contact@qarte.fr', vapidPublicKey, vapidPrivateKey);
}

// ── sendAutomationPush ──────────────────────────────────────────────────
// Shared helper for cron push automations. Handles dedup, cross-merchant
// subscription lookup, send, cleanup, and logging.

export async function sendAutomationPush(params: {
  supabase: SupabaseClient;
  merchantId: string;
  customerId: string;
  customerPhone: string;
  automationType: string;
  title: string;
  body: string;
  url: string;
}): Promise<boolean> {
  const { supabase, merchantId, customerId, customerPhone, automationType, title, body, url } = params;

  if (!vapidPublicKey || !vapidPrivateKey) return false;

  try {
    // 1. Dedup: check if already sent today for this type + customer + merchant
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const { data: existing } = await supabase
      .from('push_automation_logs')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('customer_id', customerId)
      .eq('automation_type', automationType)
      .gte('sent_at', todayStart.toISOString())
      .limit(1)
      .maybeSingle();

    if (existing) return false; // Already sent today

    // 2. Find all customer IDs with the same phone (cross-merchant)
    const { data: allCustomers } = await supabase
      .from('customers')
      .select('id')
      .eq('phone_number', customerPhone);

    const custIds = (allCustomers || []).map(c => c.id);
    if (custIds.length === 0) return false;

    // 3. Get push subscriptions
    const { data: subscriptions } = await supabase
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .in('customer_id', custIds);

    if (!subscriptions || subscriptions.length === 0) return false;

    // 4. Send via webpush
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      url,
      tag: `qarte-${automationType}`,
    });

    const results = await Promise.allSettled(
      subscriptions.map(sub =>
        webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          payload,
        )
      )
    );

    // 5. Cleanup expired subscriptions (404/410)
    const failedEndpoints: string[] = [];
    let sentCount = 0;
    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        sentCount++;
      } else {
        const err = result.reason as { statusCode?: number };
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          failedEndpoints.push(subscriptions[idx].endpoint);
        }
      }
    });

    if (failedEndpoints.length > 0) {
      await supabase.from('push_subscriptions').delete().in('endpoint', failedEndpoints);
    }

    if (sentCount === 0) return false;

    // 6. Log in push_automation_logs
    await supabase.from('push_automation_logs').insert({
      merchant_id: merchantId,
      customer_id: customerId,
      automation_type: automationType,
    });

    // 7. Increment stat counter on push_automations
    const statColumn = getStatColumn(automationType);
    if (statColumn) {
      // Use raw SQL increment via rpc or manual read+write
      const { data: current } = await supabase
        .from('push_automations')
        .select(statColumn)
        .eq('merchant_id', merchantId)
        .maybeSingle();

      if (current) {
        const val = (current as unknown as Record<string, number>)[statColumn] || 0;
        await supabase
          .from('push_automations')
          .update({ [statColumn]: val + 1 })
          .eq('merchant_id', merchantId);
      }
    }

    return true;
  } catch {
    return false;
  }
}

function getStatColumn(automationType: string): string | null {
  if (automationType === 'inactive_reminder') return 'inactive_reminder_sent';
  if (automationType === 'reward_reminder') return 'reward_reminder_sent';
  if (automationType.startsWith('event_')) return 'events_sent';
  return null;
}

// ── Event Calendar ──────────────────────────────────────────────────────

interface CalendarEvent {
  id: string;
  name: string;
}

/**
 * Returns the event that falls exactly 7 days from `date`, or null.
 */
export function getUpcomingEvent(date: Date): CalendarEvent | null {
  const targetDate = new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000);
  const targetMonth = targetDate.getMonth(); // 0-indexed
  const targetDay = targetDate.getDate();
  const year = targetDate.getFullYear();

  // Fixed-date events
  const fixedEvents: { month: number; day: number; id: string; name: string }[] = [
    { month: 11, day: 25, id: 'noel', name: 'Noël' },
    { month: 1, day: 14, id: 'saint_valentin', name: 'la Saint-Valentin' },
    { month: 9, day: 31, id: 'halloween', name: 'Halloween' },
  ];

  for (const ev of fixedEvents) {
    if (targetMonth === ev.month && targetDay === ev.day) {
      return { id: ev.id, name: ev.name };
    }
  }

  // Variable-date events
  const easter = getEasterDate(year);
  if (targetMonth === easter.getMonth() && targetDay === easter.getDate()) {
    return { id: 'paques', name: 'Pâques' };
  }

  const motherDay = getLastSundayOfMay(year);
  if (targetMonth === motherDay.getMonth() && targetDay === motherDay.getDate()) {
    return { id: 'fete_meres', name: 'la Fête des mères' };
  }

  const fatherDay = getThirdSundayOfJune(year);
  if (targetMonth === fatherDay.getMonth() && targetDay === fatherDay.getDate()) {
    return { id: 'fete_peres', name: 'la Fête des pères' };
  }

  const blackFriday = getFourthFridayOfNovember(year);
  if (targetMonth === blackFriday.getMonth() && targetDay === blackFriday.getDate()) {
    return { id: 'black_friday', name: 'le Black Friday' };
  }

  return null;
}

/**
 * Returns all upcoming events from `date` (for UI display).
 */
export function getNextEvents(date: Date, count: number = 3): { id: string; name: string; date: Date }[] {
  const year = date.getFullYear();
  const nextYear = year + 1;

  // Build all events for this year and next
  const allEvents: { id: string; name: string; date: Date }[] = [];

  for (const y of [year, nextYear]) {
    allEvents.push(
      { id: 'noel', name: 'Noël', date: new Date(y, 11, 25) },
      { id: 'saint_valentin', name: 'Saint-Valentin', date: new Date(y, 1, 14) },
      { id: 'halloween', name: 'Halloween', date: new Date(y, 9, 31) },
      { id: 'paques', name: 'Pâques', date: getEasterDate(y) },
      { id: 'fete_meres', name: 'Fête des mères', date: getLastSundayOfMay(y) },
      { id: 'fete_peres', name: 'Fête des pères', date: getThirdSundayOfJune(y) },
      { id: 'black_friday', name: 'Black Friday', date: getFourthFridayOfNovember(y) },
    );
  }

  // Filter future events and sort
  const now = date.getTime();
  return allEvents
    .filter(ev => ev.date.getTime() > now)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, count);
}

// ── Date calculation helpers ────────────────────────────────────────────

/** Easter date using the Anonymous Gregorian algorithm */
export function getEasterDate(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

/** Last Sunday of May (France Mother's Day) */
function getLastSundayOfMay(year: number): Date {
  const lastDay = new Date(year, 4, 31); // May 31
  const dayOfWeek = lastDay.getDay();
  const offset = dayOfWeek === 0 ? 0 : dayOfWeek;
  return new Date(year, 4, 31 - offset);
}

/** 3rd Sunday of June (France Father's Day) */
function getThirdSundayOfJune(year: number): Date {
  const firstDay = new Date(year, 5, 1); // June 1
  const firstSunday = firstDay.getDay() === 0 ? 1 : 8 - firstDay.getDay();
  return new Date(year, 5, firstSunday + 14); // 3rd Sunday
}

/** 4th Friday of November (Black Friday) */
function getFourthFridayOfNovember(year: number): Date {
  const firstDay = new Date(year, 10, 1); // November 1
  const firstFriday = firstDay.getDay() <= 5
    ? 1 + (5 - firstDay.getDay())
    : 1 + (5 + 7 - firstDay.getDay());
  return new Date(year, 10, firstFriday + 21); // 4th Friday
}
