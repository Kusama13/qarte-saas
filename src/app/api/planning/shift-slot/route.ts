import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const shiftSlotSchema = z.object({
  merchantId: z.string().uuid(),
  slotId: z.string().uuid(),
  newTime: z.string().regex(/^\d{2}:\d{2}$/),
  newDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

// POST — shift a slot to a new time and/or date
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = shiftSlotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
    }

    const { merchantId, slotId, newTime, newDate } = parsed.data;

    // Verify ownership
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Get the slot to shift
    const { data: slot } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('id, slot_date, start_time')
      .eq('id', slotId)
      .eq('merchant_id', merchantId)
      .single();

    if (!slot) {
      return NextResponse.json({ error: 'Creneau introuvable' }, { status: 404 });
    }

    const targetDate = newDate || slot.slot_date;

    // Check no conflict with UNIQUE(merchant_id, slot_date, start_time)
    const { data: conflict } = await supabaseAdmin
      .from('merchant_planning_slots')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('slot_date', targetDate)
      .eq('start_time', newTime)
      .neq('id', slotId)
      .single();

    if (conflict) {
      return NextResponse.json({ error: 'Un creneau existe deja a cette heure' }, { status: 409 });
    }

    // Update start_time and optionally slot_date
    const updateData: Record<string, string> = { start_time: newTime };
    if (newDate) updateData.slot_date = newDate;

    const { error } = await supabaseAdmin
      .from('merchant_planning_slots')
      .update(updateData)
      .eq('id', slotId)
      .eq('merchant_id', merchantId);

    if (error) {
      logger.error('Planning shift-slot error:', error);
      return NextResponse.json({ error: 'Erreur lors du decalage' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Planning shift-slot error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
