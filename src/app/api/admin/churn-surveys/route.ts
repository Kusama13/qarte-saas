import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { batchGetUserEmails } from '@/lib/cron-helpers';
import logger from '@/lib/logger';

interface SurveyMerchantJoin {
  id: string;
  shop_name: string;
  shop_type: string | null;
  user_id: string;
  phone: string | null;
  country: string | null;
  created_at: string;
  trial_ends_at: string;
  subscription_status: string;
}

interface SurveyRow {
  id: string;
  merchant_id: string;
  blocker: string;
  missing_feature: string | null;
  features_tested: string[] | null;
  would_convince: string;
  free_comment: string | null;
  bonus_days_granted: number;
  plan_tier_at_churn: string | null;
  features_wanted_unavailable: string[] | null;
  created_at: string;
  merchant: SurveyMerchantJoin | null;
}

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-churn-surveys');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const { data: rawSurveys, error: surveysError } = await supabaseAdmin
      .from('merchant_churn_surveys')
      .select(`
        id,
        merchant_id,
        blocker,
        missing_feature,
        features_tested,
        would_convince,
        free_comment,
        bonus_days_granted,
        plan_tier_at_churn,
        features_wanted_unavailable,
        created_at,
        merchant:merchants!merchant_id (
          id,
          shop_name,
          shop_type,
          user_id,
          phone,
          country,
          created_at,
          trial_ends_at,
          subscription_status
        )
      `)
      .order('created_at', { ascending: false })
      .limit(500);

    if (surveysError) {
      logger.error('Error fetching churn surveys', surveysError);
      return NextResponse.json({ error: 'Erreur récupération questionnaires' }, { status: 500 });
    }

    const surveys = (rawSurveys || []) as unknown as SurveyRow[];

    const userIds = [...new Set(
      surveys.map((s) => s.merchant?.user_id).filter((id): id is string => !!id)
    )];

    const emailMap = await batchGetUserEmails(supabaseAdmin, userIds);

    const blockerCounts: Record<string, number> = {};
    const convinceCounts: Record<string, number> = {};
    const featureCounts: Record<string, number> = {};
    const tierCounts: Record<string, number> = {};
    const wantedUnavailableCounts: Record<string, number> = {};
    let convertedCount = 0;

    for (const s of surveys) {
      blockerCounts[s.blocker] = (blockerCounts[s.blocker] || 0) + 1;
      convinceCounts[s.would_convince] = (convinceCounts[s.would_convince] || 0) + 1;
      for (const f of s.features_tested || []) {
        featureCounts[f] = (featureCounts[f] || 0) + 1;
      }
      const tier = s.plan_tier_at_churn || 'legacy';
      tierCounts[tier] = (tierCounts[tier] || 0) + 1;
      for (const f of s.features_wanted_unavailable || []) {
        wantedUnavailableCounts[f] = (wantedUnavailableCounts[f] || 0) + 1;
      }
      const status = s.merchant?.subscription_status;
      if (status === 'active' || status === 'canceling') convertedCount++;
    }

    const formatted = surveys.map((s) => {
      const m = s.merchant;
      return {
        id: s.id,
        merchant_id: s.merchant_id,
        shop_name: m?.shop_name || '(inconnu)',
        shop_type: m?.shop_type || null,
        user_email: m?.user_id ? emailMap.get(m.user_id) || null : null,
        phone: m?.phone || null,
        country: m?.country || null,
        merchant_created_at: m?.created_at || null,
        trial_ends_at: m?.trial_ends_at || null,
        subscription_status: m?.subscription_status || null,
        blocker: s.blocker,
        missing_feature: s.missing_feature,
        features_tested: s.features_tested || [],
        would_convince: s.would_convince,
        free_comment: s.free_comment,
        bonus_days_granted: s.bonus_days_granted,
        plan_tier_at_churn: s.plan_tier_at_churn,
        features_wanted_unavailable: s.features_wanted_unavailable || [],
        created_at: s.created_at,
      };
    });

    return NextResponse.json({
      surveys: formatted,
      total: formatted.length,
      stats: {
        blockers: blockerCounts,
        convinces: convinceCounts,
        features: featureCounts,
        tiers: tierCounts,
        wantedUnavailable: wantedUnavailableCounts,
        converted: convertedCount,
      },
    });
  } catch (error) {
    logger.error('Churn surveys admin API error', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
