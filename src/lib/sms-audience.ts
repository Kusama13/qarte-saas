// SMS marketing audience resolver: picks phone numbers from loyalty_cards+customers
// based on a filter, excluding sms_opt_outs.

import type { SupabaseClient } from '@supabase/supabase-js';

export type AudienceFilter =
  | { type: 'all' }
  | { type: 'inactive'; days: 14 | 30 | 60 | 90 }
  | { type: 'new'; days: number }
  | { type: 'vip'; minStamps?: number; minAmount?: number }
  | { type: 'birthday_month' }
  | { type: 'unused_voucher'; olderThanDays: number };

export interface AudienceResolution {
  count: number;
  phones: string[];
}

export async function resolveAudience(
  supabase: SupabaseClient,
  merchantId: string,
  filter: AudienceFilter
): Promise<AudienceResolution> {
  const phones = await fetchCandidatePhones(supabase, merchantId, filter);
  const optedOut = await fetchOptedOutPhones(supabase, merchantId);
  const final = Array.from(new Set(phones)).filter((p) => !!p && !optedOut.has(p));
  return { count: final.length, phones: final };
}

export async function resolveAudienceUnion(
  supabase: SupabaseClient,
  merchantId: string,
  filters: AudienceFilter[]
): Promise<AudienceResolution> {
  if (filters.length === 0) return { count: 0, phones: [] };
  // Short-circuit if 'all' is present — it supersedes any narrower filter.
  if (filters.some((f) => f.type === 'all')) {
    return resolveAudience(supabase, merchantId, { type: 'all' });
  }
  const phoneLists = await Promise.all(
    filters.map((f) => fetchCandidatePhones(supabase, merchantId, f))
  );
  const optedOut = await fetchOptedOutPhones(supabase, merchantId);
  const union = Array.from(new Set(phoneLists.flat())).filter((p) => !!p && !optedOut.has(p));
  return { count: union.length, phones: union };
}

export type CustomerEmbed = {
  first_name?: string | null;
  phone_number?: string | null;
  no_contact?: boolean | null;
};

export async function fetchOptedOutPhones(
  supabase: SupabaseClient,
  merchantId: string
): Promise<Set<string>> {
  const { data } = await supabase
    .from('sms_opt_outs')
    .select('phone_number')
    .eq('merchant_id', merchantId);
  return new Set((data || []).map((r: { phone_number: string }) => r.phone_number));
}

export async function hasSmsLog(
  supabase: SupabaseClient,
  merchantId: string,
  smsType: string,
  phone: string,
  since?: string
): Promise<boolean> {
  let q = supabase
    .from('sms_logs')
    .select('id')
    .eq('merchant_id', merchantId)
    .eq('sms_type', smsType)
    .eq('phone_to', phone);
  if (since) q = q.gte('created_at', since);
  const { data } = await q.maybeSingle();
  return !!data;
}

async function fetchCandidatePhones(
  supabase: SupabaseClient,
  merchantId: string,
  filter: AudienceFilter
): Promise<string[]> {
  switch (filter.type) {
    case 'all':
      return fetchAllCards(supabase, merchantId);
    case 'inactive':
      return fetchInactive(supabase, merchantId, filter.days);
    case 'new':
      return fetchNew(supabase, merchantId, filter.days);
    case 'vip':
      return fetchVip(supabase, merchantId, filter.minStamps, filter.minAmount);
    case 'birthday_month':
      return fetchBirthdayMonth(supabase, merchantId);
    case 'unused_voucher':
      return fetchUnusedVoucher(supabase, merchantId, filter.olderThanDays);
    default:
      return [];
  }
}

type CustomerEmbedRow = { phone_number: string | null; no_contact?: boolean | null };
type CardRow = {
  customer_id: string;
  customers?: CustomerEmbedRow | CustomerEmbedRow[] | null;
};

// PostgREST peut retourner l'embed parent soit comme objet soit comme array
// selon la detection de cardinalite. On normalise.
function normalizeCustomer(c: CardRow['customers']): CustomerEmbedRow | null {
  if (!c) return null;
  return Array.isArray(c) ? c[0] ?? null : c;
}

function extractPhones(rows: CardRow[]): string[] {
  const phones: string[] = [];
  for (const r of rows) {
    const c = normalizeCustomer(r.customers);
    if (c && !c.no_contact && c.phone_number) phones.push(c.phone_number);
  }
  return phones;
}

async function fetchAllCards(supabase: SupabaseClient, merchantId: string): Promise<string[]> {
  const { data } = await supabase
    .from('loyalty_cards')
    .select('customer_id, customers(phone_number, no_contact)')
    .eq('merchant_id', merchantId);
  return extractPhones((data || []) as unknown as CardRow[]);
}

async function fetchInactive(supabase: SupabaseClient, merchantId: string, days: number): Promise<string[]> {
  const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const { data } = await supabase
    .from('loyalty_cards')
    .select('customer_id, last_visit_date, customers(phone_number, no_contact)')
    .eq('merchant_id', merchantId)
    .or(`last_visit_date.lte.${cutoff},last_visit_date.is.null`);
  return extractPhones((data || []) as unknown as CardRow[]);
}

async function fetchNew(supabase: SupabaseClient, merchantId: string, days: number): Promise<string[]> {
  const cutoff = new Date(Date.now() - days * 24 * 3600 * 1000).toISOString();
  const { data } = await supabase
    .from('loyalty_cards')
    .select('customer_id, created_at, customers(phone_number, no_contact)')
    .eq('merchant_id', merchantId)
    .gte('created_at', cutoff);
  return extractPhones((data || []) as unknown as CardRow[]);
}

async function fetchVip(
  supabase: SupabaseClient,
  merchantId: string,
  minStamps?: number,
  minAmount?: number
): Promise<string[]> {
  let q = supabase
    .from('loyalty_cards')
    .select('customer_id, current_stamps, current_amount, customers(phone_number, no_contact)')
    .eq('merchant_id', merchantId);
  if (typeof minStamps === 'number') q = q.gte('current_stamps', minStamps);
  if (typeof minAmount === 'number') q = q.gte('current_amount', minAmount);
  const { data } = await q;
  return extractPhones((data || []) as unknown as CardRow[]);
}

async function fetchBirthdayMonth(supabase: SupabaseClient, merchantId: string): Promise<string[]> {
  const month = new Date().getUTCMonth() + 1;
  const { data: cards } = await supabase
    .from('loyalty_cards')
    .select('customer_id')
    .eq('merchant_id', merchantId);
  const ids = (cards || []).map((r: { customer_id: string }) => r.customer_id);
  if (ids.length === 0) return [];

  const { data: customers } = await supabase
    .from('customers')
    .select('phone_number, no_contact, birth_month')
    .in('id', ids)
    .eq('birth_month', month);

  return (customers || [])
    .filter((c: { phone_number: string | null; no_contact?: boolean | null }) => !c.no_contact && c.phone_number)
    .map((c: { phone_number: string }) => c.phone_number);
}

async function fetchUnusedVoucher(
  supabase: SupabaseClient,
  merchantId: string,
  olderThanDays: number
): Promise<string[]> {
  const cutoff = new Date(Date.now() - olderThanDays * 24 * 3600 * 1000).toISOString();
  const { data: vouchers } = await supabase
    .from('vouchers')
    .select('customer_id, is_used, created_at, expires_at')
    .eq('merchant_id', merchantId)
    .eq('is_used', false)
    .lte('created_at', cutoff);

  const now = new Date();
  const valid = (vouchers || []).filter(
    (v: { expires_at: string | null }) => !v.expires_at || new Date(v.expires_at) > now
  );
  const ids = Array.from(new Set(valid.map((v: { customer_id: string }) => v.customer_id)));
  if (ids.length === 0) return [];

  const { data: customers } = await supabase
    .from('customers')
    .select('phone_number, no_contact')
    .in('id', ids);

  return (customers || [])
    .filter((c: { phone_number: string | null; no_contact?: boolean | null }) => !c.no_contact && c.phone_number)
    .map((c: { phone_number: string }) => c.phone_number);
}
