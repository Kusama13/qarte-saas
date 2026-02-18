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

vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseAdmin, mockSupabaseWithAuth } = await import('../mocks/supabase');
  return {
    getSupabaseAdmin: () => mockSupabaseAdmin,
    createRouteHandlerSupabaseClient: async () => mockSupabaseWithAuth,
    supabase: mockSupabaseAdmin,
  };
});

let mockPhone: string | null = null;
vi.mock('@/lib/customer-auth', () => ({
  getAuthenticatedPhone: () => mockPhone,
}));

import { PUT } from '@/app/api/customers/birthday/route';

function createJsonRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: {
      get: () => null,
    },
    cookies: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

describe('/api/customers/birthday', () => {
  beforeEach(() => {
    resetTestDb();
    vi.clearAllMocks();
    mockPhone = null;
  });

  describe('PUT /api/customers/birthday', () => {
    it('sets birthday once', async () => {
      const merchant = createTestMerchant();
      const customer = createTestCustomer({
        merchant_id: merchant.id,
        phone_number: '0612345678',
        birth_month: null,
        birth_day: null,
      });

      mockPhone = '0612345678';

      const request = createJsonRequest({
        customer_id: customer.id,
        birth_month: 3,
        birth_day: 15,
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify the customer was updated in testDb
      const updatedCustomer = testDb.customers.find((c) => c.id === customer.id);
      expect(updatedCustomer?.birth_month).toBe(3);
      expect(updatedCustomer?.birth_day).toBe(15);
    });

    it('rejects 2nd attempt (already set)', async () => {
      const merchant = createTestMerchant();
      const customer = createTestCustomer({
        merchant_id: merchant.id,
        phone_number: '0612345678',
        birth_month: 3,
        birth_day: 15,
      });

      mockPhone = '0612345678';

      const request = createJsonRequest({
        customer_id: customer.id,
        birth_month: 7,
        birth_day: 20,
      });

      const response = await PUT(request);
      const data = await response.json();

      expect(response.status).toBe(409);
      expect(data.error).toContain('déjà');
    });

    it('rejects invalid date (month=13)', async () => {
      const merchant = createTestMerchant();
      const customer = createTestCustomer({
        merchant_id: merchant.id,
        phone_number: '0612345678',
        birth_month: null,
        birth_day: null,
      });

      mockPhone = '0612345678';

      const request = createJsonRequest({
        customer_id: customer.id,
        birth_month: 13,
        birth_day: 15,
      });

      const response = await PUT(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toContain('invalide');
    });

    it('rejects without auth', async () => {
      // mockPhone stays null — no authenticated phone
      const request = createJsonRequest({
        customer_id: generateUUID(),
        birth_month: 3,
        birth_day: 15,
      });

      const response = await PUT(request);
      expect(response.status).toBe(401);

      const data = await response.json();
      expect(data.error).toContain('authentifié');
    });
  });
});
