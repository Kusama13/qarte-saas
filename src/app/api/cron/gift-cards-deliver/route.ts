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
import { formatCurrency, formatCurrencyForSms, formatLongDate } from '@/lib/utils';
import { resolveGiftCardServiceNames } from '@/lib/gift-cards';
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
          shop_name, shop_address, display_phone, slug, country, locale,
          primary_color, secondary_color, auto_booking_enabled,
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

    type GiftCardWithMerchant = {
      id: string; code: string; amount: number; kind: string;
      service_ids: string[] | null; service_snapshot: GiftCardServiceSnapshot[] | null;
      sender_first_name: string; sender_last_name: string | null;
      recipient_first_name: string; recipient_last_name: string | null;
      recipient_phone: string; recipient_email: string | null;
      sender_message: string | null; expires_at: string | null;
      scheduled_send_at: string | null; image_url: string | null; merchant_id: string;
      merchants: {
        shop_name: string; shop_address: string | null; slug: string;
        country: string; locale: string;
        primary_color: string | null; secondary_color: string | null;
        auto_booking_enabled: boolean;
        subscription_status: string | null;
        hide_address_on_public_page: boolean;
      };
    };

    // Process en batches de 8 en parallèle pour ne pas dépasser maxDuration
    // (200 bons × 500ms séquentiels = 100s > 60s ; en batches c'est ~12s).
    const BATCH_SIZE = 8;
    const dueTyped = due as unknown as GiftCardWithMerchant[];

    for (let i = 0; i < dueTyped.length; i += BATCH_SIZE) {
      const batch = dueTyped.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(batch.map(async (giftCard) => {
        const merchant = giftCard.merchants;
        if (!merchant) return;

        const locale = (merchant.locale || 'fr') as 'fr' | 'en';
        const country = merchant.country || 'FR';
        const amountFormatted = formatCurrency(Number(giftCard.amount), country, locale, 0);
        const amountForSms = formatCurrencyForSms(Number(giftCard.amount), country);
        const expiresAtFmt = giftCard.expires_at ? formatLongDate(new Date(giftCard.expires_at), locale) : '';
        const cardUrl = `${baseUrl}/customer/card/${giftCard.merchant_id}`;

        // Mode services : noms LIVE avec fallback snapshot
        const { servicesLabel } = await resolveGiftCardServiceNames(
          supabase, giftCard.merchant_id,
          giftCard.kind, giftCard.service_ids, giftCard.service_snapshot,
        );

        // Atomic claim notified_at — anti-doublon si un autre worker tourne
        const { data: claimed } = await supabase
          .from('gift_cards')
          .update({ notified_at: nowIso })
          .eq('id', giftCard.id)
          .is('notified_at', null)
          .select('id');
        if (!claimed || claimed.length === 0) return; // race lost

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
            giftAmount: amountForSms,
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
                primaryColor: merchant.primary_color || '#4b0082',
                locale,
                servicesLabel,
                imageUrl: giftCard.image_url,
                code: giftCard.code,
                bookingUrl: merchant.auto_booking_enabled && merchant.slug
                  ? `${baseUrl}/p/${merchant.slug}`
                  : null,
              })
            : Promise.resolve(),
        ]);
        delivered++;
      }));
      results.forEach((r, idx) => {
        if (r.status === 'rejected') {
          errors++;
          logger.error(`Gift cards deliver cron — failed for ${batch[idx].code}`, r.reason);
        }
      });
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
