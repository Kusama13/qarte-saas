import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendTrialEndingEmail, sendTrialExpiredEmail } from '@/lib/email';
import { getTrialStatus } from '@/lib/utils';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Clé secrète pour sécuriser le cron
const CRON_SECRET = process.env.CRON_SECRET;

export async function GET(request: NextRequest) {
  // Vérifier l'authentification
  const authHeader = request.headers.get('authorization');
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Récupérer tous les commerçants en essai
    const { data: merchants, error } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id, trial_ends_at, subscription_status')
      .eq('subscription_status', 'trial');

    if (error) {
      logger.error('Failed to fetch merchants', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    const results = {
      processed: 0,
      trialEnding: 0,
      trialExpired: 0,
      errors: 0,
    };

    for (const merchant of merchants || []) {
      results.processed++;

      const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);

      // Récupérer l'email de l'utilisateur
      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      const email = userData?.user?.email;

      if (!email) {
        logger.warn(`No email found for merchant ${merchant.id}`);
        continue;
      }

      try {
        // Essai se terminant dans 3 jours ou 1 jour
        if (trialStatus.isActive && (trialStatus.daysRemaining === 3 || trialStatus.daysRemaining === 1)) {
          await sendTrialEndingEmail(email, merchant.shop_name, trialStatus.daysRemaining);
          results.trialEnding++;
          logger.info(`Sent trial ending email to ${merchant.shop_name} (${trialStatus.daysRemaining} days)`);
        }

        // Essai expiré - période de grâce (envoyer à J+1, J+3, J+5)
        if (trialStatus.isInGracePeriod) {
          const daysExpired = Math.abs(trialStatus.daysRemaining);
          if (daysExpired === 1 || daysExpired === 3 || daysExpired === 5) {
            await sendTrialExpiredEmail(email, merchant.shop_name, trialStatus.daysUntilDeletion);
            results.trialExpired++;
            logger.info(`Sent trial expired email to ${merchant.shop_name} (${trialStatus.daysUntilDeletion} days until deletion)`);
          }
        }
      } catch (err) {
        logger.error(`Failed to send email to ${merchant.shop_name}`, err);
        results.errors++;
      }
    }

    logger.info('Trial emails cron completed', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    logger.error('Cron job error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
