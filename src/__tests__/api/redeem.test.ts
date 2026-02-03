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

// Mock auth user
let mockUser: any = null;

// Mock supabase
vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseAdmin } = await import('../mocks/supabase');
  return {
    getSupabaseAdmin: () => mockSupabaseAdmin,
    supabase: mockSupabaseAdmin,
  };
});

// Mock auth helpers
vi.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => ({
    auth: {
      getUser: async () => ({
        data: { user: mockUser },
        error: mockUser ? null : { message: 'Not authenticated' },
      }),
    },
    from: (table: string) => {
      const { mockSupabaseAdmin } = require('../mocks/supabase');
      return mockSupabaseAdmin.from(table);
    },
  }),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({}),
}));

// Import after mocks
import { POST } from '@/app/api/redeem/route';

// Helper to create mock request
function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

describe('/api/redeem', () => {
  beforeEach(() => {
    resetTestDb();
    vi.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should require authentication', async () => {
      mockUser = null;

      const request = createMockRequest({
        loyalty_card_id: generateUUID(),
        tier: 1,
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it('should reject if user does not own the merchant', async () => {
      const merchant = createTestMerchant();
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 10,
      });

      mockUser = { id: 'different-user-id' }; // Wrong user

      const request = createMockRequest({
        loyalty_card_id: card.id,
        tier: 1,
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Basic redemption', () => {
    it('should successfully redeem tier 1 reward', async () => {
      const merchant = createTestMerchant({
        stamps_required: 10,
        tier2_enabled: false,
      });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 10,
      });

      mockUser = { id: merchant.user_id };

      const request = createMockRequest({
        loyalty_card_id: card.id,
        tier: 1,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tier).toBe(1);
      expect(data.stamps_reset).toBe(true);

      // Verify redemption was recorded
      const redemption = testDb.redemptions.find(
        (r) => r.loyalty_card_id === card.id
      );
      expect(redemption).toBeDefined();
      expect(redemption?.tier).toBe(1);
    });

    it('should reject if not enough stamps', async () => {
      const merchant = createTestMerchant({ stamps_required: 10 });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 5, // Not enough
      });

      mockUser = { id: merchant.user_id };

      const request = createMockRequest({
        loyalty_card_id: card.id,
        tier: 1,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('assez');
    });

    it('should return 404 for unknown card', async () => {
      const merchant = createTestMerchant();
      mockUser = { id: merchant.user_id };

      const request = createMockRequest({
        loyalty_card_id: generateUUID(),
        tier: 1,
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Tier 2 rewards', () => {
    it('should reject tier 2 if not enabled', async () => {
      const merchant = createTestMerchant({
        stamps_required: 10,
        tier2_enabled: false,
      });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 20,
      });

      mockUser = { id: merchant.user_id };

      const request = createMockRequest({
        loyalty_card_id: card.id,
        tier: 2,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('palier 2');
    });

    it('should successfully redeem tier 2 reward', async () => {
      const merchant = createTestMerchant({
        stamps_required: 10,
        tier2_enabled: true,
        tier2_stamps_required: 20,
      });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 20,
      });

      mockUser = { id: merchant.user_id };

      const request = createMockRequest({
        loyalty_card_id: card.id,
        tier: 2,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.tier).toBe(2);
      expect(data.stamps_reset).toBe(true);
    });
  });

  describe('Tier 1 with Tier 2 enabled', () => {
    it('should not reset stamps when redeeming tier 1 if tier 2 is enabled', async () => {
      const merchant = createTestMerchant({
        stamps_required: 10,
        tier2_enabled: true,
        tier2_stamps_required: 20,
      });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 15,
      });

      mockUser = { id: merchant.user_id };

      const request = createMockRequest({
        loyalty_card_id: card.id,
        tier: 1,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.stamps_reset).toBe(false); // Should NOT reset
    });

    it('should reject tier 1 if already redeemed in current cycle', async () => {
      const merchant = createTestMerchant({
        stamps_required: 10,
        tier2_enabled: true,
        tier2_stamps_required: 20,
      });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 15,
      });

      // Add existing tier 1 redemption
      testDb.redemptions.push({
        id: generateUUID(),
        loyalty_card_id: card.id,
        tier: 1,
        redeemed_at: new Date().toISOString(),
      });

      mockUser = { id: merchant.user_id };

      const request = createMockRequest({
        loyalty_card_id: card.id,
        tier: 1,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('palier 1');
    });
  });

  describe('Multi-merchant isolation', () => {
    it('should only allow merchant owner to redeem customer rewards', async () => {
      const merchantA = createTestMerchant();
      const merchantB = createTestMerchant();

      const customerA = createTestCustomer({ merchant_id: merchantA.id });
      const cardA = createTestLoyaltyCard({
        customer_id: customerA.id,
        merchant_id: merchantA.id,
        current_stamps: 10,
      });

      // Try to redeem with merchant B's owner
      mockUser = { id: merchantB.user_id };

      const request = createMockRequest({
        loyalty_card_id: cardA.id,
        tier: 1,
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });
});
