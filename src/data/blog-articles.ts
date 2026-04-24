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
