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
      .select('id, shop_name, reward_description, stamps_required, primary_color, logo_url, user_id, tier2_enabled, tier2_stamps_required, tier2_reward_description')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json(
        { error: 'Commerce introuvable' },
        { status: 404 }
      );
    }

    // Only send if program is configured and logo is set
    if (!merchant.reward_description || !merchant.logo_url) {
      return NextResponse.json(
        { error: 'Programme non configuré ou logo manquant' },
        { status: 400 }
      );
    }

    const result = await sendQRCodeEmail(
      user.email!,
      merchant.shop_name,
      merchant.reward_description,
      merchant.stamps_required,
      merchant.primary_color,
      merchant.logo_url,
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Social kit email error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
