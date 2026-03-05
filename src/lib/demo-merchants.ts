export interface DemoMerchant {
  id: string;
  shop_name: string;
  shop_type: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  stamps_required: number;
  reward_description: string;
  tier2_enabled: boolean;
  tier2_stamps_required: number | null;
  tier2_reward_description: string | null;
  loyalty_mode: string;
  cagnotte_percent: number | null;
  cagnotte_tier2_percent: number | null;
  review_link: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  booking_url: string | null;
  referral_program_enabled: boolean;
  referral_reward_referrer: string | null;
  referral_reward_referred: string | null;
  scan_code: string;
}

export const DEMO_MERCHANTS: Record<string, DemoMerchant> = {
  'demo-onglerie': {
    id: 'demo-onglerie', shop_name: 'Nails & Beauty', shop_type: 'onglerie',
    logo_url: null, primary_color: '#EC4899', secondary_color: '#F472B6',
    stamps_required: 8, reward_description: 'Une pose gel offerte',
    tier2_enabled: true, tier2_stamps_required: 15, tier2_reward_description: 'Un soin complet des mains offert',
    loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
    review_link: 'https://getqarte.com',
    instagram_url: 'https://www.instagram.com/qarte.app', facebook_url: 'https://www.facebook.com/profile.php?id=61587048661028', tiktok_url: 'https://www.tiktok.com/@getqarte',
    booking_url: 'https://getqarte.com',
    referral_program_enabled: true, referral_reward_referrer: 'Une pose gel offerte', referral_reward_referred: '-15% sur votre 1ère pose',
    scan_code: 'demo-onglerie',
  },
  'demo-barbier': {
    id: 'demo-barbier', shop_name: 'Chez Marco', shop_type: 'barbier',
    logo_url: null, primary_color: '#059669', secondary_color: '#10B981',
    stamps_required: 10, reward_description: '5% sur votre cagnotte fidélité',
    tier2_enabled: true, tier2_stamps_required: 20, tier2_reward_description: '10% sur votre cagnotte fidélité',
    loyalty_mode: 'cagnotte', cagnotte_percent: 5, cagnotte_tier2_percent: 10,
    review_link: 'https://getqarte.com',
    instagram_url: 'https://www.instagram.com/qarte.app', facebook_url: 'https://www.facebook.com/profile.php?id=61587048661028', tiktok_url: 'https://www.tiktok.com/@getqarte',
    booking_url: 'https://getqarte.com',
    referral_program_enabled: true, referral_reward_referrer: 'Une coupe offerte', referral_reward_referred: '-20% sur votre 1ère coupe',
    scan_code: 'demo-barbier',
  },
};
