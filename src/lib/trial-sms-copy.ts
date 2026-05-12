import type { ActivationDetails } from './activation-score';
import type { TrialSmsType } from './sms-trial-marketing';

/**
 * Copy SMS marketing trial (check-in J+1).
 * Pas d'emoji, pas de firstName (merchant a uniquement shop_name).
 * Sender alpha "Qarte". 2 liens courts SMS Partner :
 * - SIGNIN_URL → page sign-in merchant (default, dashboard si déjà loggué)
 * - QR_URL    → page QR download (CTA "scanne-la ici" direct)
 *
 * Voir docs/sms-system.md pour détails.
 */

/** Liens courts créés manuellement chez SMS Partner / Cuttly. */
const SIGNIN_URL = 'https://ptnr.fr/1Vvx2D';
const QR_URL = 'https://ptnr.fr/1Vvxut';
const EXAMPLE_VITRINE_URL = 'https://cll.re/1VvxCB';

/** SMS envoyé ~15 min après signup pour montrer un exemple de page vitrine. */
export function exampleVitrineSmsBody(shopName: string): string {
  return `${shopName}, exemple de page vitrine Qarte : ${EXAMPLE_VITRINE_URL}. ecris nous sur whatsapp si tu as des questions`;
}

/**
 * Choisit la variante + le corps du SMS check-in J+1 selon l'état du merchant.
 * 5 variantes :
 * - A (checkin_nudge)      : aucun pilier atteint, nudge configuration
 * - B (celebration_fidelity): seulement fidélité → célébration + next step vitrine
 * - C (celebration_vitrine) : seulement vitrine → célébration + next step 1re cliente
 * - D (checkin_combo)       : 2+ piliers atteints → célébration combinée
 * - E (celebration_planning): planning seul sans fidélité → fallback rare
 */
export function checkInSmsSelection(
  activation: ActivationDetails,
  shopName: string,
): { smsType: TrialSmsType; body: string } {
  const { fidelity, planning, vitrine } = activation.pillars;

  if (activation.score >= 2) {
    return {
      smsType: 'checkin_combo',
      body: `${shopName}, top depart ! 1re cliente dans la carte + page vitrine OK : ${SIGNIN_URL}`,
    };
  }

  if (fidelity) {
    return {
      smsType: 'celebration_fidelity',
      body: `${shopName}, 1re cliente dans la carte ! Etape suivante : ta page vitrine. ${SIGNIN_URL}`,
    };
  }

  if (vitrine) {
    return {
      smsType: 'celebration_vitrine',
      body: `${shopName}, ta page vitrine est en ligne ! Manque plus que ta 1re cliente. Ton QR : ${QR_URL}`,
    };
  }

  if (planning) {
    // Fallback rarissime (planning sans fidélité ni vitrine)
    return {
      smsType: 'celebration_planning',
      body: `${shopName}, 1re resa en ligne ! Active ta carte fidelite pour fideliser : ${SIGNIN_URL}`,
    };
  }

  // S0 — rien configuré à J+1
  return {
    smsType: 'checkin_nudge',
    body: `${shopName}, J+1 sur Qarte. Scanne ta 1re cliente ou prepare ta page vitrine, 5 min : ${SIGNIN_URL}`,
  };
}
