import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { sendWinBackEmail } from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import logger from '@/lib/logger';

/**
 * POST /api/admin/win-back
 * Send win-back email to all merchants with canceled/expired subscriptions (3+ days).
 * Admin only — one-shot bulk send.
 */
export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-win-back');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    // Fetch all canceled merchants (trial_ends_at expired 3+ days ago OR subscription_status = 'canceled')
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    // Get admin IDs to exclude
    const { data: admins } = await supabaseAdmin
      .from('super_admins')
      .select('user_id');
    const adminIds = (admins || []).map((a: { user_id: string }) => a.user_id);

    // Fetch canceled merchants
    let query = supabaseAdmin
      .from('merchants')
      .select('id, user_id, shop_name, email, locale')
      .eq('subscription_status', 'canceled')
      .not('email', 'is', null)
      .not('shop_name', 'is', null);

    if (adminIds.length > 0) {
      query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
    }

    const { data: merchants, error } = await query;

    if (error) {
      logger.error('[WIN-BACK] Error fetching merchants:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    if (!merchants || merchants.length === 0) {
      return NextResponse.json({ sent: 0, message: 'No eligible merchants found' });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const merchant of merchants) {
      try {
        const result = await sendWinBackEmail(
          merchant.email,
          merchant.shop_name,
          (merchant.locale as EmailLocale) || 'fr'
        );

        if (result.success) {
          sent++;
        } else {
          failed++;
          errors.push(`${merchant.shop_name}: ${result.error}`);
        }

        // Rate limit: 600ms between emails (Resend 2 req/s)
        await new Promise(resolve => setTimeout(resolve, 600));
      } catch (err) {
        failed++;
        errors.push(`${merchant.shop_name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    }

    logger.info(`[WIN-BACK] Sent ${sent}/${merchants.length} emails (${failed} failed)`);

    return NextResponse.json({
      total: merchants.length,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.error('[WIN-BACK] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * GET /api/admin/win-back
 * Preview: list eligible merchants without sending.
 */
export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-win-back');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const { data: admins } = await supabaseAdmin
      .from('super_admins')
      .select('user_id');
    const adminIds = (admins || []).map((a: { user_id: string }) => a.user_id);

    let query = supabaseAdmin
      .from('merchants')
      .select('id, shop_name, email, subscription_status, updated_at, locale')
      .eq('subscription_status', 'canceled')
      .not('email', 'is', null)
      .not('shop_name', 'is', null);

    if (adminIds.length > 0) {
      query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
    }

    const { data: merchants, error } = await query;

    if (error) {
      logger.error('Admin win-back DB error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({
      total: merchants?.length || 0,
      merchants: (merchants || []).map(m => ({
        shop_name: m.shop_name,
        email: m.email,
        subscription_status: m.subscription_status,
        canceled_at: m.updated_at,
        locale: m.locale,
      })),
    });
  } catch (err) {
    logger.error('[WIN-BACK] Preview error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
