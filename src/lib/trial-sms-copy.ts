import type { ActivationDetails } from './activation-score';
import type { TierRecommended, TrialSmsType } from './sms-trial-marketing';

/**
 * Copy SMS marketing trial v3 (check-in 48h).
 * Pas d'emoji, pas de firstName (merchant a uniquement shop_name).
 * Sender alpha "Qarte" (pas d'URL pour éviter filtres anti-spam).
 *
 * Voir docs/sms-system.md pour détails.
 */

/**
 * Choisit la variante + le corps du SMS check-in 48h selon l'état du merchant.
 * 4 variantes :
 * - A (checkin_nudge)      : aucun pilier atteint, nudge configuration
 * - B (celebration_fidelity): seulement fidélité → célébration + next step vitrine
 * - C (celebration_vitrine) : seulement vitrine → célébration + next step 1re cliente
 * - D (checkin_combo)       : 2+ piliers atteints → célébration combinée
 *
 * Cas rare : planning seul sans fidélité → fallback celebration_planning.
 */
export function checkInSmsSelection(
  activation: ActivationDetails,
  shopName: string,
): { smsType: TrialSmsType; body: string } {
  const { fidelity, planning, vitrine } = activation.pillars;
  const pillarsAchieved = Number(fidelity) + Number(planning) + Number(vitrine);

  if (pillarsAchieved >= 2) {
    return {
      smsType: 'checkin_combo',
      body: `Bravo ${shopName}, top depart : 1re cliente fidelisee et vitrine en ligne. Qarte bosse pour toi, ouvre l'app.`,
    };
  }

  if (fidelity) {
    return {
      smsType: 'celebration_fidelity',
      body: `Bravo ${shopName}, 1re cliente fidelisee. Qarte fait le taf. Prochaine etape : complete ta vitrine pour Google. Ouvre l'app.`,
    };
  }

  if (vitrine) {
    return {
      smsType: 'celebration_vitrine',
      body: `Ta vitrine ${shopName} est en ligne sur Google. Il manque juste ta 1re cliente fidelisee : scanne-la depuis Qarte.`,
    };
  }

  if (planning) {
    // Fallback rarissime (planning sans fidélité ni vitrine)
    return {
      smsType: 'celebration_planning',
      body: `Bravo ${shopName}, 1re resa en ligne. Le planning bosse pour toi. Ouvre Qarte.`,
    };
  }

  // S0 — rien configuré à 48h
  return {
    smsType: 'checkin_nudge',
    body: `${shopName}, ca fait 2 jours chez Qarte. Lance ton 1er scan ou complete ta vitrine en 5 min pour demarrer. Ouvre l'app.`,
  };
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
