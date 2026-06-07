import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const switchModeSchema = z.object({
  merchantId: z.string().uuid(),
  targetMode: z.enum(['slots', 'free']),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = switchModeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { merchantId, targetMode } = parsed.data;

    const supabaseAdmin = getSupabaseAdmin();

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, user_id, booking_mode')
      .eq('id', merchantId)
      .single();
    if (!merchant || merchant.user_id !== user.id) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const currentMode = merchant.booking_mode as 'slots' | 'free';
    if (currentMode === targetMode) {
      return NextResponse.json({ success: true, deletedCount: 0, modeChanged: false });
    }

    let deletedCount = 0;
    // Purge toutes semaines confondues sinon contrainte unique (merchant_id, slot_date, start_time) sautera en mode libre.
    if (targetMode === 'free' && currentMode === 'slots') {
      const { count, error: deleteError } = await supabaseAdmin
        .from('merchant_planning_slots')
        .delete({ count: 'exact' })
        .eq('merchant_id', merchantId)
        .is('client_name', null)
        .is('primary_slot_id', null);
      if (deleteError) {
        logger.error('switch-mode delete error:', deleteError);
        return NextResponse.json({ error: 'Erreur lors du nettoyage des créneaux' }, { status: 500 });
      }
      deletedCount = count ?? 0;

      // Backfill total_duration_minutes sur les resas creneaux existantes :
      // en mode creneaux, la duree etait implicite via le nombre de child slots
      // fillers (primary_slot_id pointant vers le parent). En mode libre, les
      // checks de conflit retombent sur ?? 30 min si NULL, ce qui laisse passer
      // des chevauchements pour les RDV >= 60 min.
      const { data: primariesNeedingDuration } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('id')
        .eq('merchant_id', merchantId)
        .not('client_name', 'is', null)
        .is('primary_slot_id', null)
        .is('total_duration_minutes', null);
      if (primariesNeedingDuration && primariesNeedingDuration.length > 0) {
        const primaryIds = primariesNeedingDuration.map(p => p.id);
        const { data: children } = await supabaseAdmin
          .from('merchant_planning_slots')
          .select('primary_slot_id')
          .in('primary_slot_id', primaryIds);
        const childCountByPrimary = new Map<string, number>();
        for (const c of children || []) {
          if (!c.primary_slot_id) continue;
          childCountByPrimary.set(c.primary_slot_id, (childCountByPrimary.get(c.primary_slot_id) || 0) + 1);
        }
        await Promise.all(
          primaryIds.map(id => {
            const duration = 30 + 30 * (childCountByPrimary.get(id) || 0);
            return supabaseAdmin
              .from('merchant_planning_slots')
              .update({ total_duration_minutes: duration })
              .eq('id', id);
          }),
        );
      }
    }

    const updatePayload: Record<string, unknown> = { booking_mode: targetMode };
    if (targetMode === 'free') updatePayload.auto_booking_enabled = true;

    const { error: updateError } = await supabaseAdmin
      .from('merchants')
      .update(updatePayload)
      .eq('id', merchantId);
    if (updateError) {
      logger.error('switch-mode update error:', updateError);
      return NextResponse.json({ error: 'Erreur lors du changement de mode' }, { status: 500 });
    }

    return NextResponse.json({ success: true, deletedCount, modeChanged: true });
  } catch (error) {
    logger.error('switch-mode unexpected error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
