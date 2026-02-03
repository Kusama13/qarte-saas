import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  createTestCustomer,
  generateUUID,
} from '../mocks/supabase';

// Mock supabase
vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseAdmin } = await import('../mocks/supabase');
  return {
    getSupabaseAdmin: () => mockSupabaseAdmin,
    supabase: mockSupabaseAdmin,
  };
});

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

  describe('GET - Search customer by phone (PUBLIC endpoint)', () => {
    it('should return 404 for unknown merchant', async () => {
      const request = createMockRequest(undefined, {
        phone: '0612345678',
        merchant_id: generateUUID(),
      });

      const response = await GET(request);
      expect(response.status).toBe(404);
    });

    it('should find customer for specific merchant only', async () => {
      const merchantA = createTestMerchant();

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

  describe('POST - Create customer (PUBLIC endpoint)', () => {
    it('should return 404 for unknown merchant', async () => {
      const request = createMockRequest({
        phone_number: '0612345678',
        first_name: 'Jean',
        merchant_id: generateUUID(),
      });

      const response = await POST(request);
      expect(response.status).toBe(404);
    });

    it('should create customer for specific merchant', async () => {
      const merchant = createTestMerchant();

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
      const requestA = createMockRequest({
        phone_number: '0612345678',
        first_name: 'Jean',
        merchant_id: merchantA.id,
      });
      await POST(requestA);

      // Create customer for merchant B
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
  });
});
