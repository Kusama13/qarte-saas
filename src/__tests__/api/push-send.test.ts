import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  createTestCustomer,
  createTestPushSubscription,
  createTestLoyaltyCard,
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

// Mock @supabase/supabase-js createClient (used by push/send for admin client)
vi.mock('@supabase/supabase-js', async () => {
  const { mockSupabaseAdmin } = await import('../mocks/supabase');
  return {
    createClient: () => mockSupabaseAdmin,
  };
});

vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}));

// Mock content moderation
vi.mock('@/lib/content-moderation', () => ({
  containsForbiddenWords: (text: string) => {
    const forbidden = ['casino', 'viagra', 'crypto'];
    for (const word of forbidden) {
      if (text.toLowerCase().includes(word)) return word;
    }
    return null;
  },
}));

// Set required environment variables before importing routes
vi.stubEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY', 'test-vapid-public-key');
vi.stubEnv('VAPID_PRIVATE_KEY', 'test-vapid-private-key');
vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'test-service-role-key');

import { POST } from '@/app/api/push/send/route';
import { POST as SCHEDULE_POST } from '@/app/api/push/schedule/route';

// Helper to create mock POST request with JSON body
function createMockPostRequest(body: any): NextRequest {
  return {
    url: 'http://localhost:3000/api/push/send',
    json: async () => body,
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

// Helper to create mock schedule POST request
function createMockScheduleRequest(body: any): NextRequest {
  return {
    url: 'http://localhost:3000/api/push/schedule',
    json: async () => body,
    headers: {
      get: () => null,
    },
  } as unknown as NextRequest;
}

describe('/api/push/send', () => {
  beforeEach(() => {
    resetTestDb();
    setMockAuthUser(null);
    vi.clearAllMocks();
  });

  it('should send push notifications to subscribed customers (200)', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    // Create a customer with a push subscription
    const customer = createTestCustomer({
      merchant_id: merchant.id,
      phone_number: '0611223344',
    });

    // Create loyalty card linking customer to merchant
    createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
    });

    // Create push subscription for the customer
    createTestPushSubscription({
      customer_id: customer.id,
      endpoint: 'https://push.example.com/sub1',
      p256dh: 'test-p256dh',
      auth: 'test-auth',
    });

    setMockAuthUser({ id: userId });

    const request = createMockPostRequest({
      merchantId: merchant.id,
      payload: {
        title: 'Nouvelle promo',
        body: 'Venez profiter de nos offres',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.sent).toBeGreaterThanOrEqual(1);
  });

  it('should reject forbidden words in notification content (400)', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    setMockAuthUser({ id: userId });

    const request = createMockPostRequest({
      merchantId: merchant.id,
      payload: {
        title: 'Gagnez au casino',
        body: 'Tentez votre chance',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('casino');
  });

  it('should reject forbidden words in body (400)', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    setMockAuthUser({ id: userId });

    const request = createMockPostRequest({
      merchantId: merchant.id,
      payload: {
        title: 'Offre spéciale',
        body: 'Achetez du viagra pas cher',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('viagra');
  });

  it('should reject without authentication (401)', async () => {
    const merchant = createTestMerchant();
    setMockAuthUser(null);

    const request = createMockPostRequest({
      merchantId: merchant.id,
      payload: {
        title: 'Test',
        body: 'Notification test',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
  });

  it('should reject non-owner merchant (403)', async () => {
    const merchant = createTestMerchant({ user_id: generateUUID() });
    const otherUserId = generateUUID();

    setMockAuthUser({ id: otherUserId });

    const request = createMockPostRequest({
      merchantId: merchant.id,
      payload: {
        title: 'Test',
        body: 'Notification piratée',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
  });

  it('should reject missing payload fields (400)', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    setMockAuthUser({ id: userId });

    const request = createMockPostRequest({
      merchantId: merchant.id,
      payload: {
        title: 'Titre seul',
        // missing body
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });

  it('should store push in history after successful send', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    const customer = createTestCustomer({
      merchant_id: merchant.id,
      phone_number: '0611223344',
    });

    createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
    });

    createTestPushSubscription({
      customer_id: customer.id,
    });

    setMockAuthUser({ id: userId });

    const request = createMockPostRequest({
      merchantId: merchant.id,
      payload: {
        title: 'Promo du jour',
        body: 'Ne ratez pas nos offres',
      },
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    // Verify push_history was created
    const history = testDb.push_history.find((h: any) => h.merchant_id === merchant.id);
    expect(history).toBeDefined();
    expect(history?.title).toBe('Promo du jour');
    expect(history?.body).toBe('Ne ratez pas nos offres');
  });
});

describe('/api/push/schedule', () => {
  beforeEach(() => {
    resetTestDb();
    setMockAuthUser(null);
    vi.clearAllMocks();
  });

  it('should schedule a push notification (200)', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    setMockAuthUser({ id: userId });

    // Use a future date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const scheduledDate = futureDate.toISOString().split('T')[0];

    const request = createMockScheduleRequest({
      merchantId: merchant.id,
      title: 'Promo demain',
      body: 'Venez découvrir nos offres',
      scheduledTime: '10:00',
      scheduledDate,
    });

    const response = await SCHEDULE_POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.scheduled).toBeDefined();

    // Verify record was created in scheduled_push
    const scheduled = testDb.scheduled_push.find((s: any) => s.merchant_id === merchant.id);
    expect(scheduled).toBeDefined();
    expect(scheduled?.title).toBe('Promo demain');
    expect(scheduled?.scheduled_time).toBe('10:00');
    expect(scheduled?.scheduled_date).toBe(scheduledDate);
  });

  it('should also accept 18:00 as a valid time slot', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    setMockAuthUser({ id: userId });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 2);
    const scheduledDate = futureDate.toISOString().split('T')[0];

    const request = createMockScheduleRequest({
      merchantId: merchant.id,
      title: 'Promo soir',
      body: 'Offre du soir',
      scheduledTime: '18:00',
      scheduledDate,
    });

    const response = await SCHEDULE_POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject forbidden words in scheduled push (400)', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    setMockAuthUser({ id: userId });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const scheduledDate = futureDate.toISOString().split('T')[0];

    const request = createMockScheduleRequest({
      merchantId: merchant.id,
      title: 'Investissez en crypto',
      body: 'Devenez riche',
      scheduledTime: '10:00',
      scheduledDate,
    });

    const response = await SCHEDULE_POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('crypto');
  });

  it('should reject past date (400)', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    setMockAuthUser({ id: userId });

    // Use a past date
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const scheduledDate = pastDate.toISOString().split('T')[0];

    const request = createMockScheduleRequest({
      merchantId: merchant.id,
      title: 'Promo passée',
      body: 'Date invalide',
      scheduledTime: '10:00',
      scheduledDate,
    });

    const response = await SCHEDULE_POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('past');
  });

  it('should reject invalid time slot (400)', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    setMockAuthUser({ id: userId });

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const scheduledDate = futureDate.toISOString().split('T')[0];

    const request = createMockScheduleRequest({
      merchantId: merchant.id,
      title: 'Promo midi',
      body: 'Créneau invalide',
      scheduledTime: '12:00', // not 10:00 or 18:00
      scheduledDate,
    });

    const response = await SCHEDULE_POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid scheduled time');
  });

  it('should reject without authentication (403)', async () => {
    const merchant = createTestMerchant();
    setMockAuthUser(null);

    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);
    const scheduledDate = futureDate.toISOString().split('T')[0];

    const request = createMockScheduleRequest({
      merchantId: merchant.id,
      title: 'Test',
      body: 'Sans auth',
      scheduledTime: '10:00',
      scheduledDate,
    });

    const response = await SCHEDULE_POST(request);
    const data = await response.json();

    expect(response.status).toBe(403);
  });

  it('should reject missing required fields (400)', async () => {
    const userId = generateUUID();
    const merchant = createTestMerchant({ user_id: userId });

    setMockAuthUser({ id: userId });

    const request = createMockScheduleRequest({
      merchantId: merchant.id,
      title: 'Promo',
      // missing body, scheduledTime, scheduledDate
    });

    const response = await SCHEDULE_POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
  });
});
