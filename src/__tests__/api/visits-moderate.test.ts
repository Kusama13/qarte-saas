import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  createTestCustomer,
  createTestLoyaltyCard,
  setMockAuthUser,
  generateUUID,
} from '../mocks/supabase';

// Mock supabase — admin + route handler auth client
vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseAdmin, mockSupabaseWithAuth } = await import('../mocks/supabase');
  return {
    getSupabaseAdmin: () => mockSupabaseAdmin,
    createRouteHandlerSupabaseClient: async () => mockSupabaseWithAuth,
    supabase: mockSupabaseAdmin,
  };
});

// Import after mocks
import { POST, PUT } from '@/app/api/visits/moderate/route';

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    url: 'http://localhost:3000/api/visits/moderate',
    headers: { get: () => null },
  } as unknown as NextRequest;
}

function createTestVisit(merchantId: string, cardId: string, customerId: string, points = 1) {
  const visit = {
    id: generateUUID(),
    loyalty_card_id: cardId,
    merchant_id: merchantId,
    customer_id: customerId,
    points_earned: points,
    status: 'pending',
    visited_at: new Date().toISOString(),
  };
  testDb.visits.push(visit);
  return visit;
}

// ─── POST /api/visits/moderate — single visit moderation ────────────

describe('POST /api/visits/moderate — single', () => {
  beforeEach(() => {
    resetTestDb();
    setMockAuthUser(null);
    vi.clearAllMocks();
  });

  it('confirms a visit and adds stamps to the loyalty card', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({ merchant_id: merchant.id });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
      current_stamps: 3,
    });
    const visit = createTestVisit(merchant.id, card.id, customer.id, 1);

    setMockAuthUser({ id: merchant.user_id });

    const request = createMockRequest({
      visit_id: visit.id,
      action: 'confirm',
      merchant_id: merchant.id,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.action).toBe('confirm');

    // Visit status updated
    const updatedVisit = testDb.visits.find((v) => v.id === visit.id);
    expect(updatedVisit?.status).toBe('confirmed');

    // Card stamps incremented
    const updatedCard = testDb.loyalty_cards.find((c) => c.id === card.id);
    expect(updatedCard?.current_stamps).toBe(4);
  });

  it('rejects a visit without changing stamps', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({ merchant_id: merchant.id });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
      current_stamps: 3,
    });
    const visit = createTestVisit(merchant.id, card.id, customer.id, 1);

    setMockAuthUser({ id: merchant.user_id });

    const request = createMockRequest({
      visit_id: visit.id,
      action: 'reject',
      merchant_id: merchant.id,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.action).toBe('reject');

    // Visit status updated
    const updatedVisit = testDb.visits.find((v) => v.id === visit.id);
    expect(updatedVisit?.status).toBe('rejected');

    // Card stamps unchanged
    const updatedCard = testDb.loyalty_cards.find((c) => c.id === card.id);
    expect(updatedCard?.current_stamps).toBe(3);
  });

  it('returns 403 when not authenticated', async () => {
    setMockAuthUser(null);

    const merchant = createTestMerchant();
    const customer = createTestCustomer({ merchant_id: merchant.id });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
    });
    const visit = createTestVisit(merchant.id, card.id, customer.id);

    const request = createMockRequest({
      visit_id: visit.id,
      action: 'confirm',
      merchant_id: merchant.id,
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('returns 404 when visit does not belong to the merchant', async () => {
    const merchantA = createTestMerchant();
    const merchantB = createTestMerchant();
    const customer = createTestCustomer({ merchant_id: merchantA.id });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchantA.id,
    });
    const visit = createTestVisit(merchantA.id, card.id, customer.id);

    // Authenticate as merchant B
    setMockAuthUser({ id: merchantB.user_id });

    const request = createMockRequest({
      visit_id: visit.id,
      action: 'confirm',
      merchant_id: merchantB.id,
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });

  it('returns 400 for invalid body (missing fields)', async () => {
    setMockAuthUser({ id: generateUUID() });

    const request = createMockRequest({ action: 'confirm' });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 400 for invalid action value', async () => {
    setMockAuthUser({ id: generateUUID() });

    const request = createMockRequest({
      visit_id: generateUUID(),
      action: 'invalid',
      merchant_id: generateUUID(),
    });

    const response = await POST(request);
    expect(response.status).toBe(400);
  });

  it('returns 404 when visit is already processed (not pending)', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({ merchant_id: merchant.id });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
      current_stamps: 3,
    });
    const visit = createTestVisit(merchant.id, card.id, customer.id, 1);
    // Mark the visit as already confirmed
    visit.status = 'confirmed';

    setMockAuthUser({ id: merchant.user_id });

    const request = createMockRequest({
      visit_id: visit.id,
      action: 'confirm',
      merchant_id: merchant.id,
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });
});

// ─── PUT /api/visits/moderate — bulk visit moderation ───────────────

describe('PUT /api/visits/moderate — bulk', () => {
  beforeEach(() => {
    resetTestDb();
    setMockAuthUser(null);
    vi.clearAllMocks();
  });

  it('confirms multiple visits and updates stamps correctly', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({ merchant_id: merchant.id });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
      current_stamps: 2,
    });
    const v1 = createTestVisit(merchant.id, card.id, customer.id, 1);
    const v2 = createTestVisit(merchant.id, card.id, customer.id, 1);

    setMockAuthUser({ id: merchant.user_id });

    const request = createMockRequest({
      visit_ids: [v1.id, v2.id],
      action: 'confirm',
      merchant_id: merchant.id,
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.action).toBe('confirm');
    expect(data.processed).toBe(2);
    expect(data.errors).toBe(0);

    // Both visits confirmed
    const updatedV1 = testDb.visits.find((v) => v.id === v1.id);
    const updatedV2 = testDb.visits.find((v) => v.id === v2.id);
    expect(updatedV1?.status).toBe('confirmed');
    expect(updatedV2?.status).toBe('confirmed');

    // Card stamps updated (+2 total)
    const updatedCard = testDb.loyalty_cards.find((c) => c.id === card.id);
    expect(updatedCard?.current_stamps).toBe(4);
  });

  it('rejects multiple visits without changing stamps', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({ merchant_id: merchant.id });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
      current_stamps: 5,
    });
    const v1 = createTestVisit(merchant.id, card.id, customer.id, 1);
    const v2 = createTestVisit(merchant.id, card.id, customer.id, 1);

    setMockAuthUser({ id: merchant.user_id });

    const request = createMockRequest({
      visit_ids: [v1.id, v2.id],
      action: 'reject',
      merchant_id: merchant.id,
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.action).toBe('reject');
    expect(data.processed).toBe(2);
    expect(data.errors).toBe(0);

    // Both visits rejected
    const updatedV1 = testDb.visits.find((v) => v.id === v1.id);
    const updatedV2 = testDb.visits.find((v) => v.id === v2.id);
    expect(updatedV1?.status).toBe('rejected');
    expect(updatedV2?.status).toBe('rejected');

    // Card stamps unchanged
    const updatedCard = testDb.loyalty_cards.find((c) => c.id === card.id);
    expect(updatedCard?.current_stamps).toBe(5);
  });

  it('returns 403 when not authenticated', async () => {
    setMockAuthUser(null);

    const request = createMockRequest({
      visit_ids: [generateUUID()],
      action: 'confirm',
      merchant_id: generateUUID(),
    });

    const response = await PUT(request);
    expect(response.status).toBe(403);
  });

  it('returns 400 for invalid body', async () => {
    setMockAuthUser({ id: generateUUID() });

    const request = createMockRequest({ action: 'confirm' });

    const response = await PUT(request);
    expect(response.status).toBe(400);
  });

  it('reports errors for visit IDs that are not found as pending', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({ merchant_id: merchant.id });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
      current_stamps: 0,
    });
    const v1 = createTestVisit(merchant.id, card.id, customer.id, 1);
    const nonExistentId = generateUUID();

    setMockAuthUser({ id: merchant.user_id });

    const request = createMockRequest({
      visit_ids: [v1.id, nonExistentId],
      action: 'confirm',
      merchant_id: merchant.id,
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processed).toBe(1);
    expect(data.errors).toBe(1);
  });

  it('groups points by card when confirming visits across multiple cards', async () => {
    const merchant = createTestMerchant();
    const customer1 = createTestCustomer({ merchant_id: merchant.id });
    const customer2 = createTestCustomer({ merchant_id: merchant.id, phone_number: '0699999999' });
    const card1 = createTestLoyaltyCard({
      customer_id: customer1.id,
      merchant_id: merchant.id,
      current_stamps: 1,
    });
    const card2 = createTestLoyaltyCard({
      customer_id: customer2.id,
      merchant_id: merchant.id,
      current_stamps: 0,
    });
    const v1 = createTestVisit(merchant.id, card1.id, customer1.id, 2);
    const v2 = createTestVisit(merchant.id, card2.id, customer2.id, 3);

    setMockAuthUser({ id: merchant.user_id });

    const request = createMockRequest({
      visit_ids: [v1.id, v2.id],
      action: 'confirm',
      merchant_id: merchant.id,
    });

    const response = await PUT(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.processed).toBe(2);

    const updatedCard1 = testDb.loyalty_cards.find((c) => c.id === card1.id);
    const updatedCard2 = testDb.loyalty_cards.find((c) => c.id === card2.id);
    expect(updatedCard1?.current_stamps).toBe(3); // 1 + 2
    expect(updatedCard2?.current_stamps).toBe(3); // 0 + 3
  });
});
