import type { Pillar } from './activation-score';
import type { TierRecommended } from './sms-trial-marketing';

/**
 * Copy SMS marketing trial (plan v2 §5).
 * Pas d'emoji, pas de firstName (merchant a uniquement shop_name).
 * Sender alpha "Qarte" (pas d'URL pour éviter filtres anti-spam).
 *
 * Voir docs/email-sms-trial-plan.md §5 pour détails.
 */

export function celebrationSmsBody(pillar: Pillar, shopName: string): string {
  if (pillar === 'fidelity') {
    return `Bravo, 1re cliente fidelisee chez ${shopName}. Qarte fait le taf. Ouvre l'app pour voir.`;
  }
  if (pillar === 'planning') {
    return `Bravo, 1re resa en ligne chez ${shopName}. Le planning bosse pour toi. Ouvre Qarte.`;
  }
  return `Ta vitrine ${shopName} est en ligne sur Google. Ouvre Qarte pour ton lien.`;
}

interface PreLossStats {
  customerCount?: number;
  bookingCount?: number;
}

export function preLossSmsBody(
  shopName: string,
  tierRecommended: TierRecommended,
  stats: PreLossStats,
): string {
  const customers = stats.customerCount ?? 0;
  const bookings = stats.bookingCount ?? 0;

  if (tierRecommended === 'all_in') {
    return `Plus que 24h chez Qarte. ${shopName} a ${customers} clientes et ${bookings} resas. Garde tout (resa + fidelite) pour 24EUR/mois — ouvre Qarte.`;
  }
  if (tierRecommended === 'fidelity') {
    return `Plus que 24h chez Qarte. ${shopName} a deja ${customers} clientes fidelisees. Garde ta carte fidelite pour 19EUR/mois — ouvre Qarte.`;
  }
  // Aucune reco (signal mixte / faible)
  return `Plus que 24h chez Qarte. ${shopName} a ${customers} clientes fidelisees. Garde ton compte pour 19EUR/mois — ouvre Qarte.`;
}

export function churnSurveySmsBody(shopName: string): string {
  return `Qarte: on a rate quelque chose avec ${shopName}. 2 min pour nous dire quoi? On rouvre ton compte 7j, et -25% x3 mois si c'est le prix. Lien dans l'email envoye.`;
}
