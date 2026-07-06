import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeMerchant } from '@/lib/api-helpers';
import { syncBookingLoyalty } from '@/lib/booking-loyalty';
import logger from '@/lib/logger';

const patchSchema = z.object({
  slot_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  attendance_status: z.enum(['pending', 'attended', 'no_show', 'cancelled']).nullable(),
});

// PATCH: merchant marks a past slot as attended / no_show / cancelled
// Reserved to paid tiers via plan feature `planning` (trials have access).
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { slot_id, merchant_id, attendance_status } = parsed.data;

    const auth = await authorizeMerchant(merchant_id);
    if (auth.response) return auth.response;

    const { data, error } = await auth.supabaseAdmin
      .from('merchant_planning_slots')
      .update({ attendance_status })
      .eq('id', slot_id)
      .eq('merchant_id', merchant_id)
      .select('id, attendance_status')
      .maybeSingle();

    if (error || !data) {
      logger.error('attendance PATCH error', error);
      return NextResponse.json({ error: 'Créneau introuvable' }, { status: 404 });
    }

    // Symbiose résa → fidélité : Venue crédite un point, tout autre statut le retire.
    // No-op si l'option merchant est OFF / pas de cliente reliée / déjà à jour.
    await syncBookingLoyalty(auth.supabaseAdmin, slot_id, attendance_status === 'attended');

    return NextResponse.json({ success: true, attendance_status: data.attendance_status });
  } catch (error) {
    logger.error('attendance route error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
