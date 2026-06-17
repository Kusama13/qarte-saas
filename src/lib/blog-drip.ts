import type { BlogArticle } from '@/data/blog-articles';

/**
 * Séquence d'accueil blog (drip) pour les essais.
 * Logique pure, isolée pour être testable sans la couche cron/Supabase.
 */

// Fenêtre d'éligibilité : essais inscrits depuis ≤ 90 j (glissante). Un nouveau
// signup a largement le temps de recevoir les 14 articles (~28 j de séquence).
export const DRIP_WINDOW_DAYS = 90;
// Espacement minimal entre 2 mails blog pour un même salon (cadence 1 / 2 jours).
export const DRIP_SPACING_MS = 2 * 24 * 60 * 60 * 1000;
// On laisse passer les mails d'accueil du jour 0 avant le premier article.
export const DRIP_MIN_AGE_MS = 24 * 60 * 60 * 1000;

/**
 * Prochain article à envoyer à un salon : le plus récent (par date) publié
 * (date <= aujourd'hui) qu'il n'a pas encore reçu. null si épuisé.
 */
export function pickNextDripArticle(
  articles: BlogArticle[],
  receivedSlugs: Set<string>,
  today: string,
): BlogArticle | null {
  return (
    articles
      .filter((a) => a.date <= today && !receivedSlugs.has(a.slug))
      .sort((a, b) => b.date.localeCompare(a.date))[0] ?? null
  );
}

/**
 * Le salon est-il dû pour son prochain article ?
 * - Déjà reçu un mail blog : espacé d'au moins 2 jours.
 * - Jamais reçu : inscrit depuis au moins 24 h (ne pas télescoper l'accueil J0).
 */
export function isDueForDrip(
  lastSentAt: string | null,
  createdAt: string,
  now: Date,
): boolean {
  if (lastSentAt) {
    return now.getTime() - new Date(lastSentAt).getTime() >= DRIP_SPACING_MS;
  }
  return now.getTime() - new Date(createdAt).getTime() >= DRIP_MIN_AGE_MS;
}
