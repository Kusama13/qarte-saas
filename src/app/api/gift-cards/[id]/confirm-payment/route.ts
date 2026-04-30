/**
 * POST /api/gift-cards/[id]/confirm-payment
 *
 * Le merchant valide qu'il a reçu le paiement de l'offreur. À cette étape :
 *   1. Crée/récupère le customer destinataire chez ce merchant
 *   2. Crée/récupère sa loyalty_card (pour qu'il ait son bon dans sa carte fidélité)
 *   3. Crée le voucher (source='gift', expires 3 mois) lié à cette carte
 *   4. Update la gift_card en status='active' avec voucher_id + recipient_customer_id + paid_at + expires_at
 *   5. Envoie le SMS au destinataire (gift_card_received)
 *   6. Envoie l'email au destinataire (si email fourni) — beau design carte cadeau
 *   7. Envoie l'email de confirmation à l'offreur (gift activé)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import {
  getAllPhoneFormats,
  generateReferralCode,
  formatCurrency,
} from '@/lib/utils';
import {
  computeGiftCardExpiry,
  GIFT_CARD_EXPIRY_MONTHS,
  formatGiftCardServicesLabel,
} from '@/lib/gift-cards';
import { renderAndUploadGiftCardPdf } from '@/lib/gift-card-pdf';
import type { GiftCardServiceSnapshot } from '@/types';
import { sendBookingSms } from '@/lib/sms';
import {
  sendGiftCardReceivedEmail,
  sendGiftCardActivatedEmail,
} from '@/lib/email';
import logger from '@/lib/logger';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    // 1. Auth merchant
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    // 2. Lookup gift_card + ownership check
    const { data: giftCard } = await supabase
      .from('gift_cards')
      .select('*')
      .eq('id', id)
      .single();

    if (!giftCard) {
      return NextResponse.json({ error: 'Bon cadeau introuvable' }, { status: 404 });
    }

    if (giftCard.status !== 'pending_payment') {
      return NextResponse.json(
        { error: 'Ce bon n\'est pas en attente de paiement' },
        { status: 409 },
      );
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id, slug, shop_name, shop_address, country, locale, primary_color, secondary_color, stamps_required, hide_address_on_public_page')
      .eq('id', giftCard.merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // 3. Récupère ou crée le customer destinataire
    const recipientPhoneVariants = getAllPhoneFormats(giftCard.recipient_phone);
    let { data: customer } = await supabase
      .from('customers')
      .select('id')
      .in('phone_number', recipientPhoneVariants)
      .eq('merchant_id', merchant.id)
      .maybeSingle();

    if (!customer) {
      const { data: created, error: customerError } = await supabase
        .from('customers')
        .insert({
          phone_number: giftCard.recipient_phone,
          first_name: giftCard.recipient_first_name,
          last_name: giftCard.recipient_last_name || null,
          merchant_id: merchant.id,
        })
        .select('id')
        .single();

      if (customerError || !created) {
        logger.error('Gift card recipient customer creation error:', customerError);
        return NextResponse.json({ error: 'Erreur création client' }, { status: 500 });
      }
      customer = created;
    }

    // 4. Récupère ou crée la loyalty_card
    let { data: card } = await supabase
      .from('loyalty_cards')
      .select('id')
      .eq('customer_id', customer.id)
      .eq('merchant_id', merchant.id)
      .maybeSingle();

    if (!card) {
      const { data: created, error: cardError } = await supabase
        .from('loyalty_cards')
        .insert({
          customer_id: customer.id,
          merchant_id: merchant.id,
          current_stamps: 0,
          current_amount: 0,
          stamps_target: merchant.stamps_required,
          referral_code: generateReferralCode(),
        })
        .select('id')
        .single();

      if (cardError || !created) {
        logger.error('Gift card loyalty card creation error:', cardError);
        return NextResponse.json({ error: 'Erreur création carte fidélité' }, { status: 500 });
      }
      card = created;
    }

    // 5. Calcul expiry + amount formaté
    const paidAt = new Date();
    const expiresAt = computeGiftCardExpiry(paidAt);
    const locale = (merchant.locale || 'fr') as 'fr' | 'en';
    const amountFormatted = formatCurrency(Number(giftCard.amount), merchant.country, locale, 0);

    // Pour kind='services' : on tente le LIVE (au cas où nom changé depuis commande),
    // fallback sur le snapshot (résilience suppression).
    let servicesLabel: string | null = null;
    let serviceNamesLive: string[] = [];
    if (giftCard.kind === 'services' && Array.isArray(giftCard.service_ids) && giftCard.service_ids.length > 0) {
      const { data: liveSvc } = await supabase
        .from('merchant_services')
        .select('id, name')
        .eq('merchant_id', merchant.id)
        .in('id', giftCard.service_ids);
      const liveById = new Map<string, string>(
        ((liveSvc as Array<{ id: string; name: string }>) || []).map((s) => [s.id, s.name]),
      );
      const snapById = new Map<string, GiftCardServiceSnapshot>(
        ((giftCard.service_snapshot as GiftCardServiceSnapshot[] | null) || []).map((s) => [s.id, s]),
      );
      serviceNamesLive = (giftCard.service_ids as string[])
        .map((id) => liveById.get(id) || snapById.get(id)?.name || null)
        .filter((n): n is string => Boolean(n));
      servicesLabel = formatGiftCardServicesLabel(serviceNamesLive);
    }

    const rewardDescription = giftCard.kind === 'services' && servicesLabel
      ? (locale === 'en' ? `Gift · ${servicesLabel}` : `Bon cadeau · ${servicesLabel}`)
      : (locale === 'en' ? `Gift card · ${amountFormatted}` : `Bon cadeau · ${amountFormatted}`);

    // 6. Crée le voucher
    const { data: voucher, error: voucherError } = await supabase
      .from('vouchers')
      .insert({
        loyalty_card_id: card.id,
        merchant_id: merchant.id,
        customer_id: customer.id,
        reward_description: rewardDescription,
        source: 'gift',
        expires_at: expiresAt.toISOString(),
      })
      .select('id')
      .single();

    if (voucherError || !voucher) {
      logger.error('Gift card voucher creation error:', voucherError);
      return NextResponse.json({ error: 'Erreur création bon' }, { status: 500 });
    }

    // 7. Atomic: passe la gift_card en 'active' SI elle est encore en pending_payment
    // (anti-race: 2 clics simultanés)
    const { data: updated, error: updateError } = await supabase
      .from('gift_cards')
      .update({
        status: 'active',
        voucher_id: voucher.id,
        recipient_customer_id: customer.id,
        paid_at: paidAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending_payment')
      .select('id');

    if (updateError || !updated || updated.length === 0) {
      // Rollback voucher (race condition)
      await supabase.from('vouchers').delete().eq('id', voucher.id);
      return NextResponse.json({ error: 'Bon déjà traité' }, { status: 409 });
    }

    // 8. Side effects fire-and-forget : SMS destinataire + emails
    const expiresAtFormatted = paidAt.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const expiresAtFmt = new Date(expiresAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const cardUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com'}/customer/card/${merchant.id}`;

    // Génération PDF puis envoi des emails (PDF joint).
    // Le PDF est attendu pour qu'il soit prêt avant les emails.
    // SMS destinataire part en parallèle (pas besoin de PDF).
    const senderFullName = giftCard.sender_last_name
      ? `${giftCard.sender_first_name} ${giftCard.sender_last_name}`
      : giftCard.sender_first_name;
    const recipientFullName = giftCard.recipient_last_name
      ? `${giftCard.recipient_first_name} ${giftCard.recipient_last_name}`
      : giftCard.recipient_first_name;

    // Si scheduled_send_at est dans le futur → on diffère SMS+email destinataire
    // (le cron /api/cron/gift-cards-deliver les enverra à l'échéance).
    // Le mail offreur + PDF sont toujours envoyés immédiatement.
    const scheduledAt = giftCard.scheduled_send_at ? new Date(giftCard.scheduled_send_at) : null;
    const deferRecipient = scheduledAt && scheduledAt.getTime() > paidAt.getTime();

    const sideEffectsTask = (async () => {
      // 1. SMS + email destinataire — UNIQUEMENT si pas différé
      if (!deferRecipient) {
        sendBookingSms(supabase, {
          merchantId: merchant.id,
          phone: giftCard.recipient_phone,
          shopName: merchant.shop_name,
          smsType: 'gift_card_received',
          locale,
          subscriptionStatus: 'active',
          giftSenderName: giftCard.sender_first_name,
          giftRecipientName: giftCard.recipient_first_name,
          giftAmount: amountFormatted,
          giftServicesLabel: servicesLabel,
        }).catch((e) => logger.error('Gift SMS recipient failed:', e));
      }

      // 2. Génère le PDF (peut prendre 1-3s côté serveur)
      const pdfUrl = await renderAndUploadGiftCardPdf(supabase, giftCard.id, {
        shopName: merchant.shop_name,
        shopAddress: merchant.hide_address_on_public_page ? null : merchant.shop_address,
        primaryColor: merchant.primary_color || '#4b0082',
        secondaryColor: merchant.secondary_color || '#ec4899',
        amountFormatted,
        servicesLabel,
        serviceNames: serviceNamesLive,
        senderFullName,
        recipientFullName,
        senderMessage: giftCard.sender_message,
        code: giftCard.code,
        expiresAtFormatted: expiresAtFmt,
        locale,
      });

      // 3. Stocke pdf_url + notified_at (si envoi immédiat)
      const updates: Record<string, unknown> = {};
      if (pdfUrl) updates.pdf_url = pdfUrl;
      if (!deferRecipient) updates.notified_at = paidAt.toISOString();
      if (Object.keys(updates).length > 0) {
        await supabase.from('gift_cards').update(updates).eq('id', giftCard.id);
      }

      // 4. Email destinataire (si email fourni ET pas différé)
      const recipientEmailTask = (!deferRecipient && giftCard.recipient_email)
        ? sendGiftCardReceivedEmail(giftCard.recipient_email, {
            shopName: merchant.shop_name,
            senderFirstName: giftCard.sender_first_name,
            senderLastName: giftCard.sender_last_name,
            recipientFirstName: giftCard.recipient_first_name,
            recipientLastName: giftCard.recipient_last_name,
            amount: amountFormatted,
            senderMessage: giftCard.sender_message,
            expiresAtFormatted: expiresAtFmt,
            cardUrl,
            shopAddress: merchant.hide_address_on_public_page ? null : merchant.shop_address,
            primaryColor: merchant.primary_color || '#4b0082',
            secondaryColor: merchant.secondary_color || '#ec4899',
            locale,
            servicesLabel,
            serviceNames: serviceNamesLive,
          })
        : Promise.resolve();

      // 5. Email offreur — toujours envoyé. Lien PDF (pas attachment) +
      //    info "envoi prévu le X" si différé.
      const senderEmailTask = sendGiftCardActivatedEmail(giftCard.sender_email, {
        shopName: merchant.shop_name,
        senderFirstName: giftCard.sender_first_name,
        recipientFirstName: giftCard.recipient_first_name,
        recipientLastName: giftCard.recipient_last_name,
        amount: amountFormatted,
        expiresAtFormatted: expiresAtFmt,
        locale,
        servicesLabel,
        pdfUrl,
        scheduledSendAtFormatted: scheduledAt
          ? scheduledAt.toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
          : null,
      });

      await Promise.allSettled([recipientEmailTask, senderEmailTask]);
    })();
    sideEffectsTask.catch((e) => logger.error('Gift confirm-payment side effects failed:', e));

    return NextResponse.json({
      success: true,
      voucher_id: voucher.id,
      recipient_customer_id: customer.id,
      expiry_months: GIFT_CARD_EXPIRY_MONTHS,
    });
  } catch (error) {
    logger.error('Gift card confirm-payment error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
