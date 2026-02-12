export type ShopType =
  | 'coiffeur'
  | 'barbier'
  | 'institut_beaute'
  | 'onglerie'
  | 'spa'
  | 'estheticienne'
  | 'massage'
  | 'epilation'
  | 'autre';

export const SHOP_TYPES: Record<ShopType, string> = {
  coiffeur: 'Salon de coiffure',
  barbier: 'Barbier',
  institut_beaute: 'Institut de beauté',
  onglerie: 'Onglerie / Nail bar',
  spa: 'Spa & Bien-être',
  estheticienne: 'Esthéticienne',
  massage: 'Salon de massage',
  epilation: 'Centre d\'épilation',
  autre: 'Autre',
};

export type MerchantCountry = 'FR' | 'BE' | 'CH' | 'LU';

export const COUNTRIES: Record<MerchantCountry, string> = {
  FR: 'France',
  BE: 'Belgique',
  CH: 'Suisse',
  LU: 'Luxembourg',
};

export type SubscriptionStatus = 'trial' | 'active' | 'canceled' | 'canceling' | 'past_due';

export type LoyaltyMode = 'visit' | 'article';

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
  phone: string;
  country: MerchantCountry;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  program_name: string | null;
  welcome_message: string | null;
  promo_message: string | null;
  review_link: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  loyalty_mode: LoyaltyMode;
  product_name: string | null;
  max_quantity_per_scan: number;
  stamps_required: number;
  reward_description: string | null;
  // 2nd tier reward (cumulative, points don't reset)
  tier2_enabled: boolean;
  tier2_stamps_required: number | null;
  tier2_reward_description: string | null;
  trial_ends_at: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: SubscriptionStatus;
  onboarding_completed: boolean;
  shield_enabled: boolean;
  referral_code: string;
  created_at: string;
  updated_at: string;
  last_seen_at: string | null;
}

export interface Customer {
  id: string;
  phone_number: string;
  first_name: string;
  last_name: string | null;
  created_at: string;
}

export interface LoyaltyCard {
  id: string;
  customer_id: string;
  merchant_id: string;
  current_stamps: number;
  stamps_target: number; // Grandfathering: target when card was created
  last_visit_date: string | null;
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
  is_used: boolean;
  used_at: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface Visit {
  id: string;
  loyalty_card_id: string;
  merchant_id: string;
  customer_id: string;
  points_earned: number;
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
