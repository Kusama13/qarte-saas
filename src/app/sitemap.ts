import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

  // Helper: generate entry (FR only — EN disabled via 301 redirect)
  const entry = (
    path: string,
    opts: { priority?: number; changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']; lastModified?: Date } = {}
  ): MetadataRoute.Sitemap[number] => ({
    url: `${baseUrl}${path}`,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency ?? 'monthly',
    priority: opts.priority ?? 0.7,
  });

  // --- Static pages ---
  const staticPages: MetadataRoute.Sitemap = [
    entry('', { priority: 1, changeFrequency: 'weekly', lastModified: new Date('2026-04-19') }),
    entry('/pricing', { priority: 0.9, changeFrequency: 'weekly', lastModified: new Date('2026-03-15') }),
    entry('/ambassadeur', { priority: 0.6, changeFrequency: 'monthly', lastModified: new Date('2026-04-12') }),
    entry('/contact', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-03-01') }),
    entry('/pros', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-03-15') }),
    entry('/exemples', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-05-29') }),
    entry('/boutique', { priority: 0.7, lastModified: new Date('2026-03-01') }),
    entry('/cgv', { priority: 0.3, lastModified: new Date('2026-01-15') }),
    entry('/mentions-legales', { priority: 0.3, lastModified: new Date('2026-01-15') }),
    entry('/politique-confidentialite', { priority: 0.3, lastModified: new Date('2026-01-15') }),
  ];

  // --- Blog pages ---
  const blogPages: MetadataRoute.Sitemap = [
    entry('/blog', { priority: 0.8, changeFrequency: 'weekly', lastModified: new Date('2026-07-24') }),
    entry('/blog/remplir-agenda-septembre-salon-beaute', { priority: 0.9, changeFrequency: 'monthly', lastModified: new Date('2026-07-24') }),
    entry('/blog/faire-revenir-clientes-prochain-rdv-salon', { priority: 0.9, changeFrequency: 'monthly', lastModified: new Date('2026-06-17') }),
    entry('/blog/beauty-profs-2026-salon-beaute-marseille', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-06-03') }),
    entry('/blog/instagram-salon-de-beaute', { priority: 0.9, changeFrequency: 'monthly', lastModified: new Date('2026-06-03') }),
    entry('/blog/augmenter-chiffre-affaires-salon-beaute', { priority: 0.9, changeFrequency: 'monthly', lastModified: new Date('2026-05-27') }),
    entry('/blog/carte-fidelite-dematerialisee-salon-beaute', { priority: 0.9, changeFrequency: 'monthly', lastModified: new Date('2026-05-27') }),
    entry('/blog/service-domicile-salon-beaute-rayon-trajets', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-05-22') }),
    entry('/blog/acompte-rdv-salon-sans-commission', { priority: 0.9, changeFrequency: 'monthly', lastModified: new Date('2026-05-08') }),
    entry('/blog/avis-planity-booksy-ne-tappartiennent-pas', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-04-29') }),
    entry('/blog/ne-pas-mettre-lien-planity-bio-instagram', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-04-26') }),
    entry('/blog/clients-planity-booksy-ne-reviennent-jamais', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-04-23') }),
    entry('/blog/comment-attirer-clientes-salon-beaute', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-16') }),
    entry('/blog/eviter-no-show-salon-rendez-vous', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-16') }),
    entry('/blog/logiciel-reservation-en-ligne-salon-beaute', { priority: 0.9, changeFrequency: 'monthly', lastModified: new Date('2026-04-16') }),
  ];

  // Pages démo (`/p/demo-*`) volontairement absentes du sitemap.
  // Elles polluaient les SERPs "qarte" — désormais noindex côté generateMetadata
  // de /p/[slug]/page.tsx (cf. isDemoSlug check).

  // --- Compare pages ---
  const comparePages: MetadataRoute.Sitemap = [
    entry('/compare/planity', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-12') }),
    entry('/compare/booksy', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-12') }),
    entry('/compare/bookinbeautiful', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-04-12') }),
    entry('/compare/treatwell', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-06-03') }),
    entry('/compare/fresha', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-06-03') }),
  ];

  // --- Alternative pages (switch intent) ---
  const alternativePages: MetadataRoute.Sitemap = [
    entry('/alternatives/planity', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-18') }),
    entry('/alternatives/booksy', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-18') }),
    entry('/alternatives/bookinbeautiful', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-04-18') }),
    entry('/alternatives/treatwell', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-06-03') }),
    entry('/alternatives/fresha', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-06-03') }),
  ];

  // --- Tools / calculators ---
  const toolPages: MetadataRoute.Sitemap = [
    entry('/combien-coute-booksy', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-04-18') }),
  ];

  // Merchant pages (/p/slug) are NOT included in the sitemap.
  // Each merchant page has its own SEO identity via JSON-LD LocalBusiness
  // and should be discovered organically, not listed under getqarte.com.

  return [...staticPages, ...blogPages, ...comparePages, ...alternativePages, ...toolPages];
}
