import { SupabaseClient } from '@supabase/supabase-js';

// Result counters type
export type SectionStats = { processed: number; sent: number; skipped: number; errors: number };

// Resend rate limit: 2 req/s — 600ms pause between actual sends only
export const RESEND_RATE_LIMIT_MS = 600;
export const rateLimitDelay = () => new Promise(resolve => setTimeout(resolve, RESEND_RATE_LIMIT_MS));

// Helper: batch fetch user emails by user_id
export async function batchGetUserEmails(supabase: SupabaseClient, userIds: string[]): Promise<Map<string, string>> {
  const emailMap = new Map<string, string>();
  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    await Promise.allSettled(batch.map(async (userId) => {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.user?.email;
      if (email) emailMap.set(userId, email);
    }));
  }
  return emailMap;
}

// Helper: fetch tracking records and build a Set of already-sent merchant IDs
export async function getAlreadySentSet(supabase: SupabaseClient, merchantIds: string[], trackingCode: number): Promise<Set<string>> {
  const { data } = await supabase
    .from('pending_email_tracking')
    .select('merchant_id')
    .in('merchant_id', merchantIds)
    .eq('reminder_day', trackingCode);
  return new Set((data || []).map((t: { merchant_id: string }) => t.merchant_id));
}

// Flush tracking records in batches
export async function flushTrackingBatch(supabase: SupabaseClient, batch: Array<{ merchant_id: string; reminder_day: number; pending_count: number }>) {
  if (batch.length === 0) return;
  await supabase.from('pending_email_tracking').insert(batch);
}

// Process email section — handles the common pattern
export async function processEmailSection<T extends { id: string; user_id: string }>(
  supabase: SupabaseClient,
  opts: {
    candidates: T[];
    trackingCode: number;
    emailMap: Map<string, string>;
    alreadySentSet: Set<string>;
    stats: SectionStats;
    sendFn: (email: string, candidate: T) => Promise<{ success: boolean }>;
    extraSkip?: (candidate: T) => boolean;
    superAdminUserIds?: Set<string>;
  }
) {
  const { candidates, trackingCode, emailMap, alreadySentSet, stats, sendFn, extraSkip, superAdminUserIds } = opts;
  const trackingBatch: Array<{ merchant_id: string; reminder_day: number; pending_count: number }> = [];

  for (const candidate of candidates) {
    stats.processed++;
    if (superAdminUserIds?.has(candidate.user_id)) { stats.skipped++; continue; }
    if (alreadySentSet.has(candidate.id)) { stats.skipped++; continue; }
    if (extraSkip && extraSkip(candidate)) { stats.skipped++; continue; }

    const email = emailMap.get(candidate.user_id);
    if (!email) { stats.skipped++; continue; }

    try {
      const result = await sendFn(email, candidate);
      if (result.success) {
        trackingBatch.push({ merchant_id: candidate.id, reminder_day: trackingCode, pending_count: 0 });
        if (trackingBatch.length >= 100) {
          await flushTrackingBatch(supabase, trackingBatch.splice(0));
        }
        stats.sent++;
        await rateLimitDelay();
      } else { stats.errors++; }
    } catch { stats.errors++; }
  }

  await flushTrackingBatch(supabase, trackingBatch);
}

// Full standard email section — query + tracking + emails
export async function runStandardEmailSection<T extends { id: string; user_id: string }>(
  supabase: SupabaseClient,
  opts: {
    candidates: T[] | null | undefined;
    trackingCode: number;
    stats: SectionStats;
    sendFn: (email: string, candidate: T) => Promise<{ success: boolean }>;
    extraSkip?: (candidate: T) => boolean;
    superAdminUserIds?: Set<string>;
    emailMap?: Map<string, string>;
    globalTrackingSet?: Set<string>;
  }
) {
  const { candidates, trackingCode, stats, sendFn, extraSkip, superAdminUserIds } = opts;
  if (!candidates || candidates.length === 0) return;

  const emailMap = opts.emailMap || await batchGetUserEmails(supabase, [...new Set(candidates.map(m => m.user_id))]);
  const alreadySentSet = opts.globalTrackingSet
    ? new Set(candidates.filter(m => opts.globalTrackingSet!.has(`${m.id}:${trackingCode}`)).map(m => m.id))
    : await getAlreadySentSet(supabase, candidates.map(m => m.id), trackingCode);

  await processEmailSection(supabase, { candidates, trackingCode, emailMap, alreadySentSet, stats, sendFn, extraSkip, superAdminUserIds });
}

// Timing safe compare for CRON_SECRET
export function timingSafeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const encoder = new TextEncoder();
  const bufA = encoder.encode(a);
  const bufB = encoder.encode(b);
  let result = 0;
  for (let i = 0; i < bufA.length; i++) result |= bufA[i] ^ bufB[i];
  return result === 0;
}

// Auth check for cron routes
export function verifyCronAuth(authHeader: string | null): boolean {
  const CRON_SECRET = process.env.CRON_SECRET;
  if (!CRON_SECRET || !authHeader?.startsWith('Bearer ')) return false;
  return timingSafeCompare(authHeader.slice(7), CRON_SECRET);
}

// Fetch all tracking records with pagination
export async function fetchAllTracking(supabase: SupabaseClient, merchantIds: string[]) {
  const allRows: Array<{ merchant_id: string; reminder_day: number }> = [];
  const PAGE_SIZE = 1000;
  let offset = 0;
  while (true) {
    const { data } = await supabase
      .from('pending_email_tracking')
      .select('merchant_id, reminder_day')
      .in('merchant_id', merchantIds)
      .range(offset, offset + PAGE_SIZE - 1);
    if (!data || data.length === 0) break;
    allRows.push(...data);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return allRows;
}

// Send onboarding push to merchants with PWA installed
export function sendOnboardingPushes(
  sendMerchantPushFn: (params: { supabase: SupabaseClient; merchantId: string; notificationType: string; referenceId: string; title: string; body: string; url: string; tag: string }) => Promise<boolean>,
  supabase: SupabaseClient,
  merchants: Array<{ id: string; locale: string | null; pwa_installed_at: string | null }>,
  opts: { notificationType: string; titleFr: string; titleEn: string; bodyFr: string; bodyEn: string; url: string },
  pushPromises: Promise<boolean>[],
) {
  for (const m of merchants) {
    if (!m.pwa_installed_at) continue;
    const isEN = m.locale === 'en';
    pushPromises.push(
      sendMerchantPushFn({
        supabase, merchantId: m.id, notificationType: opts.notificationType, referenceId: m.id,
        title: isEN ? opts.titleEn : opts.titleFr,
        body: isEN ? opts.bodyEn : opts.bodyFr,
        url: opts.url, tag: 'qarte-merchant-onboarding',
      })
    );
  }
}
