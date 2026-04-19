import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { sendPlansLaunchEmail } from '@/lib/email';
import { stripe } from '@/lib/stripe';
import type { EmailLocale } from '@/emails/translations';
import logger from '@/lib/logger';

/**
 * POST /api/admin/plans-launch
 * Bulk send the PlansLaunch announcement to all paying merchants.
 * Reads each merchant's actual Stripe subscription price (handles grandfathered tariffs)
 * and inserts it in the email so they see "Tu restes à 19€/mois" — their real price.
 */
export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-plans-launch');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const { data: admins } = await supabaseAdmin.from('super_admins').select('user_id');
    const adminIds = (admins || []).map((a: { user_id: string }) => a.user_id);

    let query = supabaseAdmin
      .from('merchants')
      .select('id, user_id, shop_name, email, locale, stripe_subscription_id, billing_interval')
      .in('subscription_status', ['active', 'canceling', 'past_due'])
      .not('email', 'is', null)
      .not('shop_name', 'is', null)
      .not('stripe_subscription_id', 'is', null);

    if (adminIds.length > 0) query = query.not('user_id', 'in', `(${adminIds.join(',')})`);

    const { data: merchants, error } = await query;
    if (error) {
      logger.error('[PLANS-LAUNCH] Fetch error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }
    if (!merchants?.length) return NextResponse.json({ sent: 0, message: 'No eligible merchants' });

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const m of merchants) {
      try {
        // Lookup actual Stripe price (handles grandfathered).
        let currentPrice = m.billing_interval === 'annual' ? '240€/an' : '24€/mois';
        try {
          const sub = await stripe.subscriptions.retrieve(m.stripe_subscription_id);
          const item = sub.items.data[0];
          const amount = item?.price.unit_amount;
          const interval = item?.price.recurring?.interval;
          if (amount && interval) {
            const euros = (amount / 100).toFixed(0);
            const suffix = interval === 'year' ? '/an' : '/mois';
            currentPrice = `${euros}€${suffix}`;
          }
        } catch (stripeErr) {
          logger.error(`[PLANS-LAUNCH] Stripe lookup failed for ${m.shop_name}:`, stripeErr);
        }

        const result = await sendPlansLaunchEmail(
          m.email,
          m.shop_name,
          currentPrice,
          (m.locale as EmailLocale) || 'fr',
        );

        if (result.success) sent++;
        else { failed++; errors.push(`${m.shop_name}: ${result.error}`); }

        // Rate limit: Resend 2 req/s + Stripe per merchant. 700ms is safe.
        await new Promise(r => setTimeout(r, 700));
      } catch (err) {
        failed++;
        errors.push(`${m.shop_name}: ${err instanceof Error ? err.message : 'Unknown'}`);
      }
    }

    logger.info(`[PLANS-LAUNCH] Sent ${sent}/${merchants.length} (${failed} failed)`);
    return NextResponse.json({
      total: merchants.length,
      sent,
      failed,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    logger.error('[PLANS-LAUNCH] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/** GET: preview eligible merchants without sending. */
export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-plans-launch');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const { data: admins } = await supabaseAdmin.from('super_admins').select('user_id');
    const adminIds = (admins || []).map((a: { user_id: string }) => a.user_id);

    let query = supabaseAdmin
      .from('merchants')
      .select('id, shop_name, email, locale, subscription_status, billing_interval, plan_tier')
      .in('subscription_status', ['active', 'canceling', 'past_due'])
      .not('email', 'is', null)
      .not('stripe_subscription_id', 'is', null);

    if (adminIds.length > 0) query = query.not('user_id', 'in', `(${adminIds.join(',')})`);

    const { data: merchants, error } = await query;
    if (error) return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });

    return NextResponse.json({ total: merchants?.length || 0, merchants: merchants || [] });
  } catch (err) {
    logger.error('[PLANS-LAUNCH] Preview error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
