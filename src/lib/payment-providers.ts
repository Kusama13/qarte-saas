/**
 * Detection du provider de paiement depuis l'URL du lien d'acompte du merchant.
 * Utilise pour proposer un label friendly ("Revolut", "PayPal", ...) quand le
 * merchant n'a pas mis de label custom dans deposit_link_label.
 */

const PAYMENT_PROVIDER_RULES: Array<[RegExp, string]> = [
  [/revolut\.(me|com)/, 'Revolut'],
  [/paypal\.(com|me)/, 'PayPal'],
  [/(lydia-app\.com|lydia\.me)/, 'Lydia'],
  [/pumpkin-app\.com/, 'Pumpkin'],
  [/wise\.com/, 'Wise'],
  [/(stripe\.com|buy\.stripe\.com)/, 'Stripe'],
  [/sumup\.(link|com)/, 'SumUp'],
  [/buymeacoffee\.com/, 'Buy Me a Coffee'],
  [/venmo\.com/, 'Venmo'],
  [/cash\.app/, 'Cash App'],
  [/zelle\.com/, 'Zelle'],
  [/payconiq\.com/, 'Payconiq'],
  [/twint/, 'Twint'],
  [/monzo\.me/, 'Monzo'],
];

export function detectPaymentProvider(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    for (const [pattern, label] of PAYMENT_PROVIDER_RULES) {
      if (pattern.test(host)) return label;
    }
    return null;
  } catch {
    return null;
  }
}

export interface DepositLink {
  url: string;
  label: string | null;
}

/**
 * Préfixe `https://` si manquant. Renvoie null si la chaîne est vide
 * après trim. Utilisé partout où on stocke un lien de paiement.
 */
export function normalizePaymentLink(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

/**
 * Vérifie qu'une saisie ressemble à un vrai lien (host avec un point).
 * Sert à afficher un warning quand la coiffeuse a tapé du texte ("Payplug")
 * au lieu d'un URL.
 */
export function isValidPaymentLink(raw: string | null | undefined): boolean {
  const normalized = normalizePaymentLink(raw);
  if (!normalized) return false;
  try {
    const host = new URL(normalized).hostname;
    return host.includes('.') && host.length >= 4;
  } catch {
    return false;
  }
}

/**
 * Construit la liste des liens d'acompte du merchant (max 2 supportes).
 * Normalise l'URL (ajoute https:// si manquant). Retourne [] si aucun lien.
 */
export function buildDepositLinks(
  link1?: string | null,
  label1?: string | null,
  link2?: string | null,
  label2?: string | null,
): DepositLink[] {
  const out: DepositLink[] = [];
  const u1 = normalizePaymentLink(link1);
  if (u1) out.push({ url: u1, label: label1 || null });
  const u2 = normalizePaymentLink(link2);
  if (u2) out.push({ url: u2, label: label2 || null });
  return out;
}
