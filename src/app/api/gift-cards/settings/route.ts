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
import { detectPaymentProvider } from '@/lib/payment-providers';
import { hasGiftCards } from '@/lib/plan-tiers';
import logger from '@/lib/logger';

// Accepte une URL valide OU une chaîne vide / null (= effacer le lien)
const urlOrEmpty = z.union([z.string().url().max(500), z.literal(''), z.null()]);

const settingsSchema = z.object({
  merchantId: z.string().uuid(),
  enabled: z.boolean(),
  amounts: z.array(z.number().min(GIFT_CARD_MIN_AMOUNT).max(GIFT_CARD_MAX_AMOUNT)).max(8).optional(),
  message: z.string().max(300).nullable().optional(),
  // Sous-toggle : autoriser le client à offrir une prestation (mig 140)
  servicesEnabled: z.boolean().optional(),
  // Liens paiement dédiés bons cadeaux (mig 141)
  paymentLink: urlOrEmpty.optional(),
  paymentLink2: urlOrEmpty.optional(),
  // Durée de validité personnalisable (mig 145, 1-24 mois)
  expiryMonths: z.number().int().min(1).max(24).optional(),
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

    const { merchantId, enabled, amounts, message, servicesEnabled, paymentLink, paymentLink2, expiryMonths } = parsed.data;
    const supabase = getSupabaseAdmin();

    // Ownership check + tier gating
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, plan_tier, subscription_status')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();
    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }
    if (!hasGiftCards(merchant)) {
      return NextResponse.json(
        { error: 'plan_tier_required', message: 'Les bons cadeaux nécessitent le plan Tout-en-un.' },
        { status: 403 },
      );
    }

    const updatePayload: Record<string, unknown> = {
      gift_card_enabled: enabled,
    };
    // Patch partiel : on ne touche aux amounts/message que s'ils sont fournis
    // dans le body (sinon le toggle écraserait la config existante).
    if (amounts !== undefined) {
      const cleanAmounts = Array.from(new Set(
        amounts.filter((a) => a >= GIFT_CARD_MIN_AMOUNT && a <= GIFT_CARD_MAX_AMOUNT)
      ));
      updatePayload.gift_card_amounts = cleanAmounts.length > 0 ? cleanAmounts : GIFT_CARD_DEFAULT_AMOUNTS;
    }
    if (message !== undefined) {
      updatePayload.gift_card_message = message?.trim() || null;
    }
    if (typeof servicesEnabled === 'boolean') {
      updatePayload.gift_card_services_enabled = servicesEnabled;
    }
    // Liens paiement : on ne touche que si fourni (undefined = pas de changement,
    // null/'' = clear, URL = set + label auto-détecté)
    if (paymentLink !== undefined) {
      const url = paymentLink?.trim() || null;
      updatePayload.gift_card_payment_link = url;
      updatePayload.gift_card_payment_link_label = url ? detectPaymentProvider(url) : null;
    }
    if (paymentLink2 !== undefined) {
      const url = paymentLink2?.trim() || null;
      updatePayload.gift_card_payment_link_2 = url;
      updatePayload.gift_card_payment_link_2_label = url ? detectPaymentProvider(url) : null;
    }
    if (expiryMonths !== undefined) {
      updatePayload.gift_card_expiry_months = expiryMonths;
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
    // (sinon ISR cache 1h sert l'ancien HTML). Fire-and-forget : on ignore
    // l'échec, l'ISR finira par expirer.
    fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com'}/api/dashboard/revalidate-merchant-page`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
    }).catch(() => { /* silent */ });

    return NextResponse.json({
      success: true,
      gift_card_enabled: enabled,
      gift_card_amounts: updatePayload.gift_card_amounts,
      gift_card_message: updatePayload.gift_card_message,
      ...(typeof servicesEnabled === 'boolean' ? { gift_card_services_enabled: servicesEnabled } : {}),
    });
  } catch (error) {
    logger.error('Gift cards settings error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
