import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { formatPhoneNumber } from '@/lib/utils';
import { sendBookingSms } from '@/lib/sms';
import type { MerchantCountry } from '@/types';
import logger from '@/lib/logger';

const schema = z.object({
  merchantId: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  total_duration_minutes: z.number().int().min(5).max(600),
  client_name: z.string().min(1).max(100),
  client_phone: z.string().max(20).optional(),
  phone_country: z.string().optional(),
  customer_id: z.string().uuid().optional(),
  service_ids: z.array(z.string().uuid()).optional(),
  custom_service_name: z.string().max(100).nullable().optional(),
  custom_service_duration: z.number().int().positive().max(720).nullable().optional(),
  custom_service_price: z.number().min(0).max(100_000).nullable().optional(),
  custom_service_color: z.string().regex(/^#[0-9a-fA-F]{6}$/).nullable().optional(),
  notes: z.string().max(500).optional(),
  force: z.boolean().optional(),
  send_sms: z.boolean().optional(),
});

function timeToMinutes(t: string): number {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

/**
 * POST /api/planning/manual-booking
 * Merchant creates a booking manually in free mode (no pre-generated slot needed).
 * Checks for overlap with existing bookings + buffer.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });

    const { merchantId, date, start_time, total_duration_minutes, client_name, client_phone, phone_country, customer_id, service_ids, custom_service_name, custom_service_duration, custom_service_price, custom_service_color, notes, force, send_sms } = parsed.data;

    const { data: m } = await supabase.from('merchants').select('id, booking_mode, buffer_minutes, country, shop_name, locale, subscription_status').eq('id', merchantId).eq('user_id', user.id).single();
    if (!m) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    if (m.booking_mode !== 'free') return NextResponse.json({ error: 'Mode non applicable' }, { status: 400 });

    const supabaseAdmin = getSupabaseAdmin();
    const buffer = m.buffer_minutes ?? 0;
    const country = (phone_country || m.country || 'FR') as MerchantCountry;
    const formattedPhone = client_phone ? formatPhoneNumber(client_phone.trim(), country) : null;

    const newStart = timeToMinutes(start_time);
    const newEnd = newStart + total_duration_minutes;

    if (!force) {
      // Check overlap with existing bookings
      const { data: existing } = await supabaseAdmin
        .from('merchant_planning_slots')
        .select('start_time, total_duration_minutes, client_name')
        .eq('merchant_id', merchantId)
        .eq('slot_date', date)
        .not('client_name', 'is', null)
        .is('primary_slot_id', null);

      const conflicting = (existing || []).find(b => {
        const bStart = timeToMinutes(b.start_time);
        const bEnd = bStart + (b.total_duration_minutes ?? 30) + buffer;
        return newStart < bEnd && newEnd > bStart;
      });

      if (conflicting) {
        const cStart = timeToMinutes(conflicting.start_time);
        const cEnd = cStart + (conflicting.total_duration_minutes ?? 30);
        const pad = (n: number) => String(n).padStart(2, '0');
        const fmt = (mins: number) => `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
        return NextResponse.json({
          error: 'Un RDV existe déjà sur cette plage',
          conflict: {
            client_name: conflicting.client_name,
            start_time: conflicting.start_time,
            end_time: fmt(cEnd),
          },
        }, { status: 409 });
      }
    }

    const { data: slot, error: insertError } = await supabaseAdmin
      .from('merchant_planning_slots')
      .insert({
        merchant_id: merchantId,
        slot_date: date,
        start_time,
        client_name,
        client_phone: formattedPhone,
        customer_id: customer_id || null,
        notes: notes || null,
        total_duration_minutes,
        custom_service_name: custom_service_name?.trim() || null,
        custom_service_duration: custom_service_duration ?? null,
        custom_service_price: custom_service_price ?? null,
        custom_service_color: custom_service_color ?? null,
      })
      .select('id')
      .single();

    if (insertError || !slot) {
      logger.error('Manual booking insert error:', insertError);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Link services
    if (service_ids?.length) {
      await supabaseAdmin.from('planning_slot_services').insert(
        service_ids.map(service_id => ({ slot_id: slot.id, service_id }))
      );
    }

    // SMS confirmation (opt-in, fire-and-forget)
    if (send_sms && formattedPhone) {
      sendBookingSms(supabaseAdmin, {
        merchantId,
        slotId: slot.id,
        phone: formattedPhone,
        shopName: m.shop_name,
        date,
        time: start_time,
        smsType: 'confirmation_no_deposit',
        locale: m.locale || 'fr',
        subscriptionStatus: m.subscription_status,
      }).catch(() => {});
    }

    return NextResponse.json({ success: true, slotId: slot.id, customer_id: customer_id || null });
  } catch (error) {
    logger.error('Manual booking error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
