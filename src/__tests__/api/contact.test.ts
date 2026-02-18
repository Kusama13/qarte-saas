import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import {
  testDb,
  resetTestDb,
} from '../mocks/supabase';

let testIpCounter = 500;

vi.mock('@/lib/supabase', async () => {
  const { mockSupabaseAdmin, mockSupabaseWithAuth } = await import('../mocks/supabase');
  return {
    getSupabaseAdmin: () => mockSupabaseAdmin,
    createRouteHandlerSupabaseClient: async () => mockSupabaseWithAuth,
    createServerClient: () => mockSupabaseAdmin,
    supabase: mockSupabaseAdmin,
  };
});

vi.mock('@/lib/resend', () => ({
  resend: {
    emails: {
      send: vi.fn().mockResolvedValue({ id: 'test-id' }),
    },
  },
  EMAIL_FROM: 'Qarte <test@test.com>',
}));

vi.mock('@/lib/logger', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

vi.mock('@/lib/utils', () => ({
  validateEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
}));

import { POST } from '@/app/api/contact/route';

function createMockRequest(body: any): NextRequest {
  testIpCounter++;
  return {
    json: async () => body,
    headers: {
      get: (name: string) => name === 'x-forwarded-for' ? `10.2.0.${testIpCounter}` : null,
    },
  } as unknown as NextRequest;
}

describe('/api/contact', () => {
  beforeEach(() => {
    resetTestDb();
    vi.clearAllMocks();
  });

  describe('POST /api/contact', () => {
    it('submits form and saves to DB', async () => {
      const request = createMockRequest({
        name: 'Jean Dupont',
        email: 'jean@example.com',
        subject: 'question',
        message: 'Bonjour, je voudrais en savoir plus sur Qarte.',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);

      // Verify entry was saved in testDb
      expect(testDb.contact_messages).toHaveLength(1);
      expect(testDb.contact_messages[0].name).toBe('Jean Dupont');
      expect(testDb.contact_messages[0].email).toBe('jean@example.com');
      expect(testDb.contact_messages[0].subject).toBe('Question');
      expect(testDb.contact_messages[0].message).toBe(
        'Bonjour, je voudrais en savoir plus sur Qarte.'
      );
    });

    it('rejects invalid email', async () => {
      const request = createMockRequest({
        name: 'Jean Dupont',
        email: 'not-an-email',
        subject: 'question',
        message: 'Bonjour, je voudrais en savoir plus.',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });

    it('rejects missing fields', async () => {
      // Missing name and message
      const request = createMockRequest({
        email: 'jean@example.com',
        subject: 'question',
      });

      const response = await POST(request);
      expect(response.status).toBe(400);

      const data = await response.json();
      expect(data.error).toBeDefined();
    });
  });
});
