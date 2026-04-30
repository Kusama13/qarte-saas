/**
 * GET /api/gift-cards/track/[code]
 *
 * Endpoint public, rate-limited. Permet à l'offreur de suivre l'état de son
 * bon cadeau via le code GIFT-XXXXXX. Le code agit comme un token bearer :
 * pas d'auth, mais le code est aléatoire (6 chars sur 31, ~887 millions
 * combinaisons) et le rate limit empêche l'énumération.
 *
 * Renvoie uniquement les champs publics : pas de téléphone ni email
 * complets, ni l'identité du destinataire au-delà de son prénom (la pré-
 * sentation reste "Pour [Marie]" comme sur le bon).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { formatCurrency } from '@/lib/utils';
import { formatGiftCardServicesLabel } from '@/lib/gift-cards';
import type { GiftCardServiceSnapshot } from '@/types';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ code: string }> },
) {
  try {
    // Rate limit anti-énumération (60/h par IP — l'offreur regarde quelques fois)
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`gift-track:${ip}`, {
      maxRequests: 60,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const { code: rawCode } = await context.params;
    const code = (rawCode || '').toUpperCase().trim();

    // Format basique : doit ressembler à GIFT-XXXXXX
    if (!/^GIFT-[A-Z2-9]{6}$/.test(code)) {
      return NextResponse.json({ error: 'Code invalide' }, { status: 400 });
    }

    // Lookup gift_card + merchant pour shop_name + couleurs + locale
    const { data: giftCard, error } = await supabaseAdmin
      .from('gift_cards')
      .select(`
        id, code, amount, kind, status, service_ids, service_snapshot,
        sender_first_name, recipient_first_name,
        created_at, paid_at, used_at, cancelled_at, expires_at, pdf_url,
        scheduled_send_at, notified_at,
        merchant_id,
        merchants ( shop_name, country, locale, primary_color, secondary_color )
      `)
      .eq('code', code)
      .maybeSingle();

    if (error || !giftCard) {
      return NextResponse.json({ error: 'Bon introuvable' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const merchant = giftCard.merchants as any;
    const locale = (merchant?.locale || 'fr') as 'fr' | 'en';
    const country = merchant?.country || 'FR';
    const amountFormatted = formatCurrency(Number(giftCard.amount), country, locale, 0);

    // Si kind=services : noms LIVE (avec fallback snapshot) pour résilience
    let servicesLabel: string | null = null;
    let serviceNames: string[] = [];
    if (giftCard.kind === 'services' && Array.isArray(giftCard.service_ids) && giftCard.service_ids.length > 0) {
      const { data: liveSvc } = await supabaseAdmin
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
      serviceNames = (giftCard.service_ids as string[])
        .map((id) => liveById.get(id) || snapById.get(id)?.name || null)
        .filter((n): n is string => Boolean(n));
      servicesLabel = formatGiftCardServicesLabel(serviceNames);
    }

    // Réponse publique — on ne retourne ni téléphones ni emails complets
    return NextResponse.json({
      code: giftCard.code,
      status: giftCard.status,
      amount: Number(giftCard.amount),
      amountFormatted,
      kind: giftCard.kind,
      servicesLabel,
      serviceNames,
      senderFirstName: giftCard.sender_first_name,
      recipientFirstName: giftCard.recipient_first_name,
      createdAt: giftCard.created_at,
      paidAt: giftCard.paid_at,
      usedAt: giftCard.used_at,
      cancelledAt: giftCard.cancelled_at,
      expiresAt: giftCard.expires_at,
      pdfUrl: giftCard.pdf_url,
      scheduledSendAt: giftCard.scheduled_send_at,
      notifiedAt: giftCard.notified_at,
      shop: {
        name: merchant?.shop_name || '',
        primaryColor: merchant?.primary_color || '#4b0082',
        secondaryColor: merchant?.secondary_color || '#ec4899',
        locale,
      },
    });
  } catch (err) {
    logger.error('Gift card track error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
