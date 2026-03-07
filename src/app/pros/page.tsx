import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';
import { getSupabaseAdmin } from '@/lib/supabase';
import { FooterSection, ScrollToTopButton } from '@/components/landing';
import ClientShell from '@/components/landing/ClientShell';
import LandingNav from '@/components/landing/LandingNav';
import InspirationGrid, { type InspirationMerchant } from './InspirationGrid';

export const metadata: Metadata = {
  title: 'Ils fidélisent avec Qarte',
  description:
    'Découvrez les salons de coiffure, instituts de beauté et ongleries qui utilisent Qarte pour fidéliser leurs clients. Rejoignez-les.',
  openGraph: {
    title: 'Ils fidélisent avec Qarte',
    description:
      'Découvrez les pros de la beauté qui fidélisent avec Qarte. Rejoignez la communauté.',
    url: 'https://getqarte.com/pros',
  },
};

const getInspirationMerchants = unstable_cache(
  async (): Promise<InspirationMerchant[]> => {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Exclure admins (parallélisé avec la query merchants)
    const [{ data: admins }, baseQuery] = await Promise.all([
      supabaseAdmin.from('super_admins').select('user_id'),
      supabaseAdmin
        .from('merchants')
        .select(
          'slug, shop_name, shop_type, logo_url, primary_color, secondary_color, ' +
          'reward_description, instagram_url, facebook_url, tiktok_url, snapchat_url, user_id, subscription_status, created_at'
        )
        .not('logo_url', 'is', null)
        .not('reward_description', 'is', null)
        .neq('reward_description', '')
        .in('subscription_status', ['active', 'trial'])
        .or('instagram_url.not.is.null,facebook_url.not.is.null,tiktok_url.not.is.null,snapchat_url.not.is.null'),
    ]);

    const adminIds = (admins || []).map((a: { user_id: string }) => a.user_id);
    let merchants = (baseQuery.data ?? []) as unknown as (InspirationMerchant & { user_id: string; subscription_status: string; created_at: string })[];
    if (!merchants.length) return [];

    // 2. Exclure admins côté JS (le filtre NOT IN nécessite les adminIds)
    if (adminIds.length > 0) {
      const adminSet = new Set(adminIds);
      merchants = merchants.filter((m) => !adminSet.has(m.user_id));
    }

    // 3. Exclure merchants inscrits depuis moins de 3 jours
    const threeDaysAgo = Date.now() - 3 * 24 * 60 * 60 * 1000;
    merchants = merchants.filter((m) => new Date(m.created_at).getTime() <= threeDaysAgo);

    // 4. Scorer et trier
    return merchants
      .map(({ user_id: _uid, subscription_status, created_at: _ca, ...rest }) => {
        // Score de complétude
        let score = 0;
        if (rest.logo_url) score++;
        if (rest.reward_description) score++;
        if (rest.instagram_url) score++;
        if (rest.facebook_url) score++;
        if (rest.tiktok_url) score++;
        if (rest.secondary_color && rest.secondary_color !== rest.primary_color) score++;
        return {
          ...(rest as InspirationMerchant),
          _score: score,
          _isActive: subscription_status === 'active',
        };
      })
      // Actifs d'abord, puis par score décroissant
      .sort((a, b) => {
        if (a._isActive !== b._isActive) return a._isActive ? -1 : 1;
        return b._score - a._score;
      })
      .map(({ _score: _s, _isActive: _a, ...rest }) => rest);
  },
  ['inspiration-merchants'],
  { revalidate: 259200 }
);

export default async function InspirationPage() {
  const merchants = await getInspirationMerchants();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <ClientShell />
      <LandingNav minimal />

      {/* Hero — offset for fixed banner (36px) + navbar (64px) */}
      <section className="px-4 pt-[140px] pb-10 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4 leading-tight">
          Aperçu de quelques pros sur Qarte.
          <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">
            Fidélisez aussi vos clients.
          </span>
        </h1>
      </section>

      {/* Grille */}
      <InspirationGrid merchants={merchants} />

      <FooterSection />
      <ScrollToTopButton />
    </div>
  );
}
