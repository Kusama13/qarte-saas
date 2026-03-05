import { getSupabaseAdmin } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import ProgrammeView from './ProgrammeView';

export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabaseAdmin = getSupabaseAdmin();

  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select(
      'id, shop_name, logo_url, primary_color, secondary_color, ' +
      'stamps_required, reward_description, ' +
      'tier2_enabled, tier2_stamps_required, tier2_reward_description, ' +
      'birthday_gift_enabled, birthday_gift_description, ' +
      'referral_program_enabled, referral_reward_referrer, referral_reward_referred, ' +
      'double_days_enabled, double_days_of_week, ' +
      'booking_url, instagram_url, facebook_url, tiktok_url, ' +
      'loyalty_mode, cagnotte_percent, cagnotte_tier2_percent'
    )
    .eq('slug', slug)
    .maybeSingle();

  if (!merchant) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <ProgrammeView merchant={merchant as any} />;
}
