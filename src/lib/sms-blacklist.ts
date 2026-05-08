/**
 * Blacklist des numeros de telephone definitivement invalides.
 *
 * Politique : ajouter un numero apres 2+ tentatives ayant abouti a 'invalid_phone'
 * sur 2 providers differents (ou 2 fois sur le meme provider si l'autre n'est pas
 * disponible pour ce pays).
 *
 * `isPhoneBlacklisted()` est appele AVANT chaque envoi pour skip a la source.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import logger from './logger';

export interface BlacklistEntry {
  phone: string;
  reason: string;
  detected_provider: 'ovh' | 'sms_partner' | 'both' | null;
  added_at: string;
  last_seen_at: string;
  attempt_count: number;
}

/**
 * True si le numero est dans la blacklist (cf table sms_phone_blacklist mig 162).
 * Cache module-level 60s pour eviter une query par envoi.
 */
const cache = new Map<string, { blacklisted: boolean; ts: number }>();
const CACHE_TTL_MS = 60_000;
const CACHE_MAX_SIZE = 1000;

function setCache(phone: string, blacklisted: boolean): void {
  // LRU eviction : jarre l'entree la plus ancienne (premiere inseree dans le Map)
  if (cache.size >= CACHE_MAX_SIZE && !cache.has(phone)) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  cache.set(phone, { blacklisted, ts: Date.now() });
}

export async function isPhoneBlacklisted(
  supabase: SupabaseClient,
  phone: string,
): Promise<boolean> {
  const cached = cache.get(phone);
  if (cached && Date.now() - cached.ts < CACHE_TTL_MS) {
    return cached.blacklisted;
  }
  const { data } = await supabase
    .from('sms_phone_blacklist')
    .select('phone')
    .eq('phone', phone)
    .maybeSingle();
  const blacklisted = !!data;
  setCache(phone, blacklisted);
  return blacklisted;
}

/**
 * Enregistre un evenement 'invalid_phone' pour ce numero. Apres 2 occurrences
 * sur 2 providers differents → ajoute a la blacklist.
 *
 * Strategie : on cherche d'abord les 'invalid_phone' precedents dans sms_logs
 * sur les 30 derniers jours pour ce numero. Si on en trouve un sur un autre
 * provider → blacklist (les 2 ont confirme).
 */
export async function recordInvalidPhone(
  supabase: SupabaseClient,
  phone: string,
  provider: 'ovh' | 'sms_partner',
  reason: string,
): Promise<{ blacklisted: boolean }> {
  // Cherche un precedent invalid_phone sur ce numero (autre provider de preference)
  const { data: previous } = await supabase
    .from('sms_logs')
    .select('provider, error_class, created_at')
    .eq('phone_to', phone)
    .eq('error_class', 'invalid_phone')
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(5);

  const otherProviderConfirmed = (previous || []).some(p => p.provider !== provider);
  const sameProviderTwice = (previous || []).filter(p => p.provider === provider).length >= 1;

  // Blacklist si deux providers confirment OU si meme provider 2 fois (pour les
  // numeros qui n'ont qu'un seul provider eligible — ex: CH avec OVH only).
  if (otherProviderConfirmed || sameProviderTwice) {
    const detectedProvider = otherProviderConfirmed ? 'both' : provider;
    await supabase
      .from('sms_phone_blacklist')
      .upsert({
        phone,
        reason,
        detected_provider: detectedProvider,
        last_seen_at: new Date().toISOString(),
        attempt_count: ((previous || []).length || 1) + 1,
      }, { onConflict: 'phone' });
    cache.set(phone, { blacklisted: true, ts: Date.now() });
    logger.warn('[sms-blacklist] Phone blacklisted', { phone, provider, reason, attempts: (previous || []).length + 1 });
    return { blacklisted: true };
  }
  return { blacklisted: false };
}
