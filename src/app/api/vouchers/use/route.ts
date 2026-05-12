import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import { getAuthenticatedPhone } from '@/lib/customer-auth';
import { getTodayForCountry } from '@/lib/utils';
import { isMerchantBlocked } from '@/lib/merchant-access';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { sendBookingSms } from '@/lib/sms';
import { formatCurrencyForSms } from '@/lib/utils';
import { formatGiftCardServicesLabel } from '@/lib/gift-cards';
import { completeReferralAfterReferredUse } from '@/lib/referral-completion';
import type { GiftCardServiceSnapshot } from '@/types';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

const useVoucherSchema = z.object({
  voucher_id: z.string().uuid(),
  customer_id: z.string().uuid(),
});

// POST: Client consomme un voucher (self-service)
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 per minute per IP
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`voucher-use:${ip}`, { maxRequests: 5, windowMs: 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const phone_number = getAuthenticatedPhone(request);
    if (!phone_number) {
      return NextResponse.json(
        { error: 'Non authentifié' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const parsed = useVoucherSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const { voucher_id, customer_id } = parsed.data;

    // SECURITY: Verify cookie phone matches the customer
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, first_name')
      .eq('id', customer_id)
      .eq('phone_number', phone_number)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ error: 'Vérification échouée' }, { status: 403 });
    }

    // 1. Récupérer le voucher
    const { data: voucher, error: voucherError } = await supabaseAdmin
      .from('vouchers')
      .select('*')
      .eq('id', voucher_id)
      .eq('customer_id', customer_id)
      .maybeSingle();

    if (voucherError || !voucher) {
      return NextResponse.json({ error: 'Récompense introuvable' }, { status: 404 });
    }

    if (voucher.is_used) {
      return NextResponse.json({ error: 'Récompense déjà utilisée' }, { status: 409 });
    }

    // Check expiration (will be re-checked with merchant timezone after fetch)
    if (voucher.expires_at && new Date(voucher.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Récompense expirée' }, { status: 410 });
    }

    // 2. Atomic: mark as used only if still unused (prevents double-use race condition)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('vouchers')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', voucher_id)
      .eq('is_used', false)
      .select('id');

    if (updateError) {
      logger.error('Voucher update error:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Récompense déjà utilisée' }, { status: 409 });
    }

    // Fetch merchant for timezone + trial check
    const { data: voucherMerchant } = await supabaseAdmin
      .from('merchants')
      .select('country, trial_ends_at, subscription_status, past_due_since')
      .eq('id', voucher.merchant_id)
      .single();

    // Bloque si trial expired (>3j grace) OU past_due >72h (mig 164).
    if (voucherMerchant && isMerchantBlocked({
      trial_ends_at: voucherMerchant.trial_ends_at,
      subscription_status: voucherMerchant.subscription_status,
      past_due_since: voucherMerchant.past_due_since,
    })) {
      return NextResponse.json({ error: 'Ce commerce n\'accepte plus les récompenses pour le moment.' }, { status: 403 });
    }

    // 3. Bonus +1 stamp (skip for birthday vouchers + skip if already visited today,
    //    SAUF pour les bons cadeaux : la cliente garde le bonus même si elle a scanné aujourd'hui)
    let bonusVisitId: string | null = null;
    let newStamps: number | null = null;
    let skipBonusStamp = voucher.source === 'birthday';

    if (!skipBonusStamp && voucher.source !== 'gift') {
      const today = getTodayForCountry(voucherMerchant?.country);
      const { count } = await supabaseAdmin
        .from('visits')
        .select('id', { count: 'exact', head: true })
        .eq('customer_id', voucher.customer_id)
        .eq('merchant_id', voucher.merchant_id)
        .eq('status', 'confirmed')
        .gte('visited_at', today);

      if (count && count > 0) {
        skipBonusStamp = true;
      }
    }

    if (!skipBonusStamp) {
      const { data: filleulCard } = await supabaseAdmin
        .from('loyalty_cards')
        .select('id, current_stamps')
        .eq('id', voucher.loyalty_card_id)
        .single();

      if (filleulCard) {
        const { data: bonusVisit } = await supabaseAdmin
          .from('visits')
          .insert({
            loyalty_card_id: filleulCard.id,
            merchant_id: voucher.merchant_id,
            customer_id: voucher.customer_id,
            points_earned: 1,
            status: 'confirmed',
            flagged_reason: voucher.source === 'referral' ? 'bonus_parrainage' : `bonus_${voucher.source || 'voucher'}`,
          })
          .select('id')
          .single();

        bonusVisitId = bonusVisit?.id || null;

        newStamps = filleulCard.current_stamps + 1;
        await supabaseAdmin
          .from('loyalty_cards')
          .update({
            current_stamps: newStamps,
            last_visit_date: getTodayForCountry(voucherMerchant?.country),
          })
          .eq('id', filleulCard.id);
      }
    }

    // 4a. Si voucher = bon cadeau → SMS systématique à l'offreur (fire-and-forget)
    if (voucher.source === 'gift') {
      const sendGiftUsedSmsToSender = async () => {
        try {
          const { data: giftCard } = await supabaseAdmin
            .from('gift_cards')
            .select('id, sender_phone, sender_first_name, recipient_first_name, amount, kind, service_ids, service_snapshot, merchant_id')
            .eq('voucher_id', voucher_id)
            .maybeSingle();

          if (!giftCard) return;

          // Update gift_card → used + used_at
          await supabaseAdmin
            .from('gift_cards')
            .update({
              status: 'used',
              used_at: new Date().toISOString(),
            })
            .eq('id', giftCard.id);

          // Récup merchant pour shop_name + locale + status
          const { data: shopMerchant } = await supabaseAdmin
            .from('merchants')
            .select('shop_name, locale, country, subscription_status')
            .eq('id', voucher.merchant_id)
            .maybeSingle();

          if (!shopMerchant) return;
          const lang = (shopMerchant.locale || 'fr') as 'fr' | 'en';
          // SMS-safe : pas de symbole € (GSM-7)
          const amountFmt = formatCurrencyForSms(Number(giftCard.amount), shopMerchant.country);

          // Si kind='services' : on construit le label LIVE (avec fallback snapshot)
          let servicesLabel: string | null = null;
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
            const names = (giftCard.service_ids as string[])
              .map((id) => liveById.get(id) || snapById.get(id)?.name || null)
              .filter((n): n is string => Boolean(n));
            servicesLabel = formatGiftCardServicesLabel(names);
          }

          await sendBookingSms(supabaseAdmin, {
            merchantId: voucher.merchant_id,
            phone: giftCard.sender_phone,
            shopName: shopMerchant.shop_name,
            smsType: 'gift_card_used',
            locale: lang,
            subscriptionStatus: shopMerchant.subscription_status,
            giftSenderName: giftCard.sender_first_name,
            giftRecipientName: giftCard.recipient_first_name,
            giftAmount: amountFmt,
            giftServicesLabel: servicesLabel,
          });
        } catch (err) {
          logger.error('Gift card sender SMS failed:', err);
        }
      };
      sendGiftUsedSmsToSender().catch(() => {});
    }

    // 4. Si voucher filleul → helper crée le voucher parrain + push + SMS (idempotent).
    const isReferral = await completeReferralAfterReferredUse(
      supabaseAdmin,
      voucher_id,
      customer.first_name || null,
    );

    return NextResponse.json({
      success: true,
      message: 'Récompense utilisée avec succès',
      is_referral: isReferral,
      reward_description: voucher.reward_description,
      bonus_stamp_added: !!bonusVisitId,
      new_stamps: newStamps,
      bonus_visit_id: bonusVisitId,
      customer_name: customer.first_name || null,
    });
  } catch (error) {
    logger.error('Voucher use error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
