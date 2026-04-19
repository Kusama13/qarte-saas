import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { resolveAudienceUnion } from '@/lib/sms-audience';
import type { AudienceFilter } from '@/lib/sms-audience';
import { countSms, validateMarketingSms } from '@/lib/sms-validator';
import { SMS_UNIT_COST_CENTS } from '@/lib/sms';
import { isLegalSendTime, nextLegalSlot } from '@/lib/sms-compliance';
import { getPlanFeatures } from '@/lib/plan-tiers';
import { triggerUpgradeAllInEmail } from '@/lib/upgrade-triggers';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

const FilterSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('all') }),
  z.object({ type: z.literal('inactive'), days: z.union([z.literal(14), z.literal(30), z.literal(60), z.literal(90)]) }),
  z.object({ type: z.literal('new'), days: z.number().int().min(1).max(365) }),
  z.object({ type: z.literal('vip'), minStamps: z.number().int().min(0).optional(), minAmount: z.number().min(0).optional() }),
  z.object({ type: z.literal('birthday_month') }),
  z.object({ type: z.literal('unused_voucher'), olderThanDays: z.number().int().min(1).max(365) }),
]);

const BodySchema = z.object({
  merchantId: z.string().uuid(),
  body: z.string().min(1).max(500),
  filters: z.array(FilterSchema).min(1).max(10),
  scheduledAt: z.string().datetime().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Paramètres invalides', details: parsed.error.flatten() }, { status: 400 });
    }
    const { merchantId, body, filters, scheduledAt } = parsed.data;

    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, country, subscription_status, plan_tier')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();
    if (!merchant) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    if (!getPlanFeatures(merchant).marketingSms) {
      // Trigger UpgradeAllInEmail (dedup 14j via pending_email_tracking code -330)
      // Fire-and-forget : ne bloque pas la réponse 403
      void triggerUpgradeAllInEmail(supabaseAdmin, merchant.id, 'sms_campaign_blocked').catch((e) =>
        console.warn('[upgrade-trigger] failed', e),
      );
      return NextResponse.json(
        { error: 'plan_tier_required', message: 'Les campagnes SMS marketing nécessitent le plan Tout-en-un.' },
        { status: 403 },
      );
    }

    // Validate content (appends STOP, checks length/forbidden)
    const validation = validateMarketingSms(body, { requireStop: true });
    if (!validation.ok) {
      return NextResponse.json({ error: 'Contenu invalide', errors: validation.errors }, { status: 400 });
    }

    // Resolve audience snapshot (union of selected filters)
    const resolved = await resolveAudienceUnion(supabaseAdmin, merchantId, filters as AudienceFilter[]);
    if (resolved.count === 0) {
      return NextResponse.json({ error: 'Audience vide — aucun destinataire éligible.' }, { status: 400 });
    }

    // Determine effective scheduled_at: either user-provided (shifted to legal slot) or nextLegalSlot(now)
    const requestedAt = scheduledAt ? new Date(scheduledAt) : new Date();
    const compliance = isLegalSendTime(requestedAt, merchant.country || 'FR');
    const effectiveAt = compliance.ok ? requestedAt : nextLegalSlot(requestedAt, merchant.country || 'FR');

    const smsCount = countSms(validation.finalBody);
    const costCentsInt = Math.round(resolved.count * smsCount * SMS_UNIT_COST_CENTS);

    const { data: campaign, error: insertError } = await supabaseAdmin
      .from('sms_campaigns')
      .insert({
        merchant_id: merchantId,
        kind: 'custom',
        body: validation.finalBody,
        audience_filter: { filters },
        recipient_count: resolved.count,
        status: 'pending_review',
        scheduled_at: effectiveAt.toISOString(),
        cost_cents: costCentsInt,
      })
      .select()
      .single();

    if (insertError || !campaign) {
      logger.error('SMS campaign insert error:', insertError);
      return NextResponse.json({ error: 'Erreur à la création de la campagne' }, { status: 500 });
    }

    return NextResponse.json({
      campaignId: campaign.id,
      status: campaign.status,
      scheduledAt: campaign.scheduled_at,
      recipientCount: resolved.count,
      smsCount,
      costCents: costCentsInt,
      complianceAdjusted: !compliance.ok,
      warnings: validation.warnings,
    });
  } catch (error) {
    logger.error('SMS campaign submit error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
