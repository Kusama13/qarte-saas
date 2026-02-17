import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  createTestCustomer,
  createTestLoyaltyCard,
  generateUUID,
  setMockAuthUser,
} from '../mocks/supabase';

// Mock supabase — createRouteHandlerSupabaseClient returns auth-aware client
vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseWithAuth } = await import('../mocks/supabase');
  return {
    createRouteHandlerSupabaseClient: async () => mockSupabaseWithAuth,
    getSupabaseAdmin: () => mockSupabaseWithAuth,
  };
});

// Import after mocks
import { POST } from '@/app/api/adjust-points/route';

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

describe('/api/adjust-points', () => {
  const userId = generateUUID();

  beforeEach(() => {
    resetTestDb();
    vi.clearAllMocks();
    setMockAuthUser({ id: userId });
  });

  describe('Authentication', () => {
    it('should return 401 when not authenticated', async () => {
      setMockAuthUser(null);

      const request = createMockRequest({
        customer_id: generateUUID(),
        merchant_id: generateUUID(),
        loyalty_card_id: generateUUID(),
        adjustment: 1,
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('Validation', () => {
    it('should return 400 for invalid body (missing fields)', async () => {
      const request = createMockRequest({ adjustment: 1 });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('invalide');
    });

    it('should return 400 for non-integer adjustment', async () => {
      const request = createMockRequest({
        customer_id: generateUUID(),
        merchant_id: generateUUID(),
        loyalty_card_id: generateUUID(),
        adjustment: 1.5,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });

    it('should return 400 for non-UUID ids', async () => {
      const request = createMockRequest({
        customer_id: 'not-a-uuid',
        merchant_id: generateUUID(),
        loyalty_card_id: generateUUID(),
        adjustment: 1,
      });

      const response = await POST(request);
      expect(response.status).toBe(400);
    });
  });

  describe('Authorization', () => {
    it('should return 403 when merchant does not belong to user', async () => {
      const otherUserId = generateUUID();
      const merchant = createTestMerchant({ user_id: otherUserId });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
      });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: card.id,
        adjustment: 1,
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });

  describe('Card lookup', () => {
    it('should return 404 when loyalty card not found', async () => {
      const merchant = createTestMerchant({ user_id: userId });
      const customer = createTestCustomer({ merchant_id: merchant.id });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: generateUUID(), // Non-existent card
        adjustment: 1,
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });
  });

  describe('Stamp adjustment', () => {
    it('should add stamps (positive adjustment)', async () => {
      const merchant = createTestMerchant({ user_id: userId, stamps_required: 10 });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 3,
      });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: card.id,
        adjustment: 2,
        reason: 'Bonus fidélité',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.previous_stamps).toBe(3);
      expect(data.new_stamps).toBe(5);
      expect(data.adjustment).toBe(2);
    });

    it('should remove stamps (negative adjustment)', async () => {
      const merchant = createTestMerchant({ user_id: userId, stamps_required: 10 });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 5,
      });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: card.id,
        adjustment: -2,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.new_stamps).toBe(3);
    });

    it('should floor stamps at 0 (no negative stamps)', async () => {
      const merchant = createTestMerchant({ user_id: userId, stamps_required: 10 });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 2,
      });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: card.id,
        adjustment: -5,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.new_stamps).toBe(0);
    });

    it('should create audit log entry', async () => {
      const merchant = createTestMerchant({ user_id: userId, stamps_required: 10 });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 3,
      });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: card.id,
        adjustment: 2,
        reason: 'Erreur corrigée',
      });

      await POST(request);

      const audit = testDb.point_adjustments.find(
        (a) => a.loyalty_card_id === card.id
      );
      expect(audit).toBeDefined();
      expect(audit?.adjustment).toBe(2);
      expect(audit?.reason).toBe('Erreur corrigée');
      expect(audit?.adjusted_by).toBe(userId);
    });
  });

  describe('Tier management', () => {
    it('should auto-create tier 1 redemption when adjusted above threshold', async () => {
      const merchant = createTestMerchant({
        user_id: userId,
        stamps_required: 5,
        tier2_enabled: false,
      });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 3,
      });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: card.id,
        adjustment: 4, // 3 + 4 = 7 >= 5
      });

      await POST(request);

      const tier1Redemption = testDb.redemptions.find(
        (r) => r.loyalty_card_id === card.id && r.tier === 1
      );
      expect(tier1Redemption).toBeDefined();
      expect(tier1Redemption?.stamps_used).toBe(5);
    });

    it('should delete tier 1 redemptions when adjusted below threshold (tier2 enabled)', async () => {
      const merchant = createTestMerchant({
        user_id: userId,
        stamps_required: 5,
        tier2_enabled: true,
        tier2_stamps_required: 10,
      });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 6,
      });

      // Existing tier 1 redemption
      testDb.redemptions.push({
        id: generateUUID(),
        loyalty_card_id: card.id,
        merchant_id: merchant.id,
        customer_id: customer.id,
        tier: 1,
        redeemed_at: new Date().toISOString(),
      });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: card.id,
        adjustment: -3, // 6 - 3 = 3 < 5
      });

      await POST(request);

      const tier1Redemptions = testDb.redemptions.filter(
        (r) => r.loyalty_card_id === card.id && r.tier === 1
      );
      expect(tier1Redemptions).toHaveLength(0);
    });

    it('should auto-create tier 2 redemption when adjusted above tier2 threshold', async () => {
      const merchant = createTestMerchant({
        user_id: userId,
        stamps_required: 5,
        tier2_enabled: true,
        tier2_stamps_required: 10,
      });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 8,
      });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: card.id,
        adjustment: 4, // 8 + 4 = 12 >= 10
      });

      await POST(request);

      const tier1 = testDb.redemptions.find(
        (r) => r.loyalty_card_id === card.id && r.tier === 1
      );
      const tier2 = testDb.redemptions.find(
        (r) => r.loyalty_card_id === card.id && r.tier === 2
      );
      expect(tier1).toBeDefined();
      expect(tier2).toBeDefined();
    });

    it('should not duplicate tier 1 redemption if one already exists', async () => {
      const merchant = createTestMerchant({
        user_id: userId,
        stamps_required: 5,
        tier2_enabled: false,
      });
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const card = createTestLoyaltyCard({
        customer_id: customer.id,
        merchant_id: merchant.id,
        current_stamps: 6,
      });

      // Existing tier 1 redemption
      testDb.redemptions.push({
        id: generateUUID(),
        loyalty_card_id: card.id,
        merchant_id: merchant.id,
        customer_id: customer.id,
        tier: 1,
        redeemed_at: new Date().toISOString(),
      });

      const request = createMockRequest({
        customer_id: customer.id,
        merchant_id: merchant.id,
        loyalty_card_id: card.id,
        adjustment: 2, // 6 + 2 = 8 >= 5, but tier 1 already redeemed
      });

      await POST(request);

      const tier1Redemptions = testDb.redemptions.filter(
        (r) => r.loyalty_card_id === card.id && r.tier === 1
      );
      expect(tier1Redemptions).toHaveLength(1); // Still just 1
    });
  });
});
