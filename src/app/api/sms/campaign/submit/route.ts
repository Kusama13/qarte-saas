import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { resolveAudienceUnion, resolveAudienceWithNames } from '@/lib/sms-audience';
import type { AudienceFilter } from '@/lib/sms-audience';
import { countSms, validateMarketingSms, normalizeToGsm7, withOvhStopClause, bodyHasPersonalization, computeCampaignSmsBreakdown } from '@/lib/sms-validator';
import { SMS_UNIT_COST_CENTS, isPaidMerchant } from '@/lib/sms';
import { isLegalSendTime, nextLegalSlot } from '@/lib/sms-compliance';
import { sendNewSmsCampaignNotification } from '@/lib/email';
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
      .select('id, country, subscription_status, plan_tier, shop_name, sms_pack_balance, billing_interval, created_at')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();
    if (!merchant) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    // Bloque les non-abonnés (trial / canceled). Le bouton submit est déjà désactivé
    // côté UI ; ce check sécurise contre les requêtes craftées (curl).
    if (!isPaidMerchant(merchant)) {
      return NextResponse.json({ error: 'Souscris pour envoyer une campagne SMS.' }, { status: 403 });
    }


    // Validate content (appends STOP, checks length/forbidden)
    const validation = validateMarketingSms(body);
    if (!validation.ok) {
      return NextResponse.json({ error: 'Contenu invalide', errors: validation.errors }, { status: 400 });
    }

    // Resolve audience. Si le body contient {prenom}, on fetch aussi les
    // first_names pour calculer le SMS count *par destinataire* (un prenom
    // long peut faire basculer en 2 SMS — cf computeCampaignSmsBreakdown).
    const usesPersonalization = bodyHasPersonalization(validation.finalBody);
    let recipientCount: number;
    let totalSmsRequested: number;
    let smsCount: number;
    if (usesPersonalization) {
      const { count, recipients } = await resolveAudienceWithNames(supabaseAdmin, merchantId, filters as AudienceFilter[]);
      if (count === 0) {
        return NextResponse.json({ error: 'Audience vide — aucun destinataire éligible.' }, { status: 400 });
      }
      const breakdown = computeCampaignSmsBreakdown(validation.finalBody, recipients, merchant.shop_name);
      recipientCount = count;
      totalSmsRequested = breakdown.totalSms;
      smsCount = breakdown.baselineSmsPerRecipient;
    } else {
      const resolved = await resolveAudienceUnion(supabaseAdmin, merchantId, filters as AudienceFilter[]);
      if (resolved.count === 0) {
        return NextResponse.json({ error: 'Audience vide — aucun destinataire éligible.' }, { status: 400 });
      }
      const normalized = normalizeToGsm7(validation.finalBody);
      smsCount = countSms(withOvhStopClause(normalized));
      recipientCount = resolved.count;
      totalSmsRequested = recipientCount * smsCount;
    }

    const requestedAt = scheduledAt ? new Date(scheduledAt) : new Date();
    const compliance = isLegalSendTime(requestedAt, merchant.country || 'FR');
    const effectiveAt = compliance.ok ? requestedAt : nextLegalSlot(requestedAt, merchant.country || 'FR');

    const costCentsInt = Math.round(totalSmsRequested * SMS_UNIT_COST_CENTS);

    // Campagnes manuelles : pack-only. Le quota gratuit (100/cycle) est reserve
    // aux automatisations et au transactionnel. Force l'achat d'un pack pour lancer.
    const packBalance = Number(merchant.sms_pack_balance || 0);
    if (totalSmsRequested > packBalance) {
      return NextResponse.json(
        {
          error: 'pack_insufficient',
          message: `Cette campagne demande ${totalSmsRequested} SMS mais ton pack n'a que ${packBalance} crédit${packBalance > 1 ? 's' : ''}. Achete un pack pour la lancer.`,
          requested: totalSmsRequested,
          packBalance,
        },
        { status: 402 },
      );
    }

    const { data: campaign, error: insertError } = await supabaseAdmin
      .from('sms_campaigns')
      .insert({
        merchant_id: merchantId,
        kind: 'custom',
        body: validation.finalBody,
        audience_filter: { filters },
        recipient_count: recipientCount,
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

    void sendNewSmsCampaignNotification(
      (merchant.shop_name as string) || 'Commerce',
      recipientCount,
      smsCount,
      costCentsInt,
      validation.finalBody,
      effectiveAt.toISOString(),
    ).catch((err) => logger.error('Failed to send SMS campaign admin notification', err));

    return NextResponse.json({
      campaignId: campaign.id,
      status: campaign.status,
      scheduledAt: campaign.scheduled_at,
      recipientCount,
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
