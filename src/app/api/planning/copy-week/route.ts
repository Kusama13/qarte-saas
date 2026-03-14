import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const copyWeekSchema = z.object({
  merchantId: z.string().uuid(),
  sourceWeekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetWeekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = copyWeekSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { merchantId, sourceWeekStart, targetWeekStart } = parsed.data;

    // Verify ownership
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get source week end (6 days after start)
    const sourceStart = new Date(sourceWeekStart);
    const sourceEnd = new Date(sourceStart);
    sourceEnd.setDate(sourceEnd.getDate() + 6);

    // Fetch source week slots (just times per day-of-week)
    const { data: sourceSlots, error: fetchError } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('slot_date, start_time')
      .eq('merchant_id', merchantId)
      .gte('slot_date', sourceWeekStart)
      .lte('slot_date', sourceEnd.toISOString().split('T')[0])
      .order('slot_date')
      .order('start_time');

    if (fetchError) {
      logger.error('Copy week fetch error:', fetchError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    if (!sourceSlots || sourceSlots.length === 0) {
      return NextResponse.json({ error: 'Aucun créneau à copier' }, { status: 400 });
    }

    // Map source slots to target week (same day offset)
    const targetStart = new Date(targetWeekStart);
    const newSlots = sourceSlots.map(slot => {
      const slotDate = new Date(slot.slot_date);
      const dayOffset = Math.round((slotDate.getTime() - sourceStart.getTime()) / (24 * 60 * 60 * 1000));
      const targetDate = new Date(targetStart);
      targetDate.setDate(targetDate.getDate() + dayOffset);

      return {
        merchant_id: merchantId,
        slot_date: targetDate.toISOString().split('T')[0],
        start_time: slot.start_time,
      };
    });

    // Upsert ignoring duplicates
    const { data, error: insertError } = await supabaseAdmin
      .from('merchant_planning_slots')
      .upsert(newSlots, { onConflict: 'merchant_id,slot_date,start_time', ignoreDuplicates: true })
      .select();

    if (insertError) {
      logger.error('Copy week insert error:', insertError);
      return NextResponse.json({ error: 'Erreur lors de la copie' }, { status: 500 });
    }

    return NextResponse.json({ success: true, created: data?.length || 0 });
  } catch (error) {
    logger.error('Copy week error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
