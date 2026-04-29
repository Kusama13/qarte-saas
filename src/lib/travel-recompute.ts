// Recompute travel_time_minutes for ALL slots of a given day after an
// insertion / cancellation / modification in home-service mode.
// Respects travel_time_overridden = true (manual override is not touched).
//
// Server-only.

import { getSupabaseAdmin } from '@/lib/supabase';
import { getTravelTime, type Coords } from '@/lib/travel-time';
import logger from '@/lib/logger';

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

interface SlotRow {
  id: string;
  start_time: string;
  customer_lat: number | null;
  customer_lng: number | null;
  travel_time_overridden: boolean | null;
  travel_time_minutes: number | null;
}

export async function recomputeDayTravel(merchantId: string, slotDate: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  const { data: merchant } = await supabase
    .from('merchants')
    .select('shop_lat, shop_lng, home_service_enabled')
    .eq('id', merchantId)
    .single();

  if (!merchant?.home_service_enabled) return;
  if (merchant.shop_lat == null || merchant.shop_lng == null) return;

  const { data: slots } = await supabase
    .from('merchant_planning_slots')
    .select('id, start_time, customer_lat, customer_lng, travel_time_overridden, travel_time_minutes')
    .eq('merchant_id', merchantId)
    .eq('slot_date', slotDate)
    .not('client_name', 'is', null)
    .is('primary_slot_id', null)
    .order('start_time');

  if (!slots || slots.length === 0) return;

  const sorted = (slots as SlotRow[]).sort(
    (a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time)
  );

  // Build (origin, dest) pairs for each slot that needs recompute, then run them in parallel.
  // Origin = previous slot's customer coords (or merchant shop for the 1st of the day).
  const shopCoords: Coords = { lat: merchant.shop_lat, lng: merchant.shop_lng };
  const tasks: { slotId: string; origin: Coords; dest: Coords }[] = [];

  let prevCoords: Coords = shopCoords;
  for (const slot of sorted) {
    if (slot.customer_lat == null || slot.customer_lng == null) continue;
    const dest: Coords = { lat: slot.customer_lat, lng: slot.customer_lng };

    if (!slot.travel_time_overridden) {
      tasks.push({ slotId: slot.id, origin: prevCoords, dest });
    }
    prevCoords = dest;
  }

  if (tasks.length === 0) return;

  const minutes = await Promise.all(tasks.map((t) => getTravelTime(t.origin, t.dest)));

  await Promise.all(
    tasks.map((t, i) =>
      supabase
        .from('merchant_planning_slots')
        .update({ travel_time_minutes: minutes[i] })
        .eq('id', t.slotId)
        .then(({ error }) => {
          if (error) logger.warn('recomputeDayTravel update failed', { slotId: t.slotId, err: String(error) });
        })
    )
  );
}
