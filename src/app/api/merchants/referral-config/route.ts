import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const referralConfigSchema = z.object({
  merchant_id: z.string().uuid(),
  referral_program_enabled: z.boolean(),
  referral_reward_referrer: z.string().max(200).nullable().optional(),
  referral_reward_referred: z.string().max(200).nullable().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = referralConfigSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { merchant_id, referral_program_enabled, referral_reward_referrer, referral_reward_referred } = parsed.data;

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
      logger.error('Referral config save error:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Referral config error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
