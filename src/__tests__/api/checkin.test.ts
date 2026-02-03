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
let testIpCounter = 0;

// Mock the supabase module before importing the route
vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseAdmin } = await import('../mocks/supabase');
  return {
    getSupabaseAdmin: () => mockSupabaseAdmin,
    supabase: mockSupabaseAdmin,
  };
});

// Mock utils
vi.mock('@/lib/utils', () => ({
  formatPhoneNumber: (phone: string) => phone.replace(/\s/g, ''),
  validateFrenchPhone: (phone: string) => /^0[67]\d{8}$/.test(phone),
  getTodayInParis: () => new Date().toISOString().split('T')[0],
  getTrialStatus: () => ({ isInGracePeriod: false, isFullyExpired: false }),
}));

// Import after mocks
import { POST } from '@/app/api/checkin/route';

// Helper to create mock request with unique IP to avoid rate limiting
function createMockRequest(body: any): NextRequest {
  testIpCounter++;
  const uniqueIp = `192.168.1.${testIpCounter}`;
  return {
    json: async () => body,
    headers: {
      get: (name: string) => (name === 'x-forwarded-for' ? uniqueIp : null),
    },
  } as unknown as NextRequest;
}

describe('/api/checkin', () => {
  beforeEach(() => {
    resetTestDb();
    vi.clearAllMocks();
  });

  describe('Multi-merchant scenarios', () => {
    it('should NOT find customer from another merchant with same phone number', async () => {
      // Setup: Create 2 merchants
      const merchantA = createTestMerchant({ scan_code: 'MERCHANT_A' });
      const merchantB = createTestMerchant({ scan_code: 'MERCHANT_B' });

      // Create customer for merchant A with phone 0612345678
      const customerA = createTestCustomer({
        phone_number: '0612345678',
        merchant_id: merchantA.id,
        first_name: 'Jean',
      });

      // Create loyalty card for customer A at merchant A
      createTestLoyaltyCard({
        customer_id: customerA.id,
        merchant_id: merchantA.id,
        current_stamps: 5,
      });

      // Try to checkin at merchant B with the same phone
      // This should NOT find customerA (different merchant)
      const request = createMockRequest({
        scan_code: 'MERCHANT_B',
        phone_number: '0612345678',
        // No first_name = should ask for registration
      });

      const response = await POST(request);
      const data = await response.json();

      // Should require registration because customer doesn't exist for merchant B
      expect(response.status).toBe(400);
      expect(data.needs_registration).toBe(true);
    });

    it('should find correct customer for the specific merchant', async () => {
      // Setup: Create merchant
      const merchant = createTestMerchant({ scan_code: 'TEST_MERCHANT' });

      // Create customer for this merchant
      const customer = createTestCustomer({
        phone_number: '0612345678',
        merchant_id: merchant.id,
        first_name: 'Jean',
      });

      // Create loyalty card
      createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 5,
      });

      // Checkin with the same merchant
      const request = createMockRequest({
        scan_code: 'TEST_MERCHANT',
        phone_number: '0612345678',
      });

      const response = await POST(request);
      const data = await response.json();

      // Should succeed and add points
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.current_stamps).toBe(6); // 5 + 1
    });

    it('should create separate customers for each merchant', async () => {
      // Setup: Create 2 merchants
      const merchantA = createTestMerchant({ scan_code: 'MERCHANT_A' });
      const merchantB = createTestMerchant({ scan_code: 'MERCHANT_B' });

      // Register new customer at merchant A
      const requestA = createMockRequest({
        scan_code: 'MERCHANT_A',
        phone_number: '0698765432',
        first_name: 'Pierre',
        last_name: 'Dupont',
      });

      const responseA = await POST(requestA);
      const dataA = await responseA.json();

      expect(responseA.status).toBe(200);
      expect(dataA.success).toBe(true);

      // Register same phone at merchant B
      const requestB = createMockRequest({
        scan_code: 'MERCHANT_B',
        phone_number: '0698765432',
        first_name: 'Pierre',
        last_name: 'Dupont',
      });

      const responseB = await POST(requestB);
      const dataB = await responseB.json();

      expect(responseB.status).toBe(200);
      expect(dataB.success).toBe(true);

      // Verify 2 separate customer records were created
      const customersWithPhone = testDb.customers.filter(
        (c) => c.phone_number === '0698765432'
      );
      expect(customersWithPhone).toHaveLength(2);

      // Verify each customer has different merchant_id
      const merchantIds = customersWithPhone.map((c) => c.merchant_id);
      expect(merchantIds).toContain(merchantA.id);
      expect(merchantIds).toContain(merchantB.id);
    });
  });

  describe('Basic checkin flow', () => {
    it('should return error for invalid phone number', async () => {
      const merchant = createTestMerchant({ scan_code: 'TEST' });

      const request = createMockRequest({
        scan_code: 'TEST',
        phone_number: '123', // Invalid
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('invalide');
    });

    it('should return error for unknown merchant', async () => {
      const request = createMockRequest({
        scan_code: 'UNKNOWN_CODE',
        phone_number: '0612345678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('introuvable');
    });

    it('should require first_name for new customers', async () => {
      const merchant = createTestMerchant({ scan_code: 'TEST' });

      const request = createMockRequest({
        scan_code: 'TEST',
        phone_number: '0612345678',
        // No first_name
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.needs_registration).toBe(true);
    });

    it('should create customer and loyalty card for new registration', async () => {
      const merchant = createTestMerchant({ scan_code: 'TEST' });

      const request = createMockRequest({
        scan_code: 'TEST',
        phone_number: '0612345678',
        first_name: 'Jean',
        last_name: 'Dupont',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.current_stamps).toBe(1);

      // Verify customer was created
      const customer = testDb.customers.find((c) => c.phone_number === '0612345678');
      expect(customer).toBeDefined();
      expect(customer?.merchant_id).toBe(merchant.id);

      // Verify loyalty card was created
      const card = testDb.loyalty_cards.find((c) => c.customer_id === customer?.id);
      expect(card).toBeDefined();
      expect(card?.merchant_id).toBe(merchant.id);
    });
  });

  describe('Banned numbers', () => {
    it('should reject banned phone numbers', async () => {
      const merchant = createTestMerchant({ scan_code: 'TEST' });

      // Add banned number
      testDb.banned_numbers.push({
        id: generateUUID(),
        phone_number: '0612345678',
        merchant_id: merchant.id,
      });

      const request = createMockRequest({
        scan_code: 'TEST',
        phone_number: '0612345678',
        first_name: 'Jean',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.banned).toBe(true);
    });
  });

  describe('Tier rewards', () => {
    it('should unlock tier 1 reward when threshold reached', async () => {
      const merchant = createTestMerchant({
        scan_code: 'TEST',
        stamps_required: 5,
        tier2_enabled: false,
      });

      const customer = createTestCustomer({
        phone_number: '0612345678',
        merchant_id: merchant.id,
      });

      createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 4, // 1 more needed
      });

      const request = createMockRequest({
        scan_code: 'TEST',
        phone_number: '0612345678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.current_stamps).toBe(5);
      expect(data.reward_unlocked).toBe(true);
      expect(data.reward_tier).toBe(1);
    });

    it('should not unlock reward if already redeemed', async () => {
      const merchant = createTestMerchant({
        scan_code: 'TEST',
        stamps_required: 5,
        tier2_enabled: false,
      });

      const customer = createTestCustomer({
        phone_number: '0612345678',
        merchant_id: merchant.id,
      });

      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 4,
      });

      // Add existing redemption
      testDb.redemptions.push({
        id: generateUUID(),
        loyalty_card_id: card.id,
        tier: 1,
      });

      const request = createMockRequest({
        scan_code: 'TEST',
        phone_number: '0612345678',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.current_stamps).toBe(5);
      expect(data.reward_unlocked).toBe(false);
      expect(data.tier1_redeemed).toBe(true);
    });
  });

  describe('Article mode', () => {
    it('should add multiple points in article mode', async () => {
      const merchant = createTestMerchant({
        scan_code: 'TEST',
        loyalty_mode: 'article',
      });

      const customer = createTestCustomer({
        phone_number: '0612345678',
        merchant_id: merchant.id,
      });

      createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 2,
      });

      const request = createMockRequest({
        scan_code: 'TEST',
        phone_number: '0612345678',
        points_to_add: 3,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.current_stamps).toBe(5); // 2 + 3
      expect(data.points_earned).toBe(3);
    });
  });
});
