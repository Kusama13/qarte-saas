import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

  // Helper: generate entry with FR/EN alternates
  const entry = (
    path: string,
    opts: { priority?: number; changeFrequency?: MetadataRoute.Sitemap[number]['changeFrequency']; lastModified?: Date } = {}
  ): MetadataRoute.Sitemap[number] => ({
    url: `${baseUrl}${path}`,
    lastModified: opts.lastModified ?? new Date(),
    changeFrequency: opts.changeFrequency ?? 'monthly',
    priority: opts.priority ?? 0.7,
    alternates: {
      languages: {
        fr: `${baseUrl}${path}`,
        en: `${baseUrl}/en${path}`,
      },
    },
  });

  // --- Static pages ---
  const staticPages: MetadataRoute.Sitemap = [
    entry('', { priority: 1, changeFrequency: 'weekly', lastModified: new Date('2026-04-01') }),
    entry('/pricing', { priority: 0.9, changeFrequency: 'weekly', lastModified: new Date('2026-03-15') }),
    entry('/contact', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-03-01') }),
    entry('/pros', { priority: 0.8, changeFrequency: 'monthly', lastModified: new Date('2026-03-15') }),
    entry('/boutique', { priority: 0.7, lastModified: new Date('2026-03-01') }),
    entry('/cgv', { priority: 0.3, lastModified: new Date('2026-01-15') }),
    entry('/mentions-legales', { priority: 0.3, lastModified: new Date('2026-01-15') }),
    entry('/politique-confidentialite', { priority: 0.3, lastModified: new Date('2026-01-15') }),
  ];

  // --- Blog pages ---
  const blogPages: MetadataRoute.Sitemap = [
    entry('/blog', { priority: 0.8, changeFrequency: 'weekly', lastModified: new Date('2026-03-20') }),
    entry('/blog/fideliser-clientes-salon-coiffure', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-02-15') }),
    entry('/blog/programme-fidelite-onglerie-guide', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-02-20') }),
    entry('/blog/augmenter-recurrence-client-institut-beaute', { priority: 0.7, changeFrequency: 'monthly', lastModified: new Date('2026-03-01') }),
  ];

  // --- Demo pages ---
  const demoPages: MetadataRoute.Sitemap = [
    entry('/p/demo-onglerie', { priority: 0.6, lastModified: new Date('2026-03-15') }),
    entry('/p/demo-coiffure', { priority: 0.6, lastModified: new Date('2026-03-15') }),
    entry('/p/demo-tatouage', { priority: 0.6, lastModified: new Date('2026-03-15') }),
  ];

  // Merchant pages (/p/slug) are NOT included in the sitemap.
  // Each merchant page has its own SEO identity via JSON-LD LocalBusiness
  // and should be discovered organically, not listed under getqarte.com.

  return [...staticPages, ...blogPages, ...demoPages];
}
