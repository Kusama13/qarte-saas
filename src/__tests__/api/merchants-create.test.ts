import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  setMockAuthToken,
  clearMockAuthTokens,
  generateUUID,
} from '../mocks/supabase';

let testIpCounter = 100;

vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseAdmin, mockSupabaseWithAuth } = await import('../mocks/supabase');
  return {
    getSupabaseAdmin: () => mockSupabaseAdmin,
    createRouteHandlerSupabaseClient: async () => mockSupabaseWithAuth,
    supabase: mockSupabaseAdmin,
  };
});

vi.mock('@/lib/email', () => ({
  sendWelcomeEmail: vi.fn().mockResolvedValue(undefined),
  sendNewMerchantNotification: vi.fn().mockResolvedValue(undefined),
  cancelScheduledEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/lib/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/utils', () => ({
  generateScanCode: () => 'SCAN' + Math.random().toString(36).slice(2, 6).toUpperCase(),
  generateReferralCode: () => 'REF' + Math.random().toString(36).slice(2, 8).toUpperCase(),
  formatPhoneNumber: (phone: string) => phone.replace(/\s/g, ''),
}));

import { POST } from '@/app/api/merchants/create/route';

function createMockRequest(body: any, token?: string): NextRequest {
  testIpCounter++;
  const uniqueIp = `10.0.0.${testIpCounter}`;
  return {
    json: async () => body,
    headers: {
      get: (name: string) => {
        if (name === 'x-forwarded-for') return uniqueIp;
        if (name === 'authorization' && token) return `Bearer ${token}`;
        return null;
      },
    },
  } as unknown as NextRequest;
}

describe('POST /api/merchants/create', () => {
  beforeEach(() => {
    resetTestDb();
    clearMockAuthTokens();
    vi.clearAllMocks();
  });

  it('creates merchant with valid Bearer token', async () => {
    const userId = generateUUID();
    setMockAuthToken('valid-token', { id: userId, email: 'test@example.com' });

    const request = createMockRequest(
      {
        user_id: userId,
        slug: 'test-shop',
        shop_name: 'Test Shop',
        shop_type: 'coiffeur',
        phone: '0612345678',
        country: 'FR',
      },
      'valid-token'
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.merchant).toBeDefined();
    expect(data.merchant.shop_name).toBe('Test Shop');
    expect(data.merchant.shop_type).toBe('coiffeur');
    expect(data.merchant.user_id).toBe(userId);
    expect(testDb.merchants.length).toBe(1);
    expect(testDb.merchants[0].user_id).toBe(userId);
  });

  it('rejects without token with 401', async () => {
    const userId = generateUUID();

    const request = createMockRequest({
      user_id: userId,
      slug: 'test-shop',
      shop_name: 'Test Shop',
      shop_type: 'coiffeur',
      phone: '0612345678',
      country: 'FR',
    });

    const response = await POST(request);

    expect(response.status).toBe(401);
    expect(testDb.merchants.length).toBe(0);
  });

  it('rejects if user_id does not match token user with 403', async () => {
    const userA = generateUUID();
    const userB = generateUUID();
    setMockAuthToken('token-a', { id: userA, email: 'a@example.com' });

    const request = createMockRequest(
      {
        user_id: userB,
        slug: 'test-shop',
        shop_name: 'Test Shop',
        shop_type: 'coiffeur',
        phone: '0612345678',
        country: 'FR',
      },
      'token-a'
    );

    const response = await POST(request);

    expect(response.status).toBe(403);
    expect(testDb.merchants.length).toBe(0);
  });

  it('rejects missing required fields with 400', async () => {
    const userId = generateUUID();
    setMockAuthToken('valid-token', { id: userId, email: 'test@example.com' });

    const request = createMockRequest(
      {
        user_id: userId,
        slug: 'test-shop',
        shop_name: '',
        shop_type: 'coiffeur',
        phone: '0612345678',
        country: 'FR',
      },
      'valid-token'
    );

    const response = await POST(request);

    expect(response.status).toBe(400);
    expect(testDb.merchants.length).toBe(0);
  });

  it('sets stamps_required to 8 for spa shop_type', async () => {
    const userId = generateUUID();
    setMockAuthToken('valid-token', { id: userId, email: 'test@example.com' });

    const request = createMockRequest(
      {
        user_id: userId,
        slug: 'spa-zen',
        shop_name: 'Spa Zen',
        shop_type: 'spa',
        phone: '0698765432',
        country: 'FR',
      },
      'valid-token'
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.merchant).toBeDefined();
    expect(data.merchant.stamps_required).toBe(8);
  });

  it('sets stamps_required to 10 for coiffeur shop_type', async () => {
    const userId = generateUUID();
    setMockAuthToken('valid-token', { id: userId, email: 'test@example.com' });

    const request = createMockRequest(
      {
        user_id: userId,
        slug: 'coiffeur-paris',
        shop_name: 'Coiffeur Paris',
        shop_type: 'coiffeur',
        phone: '0612345678',
        country: 'FR',
      },
      'valid-token'
    );

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.merchant).toBeDefined();
    expect(data.merchant.stamps_required).toBe(10);
  });
});
