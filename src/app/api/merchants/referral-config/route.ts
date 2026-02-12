import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { merchant_id, referral_program_enabled, referral_reward_referrer, referral_reward_referred } = body;

    if (!merchant_id) {
      return NextResponse.json({ error: 'merchant_id requis' }, { status: 400 });
    }

    // Verify ownership
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Update referral config
    const { error } = await supabase
      .from('merchants')
      .update({
        referral_program_enabled,
        referral_reward_referrer: referral_program_enabled ? referral_reward_referrer : null,
        referral_reward_referred: referral_program_enabled ? referral_reward_referred : null,
      })
      .eq('id', merchant_id)
      .eq('user_id', user.id);

    if (error) {
      console.error('Referral config save error:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Referral config error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
