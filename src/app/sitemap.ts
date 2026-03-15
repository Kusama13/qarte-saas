import { MetadataRoute } from 'next';
import { getSupabaseAdmin } from '@/lib/supabase';

// Revalidate sitemap every 6 hours
export const revalidate = 21600;

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
    entry('', { priority: 1, changeFrequency: 'weekly' }),
    entry('/pricing', { priority: 0.9, changeFrequency: 'weekly' }),
    entry('/contact', { priority: 0.7, changeFrequency: 'monthly' }),
    entry('/pros', { priority: 0.8, changeFrequency: 'daily' }),
    entry('/auth/merchant/signup', { priority: 0.9, changeFrequency: 'monthly' }),
    entry('/boutique', { priority: 0.7 }),
    entry('/cgv', { priority: 0.3 }),
    entry('/mentions-legales', { priority: 0.3 }),
    entry('/politique-confidentialite', { priority: 0.3 }),
  ];

  // --- Blog pages ---
  const blogPages: MetadataRoute.Sitemap = [
    entry('/blog', { priority: 0.8, changeFrequency: 'weekly' }),
    entry('/blog/fideliser-clientes-salon-coiffure', { priority: 0.7 }),
    entry('/blog/programme-fidelite-onglerie-guide', { priority: 0.7 }),
    entry('/blog/augmenter-recurrence-client-institut-beaute', { priority: 0.7 }),
  ];

  // --- Demo pages ---
  const demoPages: MetadataRoute.Sitemap = [
    entry('/p/demo-onglerie', { priority: 0.6 }),
    entry('/p/demo-coiffure', { priority: 0.6 }),
    entry('/p/demo-tatouage', { priority: 0.6 }),
  ];

  // --- Dynamic merchant pages (public profiles) ---
  let merchantPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = getSupabaseAdmin();
    const { data: merchants } = await supabase
      .from('merchants')
      .select('slug, updated_at')
      .in('subscription_status', ['active', 'trial', 'canceling'])
      .not('slug', 'is', null);

    if (merchants) {
      merchantPages = merchants.map((m) =>
        entry(`/p/${m.slug}`, {
          priority: 0.5,
          changeFrequency: 'weekly',
          lastModified: m.updated_at ? new Date(m.updated_at) : new Date(),
        })
      );
    }
  } catch {
    // Sitemap generation should never fail — skip dynamic pages on error
  }

  return [...staticPages, ...blogPages, ...demoPages, ...merchantPages];
}
