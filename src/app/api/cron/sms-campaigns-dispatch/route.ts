import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { sendMarketingSms, PAID_STATUSES, SMS_UNIT_COST_CENTS } from '@/lib/sms';
import { isLegalSendTime, nextLegalSlot } from '@/lib/sms-compliance';
import { resolveAudienceUnion } from '@/lib/sms-audience';
import type { AudienceFilter } from '@/lib/sms-audience';
import { resolveVariables, appendStopIfMissing, countSms } from '@/lib/sms-validator';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

export const maxDuration = 300;

interface CampaignRow {
  id: string;
  merchant_id: string;
  body: string;
  audience_filter: Record<string, unknown>;
  scheduled_at: string | null;
}

interface MerchantRow {
  id: string;
  shop_name: string;
  country: string | null;
  slug: string | null;
  billing_period_start: string | null;
}

// Per-campaign send cap — protects batch time + avoids cross-campaign starvation.
const PER_CAMPAIGN_CAP = 500;

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startedAt = Date.now();
  const results = {
    picked: 0,
    sent: 0,
    rescheduled: 0,
    failed: 0,
    campaignsProcessed: 0,
  };

  const { data: pending } = await supabaseAdmin
    .from('sms_campaigns')
    .select('id, merchant_id, body, audience_filter, scheduled_at')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(10);

  const campaigns = (pending || []) as CampaignRow[];
  results.picked = campaigns.length;

  for (const campaign of campaigns) {
    if (Date.now() - startedAt > 270_000) break;
    results.campaignsProcessed++;

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, shop_name, country, slug, billing_period_start, subscription_status')
      .eq('id', campaign.merchant_id)
      .single<MerchantRow & { subscription_status: string }>();
    if (!merchant) {
      await supabaseAdmin
        .from('sms_campaigns')
        .update({ status: 'failed', review_note: 'Merchant not found at dispatch time.' })
        .eq('id', campaign.id);
      results.failed++;
      continue;
    }
    if (!(PAID_STATUSES as readonly string[]).includes(merchant.subscription_status)) {
      await supabaseAdmin
        .from('sms_campaigns')
        .update({ status: 'failed', review_note: 'Abonnement inactif au moment du dispatch.' })
        .eq('id', campaign.id);
      results.failed++;
      continue;
    }

    // Compliance check at dispatch time — reschedule if hors plage
    const compliance = isLegalSendTime(new Date(), merchant.country || 'FR');
    if (!compliance.ok) {
      const next = nextLegalSlot(new Date(), merchant.country || 'FR');
      await supabaseAdmin
        .from('sms_campaigns')
        .update({ scheduled_at: next.toISOString() })
        .eq('id', campaign.id);
      results.rescheduled++;
      continue;
    }

    // Mark as sending (prevents reentry if cron re-fires)
    await supabaseAdmin
      .from('sms_campaigns')
      .update({ status: 'sending' })
      .eq('id', campaign.id);

    // Re-resolve audience at send time (opt-outs may have been added since submit).
    const rawFilter = campaign.audience_filter as { filters?: AudienceFilter[] };
    const filters: AudienceFilter[] = rawFilter?.filters || [];
    const audience = await resolveAudienceUnion(supabaseAdmin, campaign.merchant_id, filters);

    if (audience.count === 0) {
      await supabaseAdmin
        .from('sms_campaigns')
        .update({ status: 'done', sent_at: new Date().toISOString(), recipient_count: 0 })
        .eq('id', campaign.id);
      continue;
    }

    const finalBodyTemplate = appendStopIfMissing(campaign.body);
    const smsPerRecipient = countSms(finalBodyTemplate);

    let sentCount = 0;
    let blockedHit = false;

    for (const phone of audience.phones.slice(0, PER_CAMPAIGN_CAP)) {
      if (Date.now() - startedAt > 280_000) break;

      const message = resolveVariables(finalBodyTemplate, {
        prenom: '',
        shop_name: merchant.shop_name,
      });

      try {
        const result = await sendMarketingSms(supabaseAdmin, {
          merchantId: campaign.merchant_id,
          phone,
          body: message,
          billingPeriodStart: merchant.billing_period_start,
        });

        if (result.success) {
          sentCount++;
          results.sent++;
        } else {
          results.failed++;
          if (result.blocked) { blockedHit = true; break; }
        }
      } catch (err) {
        logger.error('Campaign send error', { campaignId: campaign.id, phone, err });
        results.failed++;
      }
    }

    // Si bloqué par quota en cours de route et rien d'envoyé → re-scheduler dans 1h.
    // Sinon done/failed selon qu'au moins un SMS a été envoyé.
    const costCentsActual = sentCount * smsPerRecipient * SMS_UNIT_COST_CENTS;
    if (blockedHit && sentCount === 0) {
      await supabaseAdmin
        .from('sms_campaigns')
        .update({
          status: 'scheduled',
          scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          review_note: 'Quota SMS épuisé — retenté dans 1h (achetez un pack pour débloquer).',
        })
        .eq('id', campaign.id);
      results.rescheduled++;
    } else {
      await supabaseAdmin
        .from('sms_campaigns')
        .update({
          status: sentCount > 0 ? 'done' : 'failed',
          sent_at: new Date().toISOString(),
          recipient_count: sentCount,
          cost_cents: Math.round(costCentsActual),
          review_note: blockedHit ? 'Quota SMS atteint pendant l\'envoi.' : null,
        })
        .eq('id', campaign.id);
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
