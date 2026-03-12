export interface DemoMerchant {
  id: string;
  slug: string;
  shop_name: string;
  shop_type: string;
  shop_address: string | null;
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
  snapchat_url: string | null;
  booking_url: string | null;
  referral_program_enabled: boolean;
  referral_reward_referrer: string | null;
  referral_reward_referred: string | null;
  welcome_offer_enabled: boolean;
  welcome_offer_description: string | null;
  welcome_referral_code: string | null;
  birthday_gift_enabled: boolean;
  birthday_gift_description: string | null;
  double_days_enabled: boolean;
  double_days_of_week: number[] | null;
  scan_code: string;
}

export type DemoPhoto = { id: string; url: string; position: number };
export type DemoService = { id: string; name: string; price: number; position: number; category_id: string | null };
export type DemoServiceCategory = { id: string; name: string; position: number };

export interface DemoMerchantFull {
  merchant: DemoMerchant;
  photos: DemoPhoto[];
  services: DemoService[];
  serviceCategories: DemoServiceCategory[];
}

const SOCIAL_LINKS = {
  instagram_url: 'https://www.instagram.com/qarte.app',
  facebook_url: 'https://www.facebook.com/profile.php?id=61587048661028',
  tiktok_url: 'https://www.tiktok.com/@getqarte',
  snapchat_url: null,
};

export const DEMO_MERCHANTS: Record<string, DemoMerchantFull> = {
  'demo-onglerie': {
    merchant: {
      id: 'demo-onglerie', slug: 'demo-onglerie',
      shop_name: 'Nails & Beauty', shop_type: 'onglerie',
      shop_address: '12 rue de la Paix, Paris 2e',
      logo_url: null, primary_color: '#EC4899', secondary_color: '#F472B6',
      stamps_required: 8, reward_description: 'Une pose gel offerte',
      tier2_enabled: true, tier2_stamps_required: 15, tier2_reward_description: 'Un soin complet des mains offert',
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com',
      ...SOCIAL_LINKS,
      booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'Une pose gel offerte', referral_reward_referred: '-15% sur votre 1ère pose',
      welcome_offer_enabled: true, welcome_offer_description: '-20% sur votre première pose', welcome_referral_code: 'BIENVENUE20',
      birthday_gift_enabled: true, birthday_gift_description: 'Un nail art offert',
      double_days_enabled: true, double_days_of_week: [2, 4],
      scan_code: 'demo-onglerie',
    },
    photos: [
      { id: 'p1', url: '/images/demo/onglerie/1.jpg', position: 1 },
      { id: 'p2', url: '/images/demo/onglerie/2.jpg', position: 2 },
      { id: 'p3', url: '/images/demo/onglerie/3.jpg', position: 3 },
      { id: 'p4', url: '/images/demo/onglerie/4.jpg', position: 4 },
      { id: 'p5', url: '/images/demo/onglerie/5.jpg', position: 5 },
      { id: 'p6', url: '/images/demo/onglerie/6.jpg', position: 6 },
    ],
    serviceCategories: [
      { id: 'cat-1', name: 'Pose gel', position: 1 },
      { id: 'cat-2', name: 'Manucure', position: 2 },
      { id: 'cat-3', name: 'Nail art', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Pose complète gel', price: 45, position: 1, category_id: 'cat-1' },
      { id: 's2', name: 'Remplissage gel', price: 35, position: 2, category_id: 'cat-1' },
      { id: 's3', name: 'Dépose gel', price: 15, position: 3, category_id: 'cat-1' },
      { id: 's4', name: 'Pose gel pieds', price: 40, position: 4, category_id: 'cat-1' },
      { id: 's5', name: 'Manucure classique', price: 20, position: 5, category_id: 'cat-2' },
      { id: 's6', name: 'Manucure semi-permanent', price: 30, position: 6, category_id: 'cat-2' },
      { id: 's7', name: 'Pédicure complète', price: 35, position: 7, category_id: 'cat-2' },
      { id: 's8', name: 'Nail art simple (2 doigts)', price: 5, position: 8, category_id: 'cat-3' },
      { id: 's9', name: 'Nail art complet (10 doigts)', price: 15, position: 9, category_id: 'cat-3' },
      { id: 's10', name: 'Strass / Piercing ongle', price: 3, position: 10, category_id: 'cat-3' },
    ],
  },

  'demo-coiffure': {
    merchant: {
      id: 'demo-coiffure', slug: 'demo-coiffure',
      shop_name: 'L\'Atelier Coiffure', shop_type: 'coiffeur',
      shop_address: '8 boulevard Longchamp, Marseille 1er',
      logo_url: null, primary_color: '#8B5CF6', secondary_color: '#A78BFA',
      stamps_required: 10, reward_description: '5% sur votre cagnotte fidélité',
      tier2_enabled: true, tier2_stamps_required: 20, tier2_reward_description: '10% sur votre cagnotte fidélité',
      loyalty_mode: 'cagnotte', cagnotte_percent: 5, cagnotte_tier2_percent: 10,
      review_link: 'https://getqarte.com',
      ...SOCIAL_LINKS,
      booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: '5€ sur votre cagnotte', referral_reward_referred: '-15% sur votre 1ère visite',
      welcome_offer_enabled: true, welcome_offer_description: '-15% sur votre première coupe', welcome_referral_code: 'WELCOME15',
      birthday_gift_enabled: true, birthday_gift_description: 'Un soin profond offert',
      double_days_enabled: true, double_days_of_week: [1, 3],
      scan_code: 'demo-coiffure',
    },
    photos: [
      { id: 'p1', url: '/images/demo/coiffure/1.jpg', position: 1 },
      { id: 'p2', url: '/images/demo/coiffure/2.jpg', position: 2 },
      { id: 'p3', url: '/images/demo/coiffure/3.jpg', position: 3 },
      { id: 'p4', url: '/images/demo/coiffure/4.jpg', position: 4 },
      { id: 'p5', url: '/images/demo/coiffure/5.jpg', position: 5 },
      { id: 'p6', url: '/images/demo/coiffure/6.jpg', position: 6 },
    ],
    serviceCategories: [
      { id: 'cat-1', name: 'Coupes', position: 1 },
      { id: 'cat-2', name: 'Couleurs', position: 2 },
      { id: 'cat-3', name: 'Soins', position: 3 },
      { id: 'cat-4', name: 'Coiffage', position: 4 },
    ],
    services: [
      { id: 's1', name: 'Coupe femme', price: 45, position: 1, category_id: 'cat-1' },
      { id: 's2', name: 'Coupe homme', price: 25, position: 2, category_id: 'cat-1' },
      { id: 's3', name: 'Coupe enfant (-12 ans)', price: 18, position: 3, category_id: 'cat-1' },
      { id: 's4', name: 'Shampoing + Coupe + Brushing', price: 55, position: 4, category_id: 'cat-1' },
      { id: 's5', name: 'Coloration racines', price: 50, position: 5, category_id: 'cat-2' },
      { id: 's6', name: 'Coloration complète', price: 75, position: 6, category_id: 'cat-2' },
      { id: 's7', name: 'Balayage / Mèches', price: 90, position: 7, category_id: 'cat-2' },
      { id: 's8', name: 'Patine / Gloss', price: 35, position: 8, category_id: 'cat-2' },
      { id: 's9', name: 'Soin Kératine', price: 60, position: 9, category_id: 'cat-3' },
      { id: 's10', name: 'Soin profond hydratant', price: 25, position: 10, category_id: 'cat-3' },
      { id: 's11', name: 'Brushing', price: 30, position: 11, category_id: 'cat-4' },
      { id: 's12', name: 'Chignon / Coiffure événement', price: 65, position: 12, category_id: 'cat-4' },
    ],
  },

  'demo-tatouage': {
    merchant: {
      id: 'demo-tatouage', slug: 'demo-tatouage',
      shop_name: 'Ink Studio', shop_type: 'tatouage',
      shop_address: '45 cours Julien, Marseille 6e',
      logo_url: null, primary_color: '#1E293B', secondary_color: '#475569',
      stamps_required: 5, reward_description: 'Un tatouage flash offert',
      tier2_enabled: true, tier2_stamps_required: 10, tier2_reward_description: '-20% sur votre prochaine séance',
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com',
      ...SOCIAL_LINKS,
      booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'Un flash offert', referral_reward_referred: '-10% sur votre 1er tatouage',
      welcome_offer_enabled: true, welcome_offer_description: '-10% sur votre premier tatouage', welcome_referral_code: 'INK10',
      birthday_gift_enabled: true, birthday_gift_description: 'Un piercing offert',
      double_days_enabled: false, double_days_of_week: null,
      scan_code: 'demo-tatouage',
    },
    photos: [
      { id: 'p1', url: '/images/demo/tatouage/1.jpg', position: 1 },
      { id: 'p2', url: '/images/demo/tatouage/2.jpg', position: 2 },
      { id: 'p3', url: '/images/demo/tatouage/3.jpg', position: 3 },
      { id: 'p4', url: '/images/demo/tatouage/4.jpg', position: 4 },
      { id: 'p5', url: '/images/demo/tatouage/5.jpg', position: 5 },
      { id: 'p6', url: '/images/demo/tatouage/6.jpg', position: 6 },
    ],
    serviceCategories: [
      { id: 'cat-1', name: 'Tatouage', position: 1 },
      { id: 'cat-2', name: 'Piercing', position: 2 },
      { id: 'cat-3', name: 'Retouches', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Tatouage flash (< 5cm)', price: 80, position: 1, category_id: 'cat-1' },
      { id: 's2', name: 'Tatouage petit (5-10cm)', price: 150, position: 2, category_id: 'cat-1' },
      { id: 's3', name: 'Tatouage moyen (10-20cm)', price: 300, position: 3, category_id: 'cat-1' },
      { id: 's4', name: 'Tatouage grande pièce (demi-journée)', price: 500, position: 4, category_id: 'cat-1' },
      { id: 's5', name: 'Tatouage journée complète', price: 900, position: 5, category_id: 'cat-1' },
      { id: 's6', name: 'Piercing lobe', price: 30, position: 6, category_id: 'cat-2' },
      { id: 's7', name: 'Piercing hélix / tragus', price: 45, position: 7, category_id: 'cat-2' },
      { id: 's8', name: 'Piercing septum', price: 50, position: 8, category_id: 'cat-2' },
      { id: 's9', name: 'Piercing nez', price: 40, position: 9, category_id: 'cat-2' },
      { id: 's10', name: 'Retouche (< 3 mois)', price: 0, position: 10, category_id: 'cat-3' },
      { id: 's11', name: 'Retouche (> 3 mois)', price: 50, position: 11, category_id: 'cat-3' },
    ],
  },
};

/** Flat merchant lookup for customer card preview page (backward compat) */
export const DEMO_MERCHANTS_FLAT: Record<string, DemoMerchant> = Object.fromEntries(
  Object.entries(DEMO_MERCHANTS).map(([key, val]) => [key, val.merchant])
);

/** Check if a slug is a demo merchant */
export function isDemoSlug(slug: string): boolean {
  return slug in DEMO_MERCHANTS;
}

/** Get demo merchant data for /p/[slug] page */
export function getDemoMerchantData(slug: string): DemoMerchantFull | null {
  return DEMO_MERCHANTS[slug] || null;
}
