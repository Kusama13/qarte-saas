import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  createTestCustomer,
  createTestLoyaltyCard,
  generateUUID,
} from '../mocks/supabase';

// Counter to generate unique IPs for each test (avoid rate limiting)
let testIpCounter = 200;

// Mock the supabase module before importing the route
vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseAdmin, mockSupabaseWithAuth } = await import('../mocks/supabase');
  return {
    getSupabaseAdmin: () => mockSupabaseAdmin,
    createRouteHandlerSupabaseClient: async () => mockSupabaseWithAuth,
    supabase: mockSupabaseAdmin,
  };
});

// Mock utils
vi.mock('@/lib/utils', async () => {
  const actual = await vi.importActual('@/lib/utils');
  return {
    ...actual,
    formatPhoneNumber: (phone: string) => phone.replace(/\D/g, '').replace(/^0/, '33'),
    validatePhone: (phone: string) => /^33\d{9}$/.test(phone.replace(/\D/g, '')),
    generateReferralCode: () => 'REF' + Math.random().toString(36).slice(2, 8).toUpperCase(),
    getTrialStatus: (trialEndsAt: string | null, status: string) => {
      if (status === 'active') return { isFullyExpired: false, isInGracePeriod: false };
      if (!trialEndsAt) return { isFullyExpired: true, isInGracePeriod: false };
      return { isFullyExpired: new Date(trialEndsAt) < new Date(), isInGracePeriod: false };
    },
  };
});

// Import after mocks
import { GET, POST } from '@/app/api/referrals/route';

// Helper to create mock GET request
function createMockGetRequest(code: string): NextRequest {
  return {
    url: `http://localhost:3000/api/referrals?code=${code}`,
    headers: { get: () => null },
  } as unknown as NextRequest;
}

// Helper to create mock POST request with unique IP to avoid rate limiting
function createMockPostRequest(body: any): NextRequest {
  testIpCounter++;
  return {
    json: async () => body,
    url: 'http://localhost:3000/api/referrals',
    headers: { get: (name: string) => name === 'x-forwarded-for' ? `10.1.0.${testIpCounter}` : null },
  } as unknown as NextRequest;
}

describe('/api/referrals', () => {
  beforeEach(() => {
    resetTestDb();
    vi.clearAllMocks();
  });

  // ─── GET ────────────────────────────────────────────────────────────

  describe('GET /api/referrals', () => {
    it('returns referral info for valid code', async () => {
      const merchant = createTestMerchant({
        referral_program_enabled: true,
        referral_reward_referred: 'Un cafe offert',
        shop_name: 'Cafe Paris',
        primary_color: '#FF5500',
        logo_url: 'https://example.com/logo.png',
      });

      const customer = createTestCustomer({
        merchant_id: merchant.id,
        first_name: 'Jean',
      });

      createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        referral_code: 'TESTREF',
      });

      const request = createMockGetRequest('TESTREF');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(true);
      expect(data.shop_name).toBe('Cafe Paris');
      expect(data.referrer_name).toBe('Jean');
      expect(data.merchant_id).toBe(merchant.id);
      expect(data.reward_for_you).toBe('Un cafe offert');
      expect(data.primary_color).toBe('#FF5500');
      expect(data.logo_url).toBe('https://example.com/logo.png');
    });

    it('returns valid false for unknown code', async () => {
      const request = createMockGetRequest('UNKNOWN');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
    });

    it('returns valid false if referral program is disabled', async () => {
      const merchant = createTestMerchant({
        referral_program_enabled: false,
        shop_name: 'Disabled Shop',
      });

      const customer = createTestCustomer({
        merchant_id: merchant.id,
        first_name: 'Pierre',
      });

      createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        referral_code: 'DISABLEDREF',
      });

      const request = createMockGetRequest('DISABLEDREF');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.valid).toBe(false);
    });
  });

  // ─── POST ───────────────────────────────────────────────────────────

  describe('POST /api/referrals', () => {
    it('creates customer + card + voucher + referral', async () => {
      const merchant = createTestMerchant({
        referral_program_enabled: true,
        referral_reward_referred: 'Cadeau',
        referral_reward_referrer: 'Bonus parrain',
        shop_name: 'Boutique Test',
        stamps_required: 8,
        subscription_status: 'active',
      });

      const referrerCustomer = createTestCustomer({
        merchant_id: merchant.id,
        phone_number: '33612345678',
        first_name: 'Paul',
      });

      createTestLoyaltyCard({
        customer_id: referrerCustomer.id,
        merchant_id: merchant.id,
        referral_code: 'TESTREF',
      });

      const request = createMockPostRequest({
        referral_code: 'TESTREF',
        phone_number: '0698765432',
        first_name: 'Marie',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.merchant_id).toBe(merchant.id);
      expect(data.referrer_name).toBe('Paul');
      expect(data.referred_reward).toBe('Cadeau');
      expect(data.shop_name).toBe('Boutique Test');

      // Verify new customer was created in testDb
      const newCustomer = testDb.customers.find(
        (c) => c.phone_number === '33698765432' && c.merchant_id === merchant.id
      );
      expect(newCustomer).toBeDefined();
      expect(newCustomer!.first_name).toBe('Marie');

      // Verify loyalty card was created
      const newCard = testDb.loyalty_cards.find(
        (c) => c.customer_id === newCustomer!.id && c.merchant_id === merchant.id
      );
      expect(newCard).toBeDefined();
      expect(newCard!.current_stamps).toBe(0);
      expect(newCard!.stamps_target).toBe(8);

      // Verify voucher was created
      const newVoucher = testDb.vouchers.find(
        (v) => v.customer_id === newCustomer!.id && v.merchant_id === merchant.id
      );
      expect(newVoucher).toBeDefined();
      expect(newVoucher!.reward_description).toBe('Cadeau');

      // Verify referral record was created
      const referral = testDb.referrals.find(
        (r) => r.referred_customer_id === newCustomer!.id && r.merchant_id === merchant.id
      );
      expect(referral).toBeDefined();
      expect(referral!.referrer_customer_id).toBe(referrerCustomer.id);
      expect(referral!.status).toBe('pending');
    });

    it('rejects invalid referral code with 400', async () => {
      const request = createMockPostRequest({
        referral_code: 'INVALID',
        phone_number: '0698765432',
        first_name: 'Marie',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('rejects if trial is fully expired with 403', async () => {
      const merchant = createTestMerchant({
        referral_program_enabled: true,
        referral_reward_referred: 'Cadeau',
        subscription_status: 'trialing',
        trial_ends_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days ago
      });

      const referrerCustomer = createTestCustomer({
        merchant_id: merchant.id,
        phone_number: '33611111111',
        first_name: 'Expired',
      });

      createTestLoyaltyCard({
        customer_id: referrerCustomer.id,
        merchant_id: merchant.id,
        referral_code: 'EXPIREDREF',
      });

      const request = createMockPostRequest({
        referral_code: 'EXPIREDREF',
        phone_number: '0698765432',
        first_name: 'Marie',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBeDefined();
    });

    it('rejects if customer already exists at merchant with 409', async () => {
      const merchant = createTestMerchant({
        referral_program_enabled: true,
        referral_reward_referred: 'Cadeau',
        subscription_status: 'active',
      });

      const referrerCustomer = createTestCustomer({
        merchant_id: merchant.id,
        phone_number: '33611111111',
        first_name: 'Paul',
      });

      createTestLoyaltyCard({
        customer_id: referrerCustomer.id,
        merchant_id: merchant.id,
        referral_code: 'DUPETEST',
      });

      // Create existing customer with the same phone at the same merchant
      createTestCustomer({
        merchant_id: merchant.id,
        phone_number: '33698765432',
        first_name: 'Marie',
      });

      const request = createMockPostRequest({
        referral_code: 'DUPETEST',
        phone_number: '0698765432',
        first_name: 'Marie',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toBeDefined();
    });

    it('rejects invalid phone number with 400', async () => {
      const merchant = createTestMerchant({
        referral_program_enabled: true,
        referral_reward_referred: 'Cadeau',
        subscription_status: 'active',
      });

      const referrerCustomer = createTestCustomer({
        merchant_id: merchant.id,
        phone_number: '33611111111',
        first_name: 'Paul',
      });

      createTestLoyaltyCard({
        customer_id: referrerCustomer.id,
        merchant_id: merchant.id,
        referral_code: 'PHONETEST',
      });

      const request = createMockPostRequest({
        referral_code: 'PHONETEST',
        phone_number: '123',
        first_name: 'Marie',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });
  });
});
