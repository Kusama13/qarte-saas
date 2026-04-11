import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';
import { getTrialStatus } from '@/lib/utils';
import {
  BLOCKER_VALUES,
  CONVINCE_VALUES,
  FEATURE_VALUES,
  CHURN_BONUS_DAYS,
  CHURN_PROMO_CODE,
} from '@/lib/churn-survey-config';
import logger from '@/lib/logger';

const surveySchema = z.object({
  blocker: z.enum(BLOCKER_VALUES),
  missing_feature: z.string().max(200).optional().nullable(),
  features_tested: z.array(z.enum(FEATURE_VALUES)).min(1),
  would_convince: z.enum(CONVINCE_VALUES),
  free_comment: z.string().max(500).optional().nullable(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 5 per hour per IP (one submission per merchant, generous safety margin)
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`churn-survey:${ip}`, { maxRequests: 5, windowMs: 60 * 60 * 1000 });
    if (!rateLimit.success) return rateLimitResponse(rateLimit.resetTime);

    // Auth
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Validate body
    const body = await request.json();
    const parsed = surveySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Fetch merchant + verify ownership + check trial status + idempotence
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, trial_ends_at, subscription_status, churn_survey_seen_at')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
    }

    // Already completed — idempotent guard
    if (merchant.churn_survey_seen_at) {
      return NextResponse.json({ error: 'Questionnaire déjà complété' }, { status: 409 });
    }

    // Must be fully expired to submit (defense in depth — client already guards)
    const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);
    if (!trialStatus.isFullyExpired) {
      return NextResponse.json({ error: 'Questionnaire non applicable' }, { status: 403 });
    }

    const { error: insertError } = await supabaseAdmin
      .from('merchant_churn_surveys')
      .insert({
        merchant_id: merchant.id,
        blocker: parsed.data.blocker,
        missing_feature: parsed.data.missing_feature?.trim() || null,
        features_tested: parsed.data.features_tested,
        would_convince: parsed.data.would_convince,
        free_comment: parsed.data.free_comment?.trim() || null,
        bonus_days_granted: CHURN_BONUS_DAYS,
      });

    if (insertError) {
      logger.error('Error inserting churn survey', insertError);
      return NextResponse.json({ error: 'Erreur lors de l\'enregistrement' }, { status: 500 });
    }

    // Compute GREATEST(now, trial_end) + bonus in JS to avoid SQL timezone edge cases
    const now = new Date();
    const currentEnd = new Date(merchant.trial_ends_at);
    const base = currentEnd.getTime() > now.getTime() ? currentEnd : now;
    const newTrialEnd = new Date(base.getTime() + CHURN_BONUS_DAYS * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabaseAdmin
      .from('merchants')
      .update({
        trial_ends_at: newTrialEnd.toISOString(),
        churn_survey_seen_at: new Date().toISOString(),
      })
      .eq('id', merchant.id);

    if (updateError) {
      logger.error('Error updating merchant after churn survey', updateError);
      return NextResponse.json({ error: 'Erreur lors de la prolongation' }, { status: 500 });
    }

    const promoEligible = parsed.data.would_convince === 'lower_price';

    return NextResponse.json({
      success: true,
      new_trial_ends_at: newTrialEnd.toISOString(),
      promo_eligible: promoEligible,
      promo_code: promoEligible ? CHURN_PROMO_CODE : null,
    });
  } catch (error) {
    logger.error('Churn survey error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
