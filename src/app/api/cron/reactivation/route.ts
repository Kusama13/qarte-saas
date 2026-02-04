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

    for (const merchant of canceledMerchants || []) {
      results.processed++;

      // Calculer le nombre de jours depuis l'annulation
      const canceledAt = new Date(merchant.updated_at);
      const now = new Date();
      const daysSinceCancellation = Math.floor(
        (now.getTime() - canceledAt.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Vérifier si c'est un jour d'envoi
      if (!REACTIVATION_DAYS.includes(daysSinceCancellation)) {
        results.skipped++;
        continue;
      }

      // Récupérer l'email du user
      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      const email = userData?.user?.email;

      if (!email) {
        results.skipped++;
        results.details.push({
          shopName: merchant.shop_name,
          daysSince: daysSinceCancellation,
          status: 'no_email',
        });
        continue;
      }

      // Vérifier si on a déjà envoyé cet email (tracking)
      const { data: existingTracking } = await supabase
        .from('reactivation_email_tracking')
        .select('id')
        .eq('merchant_id', merchant.id)
        .eq('day_sent', daysSinceCancellation)
        .single();

      if (existingTracking) {
        results.skipped++;
        results.details.push({
          shopName: merchant.shop_name,
          daysSince: daysSinceCancellation,
          status: 'already_sent',
        });
        continue;
      }

      // Récupérer le nombre de clients pour personnaliser l'email
      const { count: totalCustomers } = await supabase
        .from('loyalty_cards')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchant.id);

      try {
        const result = await sendReactivationEmail(
          email,
          merchant.shop_name,
          daysSinceCancellation,
          totalCustomers || undefined
        );

        if (result.success) {
          // Enregistrer l'envoi
          await supabase.from('reactivation_email_tracking').insert({
            merchant_id: merchant.id,
            day_sent: daysSinceCancellation,
          });

          results.sent++;
          results.details.push({
            shopName: merchant.shop_name,
            daysSince: daysSinceCancellation,
            status: 'sent',
          });
        } else {
          results.errors++;
          results.details.push({
            shopName: merchant.shop_name,
            daysSince: daysSinceCancellation,
            status: `error: ${result.error}`,
          });
        }
      } catch (err) {
        results.errors++;
        results.details.push({
          shopName: merchant.shop_name,
          daysSince: daysSinceCancellation,
          status: 'exception',
        });
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
