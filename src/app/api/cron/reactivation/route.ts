import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendReactivationEmail } from '@/lib/email';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;

// Jours après annulation où envoyer un email de réactivation
const REACTIVATION_DAYS = [7, 14, 30];

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    processed: 0,
    sent: 0,
    skipped: 0,
    errors: 0,
    details: [] as Array<{ shopName: string; daysSince: number; status: string }>,
  };

  try {
    // Récupérer les merchants avec abonnement annulé
    const { data: canceledMerchants, error } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, updated_at')
      .eq('subscription_status', 'canceled');

    if (error) {
      logger.error('Error fetching canceled merchants', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (canceledMerchants && canceledMerchants.length > 0) {
      const now = new Date();

      // Pre-filter to only merchants matching reactivation days
      const candidateMerchants = canceledMerchants.filter(merchant => {
        const canceledAt = new Date(merchant.updated_at);
        const daysSince = Math.floor((now.getTime() - canceledAt.getTime()) / (1000 * 60 * 60 * 24));
        return REACTIVATION_DAYS.includes(daysSince);
      });

      results.processed = canceledMerchants.length;
      results.skipped = canceledMerchants.length - candidateMerchants.length;

      if (candidateMerchants.length > 0) {
        // Batch fetch existing tracking
        const { data: existingTrackings } = await supabase
          .from('reactivation_email_tracking')
          .select('merchant_id, day_sent')
          .in('merchant_id', candidateMerchants.map(m => m.id));

        const trackingSet = new Set(
          (existingTrackings || []).map(t => `${t.merchant_id}:${t.day_sent}`)
        );

        // Batch fetch user emails
        const userIds = [...new Set(candidateMerchants.map(m => m.user_id))];
        const emailMap = new Map<string, string>();
        // Process getUserById in parallel batches of 10
        for (let i = 0; i < userIds.length; i += 10) {
          const batch = userIds.slice(i, i + 10);
          await Promise.allSettled(batch.map(async (userId) => {
            const { data: userData } = await supabase.auth.admin.getUserById(userId);
            if (userData?.user?.email) emailMap.set(userId, userData.user.email);
          }));
        }

        // Batch fetch customer counts for all candidates
        const { data: loyaltyCardCounts } = await supabase
          .from('loyalty_cards')
          .select('merchant_id')
          .in('merchant_id', candidateMerchants.map(m => m.id));

        const countMap = new Map<string, number>();
        for (const card of loyaltyCardCounts || []) {
          countMap.set(card.merchant_id, (countMap.get(card.merchant_id) || 0) + 1);
        }

        // Process in batches of 2 (Resend rate limit: 2 req/s)
        for (let i = 0; i < candidateMerchants.length; i += 2) {
          const batch = candidateMerchants.slice(i, i + 2);
          await Promise.allSettled(batch.map(async (merchant) => {
            const canceledAt = new Date(merchant.updated_at);
            const daysSinceCancellation = Math.floor(
              (now.getTime() - canceledAt.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Check tracking
            if (trackingSet.has(`${merchant.id}:${daysSinceCancellation}`)) {
              results.skipped++;
              results.details.push({ shopName: merchant.shop_name, daysSince: daysSinceCancellation, status: 'already_sent' });
              return;
            }

            const email = emailMap.get(merchant.user_id);
            if (!email) {
              results.skipped++;
              results.details.push({ shopName: merchant.shop_name, daysSince: daysSinceCancellation, status: 'no_email' });
              return;
            }

            const totalCustomers = countMap.get(merchant.id) || 0;

            try {
              const result = await sendReactivationEmail(
                email,
                merchant.shop_name,
                daysSinceCancellation,
                totalCustomers || undefined
              );

              if (result.success) {
                await supabase.from('reactivation_email_tracking').insert({
                  merchant_id: merchant.id,
                  day_sent: daysSinceCancellation,
                });
                results.sent++;
                results.details.push({ shopName: merchant.shop_name, daysSince: daysSinceCancellation, status: 'sent' });
              } else {
                results.errors++;
                results.details.push({ shopName: merchant.shop_name, daysSince: daysSinceCancellation, status: `error: ${result.error}` });
              }
            } catch {
              results.errors++;
              results.details.push({ shopName: merchant.shop_name, daysSince: daysSinceCancellation, status: 'exception' });
            }
          }));
          // Resend rate limit: 2 req/s — pause entre les batches
          if (i + 2 < candidateMerchants.length) {
            await new Promise(resolve => setTimeout(resolve, 600));
          }
        }
      }
    }

    // Nettoyer les anciens trackings (> 60 jours)
    const sixtyDaysAgo = new Date();
    sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
    await supabase
      .from('reactivation_email_tracking')
      .delete()
      .lt('sent_at', sixtyDaysAgo.toISOString());

    logger.info('Reactivation cron completed', results);
    return NextResponse.json({ success: true, ...results });
  } catch (error) {
    logger.error('Reactivation cron error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
