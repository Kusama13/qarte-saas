import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  createTestCustomer,
  createTestMemberProgram,
  createTestMemberCard,
  setMockAuthUser,
  generateUUID,
} from '../mocks/supabase';

vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseAdmin, mockSupabaseWithAuth } = await import('../mocks/supabase');
  return {
    getSupabaseAdmin: () => mockSupabaseAdmin,
    createRouteHandlerSupabaseClient: async () => mockSupabaseWithAuth,
    supabase: mockSupabaseAdmin,
  };
});

import { GET, POST } from '@/app/api/member-programs/route';
import { POST as POST_CARD } from '@/app/api/member-cards/route';

function createJsonRequest(body: any, url = 'http://localhost/api'): NextRequest {
  return {
    json: async () => body,
    url,
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

describe('/api/member-programs', () => {
  beforeEach(() => {
    resetTestDb();
    vi.clearAllMocks();
    setMockAuthUser(null);
  });

  describe('POST /api/member-programs', () => {
    it('creates a program', async () => {
      const merchant = createTestMerchant();
      // Auth as the merchant owner
      setMockAuthUser({ id: merchant.user_id, email: 'owner@test.com' });

      const request = createJsonRequest({
        name: 'Gold VIP',
        benefit_label: '-10% sur tout',
        duration_months: 12,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.program).toBeDefined();
      expect(data.program.name).toBe('Gold VIP');
      expect(data.program.benefit_label).toBe('-10% sur tout');
      expect(data.program.duration_months).toBe(12);
      expect(data.program.is_active).toBe(true);
      expect(data.program.merchant_id).toBe(merchant.id);

      // Verify it was persisted in testDb
      expect(testDb.member_programs).toHaveLength(1);
      expect(testDb.member_programs[0].name).toBe('Gold VIP');
    });

    it('rejects without auth', async () => {
      // No auth user set (null)
      const request = createJsonRequest({
        name: 'Gold VIP',
        benefit_label: '-10%',
        duration_months: 12,
      });

      const response = await POST(request);
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/member-cards', () => {
    it('assigns customer to program', async () => {
      const merchant = createTestMerchant();
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const program = createTestMemberProgram({
        merchant_id: merchant.id,
        duration_months: 12,
      });

      // Auth as merchant owner — needed by verifyProgramOwnership
      setMockAuthUser({ id: merchant.user_id, email: 'owner@test.com' });

      // The verifyProgramOwnership function does a join: member_programs with merchants.
      // Our mock resolves relations via alias_id convention, so we need
      // the merchants table entry to have id === program.merchant_id
      // The merchant is already in testDb.merchants from createTestMerchant.

      const request = createJsonRequest({
        program_id: program.id,
        customer_id: customer.id,
      });

      const response = await POST_CARD(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.memberCard).toBeDefined();
      expect(data.memberCard.program_id).toBe(program.id);
      expect(data.memberCard.customer_id).toBe(customer.id);

      // Verify persisted
      expect(testDb.member_cards).toHaveLength(1);
    });

    it('calculates valid_until correctly for duration_months=6', async () => {
      const merchant = createTestMerchant();
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const program = createTestMemberProgram({
        merchant_id: merchant.id,
        duration_months: 6,
      });

      setMockAuthUser({ id: merchant.user_id, email: 'owner@test.com' });

      const beforeRequest = Date.now();

      const request = createJsonRequest({
        program_id: program.id,
        customer_id: customer.id,
      });

      const response = await POST_CARD(request);
      const data = await response.json();

      expect(response.status).toBe(200);

      // duration_months=6 → 6*30 = 180 days
      const validUntil = new Date(data.memberCard.valid_until);
      const now = new Date(beforeRequest);
      const diffMs = validUntil.getTime() - now.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      // Should be approximately 180 days (allow +-1 day tolerance)
      expect(diffDays).toBeGreaterThanOrEqual(179);
      expect(diffDays).toBeLessThanOrEqual(181);
    });

    it('rejects duplicate active membership', async () => {
      const merchant = createTestMerchant();
      const customer = createTestCustomer({ merchant_id: merchant.id });
      const program = createTestMemberProgram({
        merchant_id: merchant.id,
        duration_months: 12,
      });

      setMockAuthUser({ id: merchant.user_id, email: 'owner@test.com' });

      // Create an existing member card for this customer/merchant
      createTestMemberCard({
        program_id: program.id,
        customer_id: customer.id,
        merchant_id: merchant.id,
      });

      const request = createJsonRequest({
        program_id: program.id,
        customer_id: customer.id,
      });

      const response = await POST_CARD(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('déjà inscrit');
    });
  });
});
