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
  duo_offer_enabled: boolean;
  duo_offer_description: string | null;
  student_offer_enabled: boolean;
  student_offer_description: string | null;
  contest_enabled: boolean;
  contest_prize: string | null;
  double_days_enabled: boolean;
  double_days_of_week: number[] | null;
  booking_mode: 'slots' | 'free' | null;
  scan_code: string;
  bio: string | null;
  opening_hours: Record<string, { open: string; close: string } | null> | null;
  phone: string | null;
  planning_enabled: boolean;
  planning_message: string | null;
  planning_message_expires: string | null;
  booking_message: string | null;
  auto_booking_enabled: boolean;
  deposit_link: string | null;
  deposit_percent: number | null;
  deposit_amount: number | null;
  country: string;
  subscription_status: string | null;
  whatsapp_url: string | null;
  buffer_minutes: number;
  allow_customer_cancel: boolean;
  allow_customer_reschedule: boolean;
  cancel_deadline_days: number;
  reschedule_deadline_days: number;
}

export type DemoPhoto = { id: string; url: string; position: number };
export type DemoService = { id: string; name: string; price: number; position: number; category_id: string | null; duration: number | null; description: string | null; price_from: boolean };
export type DemoServiceCategory = { id: string; name: string; position: number };
export type DemoOffer = { id: string; title: string; description: string; expires_at: string | null };

// Fields added by withDefaultsAndVariants — not required in raw data
type AutoFields = 'subscription_status' | 'whatsapp_url' | 'buffer_minutes' | 'allow_customer_cancel' | 'allow_customer_reschedule' | 'cancel_deadline_days' | 'reschedule_deadline_days';
type DemoMerchantRaw = Omit<DemoMerchant, AutoFields>;

export interface DemoMerchantFull {
  merchant: DemoMerchant;
  photos: DemoPhoto[];
  services: DemoService[];
  serviceCategories: DemoServiceCategory[];
  offer: DemoOffer | null;
}

interface DemoMerchantFullRaw {
  merchant: DemoMerchantRaw;
  photos: DemoPhoto[];
  services: DemoService[];
  serviceCategories: DemoServiceCategory[];
  offer: DemoOffer | null;
}

const SOCIAL_LINKS = {
  instagram_url: 'https://www.instagram.com/qarte.app',
  facebook_url: 'https://www.facebook.com/profile.php?id=61587048661028',
  tiktok_url: 'https://www.tiktok.com/@getqarte',
  snapchat_url: null,
};

// Common fields shared by all demo merchants
const COMMON_DEFAULTS = {
  subscription_status: 'active' as string | null,
  whatsapp_url: null,
  buffer_minutes: 15,
  allow_customer_cancel: true,
  allow_customer_reschedule: true,
  cancel_deadline_days: 1,
  reschedule_deadline_days: 1,
};

// Ensure all features are enabled for demo showcasing
const FEATURE_DEFAULTS: Record<string, Partial<DemoMerchant>> = {
  coiffeur:         { student_offer_description: '-15% etudiants',     contest_prize: 'Un balayage offert',              duo_offer_description: '-20% pour les deux',   double_days_of_week: [1, 3] },
  barbier:          { student_offer_description: '-15% etudiants',     contest_prize: 'Une coupe + barbe offerte',       duo_offer_description: '-15% pour les deux',   double_days_of_week: [2, 5] },
  institut_beaute:  { student_offer_description: '-15% etudiantes',    contest_prize: 'Un soin visage complet offert',   duo_offer_description: '-15% pour les deux',   double_days_of_week: [1, 4] },
  onglerie:         { student_offer_description: '-15% etudiantes',    contest_prize: 'Une pose gel offerte',            duo_offer_description: '-20% pour les deux',   double_days_of_week: [2, 4] },
  spa:              { student_offer_description: '-10% etudiants',     contest_prize: 'Un forfait detente offert',       duo_offer_description: '-25% duo detente',     double_days_of_week: [1, 3] },
  estheticienne:    { student_offer_description: '-10% etudiantes',    contest_prize: 'Un rehaussement cils offert',     duo_offer_description: '-15% pour les deux',   double_days_of_week: [2, 5] },
  tatouage:         { student_offer_description: '-10% etudiants',     contest_prize: 'Un flash tattoo offert',          duo_offer_description: '-20% pour les deux',   double_days_of_week: [3, 5] },
  autre:            { student_offer_description: '-15% etudiants',     contest_prize: 'Une seance offerte',              duo_offer_description: '-20% pour les deux',   double_days_of_week: [1, 4] },
};

// EN equivalents
const FEATURE_DEFAULTS_EN: Record<string, Partial<DemoMerchant>> = {
  coiffeur:         { student_offer_description: '15% off students',   contest_prize: 'A free balayage',                duo_offer_description: '20% off for both',     double_days_of_week: [1, 3] },
  barbier:          { student_offer_description: '15% off students',   contest_prize: 'A free cut + beard trim',        duo_offer_description: '15% off for both',     double_days_of_week: [2, 5] },
  institut_beaute:  { student_offer_description: '15% off students',   contest_prize: 'A free full facial',             duo_offer_description: '15% off for both',     double_days_of_week: [1, 4] },
  onglerie:         { student_offer_description: '15% off students',   contest_prize: 'A free full gel set',            duo_offer_description: '20% off for both',     double_days_of_week: [2, 4] },
  spa:              { student_offer_description: '10% off students',   contest_prize: 'A full relaxation package',      duo_offer_description: '25% off duo relaxation', double_days_of_week: [1, 3] },
  estheticienne:    { student_offer_description: '10% off students',   contest_prize: 'A free lash lift',               duo_offer_description: '15% off for both',     double_days_of_week: [2, 5] },
  tatouage:         { student_offer_description: '10% off students',   contest_prize: 'A free flash tattoo',            duo_offer_description: '20% off for both',     double_days_of_week: [3, 5] },
  autre:            { student_offer_description: '15% off students',   contest_prize: 'A free session',                 duo_offer_description: '20% off for both',     double_days_of_week: [1, 4] },
};

/** Patch all merchants in a locale map with common defaults + enable all features + create -libre variants */
function withDefaultsAndVariants(merchants: Record<string, DemoMerchantFullRaw>, isEN = false): Record<string, DemoMerchantFull> {
  const result: Record<string, DemoMerchantFull> = {};
  const featureMap = isEN ? FEATURE_DEFAULTS_EN : FEATURE_DEFAULTS;
  for (const [slug, entry] of Object.entries(merchants)) {
    const m = entry.merchant;
    const feat = featureMap[m.shop_type] || {};
    // Force-enable all avantages with fallback descriptions
    const allFeatures: Partial<DemoMerchant> = {
      birthday_gift_enabled: true,
      birthday_gift_description: m.birthday_gift_description || (isEN ? 'A surprise gift' : 'Un cadeau surprise'),
      referral_program_enabled: true,
      referral_reward_referrer: m.referral_reward_referrer || (isEN ? 'A free session' : 'Une seance offerte'),
      referral_reward_referred: m.referral_reward_referred || (isEN ? '15% off your first visit' : '-15% sur votre 1re visite'),
      welcome_offer_enabled: true,
      welcome_offer_description: m.welcome_offer_description || (isEN ? '15% off your first visit' : '-15% sur votre 1re visite'),
      duo_offer_enabled: true,
      duo_offer_description: m.duo_offer_description || feat.duo_offer_description,
      student_offer_enabled: true,
      student_offer_description: m.student_offer_description || feat.student_offer_description,
      contest_enabled: true,
      contest_prize: m.contest_prize || feat.contest_prize,
      double_days_enabled: true,
      double_days_of_week: m.double_days_of_week || feat.double_days_of_week,
    };
    // Créneaux version
    const slotsM = { ...m, ...COMMON_DEFAULTS, ...allFeatures, planning_enabled: true, auto_booking_enabled: true, booking_mode: 'slots' as const };
    result[slug] = { ...entry, merchant: slotsM };
    // Mode libre version
    const libreSlug = `${slug}-libre`;
    const libreM = { ...slotsM, id: libreSlug, slug: libreSlug, scan_code: libreSlug, booking_mode: 'free' as const };
    result[libreSlug] = { ...entry, merchant: libreM };
  }
  return result;
}

// ── Photos (shared across locales — same images) ─────────────────────────────

const PHOTOS_ONGLERIE: DemoPhoto[] = [
  { id: 'p1', url: '/images/demo/onglerie/1.jpg', position: 1 },
  { id: 'p2', url: '/images/demo/onglerie/2.jpg', position: 2 },
  { id: 'p3', url: '/images/demo/onglerie/3.jpg', position: 3 },
  { id: 'p4', url: '/images/demo/onglerie/4.jpg', position: 4 },
  { id: 'p5', url: '/images/demo/onglerie/5.jpg', position: 5 },
  { id: 'p6', url: '/images/demo/onglerie/6.jpg', position: 6 },
];

const PHOTOS_COIFFURE: DemoPhoto[] = [
  { id: 'p1', url: '/images/demo/coiffure/1.jpg', position: 1 },
  { id: 'p2', url: '/images/demo/coiffure/2.jpg', position: 2 },
  { id: 'p3', url: '/images/demo/coiffure/3.jpg', position: 3 },
  { id: 'p4', url: '/images/demo/coiffure/4.jpg', position: 4 },
  { id: 'p5', url: '/images/demo/coiffure/5.jpg', position: 5 },
  { id: 'p6', url: '/images/demo/coiffure/6.jpg', position: 6 },
];

const PHOTOS_TATOUAGE: DemoPhoto[] = [
  { id: 'p1', url: '/images/demo/tatouage/1.jpg', position: 1 },
  { id: 'p2', url: '/images/demo/tatouage/2.jpg', position: 2 },
  { id: 'p3', url: '/images/demo/tatouage/3.jpg', position: 3 },
  { id: 'p4', url: '/images/demo/tatouage/4.jpg', position: 4 },
  { id: 'p5', url: '/images/demo/tatouage/5.jpg', position: 5 },
  { id: 'p6', url: '/images/demo/tatouage/6.jpg', position: 6 },
];

// ── FR data ──────────────────────────────────────────────────────────────────

const DEMO_MERCHANTS_FR: Record<string, DemoMerchantFullRaw> = {
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
      duo_offer_enabled: true, duo_offer_description: '-20% pour les deux',
      student_offer_enabled: true, student_offer_description: '-15% sur présentation de la carte étudiante',
      contest_enabled: true, contest_prize: 'Une pose gel complète offerte',
      double_days_enabled: true, double_days_of_week: [2, 4],
      booking_mode: 'slots',
      scan_code: 'demo-onglerie',
      bio: 'Nail artist passionnée, spécialisée en baby boomer et nail art 3D. Sur rdv uniquement.',
      opening_hours: { '1': { open: '10:00', close: '19:00' }, '2': { open: '10:00', close: '19:00' }, '3': { open: '10:00', close: '19:00' }, '4': { open: '10:00', close: '20:00' }, '5': { open: '10:00', close: '20:00' }, '6': { open: '09:00', close: '17:00' }, '7': null },
      phone: null, planning_enabled: true, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null,      country: 'FR',
    },
    offer: { id: 'offer-onglerie', title: 'Offre de printemps', description: '-15% sur toutes les poses gel', expires_at: null },
    photos: PHOTOS_ONGLERIE,
    serviceCategories: [
      { id: 'cat-1', name: 'Pose gel', position: 1 },
      { id: 'cat-2', name: 'Manucure', position: 2 },
      { id: 'cat-3', name: 'Nail art', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Pose complète gel', price: 45, position: 1, category_id: 'cat-1', duration: 120, description: null, price_from: false },
      { id: 's2', name: 'Remplissage gel', price: 35, position: 2, category_id: 'cat-1', duration: 90, description: null, price_from: false },
      { id: 's3', name: 'Dépose gel', price: 15, position: 3, category_id: 'cat-1', duration: 30, description: null, price_from: false },
      { id: 's4', name: 'Pose gel pieds', price: 40, position: 4, category_id: 'cat-1', duration: 90, description: null, price_from: false },
      { id: 's5', name: 'Manucure classique', price: 20, position: 5, category_id: 'cat-2', duration: 30, description: null, price_from: false },
      { id: 's6', name: 'Manucure semi-permanent', price: 30, position: 6, category_id: 'cat-2', duration: 45, description: null, price_from: false },
      { id: 's7', name: 'Pédicure complète', price: 35, position: 7, category_id: 'cat-2', duration: 45, description: null, price_from: false },
      { id: 's8', name: 'Nail art simple (2 doigts)', price: 5, position: 8, category_id: 'cat-3', duration: 15, description: null, price_from: false },
      { id: 's9', name: 'Nail art complet (10 doigts)', price: 15, position: 9, category_id: 'cat-3', duration: 30, description: null, price_from: false },
      { id: 's10', name: 'Strass / Piercing ongle', price: 3, position: 10, category_id: 'cat-3', duration: 10, description: null, price_from: false },
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
      duo_offer_enabled: true, duo_offer_description: '-20% pour les deux',
      student_offer_enabled: false, student_offer_description: null,
      contest_enabled: true, contest_prize: 'Un balayage offert',
      double_days_enabled: true, double_days_of_week: [1, 3],
      booking_mode: null,
      scan_code: 'demo-coiffure',
      bio: 'Coloriste et coiffeuse depuis 12 ans. Spécialités : balayage, blond californien et soins Kératine.',
      opening_hours: { '1': { open: '09:00', close: '19:00' }, '2': { open: '09:00', close: '19:00' }, '3': { open: '09:00', close: '19:00' }, '4': { open: '09:00', close: '20:00' }, '5': { open: '09:00', close: '20:00' }, '6': { open: '09:00', close: '18:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null,      country: 'FR',
    },
    offer: { id: 'offer-coiffure', title: 'Offre spéciale', description: '-20% sur votre premier balayage', expires_at: null },
    photos: PHOTOS_COIFFURE,
    serviceCategories: [
      { id: 'cat-1', name: 'Coupes', position: 1 },
      { id: 'cat-2', name: 'Couleurs', position: 2 },
      { id: 'cat-3', name: 'Soins', position: 3 },
      { id: 'cat-4', name: 'Coiffage', position: 4 },
    ],
    services: [
      { id: 's1', name: 'Coupe femme', price: 45, position: 1, category_id: 'cat-1', duration: 45, description: null, price_from: true },
      { id: 's2', name: 'Coupe homme', price: 25, position: 2, category_id: 'cat-1', duration: 30, description: null, price_from: false },
      { id: 's3', name: 'Coupe enfant (-12 ans)', price: 18, position: 3, category_id: 'cat-1', duration: 20, description: null, price_from: false },
      { id: 's4', name: 'Shampoing + Coupe + Brushing', price: 55, position: 4, category_id: 'cat-1', duration: 60, description: null, price_from: true },
      { id: 's5', name: 'Coloration racines', price: 50, position: 5, category_id: 'cat-2', duration: 90, description: null, price_from: false },
      { id: 's6', name: 'Coloration complète', price: 75, position: 6, category_id: 'cat-2', duration: 120, description: null, price_from: true },
      { id: 's7', name: 'Balayage / Mèches', price: 90, position: 7, category_id: 'cat-2', duration: 150, description: 'Technique de coloration pour un effet naturel et lumineux', price_from: true },
      { id: 's8', name: 'Patine / Gloss', price: 35, position: 8, category_id: 'cat-2', duration: 30, description: null, price_from: false },
      { id: 's9', name: 'Soin Kératine', price: 60, position: 9, category_id: 'cat-3', duration: 90, description: 'Lissage et nutrition intense pour cheveux abîmés', price_from: false },
      { id: 's10', name: 'Soin profond hydratant', price: 25, position: 10, category_id: 'cat-3', duration: 30, description: null, price_from: false },
      { id: 's11', name: 'Brushing', price: 30, position: 11, category_id: 'cat-4', duration: 30, description: null, price_from: true },
      { id: 's12', name: 'Chignon / Coiffure événement', price: 65, position: 12, category_id: 'cat-4', duration: 60, description: 'Sur devis pour mariages et événements', price_from: true },
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
      duo_offer_enabled: true, duo_offer_description: '-20% pour les deux',
      student_offer_enabled: true, student_offer_description: '-10% sur présentation de la carte étudiante',
      contest_enabled: false, contest_prize: null,
      double_days_enabled: false, double_days_of_week: null,
      booking_mode: null,
      scan_code: 'demo-tatouage',
      bio: 'Artiste tatoueur spécialisé en réalisme et blackwork. Chaque pièce est unique.',
      opening_hours: { '1': null, '2': { open: '11:00', close: '19:00' }, '3': { open: '11:00', close: '19:00' }, '4': { open: '11:00', close: '19:00' }, '5': { open: '11:00', close: '20:00' }, '6': { open: '11:00', close: '20:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null,      country: 'FR',
    },
    offer: { id: 'offer-tatouage', title: 'Flash Friday', description: '-30% sur les tatouages flash chaque vendredi', expires_at: null },
    photos: PHOTOS_TATOUAGE,
    serviceCategories: [
      { id: 'cat-1', name: 'Tatouage', position: 1 },
      { id: 'cat-2', name: 'Piercing', position: 2 },
      { id: 'cat-3', name: 'Retouches', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Tatouage flash (< 5cm)', price: 80, position: 1, category_id: 'cat-1', duration: 60, description: 'Motif au choix parmi le catalogue flash', price_from: false },
      { id: 's2', name: 'Tatouage petit (5-10cm)', price: 150, position: 2, category_id: 'cat-1', duration: 120, description: null, price_from: true },
      { id: 's3', name: 'Tatouage moyen (10-20cm)', price: 300, position: 3, category_id: 'cat-1', duration: 180, description: null, price_from: true },
      { id: 's4', name: 'Tatouage grande pièce (demi-journée)', price: 500, position: 4, category_id: 'cat-1', duration: 240, description: null, price_from: true },
      { id: 's5', name: 'Tatouage journée complète', price: 900, position: 5, category_id: 'cat-1', duration: 420, description: null, price_from: false },
      { id: 's6', name: 'Piercing lobe', price: 30, position: 6, category_id: 'cat-2', duration: 15, description: 'Bijou titane inclus', price_from: false },
      { id: 's7', name: 'Piercing hélix / tragus', price: 45, position: 7, category_id: 'cat-2', duration: 15, description: null, price_from: false },
      { id: 's8', name: 'Piercing septum', price: 50, position: 8, category_id: 'cat-2', duration: 15, description: null, price_from: false },
      { id: 's9', name: 'Piercing nez', price: 40, position: 9, category_id: 'cat-2', duration: 15, description: null, price_from: false },
      { id: 's10', name: 'Retouche (< 3 mois)', price: 0, position: 10, category_id: 'cat-3', duration: 30, description: 'Gratuite dans les 3 mois suivant la séance', price_from: false },
      { id: 's11', name: 'Retouche (> 3 mois)', price: 50, position: 11, category_id: 'cat-3', duration: 60, description: null, price_from: true },
    ],
  },

  'demo-barbier': {
    merchant: {
      id: 'demo-barbier', slug: 'demo-barbier',
      shop_name: 'Le Barbier Moderne', shop_type: 'barbier',
      shop_address: '22 rue des Abbesses, Paris 18e',
      logo_url: null, primary_color: '#1E40AF', secondary_color: '#3B82F6',
      stamps_required: 10, reward_description: 'Une coupe offerte',
      tier2_enabled: true, tier2_stamps_required: 20, tier2_reward_description: 'Coupe + barbe offerte',
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'Une coupe offerte', referral_reward_referred: '-20% sur votre 1re coupe',
      welcome_offer_enabled: true, welcome_offer_description: '-20% sur votre première coupe', welcome_referral_code: 'BARBER20',
      birthday_gift_enabled: true, birthday_gift_description: 'Un soin barbe offert',
      duo_offer_enabled: false, duo_offer_description: null,
      student_offer_enabled: true, student_offer_description: '-15% sur présentation de la carte étudiante',
      contest_enabled: false, contest_prize: null,
      double_days_enabled: false, double_days_of_week: null,
      booking_mode: null, scan_code: 'demo-barbier',
      bio: 'Barbier passionné, spécialiste du dégradé et de la taille de barbe traditionnelle.',
      opening_hours: { '1': { open: '09:00', close: '19:30' }, '2': { open: '09:00', close: '19:30' }, '3': { open: '09:00', close: '19:30' }, '4': { open: '09:00', close: '20:00' }, '5': { open: '09:00', close: '20:00' }, '6': { open: '08:30', close: '18:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'FR',
    },
    offer: null, photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Coupes', position: 1 },
      { id: 'cat-2', name: 'Barbe', position: 2 },
      { id: 'cat-3', name: 'Soins', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Coupe homme', price: 25, position: 1, category_id: 'cat-1', duration: 30, description: null, price_from: false },
      { id: 's2', name: 'Coupe + barbe', price: 38, position: 2, category_id: 'cat-1', duration: 45, description: null, price_from: false },
      { id: 's3', name: 'Coupe enfant (-12 ans)', price: 15, position: 3, category_id: 'cat-1', duration: 20, description: null, price_from: false },
      { id: 's4', name: 'Dégradé américain', price: 30, position: 4, category_id: 'cat-1', duration: 35, description: null, price_from: false },
      { id: 's5', name: 'Taille de barbe', price: 18, position: 5, category_id: 'cat-2', duration: 20, description: null, price_from: false },
      { id: 's6', name: 'Rasage traditionnel', price: 25, position: 6, category_id: 'cat-2', duration: 30, description: 'Serviette chaude + huile essentielle', price_from: false },
      { id: 's7', name: 'Soin visage homme', price: 35, position: 7, category_id: 'cat-3', duration: 30, description: null, price_from: false },
      { id: 's8', name: 'Coloration barbe', price: 20, position: 8, category_id: 'cat-3', duration: 20, description: null, price_from: false },
    ],
  },

  'demo-institut': {
    merchant: {
      id: 'demo-institut', slug: 'demo-institut',
      shop_name: 'Belle & Zen', shop_type: 'institut_beaute',
      shop_address: '5 avenue Victor Hugo, Lyon 6e',
      logo_url: null, primary_color: '#DB2777', secondary_color: '#F472B6',
      stamps_required: 8, reward_description: 'Un soin visage offert',
      tier2_enabled: true, tier2_stamps_required: 15, tier2_reward_description: 'Un modelage 30min offert',
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'Un soin offert', referral_reward_referred: '-20% sur votre 1re prestation',
      welcome_offer_enabled: true, welcome_offer_description: '-20% sur votre premier soin', welcome_referral_code: 'BEAUTE20',
      birthday_gift_enabled: true, birthday_gift_description: 'Un modelage offert',
      duo_offer_enabled: true, duo_offer_description: '-15% pour les deux',
      student_offer_enabled: false, student_offer_description: null,
      contest_enabled: true, contest_prize: 'Un soin visage complet offert',
      double_days_enabled: true, double_days_of_week: [1, 4],
      booking_mode: null, scan_code: 'demo-institut',
      bio: 'Institut de beaute specialise en soins du visage, epilation et modelage. Produits bio et naturels.',
      opening_hours: { '1': { open: '09:30', close: '19:00' }, '2': { open: '09:30', close: '19:00' }, '3': { open: '09:30', close: '19:00' }, '4': { open: '09:30', close: '20:00' }, '5': { open: '09:30', close: '20:00' }, '6': { open: '09:00', close: '17:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'FR',
    },
    offer: { id: 'offer-institut', title: 'Offre decouverte', description: '-25% sur votre premier soin visage', expires_at: null },
    photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Soins visage', position: 1 },
      { id: 'cat-2', name: 'Epilation', position: 2 },
      { id: 'cat-3', name: 'Modelage', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Soin visage eclat', price: 55, position: 1, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's2', name: 'Soin anti-age', price: 75, position: 2, category_id: 'cat-1', duration: 75, description: null, price_from: false },
      { id: 's3', name: 'Soin hydratant', price: 50, position: 3, category_id: 'cat-1', duration: 45, description: null, price_from: false },
      { id: 's4', name: 'Epilation jambes completes', price: 30, position: 4, category_id: 'cat-2', duration: 30, description: null, price_from: false },
      { id: 's5', name: 'Epilation maillot', price: 20, position: 5, category_id: 'cat-2', duration: 20, description: null, price_from: true },
      { id: 's6', name: 'Epilation sourcils', price: 10, position: 6, category_id: 'cat-2', duration: 10, description: null, price_from: false },
      { id: 's7', name: 'Modelage relaxant 30min', price: 45, position: 7, category_id: 'cat-3', duration: 30, description: null, price_from: false },
      { id: 's8', name: 'Modelage relaxant 60min', price: 75, position: 8, category_id: 'cat-3', duration: 60, description: null, price_from: false },
    ],
  },

  'demo-spa': {
    merchant: {
      id: 'demo-spa', slug: 'demo-spa',
      shop_name: 'Oasis Spa', shop_type: 'spa',
      shop_address: '15 rue du Bien-Etre, Bordeaux',
      logo_url: null, primary_color: '#0D9488', secondary_color: '#2DD4BF',
      stamps_required: 6, reward_description: 'Un massage 30min offert',
      tier2_enabled: true, tier2_stamps_required: 12, tier2_reward_description: 'Un acces spa + massage 1h offert',
      loyalty_mode: 'cagnotte', cagnotte_percent: 5, cagnotte_tier2_percent: 10,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: '10€ sur votre cagnotte', referral_reward_referred: '-20% sur votre 1re visite',
      welcome_offer_enabled: true, welcome_offer_description: '-20% sur votre premiere seance', welcome_referral_code: 'SPA20',
      birthday_gift_enabled: true, birthday_gift_description: 'Un acces hammam offert',
      duo_offer_enabled: true, duo_offer_description: '-25% pour un duo detente',
      student_offer_enabled: false, student_offer_description: null,
      contest_enabled: true, contest_prize: 'Un forfait detente complet offert',
      double_days_enabled: false, double_days_of_week: null,
      booking_mode: null, scan_code: 'demo-spa',
      bio: 'Espace de bien-etre avec hammam, sauna et soins du corps. Deconnexion garantie.',
      opening_hours: { '1': { open: '10:00', close: '20:00' }, '2': { open: '10:00', close: '20:00' }, '3': { open: '10:00', close: '20:00' }, '4': { open: '10:00', close: '21:00' }, '5': { open: '10:00', close: '21:00' }, '6': { open: '09:00', close: '19:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'FR',
    },
    offer: null, photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Massages', position: 1 },
      { id: 'cat-2', name: 'Acces spa', position: 2 },
      { id: 'cat-3', name: 'Forfaits', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Massage relaxant 30min', price: 50, position: 1, category_id: 'cat-1', duration: 30, description: null, price_from: false },
      { id: 's2', name: 'Massage relaxant 60min', price: 85, position: 2, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's3', name: 'Massage pierres chaudes', price: 95, position: 3, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's4', name: 'Massage duo 60min', price: 160, position: 4, category_id: 'cat-1', duration: 60, description: 'Cabine double', price_from: false },
      { id: 's5', name: 'Acces spa 2h', price: 35, position: 5, category_id: 'cat-2', duration: 120, description: 'Hammam + sauna + piscine', price_from: false },
      { id: 's6', name: 'Forfait detente', price: 110, position: 6, category_id: 'cat-3', duration: 150, description: 'Acces spa 2h + massage 30min', price_from: false },
      { id: 's7', name: 'Forfait prestige', price: 180, position: 7, category_id: 'cat-3', duration: 210, description: 'Acces spa 2h + massage 60min + soin visage', price_from: false },
    ],
  },

  'demo-estheticienne': {
    merchant: {
      id: 'demo-estheticienne', slug: 'demo-estheticienne',
      shop_name: 'Cleo Esthetique', shop_type: 'estheticienne',
      shop_address: '3 place Bellecour, Lyon 2e',
      logo_url: null, primary_color: '#E11D48', secondary_color: '#FB7185',
      stamps_required: 10, reward_description: 'Un soin complet offert',
      tier2_enabled: false, tier2_stamps_required: null, tier2_reward_description: null,
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'Un rehaussement cils offert', referral_reward_referred: '-15% sur votre 1re prestation',
      welcome_offer_enabled: true, welcome_offer_description: '-15% sur votre premiere prestation', welcome_referral_code: 'CLEO15',
      birthday_gift_enabled: true, birthday_gift_description: 'Une extension de cils offerte',
      duo_offer_enabled: false, duo_offer_description: null,
      student_offer_enabled: true, student_offer_description: '-10% sur presentation de la carte etudiante',
      contest_enabled: false, contest_prize: null,
      double_days_enabled: true, double_days_of_week: [2, 5],
      booking_mode: null, scan_code: 'demo-estheticienne',
      bio: 'Estheticienne diplomee, specialisee en soins du regard et epilations durables.',
      opening_hours: { '1': { open: '09:00', close: '18:30' }, '2': { open: '09:00', close: '18:30' }, '3': null, '4': { open: '09:00', close: '18:30' }, '5': { open: '09:00', close: '19:00' }, '6': { open: '09:00', close: '17:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'FR',
    },
    offer: { id: 'offer-estheticienne', title: 'Offre decouverte', description: '-20% sur le rehaussement de cils', expires_at: null },
    photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Regard', position: 1 },
      { id: 'cat-2', name: 'Epilation', position: 2 },
      { id: 'cat-3', name: 'Soins', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Rehaussement de cils', price: 55, position: 1, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's2', name: 'Extension de cils classique', price: 70, position: 2, category_id: 'cat-1', duration: 90, description: null, price_from: false },
      { id: 's3', name: 'Teinture cils + sourcils', price: 25, position: 3, category_id: 'cat-1', duration: 20, description: null, price_from: false },
      { id: 's4', name: 'Restructuration sourcils', price: 18, position: 4, category_id: 'cat-1', duration: 15, description: null, price_from: false },
      { id: 's5', name: 'Epilation jambes completes', price: 28, position: 5, category_id: 'cat-2', duration: 30, description: null, price_from: false },
      { id: 's6', name: 'Epilation aisselles', price: 12, position: 6, category_id: 'cat-2', duration: 10, description: null, price_from: false },
      { id: 's7', name: 'Epilation maillot integral', price: 30, position: 7, category_id: 'cat-2', duration: 25, description: null, price_from: false },
      { id: 's8', name: 'Soin visage purifiant', price: 50, position: 8, category_id: 'cat-3', duration: 45, description: null, price_from: false },
    ],
  },

  'demo-autre': {
    merchant: {
      id: 'demo-autre', slug: 'demo-autre',
      shop_name: 'Studio Wellness', shop_type: 'autre',
      shop_address: '10 rue du Commerce, Nantes',
      logo_url: null, primary_color: '#6366F1', secondary_color: '#818CF8',
      stamps_required: 8, reward_description: 'Une seance offerte',
      tier2_enabled: false, tier2_stamps_required: null, tier2_reward_description: null,
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'Une seance offerte', referral_reward_referred: '-15% sur votre 1re seance',
      welcome_offer_enabled: true, welcome_offer_description: '-15% sur votre premiere seance', welcome_referral_code: 'WELL15',
      birthday_gift_enabled: true, birthday_gift_description: 'Un bon de 20€',
      duo_offer_enabled: true, duo_offer_description: '-20% pour les deux',
      student_offer_enabled: false, student_offer_description: null,
      contest_enabled: false, contest_prize: null,
      double_days_enabled: false, double_days_of_week: null,
      booking_mode: null, scan_code: 'demo-autre',
      bio: 'Espace bien-etre pluridisciplinaire : sophrologie, reflexologie, naturopathie.',
      opening_hours: { '1': { open: '09:00', close: '19:00' }, '2': { open: '09:00', close: '19:00' }, '3': { open: '09:00', close: '19:00' }, '4': { open: '09:00', close: '19:00' }, '5': { open: '09:00', close: '19:00' }, '6': null, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'FR',
    },
    offer: null, photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Seances', position: 1 },
      { id: 'cat-2', name: 'Forfaits', position: 2 },
    ],
    services: [
      { id: 's1', name: 'Sophrologie (1h)', price: 60, position: 1, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's2', name: 'Reflexologie plantaire', price: 55, position: 2, category_id: 'cat-1', duration: 45, description: null, price_from: false },
      { id: 's3', name: 'Naturopathie (bilan)', price: 70, position: 3, category_id: 'cat-1', duration: 75, description: null, price_from: false },
      { id: 's4', name: 'Forfait 5 seances', price: 250, position: 4, category_id: 'cat-2', duration: 60, description: '-17% vs seances individuelles', price_from: false },
      { id: 's5', name: 'Forfait 10 seances', price: 450, position: 5, category_id: 'cat-2', duration: 60, description: '-25% vs seances individuelles', price_from: false },
    ],
  },
};

// ── EN data ──────────────────────────────────────────────────────────────────

const DEMO_MERCHANTS_EN: Record<string, DemoMerchantFullRaw> = {
  'demo-onglerie': {
    merchant: {
      id: 'demo-onglerie', slug: 'demo-onglerie',
      shop_name: 'Nails & Beauty', shop_type: 'onglerie',
      shop_address: '12 Main Street, Brooklyn, NY',
      logo_url: null, primary_color: '#EC4899', secondary_color: '#F472B6',
      stamps_required: 8, reward_description: 'A free gel manicure',
      tier2_enabled: true, tier2_stamps_required: 15, tier2_reward_description: 'A full hand care treatment',
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com',
      ...SOCIAL_LINKS,
      booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'A free gel manicure', referral_reward_referred: '15% off your first set',
      welcome_offer_enabled: true, welcome_offer_description: '20% off your first gel set', welcome_referral_code: 'WELCOME20',
      birthday_gift_enabled: true, birthday_gift_description: 'A free nail art design',
      duo_offer_enabled: true, duo_offer_description: '-20% for both',
      student_offer_enabled: true, student_offer_description: '15% off with a valid student ID',
      contest_enabled: true, contest_prize: 'A free full gel set',
      double_days_enabled: true, double_days_of_week: [2, 4],
      booking_mode: 'slots',
      scan_code: 'demo-onglerie',
      bio: 'Passionate nail artist specializing in baby boomer and 3D nail art. By appointment only.',
      opening_hours: { '1': { open: '10:00', close: '19:00' }, '2': { open: '10:00', close: '19:00' }, '3': { open: '10:00', close: '19:00' }, '4': { open: '10:00', close: '20:00' }, '5': { open: '10:00', close: '20:00' }, '6': { open: '09:00', close: '17:00' }, '7': null },
      phone: null, planning_enabled: true, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null,      country: 'US',
    },
    offer: { id: 'offer-onglerie', title: 'Spring special', description: '15% off all gel sets', expires_at: null },
    photos: PHOTOS_ONGLERIE,
    serviceCategories: [
      { id: 'cat-1', name: 'Gel nails', position: 1 },
      { id: 'cat-2', name: 'Manicure', position: 2 },
      { id: 'cat-3', name: 'Nail art', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Full gel set', price: 55, position: 1, category_id: 'cat-1', duration: 120, description: null, price_from: false },
      { id: 's2', name: 'Gel fill', price: 40, position: 2, category_id: 'cat-1', duration: 90, description: null, price_from: false },
      { id: 's3', name: 'Gel removal', price: 15, position: 3, category_id: 'cat-1', duration: 30, description: null, price_from: false },
      { id: 's4', name: 'Gel pedicure', price: 50, position: 4, category_id: 'cat-1', duration: 90, description: null, price_from: false },
      { id: 's5', name: 'Classic manicure', price: 25, position: 5, category_id: 'cat-2', duration: 30, description: null, price_from: false },
      { id: 's6', name: 'Shellac manicure', price: 35, position: 6, category_id: 'cat-2', duration: 45, description: null, price_from: false },
      { id: 's7', name: 'Full pedicure', price: 40, position: 7, category_id: 'cat-2', duration: 45, description: null, price_from: false },
      { id: 's8', name: 'Simple nail art (2 nails)', price: 5, position: 8, category_id: 'cat-3', duration: 15, description: null, price_from: false },
      { id: 's9', name: 'Full nail art (10 nails)', price: 20, position: 9, category_id: 'cat-3', duration: 30, description: null, price_from: false },
      { id: 's10', name: 'Gems / Nail piercing', price: 5, position: 10, category_id: 'cat-3', duration: 10, description: null, price_from: false },
    ],
  },

  'demo-coiffure': {
    merchant: {
      id: 'demo-coiffure', slug: 'demo-coiffure',
      shop_name: 'The Hair Atelier', shop_type: 'coiffeur',
      shop_address: '8 Sunset Blvd, Los Angeles, CA',
      logo_url: null, primary_color: '#8B5CF6', secondary_color: '#A78BFA',
      stamps_required: 10, reward_description: '5% cashback on your loyalty balance',
      tier2_enabled: true, tier2_stamps_required: 20, tier2_reward_description: '10% cashback on your loyalty balance',
      loyalty_mode: 'cagnotte', cagnotte_percent: 5, cagnotte_tier2_percent: 10,
      review_link: 'https://getqarte.com',
      ...SOCIAL_LINKS,
      booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: '$5 on your loyalty balance', referral_reward_referred: '15% off your first visit',
      welcome_offer_enabled: true, welcome_offer_description: '15% off your first haircut', welcome_referral_code: 'WELCOME15',
      birthday_gift_enabled: true, birthday_gift_description: 'A free deep conditioning treatment',
      duo_offer_enabled: true, duo_offer_description: '-20% for both',
      student_offer_enabled: false, student_offer_description: null,
      contest_enabled: true, contest_prize: 'A free balayage',
      double_days_enabled: true, double_days_of_week: [1, 3],
      booking_mode: null,
      scan_code: 'demo-coiffure',
      bio: 'Colorist and stylist for 12 years. Specialties: balayage, California blonde, and Keratin treatments.',
      opening_hours: { '1': { open: '09:00', close: '19:00' }, '2': { open: '09:00', close: '19:00' }, '3': { open: '09:00', close: '19:00' }, '4': { open: '09:00', close: '20:00' }, '5': { open: '09:00', close: '20:00' }, '6': { open: '09:00', close: '18:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null,      country: 'US',
    },
    offer: { id: 'offer-coiffure', title: 'Special offer', description: '20% off your first balayage', expires_at: null },
    photos: PHOTOS_COIFFURE,
    serviceCategories: [
      { id: 'cat-1', name: 'Haircuts', position: 1 },
      { id: 'cat-2', name: 'Color', position: 2 },
      { id: 'cat-3', name: 'Treatments', position: 3 },
      { id: 'cat-4', name: 'Styling', position: 4 },
    ],
    services: [
      { id: 's1', name: 'Women\'s haircut', price: 55, position: 1, category_id: 'cat-1', duration: 45, description: null, price_from: true },
      { id: 's2', name: 'Men\'s haircut', price: 30, position: 2, category_id: 'cat-1', duration: 30, description: null, price_from: false },
      { id: 's3', name: 'Kids haircut (under 12)', price: 20, position: 3, category_id: 'cat-1', duration: 20, description: null, price_from: false },
      { id: 's4', name: 'Wash + Cut + Blowout', price: 65, position: 4, category_id: 'cat-1', duration: 60, description: null, price_from: true },
      { id: 's5', name: 'Root touch-up', price: 60, position: 5, category_id: 'cat-2', duration: 90, description: null, price_from: false },
      { id: 's6', name: 'Full color', price: 90, position: 6, category_id: 'cat-2', duration: 120, description: null, price_from: true },
      { id: 's7', name: 'Balayage / Highlights', price: 110, position: 7, category_id: 'cat-2', duration: 150, description: 'Coloring technique for a natural, luminous finish', price_from: true },
      { id: 's8', name: 'Toner / Gloss', price: 40, position: 8, category_id: 'cat-2', duration: 30, description: null, price_from: false },
      { id: 's9', name: 'Keratin treatment', price: 75, position: 9, category_id: 'cat-3', duration: 90, description: 'Smoothing and deep nourishment for damaged hair', price_from: false },
      { id: 's10', name: 'Deep conditioning', price: 30, position: 10, category_id: 'cat-3', duration: 30, description: null, price_from: false },
      { id: 's11', name: 'Blowout', price: 35, position: 11, category_id: 'cat-4', duration: 30, description: null, price_from: true },
      { id: 's12', name: 'Updo / Event styling', price: 80, position: 12, category_id: 'cat-4', duration: 60, description: 'Custom quote for weddings and events', price_from: true },
    ],
  },

  'demo-tatouage': {
    merchant: {
      id: 'demo-tatouage', slug: 'demo-tatouage',
      shop_name: 'Ink Studio', shop_type: 'tatouage',
      shop_address: '45 NE Alberta St, Portland, OR',
      logo_url: null, primary_color: '#1E293B', secondary_color: '#475569',
      stamps_required: 5, reward_description: 'A free flash tattoo',
      tier2_enabled: true, tier2_stamps_required: 10, tier2_reward_description: '20% off your next session',
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com',
      ...SOCIAL_LINKS,
      booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'A free flash tattoo', referral_reward_referred: '10% off your first tattoo',
      welcome_offer_enabled: true, welcome_offer_description: '10% off your first tattoo', welcome_referral_code: 'INK10',
      birthday_gift_enabled: true, birthday_gift_description: 'A free piercing',
      duo_offer_enabled: true, duo_offer_description: '-20% for both',
      student_offer_enabled: true, student_offer_description: '10% off with a valid student ID',
      contest_enabled: false, contest_prize: null,
      double_days_enabled: false, double_days_of_week: null,
      booking_mode: null,
      scan_code: 'demo-tatouage',
      bio: 'Tattoo artist specializing in realism and blackwork. Every piece is one of a kind.',
      opening_hours: { '1': null, '2': { open: '11:00', close: '19:00' }, '3': { open: '11:00', close: '19:00' }, '4': { open: '11:00', close: '19:00' }, '5': { open: '11:00', close: '20:00' }, '6': { open: '11:00', close: '20:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null,      country: 'US',
    },
    offer: { id: 'offer-tatouage', title: 'Flash Friday', description: '30% off flash tattoos every Friday', expires_at: null },
    photos: PHOTOS_TATOUAGE,
    serviceCategories: [
      { id: 'cat-1', name: 'Tattoo', position: 1 },
      { id: 'cat-2', name: 'Piercing', position: 2 },
      { id: 'cat-3', name: 'Touch-ups', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Flash tattoo (< 2in)', price: 100, position: 1, category_id: 'cat-1', duration: 60, description: 'Choose from our flash catalog', price_from: false },
      { id: 's2', name: 'Small tattoo (2-4in)', price: 180, position: 2, category_id: 'cat-1', duration: 120, description: null, price_from: true },
      { id: 's3', name: 'Medium tattoo (4-8in)', price: 350, position: 3, category_id: 'cat-1', duration: 180, description: null, price_from: true },
      { id: 's4', name: 'Large piece (half day)', price: 600, position: 4, category_id: 'cat-1', duration: 240, description: null, price_from: true },
      { id: 's5', name: 'Full day session', price: 1100, position: 5, category_id: 'cat-1', duration: 420, description: null, price_from: false },
      { id: 's6', name: 'Lobe piercing', price: 35, position: 6, category_id: 'cat-2', duration: 15, description: 'Titanium jewelry included', price_from: false },
      { id: 's7', name: 'Helix / Tragus piercing', price: 55, position: 7, category_id: 'cat-2', duration: 15, description: null, price_from: false },
      { id: 's8', name: 'Septum piercing', price: 60, position: 8, category_id: 'cat-2', duration: 15, description: null, price_from: false },
      { id: 's9', name: 'Nose piercing', price: 50, position: 9, category_id: 'cat-2', duration: 15, description: null, price_from: false },
      { id: 's10', name: 'Touch-up (< 3 months)', price: 0, position: 10, category_id: 'cat-3', duration: 30, description: 'Free within 3 months of original session', price_from: false },
      { id: 's11', name: 'Touch-up (> 3 months)', price: 60, position: 11, category_id: 'cat-3', duration: 60, description: null, price_from: true },
    ],
  },

  'demo-barbier': {
    merchant: {
      id: 'demo-barbier', slug: 'demo-barbier',
      shop_name: 'The Modern Barber', shop_type: 'barbier',
      shop_address: '22 Main Street, Chicago, IL',
      logo_url: null, primary_color: '#1E40AF', secondary_color: '#3B82F6',
      stamps_required: 10, reward_description: 'A free haircut',
      tier2_enabled: true, tier2_stamps_required: 20, tier2_reward_description: 'Free cut + beard trim',
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'A free haircut', referral_reward_referred: '20% off your first cut',
      welcome_offer_enabled: true, welcome_offer_description: '20% off your first haircut', welcome_referral_code: 'BARBER20',
      birthday_gift_enabled: true, birthday_gift_description: 'A free beard treatment',
      duo_offer_enabled: false, duo_offer_description: null,
      student_offer_enabled: true, student_offer_description: '15% off with a valid student ID',
      contest_enabled: false, contest_prize: null,
      double_days_enabled: false, double_days_of_week: null,
      booking_mode: null, scan_code: 'demo-barbier',
      bio: 'Passionate barber specializing in fades and traditional beard grooming.',
      opening_hours: { '1': { open: '09:00', close: '19:30' }, '2': { open: '09:00', close: '19:30' }, '3': { open: '09:00', close: '19:30' }, '4': { open: '09:00', close: '20:00' }, '5': { open: '09:00', close: '20:00' }, '6': { open: '08:30', close: '18:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'US',
    },
    offer: null, photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Haircuts', position: 1 },
      { id: 'cat-2', name: 'Beard', position: 2 },
      { id: 'cat-3', name: 'Treatments', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Men\'s haircut', price: 30, position: 1, category_id: 'cat-1', duration: 30, description: null, price_from: false },
      { id: 's2', name: 'Haircut + beard trim', price: 45, position: 2, category_id: 'cat-1', duration: 45, description: null, price_from: false },
      { id: 's3', name: 'Kids haircut (under 12)', price: 18, position: 3, category_id: 'cat-1', duration: 20, description: null, price_from: false },
      { id: 's4', name: 'Skin fade', price: 35, position: 4, category_id: 'cat-1', duration: 35, description: null, price_from: false },
      { id: 's5', name: 'Beard trim', price: 20, position: 5, category_id: 'cat-2', duration: 20, description: null, price_from: false },
      { id: 's6', name: 'Hot towel shave', price: 30, position: 6, category_id: 'cat-2', duration: 30, description: 'Hot towel + essential oils', price_from: false },
      { id: 's7', name: 'Facial treatment', price: 40, position: 7, category_id: 'cat-3', duration: 30, description: null, price_from: false },
      { id: 's8', name: 'Beard coloring', price: 25, position: 8, category_id: 'cat-3', duration: 20, description: null, price_from: false },
    ],
  },

  'demo-institut': {
    merchant: {
      id: 'demo-institut', slug: 'demo-institut',
      shop_name: 'Glow Beauty Studio', shop_type: 'institut_beaute',
      shop_address: '5 Rodeo Drive, Beverly Hills, CA',
      logo_url: null, primary_color: '#DB2777', secondary_color: '#F472B6',
      stamps_required: 8, reward_description: 'A free facial',
      tier2_enabled: true, tier2_stamps_required: 15, tier2_reward_description: 'A free 30min body massage',
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'A free treatment', referral_reward_referred: '20% off your first service',
      welcome_offer_enabled: true, welcome_offer_description: '20% off your first facial', welcome_referral_code: 'GLOW20',
      birthday_gift_enabled: true, birthday_gift_description: 'A free massage',
      duo_offer_enabled: true, duo_offer_description: '15% off for both',
      student_offer_enabled: false, student_offer_description: null,
      contest_enabled: true, contest_prize: 'A full facial treatment',
      double_days_enabled: true, double_days_of_week: [1, 4],
      booking_mode: null, scan_code: 'demo-institut',
      bio: 'Beauty studio specializing in facials, waxing, and body treatments. Organic products only.',
      opening_hours: { '1': { open: '09:30', close: '19:00' }, '2': { open: '09:30', close: '19:00' }, '3': { open: '09:30', close: '19:00' }, '4': { open: '09:30', close: '20:00' }, '5': { open: '09:30', close: '20:00' }, '6': { open: '09:00', close: '17:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'US',
    },
    offer: { id: 'offer-institut', title: 'Discovery offer', description: '25% off your first facial', expires_at: null },
    photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Facials', position: 1 },
      { id: 'cat-2', name: 'Waxing', position: 2 },
      { id: 'cat-3', name: 'Body', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Glow facial', price: 65, position: 1, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's2', name: 'Anti-aging facial', price: 90, position: 2, category_id: 'cat-1', duration: 75, description: null, price_from: false },
      { id: 's3', name: 'Hydrating facial', price: 60, position: 3, category_id: 'cat-1', duration: 45, description: null, price_from: false },
      { id: 's4', name: 'Full leg wax', price: 35, position: 4, category_id: 'cat-2', duration: 30, description: null, price_from: false },
      { id: 's5', name: 'Bikini wax', price: 25, position: 5, category_id: 'cat-2', duration: 20, description: null, price_from: true },
      { id: 's6', name: 'Eyebrow wax', price: 12, position: 6, category_id: 'cat-2', duration: 10, description: null, price_from: false },
      { id: 's7', name: 'Relaxing massage 30min', price: 55, position: 7, category_id: 'cat-3', duration: 30, description: null, price_from: false },
      { id: 's8', name: 'Relaxing massage 60min', price: 90, position: 8, category_id: 'cat-3', duration: 60, description: null, price_from: false },
    ],
  },

  'demo-spa': {
    merchant: {
      id: 'demo-spa', slug: 'demo-spa',
      shop_name: 'Oasis Spa', shop_type: 'spa',
      shop_address: '15 Wellness Ave, Miami, FL',
      logo_url: null, primary_color: '#0D9488', secondary_color: '#2DD4BF',
      stamps_required: 6, reward_description: 'A free 30min massage',
      tier2_enabled: true, tier2_stamps_required: 12, tier2_reward_description: 'Spa access + 1h massage free',
      loyalty_mode: 'cagnotte', cagnotte_percent: 5, cagnotte_tier2_percent: 10,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: '$10 on your balance', referral_reward_referred: '20% off your first visit',
      welcome_offer_enabled: true, welcome_offer_description: '20% off your first session', welcome_referral_code: 'SPA20',
      birthday_gift_enabled: true, birthday_gift_description: 'Free steam room access',
      duo_offer_enabled: true, duo_offer_description: '25% off for a duo relaxation',
      student_offer_enabled: false, student_offer_description: null,
      contest_enabled: true, contest_prize: 'A full relaxation package',
      double_days_enabled: false, double_days_of_week: null,
      booking_mode: null, scan_code: 'demo-spa',
      bio: 'Wellness retreat with steam room, sauna, and body treatments. Total disconnection guaranteed.',
      opening_hours: { '1': { open: '10:00', close: '20:00' }, '2': { open: '10:00', close: '20:00' }, '3': { open: '10:00', close: '20:00' }, '4': { open: '10:00', close: '21:00' }, '5': { open: '10:00', close: '21:00' }, '6': { open: '09:00', close: '19:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'US',
    },
    offer: null, photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Massages', position: 1 },
      { id: 'cat-2', name: 'Spa access', position: 2 },
      { id: 'cat-3', name: 'Packages', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Relaxing massage 30min', price: 60, position: 1, category_id: 'cat-1', duration: 30, description: null, price_from: false },
      { id: 's2', name: 'Relaxing massage 60min', price: 100, position: 2, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's3', name: 'Hot stone massage', price: 115, position: 3, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's4', name: 'Couples massage 60min', price: 190, position: 4, category_id: 'cat-1', duration: 60, description: 'Private double room', price_from: false },
      { id: 's5', name: 'Spa access 2h', price: 40, position: 5, category_id: 'cat-2', duration: 120, description: 'Steam room + sauna + pool', price_from: false },
      { id: 's6', name: 'Relaxation package', price: 130, position: 6, category_id: 'cat-3', duration: 150, description: 'Spa access 2h + 30min massage', price_from: false },
      { id: 's7', name: 'Prestige package', price: 210, position: 7, category_id: 'cat-3', duration: 210, description: 'Spa access 2h + 60min massage + facial', price_from: false },
    ],
  },

  'demo-estheticienne': {
    merchant: {
      id: 'demo-estheticienne', slug: 'demo-estheticienne',
      shop_name: 'Cleo Beauty', shop_type: 'estheticienne',
      shop_address: '3 Park Avenue, New York, NY',
      logo_url: null, primary_color: '#E11D48', secondary_color: '#FB7185',
      stamps_required: 10, reward_description: 'A free full treatment',
      tier2_enabled: false, tier2_stamps_required: null, tier2_reward_description: null,
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'A free lash lift', referral_reward_referred: '15% off your first service',
      welcome_offer_enabled: true, welcome_offer_description: '15% off your first service', welcome_referral_code: 'CLEO15',
      birthday_gift_enabled: true, birthday_gift_description: 'A free lash extension',
      duo_offer_enabled: false, duo_offer_description: null,
      student_offer_enabled: true, student_offer_description: '10% off with a valid student ID',
      contest_enabled: false, contest_prize: null,
      double_days_enabled: true, double_days_of_week: [2, 5],
      booking_mode: null, scan_code: 'demo-estheticienne',
      bio: 'Licensed esthetician specializing in lash treatments and long-lasting hair removal.',
      opening_hours: { '1': { open: '09:00', close: '18:30' }, '2': { open: '09:00', close: '18:30' }, '3': null, '4': { open: '09:00', close: '18:30' }, '5': { open: '09:00', close: '19:00' }, '6': { open: '09:00', close: '17:00' }, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'US',
    },
    offer: { id: 'offer-estheticienne', title: 'Discovery offer', description: '20% off lash lift', expires_at: null },
    photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Lashes & brows', position: 1 },
      { id: 'cat-2', name: 'Waxing', position: 2 },
      { id: 'cat-3', name: 'Treatments', position: 3 },
    ],
    services: [
      { id: 's1', name: 'Lash lift', price: 65, position: 1, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's2', name: 'Classic lash extensions', price: 85, position: 2, category_id: 'cat-1', duration: 90, description: null, price_from: false },
      { id: 's3', name: 'Lash + brow tint', price: 30, position: 3, category_id: 'cat-1', duration: 20, description: null, price_from: false },
      { id: 's4', name: 'Brow shaping', price: 20, position: 4, category_id: 'cat-1', duration: 15, description: null, price_from: false },
      { id: 's5', name: 'Full leg wax', price: 35, position: 5, category_id: 'cat-2', duration: 30, description: null, price_from: false },
      { id: 's6', name: 'Underarm wax', price: 15, position: 6, category_id: 'cat-2', duration: 10, description: null, price_from: false },
      { id: 's7', name: 'Brazilian wax', price: 40, position: 7, category_id: 'cat-2', duration: 25, description: null, price_from: false },
      { id: 's8', name: 'Purifying facial', price: 60, position: 8, category_id: 'cat-3', duration: 45, description: null, price_from: false },
    ],
  },

  'demo-autre': {
    merchant: {
      id: 'demo-autre', slug: 'demo-autre',
      shop_name: 'Wellness Studio', shop_type: 'autre',
      shop_address: '10 Commerce St, Austin, TX',
      logo_url: null, primary_color: '#6366F1', secondary_color: '#818CF8',
      stamps_required: 8, reward_description: 'A free session',
      tier2_enabled: false, tier2_stamps_required: null, tier2_reward_description: null,
      loyalty_mode: 'visit', cagnotte_percent: null, cagnotte_tier2_percent: null,
      review_link: 'https://getqarte.com', ...SOCIAL_LINKS, booking_url: 'https://getqarte.com',
      referral_program_enabled: true, referral_reward_referrer: 'A free session', referral_reward_referred: '15% off your first session',
      welcome_offer_enabled: true, welcome_offer_description: '15% off your first session', welcome_referral_code: 'WELL15',
      birthday_gift_enabled: true, birthday_gift_description: 'A $20 gift card',
      duo_offer_enabled: true, duo_offer_description: '20% off for both',
      student_offer_enabled: false, student_offer_description: null,
      contest_enabled: false, contest_prize: null,
      double_days_enabled: false, double_days_of_week: null,
      booking_mode: null, scan_code: 'demo-autre',
      bio: 'Multidisciplinary wellness space: sophrology, reflexology, naturopathy.',
      opening_hours: { '1': { open: '09:00', close: '19:00' }, '2': { open: '09:00', close: '19:00' }, '3': { open: '09:00', close: '19:00' }, '4': { open: '09:00', close: '19:00' }, '5': { open: '09:00', close: '19:00' }, '6': null, '7': null },
      phone: null, planning_enabled: false, planning_message: null, planning_message_expires: null, booking_message: null, auto_booking_enabled: false, deposit_link: null, deposit_percent: null, deposit_amount: null, country: 'US',
    },
    offer: null, photos: [], serviceCategories: [
      { id: 'cat-1', name: 'Sessions', position: 1 },
      { id: 'cat-2', name: 'Packages', position: 2 },
    ],
    services: [
      { id: 's1', name: 'Sophrology (1h)', price: 75, position: 1, category_id: 'cat-1', duration: 60, description: null, price_from: false },
      { id: 's2', name: 'Reflexology', price: 65, position: 2, category_id: 'cat-1', duration: 45, description: null, price_from: false },
      { id: 's3', name: 'Naturopathy (assessment)', price: 85, position: 3, category_id: 'cat-1', duration: 75, description: null, price_from: false },
      { id: 's4', name: '5-session package', price: 300, position: 4, category_id: 'cat-2', duration: 60, description: '20% off vs individual sessions', price_from: false },
      { id: 's5', name: '10-session package', price: 550, position: 5, category_id: 'cat-2', duration: 60, description: '27% off vs individual sessions', price_from: false },
    ],
  },
};

// ── Apply defaults + generate -libre variants ───────────────────────────────

const DEMO_FR_ALL = withDefaultsAndVariants(DEMO_MERCHANTS_FR, false);
const DEMO_EN_ALL = withDefaultsAndVariants(DEMO_MERCHANTS_EN, true);

const DEMO_BY_LOCALE: Record<string, Record<string, DemoMerchantFull>> = {
  fr: DEMO_FR_ALL,
  en: DEMO_EN_ALL,
};

/** @deprecated Use getDemoMerchantData(slug, locale) instead. Kept for backward compat. */
export const DEMO_MERCHANTS = DEMO_FR_ALL;

/** Flat merchant lookup for customer card preview page (backward compat) */
export const DEMO_MERCHANTS_FLAT: Record<string, DemoMerchant> = Object.fromEntries(
  Object.entries(DEMO_FR_ALL).map(([key, val]) => [key, val.merchant])
);

/** Check if a slug is a demo merchant */
export function isDemoSlug(slug: string): boolean {
  return slug in DEMO_FR_ALL;
}

/** Get demo merchant data for /p/[slug] page, locale-aware */
export function getDemoMerchantData(slug: string, locale: string = 'fr'): DemoMerchantFull | null {
  const merchants = DEMO_BY_LOCALE[locale] || DEMO_FR_ALL;
  return merchants[slug] || null;
}

/** All base demo slugs (without -libre variants) */
export const DEMO_BASE_SLUGS = Object.keys(DEMO_MERCHANTS_FR);
