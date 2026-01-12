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
  stamps_required: number;
  reward_description: string | null;
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
  last_visit_date: string | null;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  merchant?: Merchant;
}

export interface Visit {
  id: string;
  loyalty_card_id: string;
  merchant_id: string;
  customer_id: string;
  visited_at: string;
  ip_address: string | null;
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
}

export interface ApiError {
  error: string;
  code?: string;
}
