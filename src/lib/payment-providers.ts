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

function normalizeLink(url: string | null | undefined): string | null {
  if (!url) return null;
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
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
  const u1 = normalizeLink(link1);
  if (u1) out.push({ url: u1, label: label1 || null });
  const u2 = normalizeLink(link2);
  if (u2) out.push({ url: u2, label: label2 || null });
  return out;
}
