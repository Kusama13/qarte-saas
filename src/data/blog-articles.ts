export interface BlogArticle {
  slug: string;
  title: string;
  description: string;
  readTime: string;
  category: string;
  date: string;
  image: string;
}

/**
 * Registre centralise des articles de blog.
 * - Source de verite unique : page /blog ET cron blog-digest lisent d'ici.
 * - Nouveaux articles : rajouter une entree (avec fichier /blog/[slug]/page.tsx).
 * - L'ordre du tableau ne compte pas ; filtrage/tri par `date` (YYYY-MM-DD).
 */
export const BLOG_ARTICLES: BlogArticle[] = [
  {
    slug: 'instagram-salon-de-beaute',
    title: 'Instagram pour salon de beauté : transformer tes abonnées en clientes',
    description:
      'Instagram pour salon de beauté : la méthode pour transformer tes abonnées en vraies clientes. 7 idées de contenu, le bon lien en bio, et comment convertir un like en rendez-vous.',
    readTime: '9 min',
    category: 'Réseaux sociaux',
    date: '2026-06-03',
    image: '/blog/social/article-11-cover.png',
  },
  {
    slug: 'augmenter-chiffre-affaires-salon-beaute',
    title: 'Augmenter le chiffre d\'affaires de son salon de beauté : 7 idées qui marchent vraiment',
    description:
      'Augmenter le CA de ton salon de beauté en 2026 : 7 leviers testés (fidélisation, no-show, bons cadeaux, panier moyen). Chiffres et plan d\'action.',
    readTime: '12 min',
    category: 'Croissance',
    date: '2026-05-27',
    image: '/blog/social/article-9-cover.png',
  },
  {
    slug: 'carte-fidelite-dematerialisee-salon-beaute',
    title: 'Carte de fidélité dématérialisée pour salon de beauté : pourquoi passer au digital en 2026',
    description:
      'Carte de fidélité dématérialisée salon : pourquoi tes cartes papier perdent 47 % de retours. Comparatif, prix, parcours cliente en 3 étapes.',
    readTime: '8 min',
    category: 'Fidélisation',
    date: '2026-05-27',
    image: '/blog/social/article-8-cover.png',
  },
  {
    slug: 'service-domicile-salon-beaute-rayon-trajets',
    title: 'Service à domicile : comment caler tes RDV sans courir d\'une cliente à l\'autre',
    description:
      'Rayon d\'intervention configurable, calcul auto des trajets entre RDV, message hors-zone, adresse perso masquée : tout ce que Qarte fait pour les pros mobiles (esthéticiennes, prothésistes ongulaires, coiffeuses à domicile).',
    readTime: '5 min',
    category: 'Service à domicile',
    date: '2026-05-22',
    image: '/blog/social/article-7-cover.png',
  },
  {
    slug: 'acompte-rdv-salon-sans-commission',
    title: 'Acompte salon : pourquoi tu perds 0,72€ sur chaque RDV (et comment encaisser 100% direct sur ton compte)',
    description:
      'Planity prélève 1,80%, Booksy 2,49%, Treatwell jusqu\'à 25% sur tes acomptes. Découvre comment encaisser 100% en 24h via ton lien Revolut, PayPal ou SumUp. 0€ commission Qarte.',
    readTime: '6 min',
    category: 'Argent & commissions',
    date: '2026-05-08',
    image: '/blog/social/article-10-cover.png',
  },
  {
    slug: 'comment-attirer-clientes-salon-beaute',
    title: 'Comment attirer plus de clientes dans son salon de beauté : 12 stratégies qui marchent en 2026',
    description:
      '70 % des nouvelles clientes ne reviennent pas. Google Business, réservation en ligne, Instagram, parrainage, fidélité : les 12 leviers concrets pour remplir ton agenda salon, institut ou onglerie.',
    readTime: '10 min',
    category: 'Acquisition',
    date: '2026-04-16',
    image: '/blog/social/article-4-cover.png',
  },
  {
    slug: 'eviter-no-show-salon-rendez-vous',
    title: 'No-show en salon de beauté : comment éviter les rendez-vous manqués en 2026',
    description:
      'Un no-show coûte entre 35 et 80 € à un salon. La méthode complète en 6 étapes pour diviser par 4 les rendez-vous manqués : acompte, SMS de rappel, politique d\'annulation, liste d\'attente.',
    readTime: '8 min',
    category: 'Gestion',
    date: '2026-04-16',
    image: '/blog/social/article-5-cover.png',
  },
  {
    slug: 'logiciel-reservation-en-ligne-salon-beaute',
    title: 'Logiciel de réservation en ligne pour salon de beauté : le comparatif 2026',
    description:
      'Planity, Treatwell, Booksy, Qarte : comparatif honnête des 4 logiciels qui dominent le marché. Tarifs, commissions cachées, fonctionnalités, pour quel type de salon.',
    readTime: '9 min',
    category: 'Outils',
    date: '2026-04-16',
    image: '/blog/social/article-6-cover.png',
  },
  {
    slug: 'clients-planity-booksy-ne-reviennent-jamais',
    title: 'Planity, Booksy, Treatwell : ces clientes qui réservent et ne reviennent jamais',
    description:
      'Les clientes venues de Planity, Booksy ou Treatwell ne te cherchaient pas — elles cherchaient un créneau. Voici la vraie source de clientes fidèles et comment les garder sans payer de commission.',
    readTime: '5 min',
    category: 'Fidélisation',
    date: '2026-04-23',
    image: '/blog/social/article-1-cover.png',
  },
  {
    slug: 'ne-pas-mettre-lien-planity-bio-instagram',
    title: 'Lien Planity en bio Instagram : l\'erreur qui envoie tes clientes chez la concurrente',
    description:
      'Mettre ton lien Planity, Booksy ou Treatwell en bio Instagram, c\'est envoyer tes abonnées chez la concurrente. Voici pourquoi — et ce qu\'il faut mettre à la place.',
    readTime: '5 min',
    category: 'Stratégie',
    date: '2026-04-26',
    image: '/blog/social/article-2-cover.png',
  },
  {
    slug: 'avis-planity-booksy-ne-tappartiennent-pas',
    title: 'Tes avis sur Planity, Booksy et Treatwell ne t\'appartiennent pas — et c\'est dangereux',
    description:
      'Tes avis sur Planity ou Booksy disparaissent le jour où tu pars ou te fais déprioritiser. Seuls les avis Google t\'appartiennent vraiment. Comment les collecter automatiquement après chaque visite.',
    readTime: '5 min',
    category: 'Réputation',
    date: '2026-04-29',
    image: '/blog/social/article-3-cover.png',
  },
];
