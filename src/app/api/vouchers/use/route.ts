import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import webpush from 'web-push';

const supabaseAdmin = getSupabaseAdmin();

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contact@qarte.fr', vapidPublicKey, vapidPrivateKey);
}

const useVoucherSchema = z.object({
  voucher_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  phone_number: z.string().min(1),
});

// POST: Client consomme un voucher (self-service)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = useVoucherSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides' },
        { status: 400 }
      );
    }

    const { voucher_id, customer_id, phone_number } = parsed.data;

    // SECURITY: Verify phone_number matches the customer
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

    // Check expiration
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
      console.error('Voucher update error:', updateError);
      return NextResponse.json({ error: 'Erreur lors de la mise à jour' }, { status: 500 });
    }

    if (!updated || updated.length === 0) {
      return NextResponse.json({ error: 'Récompense déjà utilisée' }, { status: 409 });
    }

    // 3. Bonus +1 stamp (skip for birthday vouchers)
    let bonusVisitId: string | null = null;
    let newStamps: number | null = null;
    const isBirthdayVoucher = voucher.source === 'birthday';

    if (!isBirthdayVoucher) {
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
            flagged_reason: 'bonus_parrainage',
          })
          .select('id')
          .single();

        bonusVisitId = bonusVisit?.id || null;

        newStamps = filleulCard.current_stamps + 1;
        await supabaseAdmin
          .from('loyalty_cards')
          .update({
            current_stamps: newStamps,
            last_visit_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', filleulCard.id);
      }
    }

    // 4. Vérifier si c'est un voucher filleul → auto-créer le voucher parrain
    let isReferral = false;

    const { data: referral } = await supabaseAdmin
      .from('referrals')
      .select('*')
      .eq('referred_voucher_id', voucher_id)
      .eq('status', 'pending')
      .maybeSingle();

    if (referral) {
      isReferral = true;

      // Récupérer le merchant pour la description de la récompense parrain
      const { data: merchant } = await supabaseAdmin
        .from('merchants')
        .select('referral_reward_referrer, shop_name')
        .eq('id', referral.merchant_id)
        .single();

      if (merchant?.referral_reward_referrer) {
        // Créer le voucher parrain
        const { data: referrerVoucher } = await supabaseAdmin
          .from('vouchers')
          .insert({
            loyalty_card_id: referral.referrer_card_id,
            merchant_id: referral.merchant_id,
            customer_id: referral.referrer_customer_id,
            reward_description: merchant.referral_reward_referrer,
          })
          .select()
          .single();

        // Mettre à jour le referral → completed
        if (referrerVoucher) {
          await supabaseAdmin
            .from('referrals')
            .update({
              referrer_voucher_id: referrerVoucher.id,
              status: 'completed',
            })
            .eq('id', referral.id);

          // 5. Push notification au parrain (fire-and-forget)
          if (vapidPublicKey && vapidPrivateKey) {
            const sendPushToParrain = async () => {
              try {
                // Trouver le phone du parrain
                const { data: referrerCustomer } = await supabaseAdmin
                  .from('customers')
                  .select('phone_number')
                  .eq('id', referral.referrer_customer_id)
                  .single();

                if (!referrerCustomer?.phone_number) return;

                // Cross-merchant: trouver tous les customer IDs avec ce numéro
                const { data: allReferrerCustomers } = await supabaseAdmin
                  .from('customers')
                  .select('id')
                  .eq('phone_number', referrerCustomer.phone_number);

                const referrerIds = (allReferrerCustomers || []).map(c => c.id);
                if (referrerIds.length === 0) return;

                const { data: pushSubs } = await supabaseAdmin
                  .from('push_subscriptions')
                  .select('endpoint, p256dh, auth')
                  .in('customer_id', referrerIds);

                if (!pushSubs || pushSubs.length === 0) return;

                const filleulName = customer.first_name || 'Votre filleul·e';
                const shopName = merchant?.shop_name || 'Qarte';

                await Promise.allSettled(
                  pushSubs.map(async (sub) => {
                    try {
                      await webpush.sendNotification(
                        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                        JSON.stringify({
                          title: shopName,
                          body: `${filleulName} a utilisé sa récompense ! Votre cadeau vous attend 🎁`,
                          icon: '/icon-192.png',
                          url: `/customer/card/${referral.merchant_id}`,
                          tag: 'qarte-referral-reward',
                        })
                      );
                    } catch (pushErr: unknown) {
                      const webPushError = pushErr as { statusCode?: number };
                      if (webPushError?.statusCode === 404 || webPushError?.statusCode === 410) {
                        await supabaseAdmin
                          .from('push_subscriptions')
                          .delete()
                          .eq('endpoint', sub.endpoint);
                      }
                    }
                  })
                );
              } catch {
                // Never let push failure crash the request
              }
            };

            // Fire-and-forget
            sendPushToParrain().catch(() => {});
          }
        }
      }
    }

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
    console.error('Voucher use error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
