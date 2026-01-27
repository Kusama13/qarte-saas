import { NextRequest, NextResponse } from 'next/server';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getSupabaseAdmin } from './supabase';

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
    // Get the session from cookies
    const supabase = createServerComponentClient({ cookies });
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
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
      .eq('user_id', session.user.id)
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
      userId: session.user.id,
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
