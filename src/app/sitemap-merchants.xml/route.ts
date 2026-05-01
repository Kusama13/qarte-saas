import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

// Sitemap secondaire pour les pages marchand. **Non déclaré dans robots.txt**
// (volontaire) : on le soumet manuellement à Google Search Console pour que
// les URLs `/p/[slug]` soient découvertes/indexées sans polluer la SERP "qarte"
// brandée (le sitemap principal `/sitemap.xml` ne contient que les pages produit).
//
// On exclut les marchands trop pauvres ou inactifs (cohérent avec les noindex
// ajoutés dans /p/[slug]/page.tsx) — inutile de soumettre à Google des URLs
// qu'on lui a dit de ne pas indexer.
export const revalidate = 3600; // 1h

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';
  const supabaseAdmin = getSupabaseAdmin();

  const { data: merchants, error } = await supabaseAdmin
    .from('merchants')
    .select('slug, updated_at, subscription_status, trial_ends_at')
    .is('deleted_at', null)
    .not('slug', 'is', null);

  if (error || !merchants) {
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  const now = new Date();
  const eligible = merchants.filter(m => {
    if (m.subscription_status === 'canceled') return false;
    if (m.subscription_status === 'trial' && m.trial_ends_at && new Date(m.trial_ends_at) < now) return false;
    return true;
  });

  const urls = eligible.map(m => {
    const lastmod = m.updated_at ? new Date(m.updated_at).toISOString() : new Date().toISOString();
    return `  <url>\n    <loc>${baseUrl}/p/${m.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
