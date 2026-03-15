/**
 * Changelog — changements notables par jour.
 * Utilise dans les cohortes hebdomadaires (metriques admin)
 * pour voir l'impact des changements sur les inscriptions/conversions.
 *
 * Format: date ISO (YYYY-MM-DD) → liste de changements.
 * Ne garder que les changements avec un impact potentiel sur
 * l'acquisition, la conversion ou la retention.
 */

export type ChangelogEntry = {
  tag: 'feature' | 'fix' | 'design' | 'marketing' | 'pricing';
  text: string;
};

export const changelog: Record<string, ChangelogEntry[]> = {
  '2026-01-10': [
    { tag: 'feature', text: 'Lancement Qarte — MVP en production' },
  ],
  '2026-01-11': [
    { tag: 'feature', text: 'Dashboard admin + revenus' },
    { tag: 'feature', text: 'Systeme emails (Resend) + essai 7j + grace 3j' },
    { tag: 'feature', text: 'Bandeau RGPD + rate limiting + favicon' },
  ],
  '2026-03-04': [
    { tag: 'fix', text: 'Suppression challenge 5 clients + banner promo QARTE50' },
  ],
  '2026-03-05': [
    { tag: 'feature', text: 'Mode cagnotte (cashback %) + aide choix de mode' },
    { tag: 'design', text: 'Landing — section deux modes fidelite + QR/NFC bento' },
  ],
  '2026-03-06': [
    { tag: 'fix', text: 'Ajustement points stepper +/-, modal reste ouvert' },
  ],
  '2026-03-07': [
    { tag: 'fix', text: 'Audit schema DB — 5 bugs corriges (null checks, dedup visits)' },
    { tag: 'feature', text: 'Admin — passages cagnotte + reseaux sociaux' },
  ],
  '2026-03-08': [
    { tag: 'fix', text: 'Securite — auth DELETE, rate limit push, audit log' },
    { tag: 'fix', text: 'Limiter tampons palier 1 (max 15) et palier 2 (max 30)' },
  ],
  '2026-03-09': [
    { tag: 'marketing', text: 'Pages signup — tutoiement, badges reassurance, copy optimise' },
  ],
  '2026-03-10': [
    { tag: 'design', text: 'Tutoiement dans tout le dashboard merchant' },
    { tag: 'feature', text: 'Galerie photos realisations + adresse + SEO JSON-LD' },
    { tag: 'feature', text: 'Cadeau anniversaire dans la page programme' },
  ],
  '2026-03-11': [
    { tag: 'feature', text: 'Grille tampons adaptative + icone cadeau dernier tampon' },
    { tag: 'fix', text: 'Banner install PWA — delai reduit de 1h a 15min' },
    { tag: 'fix', text: 'Typage Stripe v20 + date prochain prelevement' },
  ],
  '2026-03-12': [
    { tag: 'design', text: 'Landing — repositionnement page pro + fidelite, demos /p/demo-*' },
    { tag: 'feature', text: 'Offre bienvenue + page publique /p/[slug] redesign' },
    { tag: 'design', text: 'Redesign page login client (floating cards + gradient mesh)' },
    { tag: 'marketing', text: 'Emails — mention page publique dans Welcome, FirstScan, TrialEnding' },
  ],
  '2026-03-13': [
    { tag: 'feature', text: 'Onboarding personnalisation + welcome + services enrichis' },
    { tag: 'design', text: 'Dashboard UX — sidebar branding, NFC tab, stats highlights' },
    { tag: 'feature', text: 'Offres promo — migration, API CRUD/claim, scan flow' },
    { tag: 'design', text: 'UX page publique — refonte design, reordonnancement sections' },
  ],
  '2026-03-14': [
    { tag: 'design', text: 'Page publique — mini bio, adresse Maps, glassmorphism, prestations redesign' },
    { tag: 'marketing', text: 'Admin — WhatsApp messages epures (8 marketing + 8 tuto)' },
  ],
  '2026-03-15': [
    { tag: 'design', text: 'Landing redesign — bento sections + glassmorphism pricing' },
    { tag: 'feature', text: 'Public-page — autosave + split, planning module, demo pages' },
    { tag: 'feature', text: 'Hero CTA layout fix + demo sticky' },
    { tag: 'feature', text: 'Admin merchant detail — tabs UX + optimisations' },
  ],
};
