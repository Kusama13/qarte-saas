export type ShopType =
  | 'coiffeur'
  | 'barbier'
  | 'institut_beaute'
  | 'onglerie'
  | 'spa'
  | 'estheticienne'
  | 'tatouage'
  | 'autre';

export const SHOP_TYPES: Record<ShopType, string> = {
  coiffeur: 'Salon de coiffure',
  barbier: 'Barbier',
  institut_beaute: 'Institut de beauté',
  onglerie: 'Onglerie / Nail bar',
  spa: 'Spa / Bien-être / Massage',
  estheticienne: 'Esthéticienne',
  tatouage: 'Salon de tatouage',
  autre: 'Autre',
};

export type MerchantCountry = 'FR' | 'BE' | 'CH' | 'LU' | 'US' | 'GB' | 'CA' | 'AU' | 'ES' | 'IT';

/** Fallback display names (English). Prefer t('countries.XX') from i18n for UI. */
export const COUNTRIES: Record<MerchantCountry, string> = {
  FR: 'France',
  BE: 'Belgium',
  CH: 'Switzerland',
  LU: 'Luxembourg',
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  ES: 'Spain',
  IT: 'Italy',
};

export const COUNTRIES_BY_LOCALE: Record<string, MerchantCountry[]> = {
  fr: ['FR', 'BE', 'CH', 'LU'],
  en: ['US', 'GB', 'CA', 'AU', 'BE', 'CH', 'LU', 'ES', 'IT'],
};

export type SubscriptionStatus = 'trial' | 'active' | 'canceled' | 'canceling' | 'past_due';

export type LoyaltyMode = 'visit' | 'cagnotte';

export interface CagnotteData {
  currentAmount: number;
  amountAdded: number;
  rewardValue: number | null;
  rewardPercent: number | null;
}

// Qarte Shield: Visit quarantine status
export type VisitStatus = 'confirmed' | 'pending' | 'rejected';

export interface Merchant {
  id: string;
  user_id: string;
  slug: string;
  scan_code: string;
  shop_name: string;
  shop_type: ShopType;
  shop_address: string | null;
  bio: string | null;
  phone: string;
  country: MerchantCountry;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  program_name: string | null;
  welcome_message: string | null;
  promo_message: string | null;
  review_link: string | null;
  opening_hours: Record<string, { open: string; close: string } | null> | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  snapchat_url: string | null;
  whatsapp_url: string | null;
  booking_url: string | null;
  loyalty_mode: LoyaltyMode;
  stamps_required: number;
  reward_description: string | null;
  // 2nd tier reward (cumulative, points don't reset)
  tier2_enabled: boolean;
  tier2_stamps_required: number | null;
  tier2_reward_description: string | null;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_interval: 'monthly' | 'annual';
  subscription_status: SubscriptionStatus;
  onboarding_completed: boolean;
  shield_enabled: boolean;
  referral_code: string;
  // Referral program
  referral_program_enabled: boolean;
  referral_reward_referrer: string | null;
  referral_reward_referred: string | null;
  // Welcome offer
  welcome_offer_enabled: boolean;
  welcome_offer_description: string | null;
  welcome_referral_code: string | null;
  // Birthday gift
  birthday_gift_enabled: boolean;
  birthday_gift_description: string | null;
  // Cagnotte (cashback) mode
  cagnotte_percent: number | null;
  cagnotte_tier2_percent: number | null;
  // Duo offer
  duo_offer_enabled: boolean;
  duo_offer_description: string | null;
  // Double stamp days
  double_days_enabled: boolean;
  double_days_of_week: string; // JSON array of JS getDay() values ex: "[1,3]"
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
  no_contact: boolean;
  admin_notes: string | null;
  pwa_installed_at: string | null;
  // Planning module
  planning_enabled: boolean;
  planning_message: string | null;
  planning_message_expires: string | null;
  booking_message: string | null;
  // Auto booking
  auto_booking_enabled: boolean;
  deposit_link: string | null;
  deposit_percent: number | null;
  deposit_amount: number | null;
  deposit_message: string | null;
  // Public page link on loyalty card
  show_public_page_on_card: boolean;
  signup_source: string | null;
  locale: 'fr' | 'en';
  first_feature_choice: 'loyalty' | 'vitrine' | null;
}

export interface PlanningSlotService {
  service_id: string;
}

export interface PlanningSlotPhoto {
  id: string;
  url: string;
  position: number;
}

export type PlanningSlotResultPhoto = PlanningSlotPhoto;

export interface PlanningSlot {
  id: string;
  merchant_id: string;
  slot_date: string;
  start_time: string;
  client_name: string | null;
  client_phone: string | null;
  customer_id: string | null;
  service_id: string | null; // deprecated — use planning_slot_services
  notes: string | null;
  deposit_confirmed: boolean | null;
  primary_slot_id: string | null;
  created_at: string;
  planning_slot_services?: PlanningSlotService[];
  planning_slot_photos?: PlanningSlotPhoto[];
  planning_slot_result_photos?: PlanningSlotResultPhoto[];
  customer?: { instagram_handle: string | null; tiktok_handle: string | null; facebook_url: string | null } | null;
}

export interface MerchantOffer {
  id: string;
  merchant_id: string;
  title: string;
  description: string;
  active: boolean;
  starts_at: string;
  expires_at: string | null;
  max_claims: number | null;
  claim_count: number;
  offer_code: string;
  created_at: string;
}

export interface Customer {
  id: string;
  merchant_id: string;
  phone_number: string;
  first_name: string;
  last_name: string | null;
  birth_month: number | null;
  birth_day: number | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  facebook_url: string | null;
  created_at: string;
}

export interface CustomerNote {
  id: string;
  customer_id: string;
  merchant_id: string;
  slot_id: string | null;
  content: string;
  note_type: string;
  pinned: boolean;
  created_at: string;
}

export interface CustomerSearchResult {
  id: string;
  first_name: string;
  last_name: string | null;
  phone_number: string;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  facebook_url: string | null;
}

export interface LoyaltyCard {
  id: string;
  customer_id: string;
  merchant_id: string;
  current_stamps: number;
  current_amount: number; // Accumulated EUR for cagnotte mode
  stamps_target: number; // Grandfathering: target when card was created
  last_visit_date: string | null;
  referral_code: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  merchant?: Merchant;
}

export interface Voucher {
  id: string;
  loyalty_card_id: string;
  merchant_id: string;
  customer_id: string;
  reward_description: string;
  source: 'birthday' | 'referral' | 'redemption' | 'welcome' | 'offer' | null;
  offer_id: string | null;
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
  merchant_offers?: { title: string } | null;
}

export interface Visit {
  id: string;
  loyalty_card_id: string;
  merchant_id: string;
  customer_id: string;
  points_earned: number;
  amount_spent: number | null; // Amount spent in EUR (cagnotte mode)
  visited_at: string;
  ip_address: string | null;
  // Qarte Shield fields
  status: VisitStatus;
  flagged_reason: string | null;
  ip_hash: string | null;
}

// Pending visit with customer info for moderation widget
export interface PendingVisit extends Visit {
  customer: Customer;
  loyalty_card: LoyaltyCard;
}

export interface Redemption {
  id: string;
  loyalty_card_id: string;
  merchant_id: string;
  customer_id: string;
  redeemed_at: string;
  stamps_used: number;
  tier: 1 | 2;
  // Cagnotte audit trail
  amount_accumulated: number | null;
  reward_percent: number | null;
  reward_value: number | null;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
}

export interface MerchantStats {
  totalCustomers: number;
  activeCustomers: number;
  visitsThisMonth: number;
  redemptionsThisMonth: number;
  visitsPerDay: Array<{ date: string; count: number }>;
}

export interface CheckinResponse {
  success: boolean;
  message: string;
  current_stamps?: number;
  required_stamps?: number;
  reward_unlocked?: boolean;
  customer_name?: string;
  // Qarte Shield fields
  status?: VisitStatus;
  pending_count?: number;
  flagged_reason?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

export interface MemberProgram {
  id: string;
  merchant_id: string;
  name: string;
  benefit_label: string;
  duration_months: number;
  is_active: boolean;
  created_at: string;
  merchant?: Merchant;
}

export interface MemberCard {
  id: string;
  program_id: string;
  customer_id: string;
  valid_from: string;
  valid_until: string;
  created_at: string;
  customer?: Customer;
  program?: MemberProgram;
}

// ============================================
// Extended types for Supabase JOIN queries
// ============================================

/** LoyaltyCard with customer relation from .select('*, customers(*)') */
export interface LoyaltyCardWithCustomer extends LoyaltyCard {
  customers: Customer;
}

/** LoyaltyCard with merchant relation */
export interface LoyaltyCardWithMerchant extends LoyaltyCard {
  merchants: Merchant;
}

/** LoyaltyCard with both customer and merchant */
export interface LoyaltyCardFull extends LoyaltyCard {
  customers: Customer;
  merchants: Merchant;
}

/** MemberProgram with merchant relation from .select('*, merchants(user_id)') */
export interface MemberProgramWithMerchant extends MemberProgram {
  merchants: { user_id: string };
}

/** MemberCard with program and nested merchant */
export interface MemberCardWithProgramAndMerchant extends MemberCard {
  program: MemberProgramWithMerchant;
}

// ============================================
// Referral program
// ============================================

export type ReferralStatus = 'pending' | 'completed';

export interface Referral {
  id: string;
  merchant_id: string;
  referrer_customer_id: string | null;
  referrer_card_id: string | null;
  referred_customer_id: string;
  referred_card_id: string;
  referred_voucher_id: string | null;
  referrer_voucher_id: string | null;
  status: ReferralStatus;
  created_at: string;
}

// ============================================
// Global type declarations
// ============================================

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, unknown>) => void;
    standalone?: boolean;
  }
  interface Navigator {
    standalone?: boolean;
  }
}
