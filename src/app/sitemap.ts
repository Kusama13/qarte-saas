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
    entry('/boutique', { priority: 0.7, lastModified: new Date('2026-03-01') }),
    entry('/cgv', { priority: 0.3, lastModified: new Date('2026-01-15') }),
    entry('/mentions-legales', { priority: 0.3, lastModified: new Date('2026-01-15') }),
    entry('/politique-confidentialite', { priority: 0.3, lastModified: new Date('2026-01-15') }),
  ];

  // --- Blog pages ---
  const blogPages: MetadataRoute.Sitemap = [
    entry('/blog', { priority: 0.8, changeFrequency: 'weekly', lastModified: new Date('2026-04-16') }),
    entry('/blog/comment-attirer-clientes-salon-beaute', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-16') }),
    entry('/blog/eviter-no-show-salon-rendez-vous', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-16') }),
    entry('/blog/logiciel-reservation-en-ligne-salon-beaute', { priority: 0.9, changeFrequency: 'monthly', lastModified: new Date('2026-04-16') }),
  ];

  // --- Demo pages (8 types x 2 modes = 16 pages) ---
  const demoSlugs = [
    'demo-onglerie', 'demo-coiffure', 'demo-tatouage', 'demo-barbier',
    'demo-institut', 'demo-spa', 'demo-estheticienne', 'demo-autre',
  ];
  const demoPages: MetadataRoute.Sitemap = demoSlugs.flatMap(slug => [
    entry(`/p/${slug}`, { priority: 0.6, lastModified: new Date('2026-04-14') }),
    entry(`/p/${slug}-libre`, { priority: 0.5, lastModified: new Date('2026-04-14') }),
  ]);

  // --- Compare pages ---
  const comparePages: MetadataRoute.Sitemap = [
    entry('/compare/planity', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-12') }),
    entry('/compare/booksy', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-12') }),
    entry('/compare/bookinbeautiful', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-04-12') }),
  ];

  // --- Alternative pages (switch intent) ---
  const alternativePages: MetadataRoute.Sitemap = [
    entry('/alternatives/planity', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-18') }),
    entry('/alternatives/booksy', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-04-18') }),
    entry('/alternatives/bookinbeautiful', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-04-18') }),
  ];

  // --- Tools / calculators ---
  const toolPages: MetadataRoute.Sitemap = [
    entry('/combien-coute-booksy', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-04-18') }),
  ];

  // Merchant pages (/p/slug) are NOT included in the sitemap.
  // Each merchant page has its own SEO identity via JSON-LD LocalBusiness
  // and should be discovered organically, not listed under getqarte.com.

  return [...staticPages, ...blogPages, ...demoPages, ...comparePages, ...alternativePages, ...toolPages];
}
