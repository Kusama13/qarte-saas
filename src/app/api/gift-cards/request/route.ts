/**
 * POST /api/gift-cards/request
 *
 * Endpoint public appelé par la vitrine /p/[slug] quand un visiteur commande
 * un bon cadeau. Crée la ligne `gift_cards` en `pending_payment`, envoie
 * l'email à l'offreur (avec liens paiement merchant) et notifie le merchant
 * (email + push). À ce stade : PAS de SMS au destinataire, PAS de voucher.
 *
 * Le voucher + SMS destinataire sont émis uniquement après confirmation du
 * paiement par le merchant (route /confirm-payment).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import {
  formatPhoneNumber,
  validatePhone,
  getAllPhoneFormats,
  getTrialStatus,
  formatCurrency,
} from '@/lib/utils';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import {
  generateGiftCardCode,
  merchantHasPaymentLink,
  GIFT_CARD_MIN_AMOUNT,
  GIFT_CARD_MAX_AMOUNT,
  formatGiftCardServicesLabel,
} from '@/lib/gift-cards';
import type { GiftCardServiceSnapshot } from '@/types';
import { detectPaymentProvider } from '@/lib/payment-providers';
import {
  sendGiftCardOrderConfirmationEmail,
  sendGiftCardMerchantNotificationEmail,
} from '@/lib/email';
import { sendMerchantPush } from '@/lib/merchant-push';
import logger from '@/lib/logger';
import type { MerchantCountry } from '@/types';

const supabaseAdmin = getSupabaseAdmin();

const giftCardRequestSchema = z.object({
  merchant_id: z.string().uuid(),

  // Type : amount = montant libre, services = liste de prestations à offrir
  // Si services, le montant est calculé serveur-side à partir des prix LIVE.
  kind: z.enum(['amount', 'services']).default('amount'),
  amount: z.number().min(GIFT_CARD_MIN_AMOUNT).max(GIFT_CARD_MAX_AMOUNT).optional(),
  service_ids: z.array(z.string().uuid()).min(1).max(10).optional(),

  // Offreur
  sender_first_name: z.string().min(1).max(60),
  sender_phone: z.string().min(1),
  sender_phone_country: z.enum(['FR', 'BE', 'CH']).optional(),
  sender_email: z.string().email().max(255),
  sender_message: z.string().max(300).optional().nullable(),

  // Destinataire
  recipient_first_name: z.string().min(1).max(60),
  recipient_phone: z.string().min(1),
  recipient_phone_country: z.enum(['FR', 'BE', 'CH']).optional(),
  recipient_email: z.string().email().max(255).optional().nullable(),
}).refine(
  (data) => (data.kind === 'amount' ? data.amount !== undefined : (data.service_ids?.length || 0) > 0),
  { message: 'amount requis si kind=amount, service_ids requis si kind=services' },
);

export async function POST(request: NextRequest) {
  try {
    // 1. Rate limit strict (déclenche email + notif merchant) — 3/h par IP
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`gift-card-request:${ip}`, {
      maxRequests: 3,
      windowMs: 60 * 60 * 1000,
    });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    // 2. Parse + validate body
    const body = await request.json();
    const parsed = giftCardRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.flatten() },
        { status: 400 },
      );
    }
    const data = parsed.data;

    // 3. Lookup merchant + checks
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select(
        'id, slug, shop_name, country, locale, primary_color, secondary_color, gift_card_enabled, gift_card_services_enabled, deposit_link, deposit_link_label, deposit_link_2, deposit_link_2_label, trial_ends_at, subscription_status, deleted_at, user_id',
      )
      .eq('id', data.merchant_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (!merchant) {
      return NextResponse.json({ error: 'Salon introuvable' }, { status: 404 });
    }

    if (!merchant.gift_card_enabled) {
      return NextResponse.json(
        { error: 'Les bons cadeaux ne sont pas activés pour ce salon' },
        { status: 403 },
      );
    }

    if (data.kind === 'services' && !merchant.gift_card_services_enabled) {
      return NextResponse.json(
        { error: 'Ce salon ne propose pas d\'offrir une prestation' },
        { status: 403 },
      );
    }

    const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
    if (trialStatus.isTrialExpired) {
      return NextResponse.json(
        { error: 'Cette page est temporairement indisponible' },
        { status: 403 },
      );
    }

    if (!merchantHasPaymentLink(merchant)) {
      return NextResponse.json(
        { error: 'Le salon n\'a pas configuré de moyen de paiement pour les bons cadeaux' },
        { status: 503 },
      );
    }

    // 4. Format + validate phones
    const senderCountry = (data.sender_phone_country || merchant.country || 'FR') as MerchantCountry;
    const senderPhoneE164 = formatPhoneNumber(data.sender_phone, senderCountry);
    if (!validatePhone(senderPhoneE164, senderCountry)) {
      return NextResponse.json({ error: 'Numéro offreur invalide' }, { status: 400 });
    }

    const recipientCountry = (data.recipient_phone_country || merchant.country || 'FR') as MerchantCountry;
    const recipientPhoneE164 = formatPhoneNumber(data.recipient_phone, recipientCountry);
    if (!validatePhone(recipientPhoneE164, recipientCountry)) {
      return NextResponse.json({ error: 'Numéro destinataire invalide' }, { status: 400 });
    }

    // 5. Anti-spam : vérifier que ni l'offreur ni le destinataire ne sont bannis
    const senderVariants = getAllPhoneFormats(senderPhoneE164);
    const recipientVariants = getAllPhoneFormats(recipientPhoneE164);
    const allBannedCheck = [...new Set([...senderVariants, ...recipientVariants])];

    const { data: bannedRow } = await supabaseAdmin
      .from('banned_numbers')
      .select('phone_number')
      .eq('merchant_id', merchant.id)
      .in('phone_number', allBannedCheck)
      .maybeSingle();

    if (bannedRow) {
      return NextResponse.json(
        { error: 'Ce numéro ne peut pas commander un bon ici. Contacte directement le salon.' },
        { status: 403 },
      );
    }

    // 6a. Si mode services : charger les prix LIVE depuis DB, calculer amount,
    //     snapshot {id,name,price} pour résilience future
    let finalAmount: number;
    let serviceIds: string[] | null = null;
    let serviceSnapshot: GiftCardServiceSnapshot[] | null = null;
    let servicesLabel: string | null = null;

    if (data.kind === 'services') {
      const ids = data.service_ids!;
      const { data: svcRows } = await supabaseAdmin
        .from('merchant_services')
        .select('id, name, price')
        .eq('merchant_id', merchant.id)
        .in('id', ids);

      const found = (svcRows as Array<{ id: string; name: string; price: number | string }>) || [];
      // On vérifie que TOUS les ids demandés appartiennent bien à ce merchant
      const foundIds = new Set(found.map((s) => s.id));
      const missing = ids.filter((id) => !foundIds.has(id));
      if (missing.length > 0) {
        return NextResponse.json(
          { error: 'Une ou plusieurs prestations sont introuvables' },
          { status: 400 },
        );
      }

      // Préserver l'ordre de sélection client (multi-sélection avec doublons éventuels)
      const byId = new Map(found.map((s) => [s.id, s]));
      const orderedFound = ids.map((id) => byId.get(id)!);

      finalAmount = orderedFound.reduce((sum, s) => sum + Number(s.price || 0), 0);
      if (finalAmount < GIFT_CARD_MIN_AMOUNT || finalAmount > GIFT_CARD_MAX_AMOUNT) {
        return NextResponse.json(
          { error: `Montant total invalide (min ${GIFT_CARD_MIN_AMOUNT}, max ${GIFT_CARD_MAX_AMOUNT})` },
          { status: 400 },
        );
      }

      serviceIds = ids;
      serviceSnapshot = orderedFound.map((s) => ({
        id: s.id,
        name: s.name,
        price: Number(s.price || 0),
      }));
      servicesLabel = formatGiftCardServicesLabel(orderedFound.map((s) => s.name));
    } else {
      finalAmount = data.amount!;
    }

    // 6b. Génère un code unique
    const code = await generateGiftCardCode();

    // 7. Insert gift_card en pending_payment
    const { data: giftCard, error: insertError } = await supabaseAdmin
      .from('gift_cards')
      .insert({
        merchant_id: merchant.id,
        code,
        amount: finalAmount,
        kind: data.kind,
        service_ids: serviceIds,
        service_snapshot: serviceSnapshot,
        sender_first_name: data.sender_first_name.trim(),
        sender_phone: senderPhoneE164,
        sender_phone_country: senderCountry,
        sender_email: data.sender_email.trim().toLowerCase(),
        sender_message: data.sender_message?.trim() || null,
        recipient_first_name: data.recipient_first_name.trim(),
        recipient_phone: recipientPhoneE164,
        recipient_phone_country: recipientCountry,
        recipient_email: data.recipient_email?.trim().toLowerCase() || null,
        status: 'pending_payment',
      })
      .select('id, code')
      .single();

    if (insertError || !giftCard) {
      logger.error('Gift card insert error:', insertError);
      return NextResponse.json({ error: 'Erreur lors de la création du bon' }, { status: 500 });
    }

    // 8. Build payment links (1 ou 2)
    const paymentLinks: Array<{ url: string; label: string }> = [];
    if (merchant.deposit_link?.trim()) {
      const label = merchant.deposit_link_label?.trim()
        || detectPaymentProvider(merchant.deposit_link)
        || 'Payer';
      paymentLinks.push({ url: merchant.deposit_link.trim(), label: `Payer avec ${label}` });
    }
    if (merchant.deposit_link_2?.trim()) {
      const label = merchant.deposit_link_2_label?.trim()
        || detectPaymentProvider(merchant.deposit_link_2)
        || 'Payer';
      paymentLinks.push({ url: merchant.deposit_link_2.trim(), label: `Payer avec ${label}` });
    }

    const amountFormatted = formatCurrency(finalAmount, merchant.country, merchant.locale || 'fr', 0);
    const locale = (merchant.locale || 'fr') as 'fr' | 'en';

    // 9. Side effects fire-and-forget : email offreur + email merchant + push merchant
    // On ne bloque pas la réponse — l'utilisateur a un retour immédiat
    Promise.allSettled([
      sendGiftCardOrderConfirmationEmail(data.sender_email.trim().toLowerCase(), {
        shopName: merchant.shop_name,
        senderFirstName: data.sender_first_name.trim(),
        recipientFirstName: data.recipient_first_name.trim(),
        amount: amountFormatted,
        code: giftCard.code,
        paymentLinks,
        locale,
        servicesLabel,
      }),
      // Email merchant : envoyé à l'email du compte (auth.users)
      (async () => {
        const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(merchant.user_id);
        const merchantEmail = userRow?.user?.email;
        if (!merchantEmail) return;
        // Format phones for display (drapeau + format local lisible)
        const { displayPhoneWithFlag } = await import('@/lib/utils');
        const senderPhoneDisplay = displayPhoneWithFlag(senderPhoneE164);
        const recipientPhoneDisplay = displayPhoneWithFlag(recipientPhoneE164);
        return sendGiftCardMerchantNotificationEmail(merchantEmail, {
          shopName: merchant.shop_name,
          senderFirstName: data.sender_first_name.trim(),
          senderEmail: data.sender_email.trim(),
          senderPhoneFormatted: `${senderPhoneDisplay.flag} ${senderPhoneDisplay.display}`,
          recipientFirstName: data.recipient_first_name.trim(),
          recipientPhoneFormatted: `${recipientPhoneDisplay.flag} ${recipientPhoneDisplay.display}`,
          amount: amountFormatted,
          code: giftCard.code,
          senderMessage: data.sender_message?.trim() || null,
          servicesLabel,
          locale,
        });
      })(),
      sendMerchantPush({
        supabase: supabaseAdmin,
        merchantId: merchant.id,
        notificationType: 'gift_card_pending',
        referenceId: giftCard.id,
        title: servicesLabel
          ? `🎁 Nouveau bon ${servicesLabel}`
          : `🎁 Nouveau bon cadeau ${amountFormatted}`,
        body: `${data.sender_first_name.trim()} pour ${data.recipient_first_name.trim()} · réf ${giftCard.code}`,
        url: '/dashboard/gift-cards',
      }),
    ]).catch(() => {
      // jamais — Promise.allSettled n'échoue pas
    });

    // 10. Réponse OK — la commande est enregistrée, l'email part
    return NextResponse.json({
      success: true,
      gift_card_id: giftCard.id,
      code: giftCard.code,
    });
  } catch (error) {
    logger.error('Gift card request error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
