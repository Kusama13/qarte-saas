export type ShopType =
  | 'cafe'
  | 'boulangerie'
  | 'restaurant'
  | 'salon_beaute'
  | 'salle_sport'
  | 'commerce_detail'
  | 'autre';

export const SHOP_TYPES: Record<ShopType, string> = {
  cafe: 'Café',
  boulangerie: 'Boulangerie',
  restaurant: 'Restaurant',
  salon_beaute: 'Salon de beauté',
  salle_sport: 'Salle de sport',
  commerce_detail: 'Commerce de détail',
  autre: 'Autre',
};

export type SubscriptionStatus = 'trial' | 'active' | 'cancelled' | 'past_due';

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
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  program_name: string | null;
  welcome_message: string | null;
  promo_message: string | null;
  review_link: string | null;
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
  subscription_status: SubscriptionStatus;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
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
