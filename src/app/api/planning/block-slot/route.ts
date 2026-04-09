import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const blockSchema = z.object({
  merchantId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
  reason: z.string().max(100).optional(),
});

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * POST /api/planning/block-slot
 * Creates a blocked time range on the merchant's calendar (mode libre).
 * If endDate is provided, creates one block per day from date to endDate (inclusive).
 * Relies on UNIQUE INDEX (merchant_id, slot_date, start_time) — duplicates are ignored.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json();
    const parsed = blockSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });

    const { merchantId, date, endDate, start_time, end_time, reason } = parsed.data;

    const duration = timeToMinutes(end_time) - timeToMinutes(start_time);
    if (duration <= 0) return NextResponse.json({ error: 'Heure de fin invalide' }, { status: 400 });

    if (endDate && endDate < date) return NextResponse.json({ error: 'Dates invalides' }, { status: 400 });

    const { data: m } = await supabase.from('merchants').select('id').eq('id', merchantId).eq('user_id', user.id).single();
    if (!m) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    const supabaseAdmin = getSupabaseAdmin();

    const startMs = new Date(date).getTime();
    const days = endDate ? Math.round((new Date(endDate).getTime() - startMs) / 86400000) + 1 : 1;
    if (days > 90) return NextResponse.json({ error: 'Période trop longue (max 90 jours)' }, { status: 400 });

    const rows = Array.from({ length: days }, (_, i) => ({
      merchant_id: merchantId,
      slot_date: new Date(startMs + i * 86400000).toISOString().split('T')[0],
      start_time,
      client_name: '__blocked__',
      notes: reason || null,
      total_duration_minutes: duration,
    }));

    const { error } = await supabaseAdmin
      .from('merchant_planning_slots')
      .upsert(rows, { onConflict: 'merchant_id,slot_date,start_time', ignoreDuplicates: true });

    if (error) {
      logger.error('Block slot error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ inserted: days });
  } catch (error) {
    logger.error('Block slot error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
