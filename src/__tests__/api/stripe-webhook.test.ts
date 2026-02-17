import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  testDb,
  resetTestDb,
  createTestMerchant,
  generateUUID,
} from '../mocks/supabase';

// Mock stripe
const mockConstructEvent = vi.fn();
vi.mock('@/lib/stripe', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: any[]) => mockConstructEvent(...args),
    },
  },
}));

// Mock supabase (direct createClient used in webhook)
vi.mock('@supabase/supabase-js', async () => {
  const { mockSupabaseWithAuth } = await import('../mocks/supabase');
  return {
    createClient: () => mockSupabaseWithAuth,
  };
});

// Mock next/headers
vi.mock('next/headers', () => ({
  headers: async () => ({
    get: (name: string) => {
      if (name === 'stripe-signature') return 'test_signature';
      return null;
    },
  }),
}));

// Mock email functions
const mockSendSubscriptionConfirmedEmail = vi.fn().mockResolvedValue({});
const mockSendPaymentFailedEmail = vi.fn().mockResolvedValue({});
const mockSendSubscriptionCanceledEmail = vi.fn().mockResolvedValue({});
const mockSendSubscriptionReactivatedEmail = vi.fn().mockResolvedValue({});

vi.mock('@/lib/email', () => ({
  sendSubscriptionConfirmedEmail: (...args: any[]) => mockSendSubscriptionConfirmedEmail(...args),
  sendPaymentFailedEmail: (...args: any[]) => mockSendPaymentFailedEmail(...args),
  sendSubscriptionCanceledEmail: (...args: any[]) => mockSendSubscriptionCanceledEmail(...args),
  sendSubscriptionReactivatedEmail: (...args: any[]) => mockSendSubscriptionReactivatedEmail(...args),
}));

// Mock logger
vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

// Import after mocks
import { POST } from '@/app/api/stripe/webhook/route';

function createWebhookRequest(body: string): Request {
  return {
    text: async () => body,
  } as unknown as Request;
}

function makeStripeEvent(type: string, data: any) {
  return { type, data: { object: data } };
}

describe('/api/stripe/webhook', () => {
  beforeEach(() => {
    resetTestDb();
    vi.clearAllMocks();
  });

  describe('Signature verification', () => {
    it('should return 400 for invalid signature', async () => {
      mockConstructEvent.mockImplementation(() => {
        throw new Error('Invalid signature');
      });

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('Invalid signature');
    });
  });

  describe('checkout.session.completed', () => {
    it('should activate merchant and send confirmation email', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'trialing',
        user_id: generateUUID(),
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('checkout.session.completed', {
          metadata: { merchant_id: merchant.id },
          customer: 'cus_test123',
          subscription: 'sub_test123',
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);

      // Merchant should be activated
      const updated = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updated?.subscription_status).toBe('active');
      expect(updated?.stripe_customer_id).toBe('cus_test123');
      expect(updated?.stripe_subscription_id).toBe('sub_test123');

      // Email should be sent
      expect(mockSendSubscriptionConfirmedEmail).toHaveBeenCalledTimes(1);
    });

    it('should be idempotent — skip if merchant already active', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'active', // Already active
        user_id: generateUUID(),
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('checkout.session.completed', {
          metadata: { merchant_id: merchant.id },
          customer: 'cus_test123',
          subscription: 'sub_test123',
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      // Email should NOT be sent (idempotent — already active)
      expect(mockSendSubscriptionConfirmedEmail).not.toHaveBeenCalled();
    });

    it('should skip if merchant_id missing in metadata', async () => {
      mockConstructEvent.mockReturnValue(
        makeStripeEvent('checkout.session.completed', {
          metadata: {},
          customer: 'cus_test123',
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      expect(mockSendSubscriptionConfirmedEmail).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.deleted', () => {
    it('should cancel merchant subscription', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'active',
        stripe_subscription_id: 'sub_delete_test',
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('customer.subscription.deleted', {
          id: 'sub_delete_test',
          status: 'canceled',
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const updated = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updated?.subscription_status).toBe('canceled');
    });

    it('should ignore deletion of incomplete subscriptions', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'active',
        stripe_subscription_id: 'sub_incomplete',
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('customer.subscription.deleted', {
          id: 'sub_incomplete',
          status: 'incomplete',
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      // Should NOT have changed status
      const updated = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updated?.subscription_status).toBe('active');
    });
  });

  describe('invoice.payment_failed', () => {
    it('should set merchant to past_due and send email', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'active',
        stripe_customer_id: 'cus_fail_test',
        user_id: generateUUID(),
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('invoice.payment_failed', {
          customer: 'cus_fail_test',
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const updated = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updated?.subscription_status).toBe('past_due');
      expect(mockSendPaymentFailedEmail).toHaveBeenCalledTimes(1);
    });
  });

  describe('invoice.payment_succeeded', () => {
    it('should restore past_due merchant to active', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'past_due',
        stripe_customer_id: 'cus_recover_test',
        user_id: generateUUID(),
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('invoice.payment_succeeded', {
          customer: 'cus_recover_test',
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const updated = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updated?.subscription_status).toBe('active');
    });

    it('should not change merchant that is already active', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'active',
        stripe_customer_id: 'cus_already_active',
        user_id: generateUUID(),
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('invoice.payment_succeeded', {
          customer: 'cus_already_active',
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      // Email should NOT be sent (only for past_due → active transition)
      expect(mockSendSubscriptionConfirmedEmail).not.toHaveBeenCalled();
    });
  });

  describe('customer.subscription.updated', () => {
    it('should set canceling when cancel_at_period_end is true', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'active',
        stripe_subscription_id: 'sub_canceling_test',
        user_id: generateUUID(),
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('customer.subscription.updated', {
          id: 'sub_canceling_test',
          status: 'active',
          cancel_at_period_end: true,
          cancel_at: Math.floor(Date.now() / 1000) + 30 * 24 * 3600,
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const updated = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updated?.subscription_status).toBe('canceling');
      expect(mockSendSubscriptionCanceledEmail).toHaveBeenCalledTimes(1);
    });

    it('should reactivate from canceling to active', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'canceling',
        stripe_subscription_id: 'sub_reactivate_test',
        user_id: generateUUID(),
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('customer.subscription.updated', {
          id: 'sub_reactivate_test',
          status: 'active',
          cancel_at_period_end: false,
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      const updated = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updated?.subscription_status).toBe('active');
      expect(mockSendSubscriptionReactivatedEmail).toHaveBeenCalledTimes(1);
    });

    it('should ignore incomplete subscriptions', async () => {
      const merchant = createTestMerchant({
        subscription_status: 'active',
        stripe_subscription_id: 'sub_incomplete_update',
      });

      mockConstructEvent.mockReturnValue(
        makeStripeEvent('customer.subscription.updated', {
          id: 'sub_incomplete_update',
          status: 'incomplete',
        })
      );

      const request = createWebhookRequest('{}');
      const response = await POST(request);

      expect(response.status).toBe(200);
      // Should NOT have changed
      const updated = testDb.merchants.find((m) => m.id === merchant.id);
      expect(updated?.subscription_status).toBe('active');
    });
  });
});
