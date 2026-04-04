import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rateLimit = checkRateLimit(`merchant-push-subscribe:${ip}`, { maxRequests: 10, windowMs: 60 * 1000 });
  if (!rateLimit.success) return rateLimitResponse(rateLimit.resetTime);

  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { subscription } = await request.json();
    if (!subscription?.endpoint) {
      return NextResponse.json({ error: 'Subscription invalide' }, { status: 400 });
    }

    // Find merchant for this user
    const supabaseAdmin = getSupabaseAdmin();
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!merchant) {
      return NextResponse.json({ error: 'Compte marchand introuvable' }, { status: 404 });
    }

    const keys = subscription.keys || {};

    const { data, error } = await supabaseAdmin
      .from('merchant_push_subscriptions')
      .upsert(
        {
          merchant_id: merchant.id,
          endpoint: subscription.endpoint,
          p256dh: keys.p256dh || '',
          auth: keys.auth || '',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'endpoint' }
      )
      .select()
      .single();

    if (error) {
      logger.error('Error saving merchant push subscription:', error);
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscription: data });
  } catch (error) {
    logger.error('Merchant push subscribe error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: 'Endpoint requis' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Only delete if subscription belongs to this merchant
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await supabaseAdmin
      .from('merchant_push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('merchant_id', merchant.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Merchant push unsubscribe error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
