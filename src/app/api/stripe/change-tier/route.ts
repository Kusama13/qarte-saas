import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { stripe, PLAN, PLAN_ANNUAL, PLAN_FIDELITY, PLAN_FIDELITY_ANNUAL } from '@/lib/stripe';
import { isLegacyMerchant, getSmsQuotaFor } from '@/lib/plan-tiers';
import type { PlanTier } from '@/types';
import logger from '@/lib/logger';

const bodySchema = z.object({
  tier: z.enum(['fidelity', 'all_in']),
});

function priceIdFor(tier: PlanTier, interval: 'monthly' | 'annual'): string {
  if (tier === 'fidelity') {
    return interval === 'annual' ? PLAN_FIDELITY_ANNUAL.priceId : PLAN_FIDELITY.priceId;
  }
  return interval === 'annual' ? PLAN_ANNUAL.priceId : PLAN.priceId;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const parsed = bodySchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Paramètres invalides' }, { status: 400 });
    const newTier = parsed.data.tier;

    const admin = getSupabaseAdmin();
    const { data: merchant } = await admin
      .from('merchants')
      .select('id, stripe_subscription_id, billing_interval, plan_tier, subscription_status, created_at')
      .eq('user_id', user.id)
      .single();

    if (!merchant?.stripe_subscription_id) {
      return NextResponse.json({ error: 'Pas d\'abonnement actif' }, { status: 400 });
    }
    if (!['active', 'canceling', 'past_due'].includes(merchant.subscription_status)) {
      return NextResponse.json({ error: 'Abonnement non éligible' }, { status: 400 });
    }
    if (merchant.plan_tier === newTier) {
      return NextResponse.json({ error: 'Déjà sur ce tier' }, { status: 400 });
    }

    // Grandfathered : seul super_admin peut changer un tier legacy (support).
    if (isLegacyMerchant(merchant)) {
      const { data: adminRow } = await admin
        .from('super_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (!adminRow) {
        return NextResponse.json(
          { error: 'legacy_grandfathered', message: 'Ton tarif historique est conservé — contacte le support pour changer de plan.' },
          { status: 403 },
        );
      }
    }

    const interval: 'monthly' | 'annual' = merchant.billing_interval === 'annual' ? 'annual' : 'monthly';
    const newPriceId = priceIdFor(newTier, interval);
    if (!newPriceId) {
      return NextResponse.json({ error: 'Configuration prix manquante' }, { status: 500 });
    }

    // Fetch current subscription to get the item id
    const subscription = await stripe.subscriptions.retrieve(merchant.stripe_subscription_id);
    const itemId = subscription.items.data[0]?.id;
    if (!itemId) {
      return NextResponse.json({ error: 'Item Stripe introuvable' }, { status: 500 });
    }

    // Update subscription with proration (charge prorated diff immediately for upgrade,
    // credit unused time for downgrade — Stripe default behavior)
    await stripe.subscriptions.update(merchant.stripe_subscription_id, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'create_prorations',
      metadata: { merchant_id: merchant.id, tier: newTier },
    });

    // Prorata quota SMS sur upgrade Fidélité → Tout-en-un : donne quota × jours_restants / jours_cycle.
    const updatePayload: Record<string, unknown> = { plan_tier: newTier, updated_at: new Date().toISOString() };
    if (merchant.plan_tier === 'fidelity' && newTier === 'all_in') {
      const item = subscription.items.data[0];
      if (item?.current_period_start && item.current_period_end) {
        const nowSec = Math.floor(Date.now() / 1000);
        const cycleSec = item.current_period_end - item.current_period_start;
        const remainingSec = Math.max(0, item.current_period_end - nowSec);
        const baseQuota = getSmsQuotaFor('all_in', interval, isLegacyMerchant(merchant));
        const prorata = Math.max(1, Math.round(baseQuota * remainingSec / cycleSec));
        updatePayload.sms_quota_override = prorata;
        updatePayload.sms_quota_override_cycle_anchor = new Date(item.current_period_start * 1000).toISOString();
        logger.info('sms_quota_prorata_set', { merchantId: merchant.id, prorata, baseQuota });
      }
    }
    // Si downgrade Tout-en-un → Fidélité : clear override (Fidélité quota = 0 de toute façon)
    if (merchant.plan_tier === 'all_in' && newTier === 'fidelity') {
      updatePayload.sms_quota_override = null;
      updatePayload.sms_quota_override_cycle_anchor = null;
    }

    // Persist new tier — webhook will also fire but we update eagerly for the redirect.
    await admin
      .from('merchants')
      .update(updatePayload)
      .eq('id', merchant.id);

    return NextResponse.json({ success: true, tier: newTier });
  } catch (error) {
    logger.error('change-tier error:', error);
    return NextResponse.json({ error: 'Erreur lors du changement de plan' }, { status: 500 });
  }
}
