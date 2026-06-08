import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';

type Admin = ReturnType<typeof getSupabaseAdmin>;

export type ReserveArgs = {
  merchantId: string;
  slotDate: string;
  startTime: string;
  durationMinutes: number;
  bufferMinutes: number;
  clientName: string | null;
  excludeSlotId?: string | null;
  force?: boolean;
};

type ReserveResult =
  | { ok: true; slotId: string }
  | { ok: false; response: NextResponse };

/**
 * Réservation atomique d'un créneau en mode libre (mig 175).
 *
 * 1. `reserve_free_slot` pose une ligne sous advisory lock (check chevauchement +
 *    INSERT atomiques) — ferme la fenêtre de course qui laissait passer 2 résas
 *    qui se chevauchent ;
 * 2. enrichit la ligne par UPDATE avec les champs propres à chaque flux ;
 * 3. libère la ligne réservée si l'enrichissement échoue (pas de créneau fantôme
 *    qui occuperait la plage).
 *
 * Centralise ce protocole pour que tout chemin de résa en mode libre soit atomique
 * sans réimplémenter — ni oublier — le verrou et le rollback.
 */
export async function reserveAndEnrich(
  admin: Admin,
  args: ReserveArgs,
  enrichFields: Record<string, unknown>,
  messages: { conflict: string; error: string },
): Promise<ReserveResult> {
  const { data: reserve } = await admin.rpc('reserve_free_slot', {
    p_merchant_id: args.merchantId,
    p_slot_date: args.slotDate,
    p_start_time: args.startTime,
    p_duration: args.durationMinutes,
    p_buffer: args.bufferMinutes,
    p_client_name: args.clientName,
    p_exclude_slot_id: args.excludeSlotId ?? null,
    p_force: args.force ?? false,
  });

  if (!reserve?.success) {
    return { ok: false, response: NextResponse.json({ error: messages.conflict }, { status: 409 }) };
  }

  const slotId = reserve.slot_id as string;
  const { error } = await admin.from('merchant_planning_slots').update(enrichFields).eq('id', slotId);
  if (error) {
    logger.error('reserveAndEnrich enrich failed, releasing slot:', error);
    await admin.from('merchant_planning_slots').delete().eq('id', slotId);
    return { ok: false, response: NextResponse.json({ error: messages.error }, { status: 500 }) };
  }

  return { ok: true, slotId };
}
