import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  createTestCustomer,
  createTestLoyaltyCard,
  createTestVoucher,
  createTestReferral,
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

// Mock customer-auth: return phone from a custom header for testing
let mockPhone: string | null = null;
vi.mock('@/lib/customer-auth', () => ({
  getAuthenticatedPhone: () => mockPhone,
}));

// Mock web-push (module-level init)
vi.mock('web-push', () => ({
  default: {
    setVapidDetails: vi.fn(),
    sendNotification: vi.fn().mockResolvedValue({}),
  },
}));

import { POST } from '@/app/api/vouchers/use/route';

function createMockRequest(body: any): NextRequest {
  return {
    json: async () => body,
    headers: { get: () => null },
  } as unknown as NextRequest;
}

describe('POST /api/vouchers/use', () => {
  beforeEach(() => {
    resetTestDb();
    mockPhone = null;
    vi.clearAllMocks();
  });

  it('uses a valid voucher → is_used = true', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({
      merchant_id: merchant.id,
      phone_number: '33612345678',
    });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
    });
    const voucher = createTestVoucher({
      customer_id: customer.id,
      merchant_id: merchant.id,
      loyalty_card_id: card.id,
      is_used: false,
    });

    mockPhone = '33612345678';

    const request = createMockRequest({
      voucher_id: voucher.id,
      customer_id: customer.id,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);

    const updatedVoucher = testDb.vouchers.find((v) => v.id === voucher.id);
    expect(updatedVoucher?.is_used).toBe(true);
  });

  it('rejects already used voucher → 409', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({
      merchant_id: merchant.id,
      phone_number: '33612345678',
    });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
    });
    const voucher = createTestVoucher({
      customer_id: customer.id,
      merchant_id: merchant.id,
      loyalty_card_id: card.id,
      is_used: true,
      used_at: new Date().toISOString(),
    });

    mockPhone = '33612345678';

    const request = createMockRequest({
      voucher_id: voucher.id,
      customer_id: customer.id,
    });

    const response = await POST(request);
    expect(response.status).toBe(409);
  });

  it('rejects expired voucher → 410', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({
      merchant_id: merchant.id,
      phone_number: '33612345678',
    });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
    });
    const voucher = createTestVoucher({
      customer_id: customer.id,
      merchant_id: merchant.id,
      loyalty_card_id: card.id,
      is_used: false,
      expires_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // yesterday
    });

    mockPhone = '33612345678';

    const request = createMockRequest({
      voucher_id: voucher.id,
      customer_id: customer.id,
    });

    const response = await POST(request);
    expect(response.status).toBe(410);
  });

  it('adds +1 bonus stamp for referral voucher', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({
      merchant_id: merchant.id,
      phone_number: '33612345678',
    });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
      current_stamps: 3,
    });
    const voucher = createTestVoucher({
      customer_id: customer.id,
      merchant_id: merchant.id,
      loyalty_card_id: card.id,
      is_used: false,
      source: 'referral',
    });

    mockPhone = '33612345678';

    const request = createMockRequest({
      voucher_id: voucher.id,
      customer_id: customer.id,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.bonus_stamp_added).toBe(true);
    expect(data.new_stamps).toBe(4);

    const updatedCard = testDb.loyalty_cards.find((c) => c.id === card.id);
    expect(updatedCard?.current_stamps).toBe(4);
  });

  it('does NOT add bonus stamp for birthday voucher', async () => {
    const merchant = createTestMerchant();
    const customer = createTestCustomer({
      merchant_id: merchant.id,
      phone_number: '33612345678',
    });
    const card = createTestLoyaltyCard({
      customer_id: customer.id,
      merchant_id: merchant.id,
      current_stamps: 3,
    });
    const voucher = createTestVoucher({
      customer_id: customer.id,
      merchant_id: merchant.id,
      loyalty_card_id: card.id,
      is_used: false,
      source: 'birthday',
    });

    mockPhone = '33612345678';

    const request = createMockRequest({
      voucher_id: voucher.id,
      customer_id: customer.id,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.bonus_stamp_added).toBe(false);

    const updatedCard = testDb.loyalty_cards.find((c) => c.id === card.id);
    expect(updatedCard?.current_stamps).toBe(3);
  });

  it('completes referral when referred voucher used', async () => {
    const merchant = createTestMerchant({
      referral_program_enabled: true,
      referral_reward_referrer: 'Un café offert',
    });
    const referrerCustomer = createTestCustomer({
      merchant_id: merchant.id,
      phone_number: '33600000000',
    });
    const referrerCard = createTestLoyaltyCard({
      customer_id: referrerCustomer.id,
      merchant_id: merchant.id,
    });
    const referredCustomer = createTestCustomer({
      merchant_id: merchant.id,
      phone_number: '33612345678',
    });
    const referredCard = createTestLoyaltyCard({
      customer_id: referredCustomer.id,
      merchant_id: merchant.id,
      current_stamps: 0,
    });
    const voucher = createTestVoucher({
      customer_id: referredCustomer.id,
      merchant_id: merchant.id,
      loyalty_card_id: referredCard.id,
      is_used: false,
      source: 'referral',
    });
    const referral = createTestReferral({
      merchant_id: merchant.id,
      referrer_customer_id: referrerCustomer.id,
      referrer_card_id: referrerCard.id,
      referred_customer_id: referredCustomer.id,
      referred_card_id: referredCard.id,
      referred_voucher_id: voucher.id,
      status: 'pending',
    });

    mockPhone = '33612345678';

    const request = createMockRequest({
      voucher_id: voucher.id,
      customer_id: referredCustomer.id,
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.is_referral).toBe(true);

    // Referral should be marked as completed
    const updatedReferral = testDb.referrals.find((r) => r.id === referral.id);
    expect(updatedReferral?.status).toBe('completed');

    // A referrer voucher should have been created
    const referrerVoucher = testDb.vouchers.find(
      (v) => v.customer_id === referrerCustomer.id && v.reward_description === 'Un café offert'
    );
    expect(referrerVoucher).toBeDefined();
  });

  it('rejects without auth → 401', async () => {
    mockPhone = null;

    const request = createMockRequest({
      voucher_id: generateUUID(),
      customer_id: generateUUID(),
    });

    const response = await POST(request);
    expect(response.status).toBe(401);
  });
});
