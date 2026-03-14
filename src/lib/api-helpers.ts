import { NextRequest, NextResponse } from 'next/server';
import { SupabaseClient } from '@supabase/supabase-js';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from './supabase';
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

// ─── Merchant Auth ───────────────────────────────────

interface AuthorizeMerchantSuccess {
  supabaseAdmin: SupabaseClient;
  userId: string;
  merchantId: string;
  response?: undefined;
}

interface AuthorizeMerchantFailure {
  supabaseAdmin?: undefined;
  userId?: undefined;
  merchantId?: undefined;
  response: NextResponse;
}

export type AuthorizeMerchantResult = AuthorizeMerchantSuccess | AuthorizeMerchantFailure;

/**
 * Combined merchant auth + ownership check for merchant API routes.
 *
 * Usage:
 *   const auth = await authorizeMerchant(request, merchantId);
 *   if (auth.response) return auth.response;
 *   const { supabaseAdmin, userId, merchantId } = auth;
 */
export async function authorizeMerchant(
  merchantId: string,
): Promise<AuthorizeMerchantResult> {
  // 1. Auth check
  const supabase = await createRouteHandlerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { response: NextResponse.json({ error: 'Non autorisé' }, { status: 401 }) };
  }

  // 2. Ownership check
  const supabaseAdmin = getSupabaseAdmin();
  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .single();

  if (!merchant) {
    return { response: NextResponse.json({ error: 'Accès refusé' }, { status: 403 }) };
  }

  return { supabaseAdmin, userId: user.id, merchantId };
}
