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
  fr: ['FR', 'BE', 'CH'],
  en: ['FR', 'BE', 'CH'],
};

export type SubscriptionStatus = 'trial' | 'active' | 'canceled' | 'canceling' | 'past_due';

export type PlanTier = 'fidelity' | 'all_in';
export type BillingInterval = 'monthly' | 'semestrial' | 'annual';
export type PlanningIntent = 'unsure' | 'yes' | 'no';

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
  display_phone: string | null;
  country: MerchantCountry;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  program_name: string | null;
  welcome_message: string | null;
  promo_message: string | null;
  review_link: string | null;
  opening_hours: Record<string, { open: string; close: string; break_start?: string; break_end?: string } | null> | null;
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
  cancellation_reason: import('@/lib/cancellation-reasons').CancellationReason | null;
  cancellation_reason_at: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  billing_interval: BillingInterval;
  billing_period_start: string | null;
  subscription_status: SubscriptionStatus;
  past_due_since: string | null;
  plan_tier: PlanTier;
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
  welcome_offer_discount_percent: number | null;
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
  // Student offer
  student_offer_enabled: boolean;
  student_offer_description: string | null;
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
  planning_intent: PlanningIntent | null;
  planning_message: string | null;
  planning_message_expires: string | null;
  booking_message: string | null;
  // Auto booking
  auto_booking_enabled: boolean;
  deposit_link: string | null;
  deposit_link_label: string | null;
  deposit_link_2: string | null;
  deposit_link_2_label: string | null;
  deposit_percent: number | null;
  deposit_amount: number | null;
  deposit_deadline_hours: number | null;
  deposit_only_for_new_customers: boolean;
  // Customer self-service booking edit
  allow_customer_cancel: boolean;
  allow_customer_reschedule: boolean;
  cancel_deadline_days: number;
  reschedule_deadline_days: number;
  // Public page link on loyalty card
  show_public_page_on_card: boolean;
  signup_source: string | null;
  locale: 'fr' | 'en';
  deleted_at: string | null;
  // Booking mode (free = merchant sets opening hours, system computes availability)
  booking_mode: 'slots' | 'free';
  buffer_minutes: 0 | 10 | 15 | 30;
  // Horizon de réservation : jusqu'à combien de jours à l'avance la cliente peut réserver (mig 168)
  booking_horizon_days: 30 | 60 | 90;
  // Service à domicile — calcul durée de trajet entre RDV
  home_service_enabled: boolean;
  shop_lat: number | null;
  shop_lng: number | null;
  hide_address_on_public_page: boolean;
  // Monthly contest
  contest_enabled: boolean;
  contest_prize: string | null;
  contest_missing_prize_alerted_at: string | null;
  // Gift cards (bons cadeaux — mig 138, services mig 140, payment links mig 141)
  gift_card_enabled: boolean;
  gift_card_amounts: number[];
  gift_card_message: string | null;
  gift_card_services_enabled: boolean;
  gift_card_payment_link: string | null;
  gift_card_payment_link_label: string | null;
  gift_card_payment_link_2: string | null;
  gift_card_payment_link_2_label: string | null;
  gift_card_expiry_months: number | null;
  // Email deliverability
  email_bounced_at: string | null;
  email_unsubscribed_at: string | null;
  // Trial marketing SMS (mig 115 + 122)
  celebration_sms_sent_at: string | null;
  pre_loss_sms_sent_at: string | null;
  churn_sms_sent_at: string | null;
  marketing_sms_opted_out: boolean;
  // SMS quota prorata (mig 118)
  sms_quota_override: number | null;
  sms_quota_override_cycle_anchor: string | null;
  sms_alert_90_sent_cycle: string | null;
}

export type BookingMode = 'slots' | 'free';

export interface FreeSlotCandidate {
  slot_date: string;   // "YYYY-MM-DD"
  start_time: string;  // "HH:MM"
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
  customer_message?: string | null; // note libre saisie par la cliente à la résa — distincte de notes (côté merchant)
  deposit_confirmed: boolean | null;
  deposit_deadline_at: string | null;
  booked_online: boolean;
  booked_at: string | null;
  primary_slot_id: string | null;
  total_duration_minutes: number | null;
  attendance_status?: 'pending' | 'attended' | 'no_show' | 'cancelled' | null;
  created_at: string;
  custom_service_name?: string | null;
  custom_service_duration?: number | null;
  custom_service_price?: number | null;
  custom_service_color?: string | null;
  // Service à domicile
  customer_address?: string | null;
  customer_lat?: number | null;
  customer_lng?: number | null;
  travel_time_minutes?: number | null;
  travel_time_overridden?: boolean;
  // Réductions appliquées (snapshots, mig 153)
  applied_offer_id?: string | null;
  applied_offer_percent?: number | null;
  applied_welcome_percent?: number | null;
  planning_slot_services?: PlanningSlotService[];
  planning_slot_photos?: PlanningSlotPhoto[];
  planning_slot_result_photos?: PlanningSlotResultPhoto[];
  customer?: { instagram_handle: string | null; tiktok_handle: string | null; facebook_url: string | null } | null;
}

export interface BookingDepositFailure {
  id: string;
  merchant_id: string;
  customer_id: string | null;
  client_name: string;
  client_phone: string | null;
  service_ids: string[];
  custom_service_name: string | null;
  custom_service_duration: number | null;
  custom_service_price: number | null;
  custom_service_color: string | null;
  original_slot_date: string;
  original_start_time: string;
  total_duration_minutes: number | null;
  notes: string | null;
  deposit_amount: number | null;
  expired_at: string;
  created_at: string;
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

// ============================================
// Gift cards (mig 138)
// ============================================

export type GiftCardStatus =
  | 'pending_payment'  // commande passée, attente validation paiement merchant
  | 'active'           // payé, voucher émis, destinataire notifié
  | 'used'             // voucher consommé (lookup via voucher_id)
  | 'cancelled'        // annulé par merchant ou auto-cancel après 3j sans paiement
  | 'expired';         // 3 mois après paid_at sans utilisation

export type GiftCardCancellationReason = 'merchant' | 'auto_expired_3d' | 'no_payment';

export type GiftCardKind = 'amount' | 'services';

// Snapshot d'une prestation au moment de la commande (mig 140)
// Sert de fallback si le service est supprimé/renommé après commande.
// L'affichage prend en priorité le LIVE depuis merchant_services.
export interface GiftCardServiceSnapshot {
  id: string;
  name: string;
  price: number;
}

export interface GiftCard {
  id: string;
  merchant_id: string;
  code: string;
  amount: number;
  // Type de cadeau (mig 140)
  kind: GiftCardKind;
  service_ids: string[] | null;
  service_snapshot: GiftCardServiceSnapshot[] | null;
  // Offreur
  sender_first_name: string;
  sender_last_name: string | null;
  sender_phone: string;
  sender_phone_country: string | null;
  sender_email: string;
  sender_message: string | null;
  // Destinataire
  recipient_first_name: string;
  recipient_last_name: string | null;
  recipient_phone: string;
  recipient_phone_country: string | null;
  recipient_email: string | null;
  // État
  status: GiftCardStatus;
  voucher_id: string | null;
  recipient_customer_id: string | null;
  paid_at: string | null;
  used_at: string | null;
  cancelled_at: string | null;
  cancellation_reason: GiftCardCancellationReason | null;
  expires_at: string | null;
  pdf_url: string | null;
  scheduled_send_at: string | null;  // mig 142 : date d'envoi future (NULL = immédiat)
  notified_at: string | null;        // mig 142 : timestamp envoi effectif destinataire
  created_at: string;
  updated_at: string;
}

export interface MerchantContest {
  id: string;
  merchant_id: string;
  contest_month: string;
  prize_description: string;
  winner_customer_id: string | null;
  winner_name: string | null;
  winner_phone: string | null;
  participants_count: number;
  drawn_at: string | null;
  created_at: string;
}

export interface Customer {
  id: string;
  merchant_id: string;
  phone_number: string;
  first_name: string;
  last_name: string | null;
  email: string | null;
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
  source: 'birthday' | 'referral' | 'redemption' | 'welcome' | 'offer' | 'gift' | null;
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
  discount_percent?: number | null;
  skip_deposit?: boolean;
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

/** Statut d'un achat de pack SMS — reflète le CHECK contrainte de `sms_pack_purchases` (mig 112). */
export type SmsPackPurchaseStatus = 'pending' | 'paid' | 'failed' | 'refunded';

/** Row de `sms_pack_purchases` côté client (champs sélectionnés depuis les routes API). */
export interface SmsPackPurchase {
  id: string;
  pack_size: number;
  amount_ttc_cents: number;
  status: SmsPackPurchaseStatus;
  paid_at: string | null;
  created_at: string;
  stripe_invoice_id: string | null;
}

declare global {
  interface Window {
    fbq?: (action: string, event: string, params?: Record<string, unknown>) => void;
    standalone?: boolean;
  }
  interface Navigator {
    standalone?: boolean;
  }
}
