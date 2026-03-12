import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { generateReferralCode } from '@/lib/utils';
import { z } from 'zod';
import logger from '@/lib/logger';

const referralConfigSchema = z.object({
  merchant_id: z.string().uuid(),
  referral_program_enabled: z.boolean(),
  referral_reward_referrer: z.string().max(200).nullable().optional(),
  referral_reward_referred: z.string().max(200).nullable().optional(),
  welcome_offer_enabled: z.boolean().optional(),
  welcome_offer_description: z.string().max(200).nullable().optional(),
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

    const {
      merchant_id,
      referral_program_enabled,
      referral_reward_referrer,
      referral_reward_referred,
      welcome_offer_enabled,
      welcome_offer_description,
    } = parsed.data;

    // Verify ownership
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, welcome_referral_code')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Generate welcome_referral_code on first activation
    let welcomeCode = merchant.welcome_referral_code;
    if (welcome_offer_enabled && !welcomeCode) {
      welcomeCode = generateReferralCode();
    }

    // Update referral + welcome config
    const updateData: Record<string, unknown> = {
      referral_program_enabled,
      referral_reward_referrer: referral_program_enabled ? referral_reward_referrer : null,
      referral_reward_referred: referral_program_enabled ? referral_reward_referred : null,
    };

    if (welcome_offer_enabled !== undefined) {
      updateData.welcome_offer_enabled = welcome_offer_enabled;
      updateData.welcome_offer_description = welcome_offer_enabled ? welcome_offer_description : null;
      if (welcomeCode) {
        updateData.welcome_referral_code = welcomeCode;
      }
    }

    const { error } = await supabase
      .from('merchants')
      .update(updateData)
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
