/**
 * PATCH /api/gift-cards/settings
 *
 * Met à jour la config bons cadeaux du merchant : toggle on/off, montants
 * suggérés, mot d'introduction. Auth merchant requise.
 *
 * Tout est dans cet endpoint plutôt que dispersé pour que la page
 * /dashboard/gift-cards soit autonome (pas de dépendance à /dashboard/program).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import {
  GIFT_CARD_MIN_AMOUNT,
  GIFT_CARD_MAX_AMOUNT,
  GIFT_CARD_DEFAULT_AMOUNTS,
} from '@/lib/gift-cards';
import logger from '@/lib/logger';

const settingsSchema = z.object({
  merchantId: z.string().uuid(),
  enabled: z.boolean(),
  amounts: z.array(z.number().min(GIFT_CARD_MIN_AMOUNT).max(GIFT_CARD_MAX_AMOUNT)).max(8).optional(),
  message: z.string().max(300).nullable().optional(),
  // Sous-toggle : autoriser le client à offrir une prestation (mig 140)
  servicesEnabled: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = settingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { merchantId, enabled, amounts, message, servicesEnabled } = parsed.data;
    const supabase = getSupabaseAdmin();

    // Ownership check
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();
    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const cleanAmounts = (amounts || []).filter((a) => a >= GIFT_CARD_MIN_AMOUNT && a <= GIFT_CARD_MAX_AMOUNT);
    const finalAmounts = cleanAmounts.length > 0 ? cleanAmounts : GIFT_CARD_DEFAULT_AMOUNTS;

    const updatePayload: Record<string, unknown> = {
      gift_card_enabled: enabled,
      gift_card_amounts: finalAmounts,
      gift_card_message: message?.trim() || null,
    };
    if (typeof servicesEnabled === 'boolean') {
      updatePayload.gift_card_services_enabled = servicesEnabled;
    }

    const { error: updateError } = await supabase
      .from('merchants')
      .update(updatePayload)
      .eq('id', merchantId);

    if (updateError) {
      logger.error('Gift cards settings update error:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    // Force-revalide la vitrine pour que le toggle prenne effet immédiatement
    // (sinon ISR cache 1h sert l'ancien HTML)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com'}/api/dashboard/revalidate-merchant-page`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Cookie: request.headers.get('cookie') || '',
        },
      }).catch(() => {});
    } catch {
      // silent
    }

    return NextResponse.json({
      success: true,
      gift_card_enabled: enabled,
      gift_card_amounts: finalAmounts,
      gift_card_message: message?.trim() || null,
      ...(typeof servicesEnabled === 'boolean' ? { gift_card_services_enabled: servicesEnabled } : {}),
    });
  } catch (error) {
    logger.error('Gift cards settings error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
