export const revalidate = 3600; // ISR: revalider toutes les heures

import { getSupabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProgrammeView from './ProgrammeView';
import { SHOP_TYPES } from '@/types';
import type { Metadata } from 'next';
import { isDemoSlug, getDemoMerchantData } from '@/lib/demo-merchants';
import { getTodayForCountry } from '@/lib/utils';
import DemoNav from './DemoNav';

import { cache } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getMerchantData = cache(async (slug: string, locale: string = 'fr'): Promise<{ merchant: any; photos: any[]; services: any[]; serviceCategories: any[]; planningSlots: any[]; demoOffer?: any } | null> => {
  // Demo merchants: return hardcoded data without DB query
  const demo = getDemoMerchantData(slug, locale);
  if (demo) {
    // Generate planning slots for next 5 days
    const demoSlots: { slot_date: string; start_time: string }[] = [];
    const times = ['10:00', '11:30', '14:00', '15:30', '17:00'];
    for (let d = 1; d <= 5; d++) {
      const date = new Date(Date.now() + d * 24 * 60 * 60 * 1000);
      if (date.getDay() === 0) continue; // skip Sunday
      const dateStr = date.toISOString().split('T')[0];
      // Vary slots per day to look realistic
      const daySlots = times.filter((_, i) => (d + i) % 3 !== 0);
      for (const t of daySlots) demoSlots.push({ slot_date: dateStr, start_time: t });
    }
    return { ...demo, planningSlots: demoSlots, demoOffer: demo.offer };
  }

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
      'duo_offer_enabled, duo_offer_description, ' +
      'double_days_enabled, double_days_of_week, ' +
      'booking_url, instagram_url, facebook_url, tiktok_url, snapchat_url, whatsapp_url, ' +
      'opening_hours, ' +
      'loyalty_mode, cagnotte_percent, cagnotte_tier2_percent, ' +
      'planning_enabled, planning_message, planning_message_expires, booking_message, ' +
      'auto_booking_enabled, deposit_link, deposit_percent, deposit_amount, phone, country, ' +
      'student_offer_enabled, student_offer_description, subscription_status'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!merchant) return null;

  const today = getTodayForCountry((merchant as any).country);
  const todayDate = new Date(today);
  todayDate.setDate(todayDate.getDate() + 60);
  const endDate = todayDate.toISOString().split('T')[0];

  const [photosResult, servicesResult, categoriesResult, planningResult] = await Promise.all([
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
    (merchant as any).planning_enabled
      ? supabaseAdmin
          .from('merchant_planning_slots')
          .select('slot_date, start_time')
          .eq('merchant_id', (merchant as any).id)
          .is('client_name', null)
          .gte('slot_date', today)
          .lte('slot_date', endDate)
          .order('slot_date')
          .order('start_time')
      : Promise.resolve({ data: [] }),
  ]);

  return {
    merchant,
    photos: (photosResult.data as any[]) || [],
    services: (servicesResult.data as any[]) || [],
    serviceCategories: (categoriesResult.data as any[]) || [],
    planningSlots: (planningResult.data as any[]) || [],
  };
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}): Promise<Metadata> {
  const { slug, locale } = await params;
  const result = await getMerchantData(slug, locale);
  if (!result) return {};

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';
  const { merchant, photos } = result;
  const shopLabel = SHOP_TYPES[merchant.shop_type as keyof typeof SHOP_TYPES] || '';
  const location = merchant.shop_address ? ` à ${merchant.shop_address}` : '';

  const isEN = locale === 'en';
  const title = isEN
    ? `${merchant.shop_name} — ${shopLabel || 'Salon'} | Qarte`
    : `${merchant.shop_name} — ${shopLabel || 'Salon'} | Qarte`;
  const description = isEN
    ? `${merchant.shop_name}${merchant.shop_address ? ` in ${merchant.shop_address}` : ''}. Services, photos, schedule and loyalty program.`
    : `${merchant.shop_name}${location}. ${shopLabel} — prestations, photos, horaires et programme de fidélité.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: photos[0]?.url || merchant.logo_url || undefined,
      type: 'website',
      locale: isEN ? 'en_US' : 'fr_FR',
      alternateLocale: isEN ? ['fr_FR'] : ['en_US'],
    },
    alternates: {
      canonical: `${baseUrl}${isEN ? '/en' : ''}/p/${slug}`,
    },
  };
}

export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ slug: string; locale: string }>;
}) {
  const { slug, locale } = await params;
  const result = await getMerchantData(slug, locale);

  if (!result) notFound();

  const isDemo = isDemoSlug(slug);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (
    <>
      {isDemo && <DemoNav current={slug} />}
      <ProgrammeView merchant={result.merchant as any} photos={result.photos} services={result.services} serviceCategories={result.serviceCategories} planningSlots={result.planningSlots} isDemo={isDemo} demoOffer={result.demoOffer} />
    </>
  );
}
