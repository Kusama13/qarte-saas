import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  createTestOffer,
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

import { GET, POST, DELETE } from '@/app/api/offers/route';

// Helper to create a GET request with URL and query params
function createMockGetRequest(url: string): NextRequest {
  return {
    url,
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

// Helper to create a POST/DELETE request with JSON body
function createMockJsonRequest(body: any, url?: string): NextRequest {
  return {
    url: url || 'http://localhost:3000/api/offers',
    json: async () => body,
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

describe('/api/offers', () => {
  beforeEach(() => {
    resetTestDb();
    setMockAuthUser(null);
    vi.clearAllMocks();
  });

  describe('GET', () => {
    it('should return active offer for merchant', async () => {
      const userId = generateUUID();
      const merchant = createTestMerchant({
        user_id: userId,
        offer_active: true,
        offer_title: 'Promo été',
        offer_description: '-20% sur tout le magasin',
        offer_image_url: null,
        offer_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        offer_duration_days: 7,
        offer_created_at: new Date().toISOString(),
        pwa_offer_text: null,
      });

      setMockAuthUser({ id: userId });

      const request = createMockGetRequest(
        `http://localhost:3000/api/offers?merchantId=${merchant.id}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.offer).toBeDefined();
      expect(data.offer.active).toBe(true);
      expect(data.offer.title).toBe('Promo été');
      expect(data.offer.description).toBe('-20% sur tout le magasin');
      expect(data.offer.isExpired).toBe(false);
    });

    it('should return inactive offer when expired (expires_at in past)', async () => {
      const userId = generateUUID();
      const merchant = createTestMerchant({
        user_id: userId,
        offer_active: true,
        offer_title: 'Offre passée',
        offer_description: 'Ancienne promo',
        offer_image_url: null,
        offer_expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
        offer_duration_days: 1,
        offer_created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        pwa_offer_text: null,
      });

      setMockAuthUser({ id: userId });

      const request = createMockGetRequest(
        `http://localhost:3000/api/offers?merchantId=${merchant.id}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.offer).toBeDefined();
      expect(data.offer.active).toBe(false);
      expect(data.offer.isExpired).toBe(true);
    });

    it('should return inactive offer when offer_active is false', async () => {
      const userId = generateUUID();
      const merchant = createTestMerchant({
        user_id: userId,
        offer_active: false,
        offer_title: 'Offre désactivée',
        offer_description: 'Promo inactive',
        offer_image_url: null,
        offer_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        offer_duration_days: 7,
        offer_created_at: new Date().toISOString(),
        pwa_offer_text: null,
      });

      setMockAuthUser({ id: userId });

      const request = createMockGetRequest(
        `http://localhost:3000/api/offers?merchantId=${merchant.id}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.offer).toBeDefined();
      expect(data.offer.active).toBe(false);
    });

    it('should return 400 when merchantId is missing', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/offers');

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('merchantId required');
    });

    it('should return 401 when not authenticated', async () => {
      const merchant = createTestMerchant();
      setMockAuthUser(null);

      const request = createMockGetRequest(
        `http://localhost:3000/api/offers?merchantId=${merchant.id}`
      );

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
    });
  });

  describe('POST', () => {
    it('should create an offer with valid data', async () => {
      const userId = generateUUID();
      const merchant = createTestMerchant({ user_id: userId });

      setMockAuthUser({ id: userId });

      const request = createMockJsonRequest({
        merchantId: merchant.id,
        title: 'Nouvelle offre',
        description: '-15% sur les boissons',
        durationDays: 7,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.expiresAt).toBeDefined();

      // Verify the merchant was updated in testDb
      const updatedMerchant = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updatedMerchant?.offer_active).toBe(true);
      expect(updatedMerchant?.offer_title).toBe('Nouvelle offre');
      expect(updatedMerchant?.offer_description).toBe('-15% sur les boissons');
    });

    it('should clamp duration to max 30 days', async () => {
      const userId = generateUUID();
      const merchant = createTestMerchant({ user_id: userId });

      setMockAuthUser({ id: userId });

      const request = createMockJsonRequest({
        merchantId: merchant.id,
        title: 'Offre longue',
        description: 'Essai trop long',
        durationDays: 999, // way over 30
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify duration was clamped to 30
      const updatedMerchant = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updatedMerchant?.offer_duration_days).toBe(30);
    });

    it('should reject POST without authentication (401)', async () => {
      const merchant = createTestMerchant();
      setMockAuthUser(null);

      const request = createMockJsonRequest({
        merchantId: merchant.id,
        title: 'Offre test',
        description: 'Description',
        durationDays: 3,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it('should reject POST from non-owner (403)', async () => {
      const merchant = createTestMerchant({ user_id: generateUUID() });
      const otherUserId = generateUUID();

      setMockAuthUser({ id: otherUserId });

      const request = createMockJsonRequest({
        merchantId: merchant.id,
        title: 'Offre piratée',
        description: 'Tentative non autorisée',
        durationDays: 3,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
    });

    it('should reject POST without title or description', async () => {
      const userId = generateUUID();
      const merchant = createTestMerchant({ user_id: userId });

      setMockAuthUser({ id: userId });

      const request = createMockJsonRequest({
        merchantId: merchant.id,
        // no title or description
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('title and description required');
    });
  });

  describe('DELETE', () => {
    it('should deactivate an offer', async () => {
      const userId = generateUUID();
      const merchant = createTestMerchant({
        user_id: userId,
        offer_active: true,
        offer_title: 'Offre active',
        offer_description: 'A désactiver',
      });

      setMockAuthUser({ id: userId });

      const request = createMockGetRequest(
        `http://localhost:3000/api/offers?merchantId=${merchant.id}`
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify the merchant's offer was deactivated
      const updatedMerchant = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updatedMerchant?.offer_active).toBe(false);
    });

    it('should reject DELETE without authentication (401)', async () => {
      const merchant = createTestMerchant({ offer_active: true });
      setMockAuthUser(null);

      const request = createMockGetRequest(
        `http://localhost:3000/api/offers?merchantId=${merchant.id}`
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(401);
    });

    it('should reject DELETE from non-owner (403)', async () => {
      const merchant = createTestMerchant({ user_id: generateUUID(), offer_active: true });
      const otherUserId = generateUUID();

      setMockAuthUser({ id: otherUserId });

      const request = createMockGetRequest(
        `http://localhost:3000/api/offers?merchantId=${merchant.id}`
      );

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(403);
    });

    it('should return 400 when merchantId is missing', async () => {
      const request = createMockGetRequest('http://localhost:3000/api/offers');

      const response = await DELETE(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('merchantId required');
    });
  });
});
