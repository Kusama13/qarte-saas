/**
 * POST /api/gift-cards/[id]/consume
 *
 * Le merchant marque un bon cadeau comme consommé depuis la page
 * /dashboard/gift-cards (cas où le destinataire utilise son bon en salon).
 *
 * Effet :
 *   1. Update voucher.is_used=true + used_at
 *   2. Update gift_card.status='used' + used_at
 *   3. Trigger SMS systématique à l'offreur (gift_card_used)
 *
 * Anti-race : update atomique sur status='active'.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { sendBookingSms } from '@/lib/sms';
import { formatCurrency } from '@/lib/utils';
import { formatGiftCardServicesLabel } from '@/lib/gift-cards';
import type { GiftCardServiceSnapshot } from '@/types';
import logger from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // Lookup gift_card + ownership check
    const { data: giftCard } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (!giftCard) {
      return NextResponse.json({ error: 'Bon cadeau introuvable' }, { status: 404 });
    }

    if (giftCard.status !== 'active') {
      return NextResponse.json(
        { error: 'Ce bon n\'est pas actif (déjà consommé, annulé ou expiré)' },
        { status: 409 },
      );
    }

    if (!giftCard.voucher_id) {
      return NextResponse.json({ error: 'Voucher introuvable' }, { status: 500 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, shop_name, country, locale, subscription_status')
      .eq('id', giftCard.merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const usedAt = new Date();

    // Atomic : passe gift_card → used SI encore active
    const { data: updated } = await supabase
      .from('gift_cards')
      .update({
        status: 'used',
        used_at: usedAt.toISOString(),
      })
      .eq('id', id)
      .eq('status', 'active')
      .select('id');

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Bon déjà traité' }, { status: 409 });
    }

    // Marque le voucher comme used (synchrone, pas critique mais cohérent)
    await supabase
      .from('vouchers')
      .update({ is_used: true, used_at: usedAt.toISOString() })
      .eq('id', giftCard.voucher_id)
      .eq('is_used', false);

    // SMS offreur fire-and-forget
    const locale = (merchant.locale || 'fr') as 'fr' | 'en';
    const amountFmt = formatCurrency(Number(giftCard.amount), merchant.country, locale, 0);

    let servicesLabel: string | null = null;
    if (giftCard.kind === 'services' && Array.isArray(giftCard.service_ids) && giftCard.service_ids.length > 0) {
      const { data: liveSvc } = await supabase
        .from('merchant_services')
        .select('id, name')
        .eq('merchant_id', giftCard.merchant_id)
        .in('id', giftCard.service_ids);
      const liveById = new Map<string, string>(
        ((liveSvc as Array<{ id: string; name: string }>) || []).map((s) => [s.id, s.name]),
      );
      const snapById = new Map<string, GiftCardServiceSnapshot>(
        ((giftCard.service_snapshot as GiftCardServiceSnapshot[] | null) || []).map((s) => [s.id, s]),
      );
      const names = (giftCard.service_ids as string[])
        .map((sid) => liveById.get(sid) || snapById.get(sid)?.name || null)
        .filter((n): n is string => Boolean(n));
      servicesLabel = formatGiftCardServicesLabel(names);
    }

    sendBookingSms(supabase, {
      merchantId: merchant.id,
      phone: giftCard.sender_phone,
      shopName: merchant.shop_name,
      smsType: 'gift_card_used',
      locale,
      subscriptionStatus: merchant.subscription_status || 'active',
      giftSenderName: giftCard.sender_first_name,
      giftRecipientName: giftCard.recipient_first_name,
      giftAmount: amountFmt,
      giftServicesLabel: servicesLabel,
    }).catch((e) => logger.error('Gift used SMS sender failed:', e));

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Gift card consume error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
