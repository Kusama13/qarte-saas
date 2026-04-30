/**
 * Cron horaire — envoie SMS+email destinataire pour les bons cadeaux dont
 * la date d'envoi planifiée est arrivée à échéance.
 *
 * Sélection : status='active' AND scheduled_send_at IS NOT NULL
 *           AND scheduled_send_at <= now() AND notified_at IS NULL
 *
 * Marque notified_at = now() après envoi pour anti-double-envoi (atomic).
 *
 * À déclencher 1×/heure depuis vercel.json.
 */

export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { sendBookingSms } from '@/lib/sms';
import { sendGiftCardReceivedEmail } from '@/lib/email';
import { formatCurrency } from '@/lib/utils';
import { formatGiftCardServicesLabel } from '@/lib/gift-cards';
import type { GiftCardServiceSnapshot } from '@/types';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  const nowIso = new Date().toISOString();

  try {
    // Bons à délivrer : actifs, scheduled échue, jamais notifiés
    const { data: due, error: fetchError } = await supabase
      .from('gift_cards')
      .select(`
        id, code, amount, kind, service_ids, service_snapshot,
        sender_first_name, sender_last_name,
        recipient_first_name, recipient_last_name, recipient_phone, recipient_email,
        sender_message, expires_at, scheduled_send_at, merchant_id,
        merchants!inner (
          shop_name, shop_address, country, locale,
          primary_color, secondary_color,
          subscription_status, hide_address_on_public_page
        )
      `)
      .eq('status', 'active')
      .is('notified_at', null)
      .not('scheduled_send_at', 'is', null)
      .lte('scheduled_send_at', nowIso)
      .limit(200);

    if (fetchError) {
      logger.error('Gift cards deliver cron — fetch error', fetchError);
      return NextResponse.json({ success: false, error: fetchError.message }, { status: 500 });
    }

    if (!due || due.length === 0) {
      return NextResponse.json({ success: true, delivered: 0, elapsedMs: Date.now() - start });
    }

    let delivered = 0;
    let errors = 0;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://getqarte.com';

    for (const row of due) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const giftCard = row as any;
      const merchant = giftCard.merchants;
      if (!merchant) continue;

      const locale = (merchant.locale || 'fr') as 'fr' | 'en';
      const country = merchant.country || 'FR';
      const amountFormatted = formatCurrency(Number(giftCard.amount), country, locale, 0);
      const expiresAtFmt = giftCard.expires_at
        ? new Date(giftCard.expires_at).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR', {
            day: 'numeric', month: 'long', year: 'numeric',
          })
        : '';
      const cardUrl = `${baseUrl}/customer/card/${giftCard.merchant_id}`;

      // Mode services : noms LIVE avec fallback snapshot
      let servicesLabel: string | null = null;
      let serviceNames: string[] = [];
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
        serviceNames = (giftCard.service_ids as string[])
          .map((id) => liveById.get(id) || snapById.get(id)?.name || null)
          .filter((n): n is string => Boolean(n));
        servicesLabel = formatGiftCardServicesLabel(serviceNames);
      }

      // Atomic claim : on marque notified_at avant l'envoi pour éviter double-envoi
      // si un autre process tourne en parallèle. Si claim échoue → on skip.
      const { data: claimed, error: claimError } = await supabase
        .from('gift_cards')
        .update({ notified_at: nowIso })
        .eq('id', giftCard.id)
        .is('notified_at', null)
        .select('id');

      if (claimError || !claimed || claimed.length === 0) {
        continue; // race : un autre worker a déjà claim
      }

      // Envoi SMS + email destinataire (fire-and-forget, errors loggés mais pas bloquants)
      try {
        await Promise.allSettled([
          sendBookingSms(supabase, {
            merchantId: giftCard.merchant_id,
            phone: giftCard.recipient_phone,
            shopName: merchant.shop_name,
            smsType: 'gift_card_received',
            locale,
            subscriptionStatus: merchant.subscription_status || 'active',
            giftSenderName: giftCard.sender_first_name,
            giftRecipientName: giftCard.recipient_first_name,
            giftAmount: amountFormatted,
            giftServicesLabel: servicesLabel,
          }),
          giftCard.recipient_email
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
                serviceNames,
              })
            : Promise.resolve(),
        ]);
        delivered++;
      } catch (err) {
        errors++;
        logger.error(`Gift cards deliver cron — failed for ${giftCard.code}`, err);
      }
    }

    return NextResponse.json({
      success: true,
      delivered,
      errors,
      elapsedMs: Date.now() - start,
    });
  } catch (error) {
    logger.error('Gift cards deliver cron — fatal', error);
    return NextResponse.json({ success: false, error: 'Internal error' }, { status: 500 });
  }
}
