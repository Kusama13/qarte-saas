import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { authorizeAdmin } from '@/lib/api-helpers';
import { sendWinBackEmail } from '@/lib/email';
import type { EmailLocale } from '@/emails/translations';
import logger from '@/lib/logger';

/**
 * Construit une map user_id → email depuis auth.users (paginé).
 * L'email n'est PAS sur la table `merchants` — il vit dans auth.users.
 */
async function buildEmailMap(supabaseAdmin: SupabaseClient): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  let page = 1;
  let hasMore = true;
  while (hasMore) {
    const { data: { users: batch } } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 500 });
    for (const u of batch || []) {
      if (u.email) map.set(u.id, u.email);
    }
    hasMore = (batch?.length || 0) === 500;
    page++;
  }
  return map;
}

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
    // Get admin IDs to exclude
    const { data: admins } = await supabaseAdmin
      .from('super_admins')
      .select('user_id');
    const adminIds = (admins || []).map((a: { user_id: string }) => a.user_id);

    // Fetch canceled merchants
    let query = supabaseAdmin
      .from('merchants')
      .select('id, user_id, shop_name, locale')
      .eq('subscription_status', 'canceled')
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

    const emailMap = await buildEmailMap(supabaseAdmin);

    let sent = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const merchant of merchants) {
      const email = emailMap.get(merchant.user_id);
      if (!email) { skipped++; continue; }
      try {
        const result = await sendWinBackEmail(
          email,
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

    logger.info(`[WIN-BACK] Sent ${sent}/${merchants.length} emails (${failed} failed, ${skipped} skipped — no email)`);

    return NextResponse.json({
      total: merchants.length,
      sent,
      failed,
      skipped,
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
      .select('id, user_id, shop_name, subscription_status, updated_at, locale')
      .eq('subscription_status', 'canceled')
      .not('shop_name', 'is', null);

    if (adminIds.length > 0) {
      query = query.not('user_id', 'in', `(${adminIds.join(',')})`);
    }

    const { data: merchants, error } = await query;

    if (error) {
      logger.error('Admin win-back DB error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const emailMap = await buildEmailMap(supabaseAdmin);
    // Seuls les merchants avec un email résolu sont éligibles à l'envoi.
    const eligible = (merchants || []).filter(m => emailMap.get(m.user_id));

    return NextResponse.json({
      total: eligible.length,
      merchants: eligible.map(m => ({
        shop_name: m.shop_name,
        email: emailMap.get(m.user_id),
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
