import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  createTestCustomer,
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
import { GET, POST } from '@/app/api/customers/register/route';

// Helper to create mock request
function createMockRequest(body?: any, searchParams?: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/customers/register');
  if (searchParams) {
    Object.entries(searchParams).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
  }

  return {
    json: async () => body || {},
    url: url.toString(),
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

describe('/api/customers/register', () => {
  beforeEach(() => {
    resetTestDb();
    vi.clearAllMocks();
  });

  describe('GET - Search customer by phone', () => {
    it('should require authentication', async () => {
      mockUser = null;

      const merchant = createTestMerchant();
      const request = createMockRequest(undefined, {
        phone: '0612345678',
        merchant_id: merchant.id,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
    });

    it('should find customer for specific merchant only', async () => {
      const merchantA = createTestMerchant();
      const merchantB = createTestMerchant();
      mockUser = { id: merchantA.user_id };

      // Create customer for merchant A
      createTestCustomer({
        phone_number: '0612345678',
        merchant_id: merchantA.id,
        first_name: 'Jean',
      });

      // Search for customer at merchant A - should find
      const requestA = createMockRequest(undefined, {
        phone: '0612345678',
        merchant_id: merchantA.id,
      });

      const responseA = await GET(requestA);
      const dataA = await responseA.json();

      expect(dataA.exists).toBe(true);
      expect(dataA.existsForMerchant).toBe(true);
      expect(dataA.customer.first_name).toBe('Jean');
    });

    it('should return existsGlobally if customer exists for another merchant', async () => {
      const merchantA = createTestMerchant();
      const merchantB = createTestMerchant();
      mockUser = { id: merchantB.user_id };

      // Create customer for merchant A
      createTestCustomer({
        phone_number: '0612345678',
        merchant_id: merchantA.id,
        first_name: 'Jean',
      });

      // Search for customer at merchant B - should find globally but not for merchant
      const request = createMockRequest(undefined, {
        phone: '0612345678',
        merchant_id: merchantB.id,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.exists).toBe(true);
      expect(data.existsForMerchant).toBe(false);
      expect(data.existsGlobally).toBe(true);
    });

    it('should return exists=false for unknown phone', async () => {
      const merchant = createTestMerchant();
      mockUser = { id: merchant.user_id };

      const request = createMockRequest(undefined, {
        phone: '0699999999',
        merchant_id: merchant.id,
      });

      const response = await GET(request);
      const data = await response.json();

      expect(data.exists).toBe(false);
      expect(data.customer).toBeNull();
    });
  });

  describe('POST - Create customer', () => {
    it('should require authentication', async () => {
      mockUser = null;

      const merchant = createTestMerchant();
      const request = createMockRequest({
        phone_number: '0612345678',
        first_name: 'Jean',
        merchant_id: merchant.id,
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });

    it('should create customer for specific merchant', async () => {
      const merchant = createTestMerchant();
      mockUser = { id: merchant.user_id };

      const request = createMockRequest({
        phone_number: '0612345678',
        first_name: 'Jean',
        last_name: 'Dupont',
        merchant_id: merchant.id,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.customer).toBeDefined();
      expect(data.customer.first_name).toBe('Jean');
      expect(data.customer.merchant_id).toBe(merchant.id);
    });

    it('should return existing customer if already exists for merchant', async () => {
      const merchant = createTestMerchant();
      mockUser = { id: merchant.user_id };

      // Create existing customer
      const existingCustomer = createTestCustomer({
        phone_number: '0612345678',
        merchant_id: merchant.id,
        first_name: 'ExistingJean',
      });

      const request = createMockRequest({
        phone_number: '0612345678',
        first_name: 'NewJean',
        merchant_id: merchant.id,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.customer.id).toBe(existingCustomer.id);
      expect(data.customer.first_name).toBe('ExistingJean');
    });

    it('should create separate customers for different merchants', async () => {
      const merchantA = createTestMerchant();
      const merchantB = createTestMerchant();

      // Create customer for merchant A
      mockUser = { id: merchantA.user_id };
      const requestA = createMockRequest({
        phone_number: '0612345678',
        first_name: 'Jean',
        merchant_id: merchantA.id,
      });
      await POST(requestA);

      // Create customer for merchant B
      mockUser = { id: merchantB.user_id };
      const requestB = createMockRequest({
        phone_number: '0612345678',
        first_name: 'Jean',
        merchant_id: merchantB.id,
      });
      await POST(requestB);

      // Verify 2 customers were created
      const customersWithPhone = testDb.customers.filter(
        (c) => c.phone_number === '0612345678'
      );
      expect(customersWithPhone).toHaveLength(2);

      const merchantIds = new Set(customersWithPhone.map((c) => c.merchant_id));
      expect(merchantIds.size).toBe(2);
    });

    it('should reject if user does not own the merchant', async () => {
      const merchant = createTestMerchant();
      mockUser = { id: 'different-user-id' }; // Wrong user

      const request = createMockRequest({
        phone_number: '0612345678',
        first_name: 'Jean',
        merchant_id: merchant.id,
      });

      const response = await POST(request);
      expect(response.status).toBe(403);
    });
  });
});
