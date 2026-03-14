import { getSupabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProgrammeView from './ProgrammeView';
import { SHOP_TYPES } from '@/types';
import type { Metadata } from 'next';
import { isDemoSlug, getDemoMerchantData } from '@/lib/demo-merchants';
import DemoNav from './DemoNav';

import { cache } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMerchantData = cache(async (slug: string): Promise<{ merchant: any; photos: any[]; services: any[]; serviceCategories: any[] } | null> => {
  // Demo merchants: return hardcoded data without DB query
  const demo = getDemoMerchantData(slug);
  if (demo) return demo;

  const supabaseAdmin = getSupabaseAdmin();

  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select(
      'id, slug, shop_name, shop_type, shop_address, bio, logo_url, primary_color, secondary_color, ' +
      'stamps_required, reward_description, ' +
      'tier2_enabled, tier2_stamps_required, tier2_reward_description, ' +
      'birthday_gift_enabled, birthday_gift_description, ' +
      'referral_program_enabled, referral_reward_referrer, referral_reward_referred, ' +
      'welcome_offer_enabled, welcome_offer_description, welcome_referral_code, scan_code, ' +
      'double_days_enabled, double_days_of_week, ' +
      'booking_url, instagram_url, facebook_url, tiktok_url, snapchat_url, ' +
      'opening_hours, ' +
      'loyalty_mode, cagnotte_percent, cagnotte_tier2_percent'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!merchant) return null;

  const [photosResult, servicesResult, categoriesResult] = await Promise.all([
    supabaseAdmin
      .from('merchant_photos')
      .select('id, url, position')
      .eq('merchant_id', (merchant as any).id)
      .order('position'),
    supabaseAdmin
      .from('merchant_services')
      .select('id, name, price, position, category_id, duration, description, price_from')
      .eq('merchant_id', (merchant as any).id)
      .order('position'),
    supabaseAdmin
      .from('merchant_service_categories')
      .select('id, name, position')
      .eq('merchant_id', (merchant as any).id)
      .order('position'),
  ]);

  return {
    merchant,
    photos: (photosResult.data as any[]) || [],
    services: (servicesResult.data as any[]) || [],
    serviceCategories: (categoriesResult.data as any[]) || [],
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const result = await getMerchantData(slug);
  if (!result) return {};

  const { merchant, photos } = result;
  const shopLabel = SHOP_TYPES[merchant.shop_type as keyof typeof SHOP_TYPES] || '';
  const location = merchant.shop_address ? ` à ${merchant.shop_address}` : '';

  return {
    title: `${merchant.shop_name} — Programme de fidélité | Qarte`,
    description: `Découvrez le programme de fidélité de ${merchant.shop_name}${location}. ${shopLabel} — carte digitale, récompenses et avantages.`,
    openGraph: {
      title: `${merchant.shop_name} — Programme de fidélité`,
      description: `${shopLabel}${location} — carte de fidélité digitale, récompenses et avantages exclusifs.`,
      images: photos[0]?.url || merchant.logo_url || undefined,
      type: 'website',
    },
  };
}

export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getMerchantData(slug);

  if (!result) notFound();

  const isDemo = isDemoSlug(slug);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <>
      {isDemo && <DemoNav current={slug} />}
      <ProgrammeView merchant={result.merchant as any} photos={result.photos} services={result.services} serviceCategories={result.serviceCategories} isDemo={isDemo} />
    </>
  );
}
