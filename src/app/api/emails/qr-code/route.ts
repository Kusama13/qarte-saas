import { NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { sendQRCodeEmail } from '@/lib/email';

const supabaseAdmin = getSupabaseAdmin();

export async function POST() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, shop_name, user_id, reward_description, stamps_required, primary_color, logo_url, tier2_enabled, tier2_stamps_required, tier2_reward_description')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Commerce introuvable' },
        { status: 404 }
      );
    }

    // Don't send if palier 1 not configured
    if (!merchant.reward_description) {
      return NextResponse.json(
        { error: 'Programme non configuré' },
        { status: 400 }
      );
    }

    // Check if already sent (avoid duplicates with cron)
    const { data: existing } = await supabaseAdmin
      .from('pending_email_tracking')
      .select('id')
      .eq('merchant_id', merchant.id)
      .eq('reminder_day', -103)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, alreadySent: true });
    }

    const result = await sendQRCodeEmail(
      user.email!,
      merchant.shop_name,
      merchant.reward_description || undefined,
      merchant.stamps_required,
      merchant.primary_color,
      merchant.logo_url || undefined,
      merchant.tier2_enabled,
      merchant.tier2_stamps_required,
      merchant.tier2_reward_description
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur envoi email' },
        { status: 500 }
      );
    }

    // Mark as sent so cron doesn't send again
    await supabaseAdmin.from('pending_email_tracking').insert({
      merchant_id: merchant.id,
      reminder_day: -103,
      pending_count: 0,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('QR code email error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
