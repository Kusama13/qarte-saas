import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';
import { getPlanFeatures } from '@/lib/plan-tiers';

const patchSchema = z.object({
  merchantId: z.string().uuid(),
  contestEnabled: z.boolean(),
  contestPrize: z.string().max(300).nullable(),
});

// GET — fetch contest history for a merchant
export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data: contests } = await supabase
      .from('merchant_contests')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('contest_month', { ascending: false })
      .limit(12);

    return NextResponse.json({ contests: contests || [] });
  } catch (error) {
    logger.error('Contest GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH — update contest settings on merchant
export async function PATCH(request: NextRequest) {
  try {
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { merchantId, contestEnabled, contestPrize } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, subscription_status, plan_tier')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (contestEnabled && !getPlanFeatures(merchant).contest) {
      return NextResponse.json(
        { error: 'plan_tier_required', message: 'Le jeu concours nécessite le plan Tout-en-un.' },
        { status: 403 },
      );
    }

    const { error } = await supabase
      .from('merchants')
      .update({
        contest_enabled: contestEnabled,
        contest_prize: contestEnabled ? contestPrize : null,
      })
      .eq('id', merchantId);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Contest PATCH error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
