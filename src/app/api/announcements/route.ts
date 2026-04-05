import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

// ── GET: Active announcements for the current merchant ──

export async function GET() {
  try {
    // 1. Auth: get user
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé - connexion requise' },
        { status: 401 }
      );
    }

    // 2. Find their merchant and get subscription_status + pwa_installed_at
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id, user_id, subscription_status, pwa_installed_at')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant non trouvé' },
        { status: 404 }
      );
    }

    // 3. Query published, non-expired announcements (use admin client for cross-table access)
    const supabaseAdmin = getSupabaseAdmin();
    const now = new Date().toISOString();

    const { data: announcements, error: fetchError } = await supabaseAdmin
      .from('admin_announcements')
      .select('*')
      .eq('is_published', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('created_at', { ascending: false });

    if (fetchError) {
      logger.error('Error fetching announcements:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // 4. Check if merchant is a super admin (for 'admin' target filter)
    const { data: superAdminRow } = await supabaseAdmin
      .from('super_admins')
      .select('user_id')
      .eq('user_id', merchant.user_id)
      .maybeSingle();
    const isSuperAdmin = !!superAdminRow;

    // 5. Filter by target_filter based on merchant attributes
    const filtered = (announcements || []).filter((a) => {
      switch (a.target_filter) {
        case 'all':
          return true;
        case 'trial':
          return merchant.subscription_status === 'trial';
        case 'active':
          return merchant.subscription_status === 'active';
        case 'pwa_installed':
          return merchant.pwa_installed_at != null;
        case 'pwa_trial':
          return merchant.subscription_status === 'trial' && merchant.pwa_installed_at != null;
        case 'admin':
          return isSuperAdmin;
        default:
          return false;
      }
    });

    // 6. Exclude announcements the merchant has dismissed
    const { data: dismissals, error: dismissalError } = await supabaseAdmin
      .from('admin_announcement_dismissals')
      .select('announcement_id')
      .eq('merchant_id', merchant.id);

    if (dismissalError) {
      logger.error('Error fetching dismissals:', dismissalError);
      // Continue without filtering dismissals rather than failing entirely
    }

    const dismissedIds = new Set((dismissals || []).map((d) => d.announcement_id));
    const result = filtered.filter((a) => !dismissedIds.has(a.id));

    return NextResponse.json({ announcements: result });
  } catch (error) {
    logger.error('Error in GET /api/announcements:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── POST: Dismiss an announcement ──

const dismissSchema = z.object({
  announcement_id: z.string().uuid('ID d\'annonce invalide'),
});

export async function POST(request: NextRequest) {
  try {
    // 1. Auth: get user
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé - connexion requise' },
        { status: 401 }
      );
    }

    // 2. Find their merchant
    const { data: merchant, error: merchantError } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant non trouvé' },
        { status: 404 }
      );
    }

    // 3. Validate body
    const body = await request.json();
    const validation = dismissSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    // 4. Insert dismissal (ON CONFLICT DO NOTHING for idempotency)
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('admin_announcement_dismissals')
      .upsert(
        {
          announcement_id: validation.data.announcement_id,
          merchant_id: merchant.id,
        },
        { onConflict: 'announcement_id,merchant_id', ignoreDuplicates: true }
      );

    if (error) {
      logger.error('Error dismissing announcement:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in POST /api/announcements:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
