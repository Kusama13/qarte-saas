import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from './supabase';
import { verifyAdminAuth } from './admin-auth';
import { checkRateLimit, RATE_LIMITS } from './rate-limit';

interface AuthorizeAdminSuccess {
  supabaseAdmin: SupabaseClient;
  userId: string;
  response?: undefined;
}

interface AuthorizeAdminFailure {
  supabaseAdmin?: undefined;
  userId?: undefined;
  response: NextResponse;
}

export type AuthorizeAdminResult = AuthorizeAdminSuccess | AuthorizeAdminFailure;

/**
 * Combined admin auth + rate limit check for admin API routes.
 *
 * Usage:
 *   const auth = await authorizeAdmin(request, 'admin-tasks');
 *   if (auth.response) return auth.response;
 *   const { supabaseAdmin, userId } = auth;
 *
 * @param request - The incoming NextRequest
 * @param rateLimitKey - Optional prefix for rate limiting (e.g. 'admin-tasks').
 *   When provided, the full key becomes `${rateLimitKey}:${userId}` and the
 *   RATE_LIMITS.api preset is applied. Omit to skip rate limiting.
 */
export async function authorizeAdmin(
  request: NextRequest,
  rateLimitKey?: string,
): Promise<AuthorizeAdminResult> {
  // 1. Admin auth check
  const adminCheck = await verifyAdminAuth(request);
  if (adminCheck.error) {
    return { response: adminCheck.error };
  }

  const userId = adminCheck.userId!;

  // 2. Rate limit check (if key provided)
  if (rateLimitKey) {
    const rateLimit = checkRateLimit(`${rateLimitKey}:${userId}`, RATE_LIMITS.api);
    if (!rateLimit.success) {
      return {
        response: NextResponse.json(
          { error: 'Trop de requêtes' },
          {
            status: 429,
            headers: {
              'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)),
            },
          },
        ),
      };
    }
  }

  // 3. Return supabaseAdmin + userId
  return {
    supabaseAdmin: getSupabaseAdmin(),
    userId,
  };
}
