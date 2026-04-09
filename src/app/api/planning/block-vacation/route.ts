import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const schema = z.object({
  merchantId: z.string().uuid(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason: z.string().max(100).optional(),
});

/**
 * POST /api/planning/block-vacation
 * Blocks a range of full days in free mode (vacations, training days, etc.).
 * client_name='__blocked__' at 00:00 with total_duration_minutes=1440 makes
 * the free-slots algorithm return no availability for those days.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });

    const { merchantId, startDate, endDate, reason } = parsed.data;

    if (endDate < startDate) return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });

    const startMs = new Date(startDate).getTime();
    const days = Math.round((new Date(endDate).getTime() - startMs) / 86400000) + 1;
    if (days > 90) return NextResponse.json({ error: 'Période trop longue (max 90 jours)' }, { status: 400 });

    const { data: m } = await supabase.from('merchants').select('id').eq('id', merchantId).eq('user_id', user.id).single();
    if (!m) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    const supabaseAdmin = getSupabaseAdmin();

    const rows = Array.from({ length: days }, (_, i) => ({
      merchant_id: merchantId,
      slot_date: new Date(startMs + i * 86400000).toISOString().split('T')[0],
      start_time: '00:00',
      client_name: '__blocked__',
      notes: reason || null,
      total_duration_minutes: 1440,
    }));

    // ignoreDuplicates relies on the UNIQUE INDEX (merchant_id, slot_date, start_time)
    const { error: upsertError } = await supabaseAdmin
      .from('merchant_planning_slots')
      .upsert(rows, { onConflict: 'merchant_id,slot_date,start_time', ignoreDuplicates: true });

    if (upsertError) {
      logger.error('Block vacation error:', upsertError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ inserted: days });
  } catch (error) {
    logger.error('Block vacation error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
