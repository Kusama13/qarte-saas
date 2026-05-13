import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

/**
 * POST /api/planning/cleanup-empty-slots
 * Supprime TOUS les slots vides (non bookes, non fillers) d'un merchant.
 * Appele au switch mode creneaux -> libre : sinon les slots vides residuels
 * bloquent les INSERT mode libre via la contrainte UNIQUE(merchant_id,
 * slot_date, start_time). Le cleanup client-side ne couvre que la semaine
 * affichee — cet endpoint nettoie l'ensemble du planning.
 */
const schema = z.object({
  merchantId: z.string().uuid(),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorise' }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });

    const { merchantId } = parsed.data;

    const { data: ownership } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();
    if (!ownership) return NextResponse.json({ error: 'Non autorise' }, { status: 403 });

    const supabaseAdmin = getSupabaseAdmin();
    const { error, count } = await supabaseAdmin
      .from('merchant_planning_slots')
      .delete({ count: 'exact' })
      .eq('merchant_id', merchantId)
      .is('client_name', null)
      .is('primary_slot_id', null);

    if (error) {
      logger.error('Cleanup empty slots error:', error);
      return NextResponse.json({ error: 'Erreur lors du nettoyage' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deleted: count ?? 0 });
  } catch (error) {
    logger.error('Cleanup empty slots error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
