/**
 * Gift cards (bons cadeaux) — helpers partagés.
 *
 * Source unique pour : génération de code public, expiration, payload SMS/email,
 * etc. Tout ce qui est consommé par plus d'une route doit vivre ici.
 */

import { supabaseAdmin } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { GiftCardServiceSnapshot } from '@/types';

/** Valeur par défaut quand le merchant n'a pas (encore) configuré sa durée. */
export const GIFT_CARD_EXPIRY_MONTHS_DEFAULT = 3;
/** Garde rétro-compat avec les imports existants — pointe sur le défaut. */
export const GIFT_CARD_EXPIRY_MONTHS = GIFT_CARD_EXPIRY_MONTHS_DEFAULT;
export const GIFT_CARD_EXPIRY_MONTHS_MIN = 1;
export const GIFT_CARD_EXPIRY_MONTHS_MAX = 24;
export const GIFT_CARD_AUTO_CANCEL_DAYS = 3;
export const GIFT_CARD_MIN_AMOUNT = 5;
export const GIFT_CARD_MAX_AMOUNT = 1000;
export const GIFT_CARD_DEFAULT_AMOUNTS = [30, 50, 80, 100];

/** Caractères du code public (sans 0/O/I/1/L pour éviter confusions visuelles). */
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 6;

/** Génère un code unique du type `GIFT-AB23CD`. Retry jusqu'à 5 fois en cas de collision. */
export async function generateGiftCardCode(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    let suffix = '';
    for (let i = 0; i < CODE_LENGTH; i++) {
      suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    const code = `GIFT-${suffix}`;
    const { data: existing } = await supabaseAdmin()
      .from('gift_cards')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (!existing) return code;
  }
  throw new Error('Failed to generate unique gift card code after 5 attempts');
}

/**
 * Calcule la date d'expiration N mois après paid_at. N est typiquement
 * `merchant.gift_card_expiry_months` (1-24, défaut 3 si NULL/invalide).
 */
export function computeGiftCardExpiry(
  paidAt: Date = new Date(),
  months: number | null | undefined = GIFT_CARD_EXPIRY_MONTHS_DEFAULT,
): Date {
  const safeMonths = (typeof months === 'number' && months >= GIFT_CARD_EXPIRY_MONTHS_MIN && months <= GIFT_CARD_EXPIRY_MONTHS_MAX)
    ? months
    : GIFT_CARD_EXPIRY_MONTHS_DEFAULT;
  const exp = new Date(paidAt);
  exp.setMonth(exp.getMonth() + safeMonths);
  return exp;
}

/**
 * Résout les noms de prestations d'un bon kind='services' :
 *   - lookup LIVE dans merchant_services (les noms ont pu changer)
 *   - fallback service_snapshot (au cas où la prestation a été supprimée)
 * Retourne `{ servicesLabel, serviceNames }` (label = noms joints par " + ").
 * Pour kind='amount' ou ids vides : `{ servicesLabel: null, serviceNames: [] }`.
 */
export async function resolveGiftCardServiceNames(
  supabase: SupabaseClient,
  merchantId: string,
  kind: string | null | undefined,
  serviceIds: string[] | null | undefined,
  serviceSnapshot: GiftCardServiceSnapshot[] | null | undefined,
): Promise<{ servicesLabel: string | null; serviceNames: string[] }> {
  if (kind !== 'services' || !Array.isArray(serviceIds) || serviceIds.length === 0) {
    return { servicesLabel: null, serviceNames: [] };
  }
  const { data: liveSvc } = await supabase
    .from('merchant_services')
    .select('id, name')
    .eq('merchant_id', merchantId)
    .in('id', serviceIds);
  const liveById = new Map<string, string>(
    ((liveSvc as Array<{ id: string; name: string }>) || []).map((s) => [s.id, s.name]),
  );
  const snapById = new Map<string, GiftCardServiceSnapshot>(
    (serviceSnapshot || []).map((s) => [s.id, s]),
  );
  const serviceNames = serviceIds
    .map((id) => liveById.get(id) || snapById.get(id)?.name || null)
    .filter((n): n is string => Boolean(n));
  return { servicesLabel: formatGiftCardServicesLabel(serviceNames), serviceNames };
}

/** Parse `merchants.gift_card_amounts` (JSONB) → array de nombres validés. */
export function parseGiftCardAmounts(raw: unknown): number[] {
  if (!Array.isArray(raw)) return GIFT_CARD_DEFAULT_AMOUNTS;
  const amounts = raw
    .map((v) => Number(v))
    .filter((v) => Number.isFinite(v) && v >= GIFT_CARD_MIN_AMOUNT && v <= GIFT_CARD_MAX_AMOUNT);
  return amounts.length > 0 ? amounts : GIFT_CARD_DEFAULT_AMOUNTS;
}

/** True si le merchant a configuré au moins un lien de paiement dédié bons cadeaux. */
export function merchantHasPaymentLink(merchant: {
  gift_card_payment_link?: string | null;
  gift_card_payment_link_2?: string | null;
}): boolean {
  return Boolean(
    merchant.gift_card_payment_link?.trim()
    || merchant.gift_card_payment_link_2?.trim(),
  );
}

/**
 * Construit la liste des liens paiement bons cadeaux. Indépendants des liens
 * d'acompte (Planning) : si le merchant veut les mêmes, il les copie/colle.
 */
export function buildGiftCardPaymentLinks(
  merchant: {
    gift_card_payment_link?: string | null;
    gift_card_payment_link_label?: string | null;
    gift_card_payment_link_2?: string | null;
    gift_card_payment_link_2_label?: string | null;
  },
  detectProvider: (url: string) => string | null,
): Array<{ url: string; label: string }> {
  const links: Array<{ url: string; label: string }> = [];
  const giftLinks: Array<{ url: string | null | undefined; label: string | null | undefined }> = [
    { url: merchant.gift_card_payment_link, label: merchant.gift_card_payment_link_label },
    { url: merchant.gift_card_payment_link_2, label: merchant.gift_card_payment_link_2_label },
  ];
  for (const { url, label } of giftLinks) {
    if (url?.trim()) {
      const finalLabel = label?.trim() || detectProvider(url) || 'Payer';
      links.push({ url: url.trim(), label: `Payer avec ${finalLabel}` });
    }
  }
  return links;
}

/**
 * Construit un libellé court pour décrire les prestations offertes,
 * utilisé dans les SMS et l'objet d'email. Ex: "1 coupe + 1 brushing"
 * ou "2× coupe + 1 brushing" si doublons.
 */
export function formatGiftCardServicesLabel(serviceNames: string[]): string {
  if (serviceNames.length === 0) return '';
  // Compte les occurrences (cas où on offre 2× la même prestation)
  const counts = new Map<string, number>();
  for (const name of serviceNames) {
    counts.set(name, (counts.get(name) || 0) + 1);
  }
  const parts: string[] = [];
  for (const [name, count] of counts) {
    parts.push(count > 1 ? `${count}× ${name}` : name);
  }
  return parts.join(' + ');
}
