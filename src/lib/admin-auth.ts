import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from './supabase';

export interface AdminAuthResult {
  authorized: boolean;
  userId?: string;
  error?: NextResponse;
}

/**
 * Verify that the current request is from an authenticated super admin.
 * Use this at the beginning of every admin API route.
 */
export async function verifyAdminAuth(request: NextRequest): Promise<AdminAuthResult> {
  try {
    // Get the user from cookies (using getUser for proper JWT validation)
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'Non authentifié' },
          { status: 401 }
        ),
      };
    }

    // Check if user is a super admin
    const supabaseAdmin = getSupabaseAdmin();
    const { data: superAdmin, error: adminError } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (adminError || !superAdmin) {
      return {
        authorized: false,
        error: NextResponse.json(
          { error: 'Accès non autorisé' },
          { status: 403 }
        ),
      };
    }

    return {
      authorized: true,
      userId: user.id,
    };
  } catch (error) {
    console.error('Admin auth error:', error);
    return {
      authorized: false,
      error: NextResponse.json(
        { error: 'Erreur d\'authentification' },
        { status: 500 }
      ),
    };
  }
}

/**
 * Rate limit key generator for admin routes
 */
export function getAdminRateLimitKey(request: NextRequest, userId?: string): string {
  const path = new URL(request.url).pathname;
  return `admin:${path}:${userId || 'anonymous'}`;
}
