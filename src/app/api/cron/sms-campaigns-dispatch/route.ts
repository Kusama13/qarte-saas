import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { sendMarketingSms, PAID_STATUSES, SMS_UNIT_COST_CENTS, getSmsUsageThisMonth, getEffectiveQuota } from '@/lib/sms';
import { isPastDueBlocked } from '@/lib/merchant-access';
import { sendSmsCampaignSentEmail } from '@/lib/email';
import { isLegalSendTime, nextLegalSlot } from '@/lib/sms-compliance';
import { resolveAudienceUnion } from '@/lib/sms-audience';
import type { AudienceFilter } from '@/lib/sms-audience';
import { resolveVariables, countSms, normalizeToGsm7, withOvhStopClause, bodyHasPersonalization } from '@/lib/sms-validator';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

export const maxDuration = 300;

interface CampaignRow {
  id: string;
  merchant_id: string;
  body: string;
  audience_filter: Record<string, unknown>;
  scheduled_at: string | null;
  pending_phones: string[] | null;
}

interface MerchantRow {
  id: string;
  shop_name: string;
  country: string | null;
  slug: string | null;
  billing_period_start: string | null;
  user_id: string;
  locale: string | null;
  sms_pack_balance: number | null;
  plan_tier: string | null;
  sms_quota_override: number | null;
  sms_quota_override_cycle_anchor: string | null;
  billing_interval: string | null;
  created_at: string | null;
  past_due_since: string | null;
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
    .select('id, merchant_id, body, audience_filter, scheduled_at, pending_phones')
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
      .select('id, shop_name, country, slug, billing_period_start, subscription_status, past_due_since, user_id, locale, sms_pack_balance, plan_tier, sms_quota_override, sms_quota_override_cycle_anchor, billing_interval, created_at')
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
    // Mig 164 : merchant past_due > 72h = suspendu. On annule la campagne au
    // niveau dispatch plutot que d'avoir N envois marketing qui echouent
    // chacun (sendMarketingSms gate aussi mais c'est plus efficace ici).
    if (isPastDueBlocked({ subscription_status: merchant.subscription_status, past_due_since: merchant.past_due_since })) {
      await supabaseAdmin
        .from('sms_campaigns')
        .update({ status: 'failed', review_note: 'Compte suspendu pour defaut de paiement au moment du dispatch.' })
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

    // Si pending_phones non-vide → reprise apres echec credit OVH : on ne
    // reresoud PAS l'audience pour ne pas re-envoyer aux destinataires deja
    // servis lors du dispatch precedent. Sinon resolution normale.
    const hasPendingPhones = (campaign.pending_phones?.length ?? 0) > 0;
    let phonesToSend: string[];
    if (hasPendingPhones) {
      phonesToSend = campaign.pending_phones || [];
    } else {
      const rawFilter = campaign.audience_filter as { filters?: AudienceFilter[] };
      const filters: AudienceFilter[] = rawFilter?.filters || [];
      const audience = await resolveAudienceUnion(supabaseAdmin, campaign.merchant_id, filters);
      phonesToSend = audience.phones;
    }

    if (phonesToSend.length === 0) {
      await supabaseAdmin
        .from('sms_campaigns')
        .update({ status: 'done', sent_at: new Date().toISOString(), recipient_count: 0, pending_phones: [] })
        .eq('id', campaign.id);
      continue;
    }

    // Normalise le body en GSM-7 (retire emojis + smart quotes) pour eviter
    // de basculer en UCS-2 et payer 2 SMS au lieu d'1.
    const normalizedBody = normalizeToGsm7(campaign.body);
    const finalBodyTemplate = normalizedBody.trim();
    const usesPersonalization = bodyHasPersonalization(finalBodyTemplate);

    // Si {prenom}, on fetch les firstnames via la table customers (1 query batch).
    // Sinon, prenom='' (comportement avant) — pas de query supplementaire.
    let firstNameByPhone: Map<string, string | null> = new Map();
    if (usesPersonalization && phonesToSend.length > 0) {
      const { data: cust } = await supabaseAdmin
        .from('customers')
        .select('phone_number, first_name')
        .eq('merchant_id', campaign.merchant_id)
        .in('phone_number', phonesToSend);
      for (const c of (cust || []) as { phone_number: string; first_name: string | null }[]) {
        firstNameByPhone.set(c.phone_number, c.first_name);
      }
    }

    // Baseline SMS count (avec prenom='') — utilise pour l'email recap quand
    // pas de personnalisation, et comme fallback de smsPerRecipient.
    const baselineSmsPerRecipient = countSms(withOvhStopClause(resolveVariables(finalBodyTemplate, { prenom: '', shop_name: merchant.shop_name })));

    let sentCount = 0;
    let actualTotalSms = 0;
    let blockedHit = false;
    let creditExhausted = false;
    const phonesQueue = phonesToSend.slice(0, PER_CAMPAIGN_CAP);
    let nextPhoneIdx = 0;

    for (; nextPhoneIdx < phonesQueue.length; nextPhoneIdx++) {
      const phone = phonesQueue[nextPhoneIdx];
      if (Date.now() - startedAt > 280_000) break;

      const prenom = usesPersonalization ? ((firstNameByPhone.get(phone) || '').trim().slice(0, 50)) : '';
      const message = resolveVariables(finalBodyTemplate, {
        prenom,
        shop_name: merchant.shop_name,
      });
      const thisSmsCount = countSms(withOvhStopClause(message));

      try {
        const result = await sendMarketingSms(supabaseAdmin, {
          merchantId: campaign.merchant_id,
          phone,
          body: message,
          billingPeriodStart: merchant.billing_period_start,
        });

        if (result.success) {
          sentCount++;
          actualTotalSms += thisSmsCount;
          results.sent++;
        } else {
          results.failed++;
          if (result.creditExhausted) { creditExhausted = true; break; }
          if (result.blocked) { blockedHit = true; break; }
        }
      } catch (err) {
        logger.error('Campaign send error', { campaignId: campaign.id, phone, err });
        results.failed++;
      }
    }

    // Phones non encore tentes (apres break) → stockes pour le prochain dispatch
    const remainingPhones = phonesQueue.slice(nextPhoneIdx + (creditExhausted || blockedHit ? 1 : 0));

    // Coût = somme reelle des SMS envoyes (pas count*moyenne) — necessaire car
    // {prenom} long peut faire basculer un destinataire en 2 SMS.
    const costCentsActual = actualTotalSms * SMS_UNIT_COST_CENTS;
    if (creditExhausted) {
      // Cumul du recipient_count si reprise (pour ne pas perdre le compte des envois precedents)
      const { data: prev } = await supabaseAdmin
        .from('sms_campaigns')
        .select('recipient_count, cost_cents')
        .eq('id', campaign.id)
        .single<{ recipient_count: number | null; cost_cents: number | null }>();
      const cumulSent = (prev?.recipient_count || 0) + sentCount;
      const cumulCost = (prev?.cost_cents || 0) + Math.round(costCentsActual);
      await supabaseAdmin
        .from('sms_campaigns')
        .update({
          status: 'scheduled',
          scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          review_note: `Credit OVH epuise — ${remainingPhones.length} destinataires en attente, retente dans 1h.`,
          pending_phones: remainingPhones,
          recipient_count: cumulSent,
          cost_cents: cumulCost,
        })
        .eq('id', campaign.id);
      results.rescheduled++;
      logger.warn('Campaign paused — OVH credit exhausted', {
        campaignId: campaign.id,
        sentThisRun: sentCount,
        cumulSent,
        remaining: remainingPhones.length,
      });
    } else if (blockedHit && sentCount === 0) {
      await supabaseAdmin
        .from('sms_campaigns')
        .update({
          status: 'scheduled',
          scheduled_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
          review_note: 'Quota SMS épuisé — retenté dans 1h (achetez un pack pour débloquer).',
          pending_phones: remainingPhones,
        })
        .eq('id', campaign.id);
      results.rescheduled++;
    } else {
      // Si reprise (hasPendingPhones), cumuler avec recipient_count/cost_cents precedents
      let finalSent = sentCount;
      let finalCost = Math.round(costCentsActual);
      if (hasPendingPhones) {
        const { data: prev } = await supabaseAdmin
          .from('sms_campaigns')
          .select('recipient_count, cost_cents')
          .eq('id', campaign.id)
          .single<{ recipient_count: number | null; cost_cents: number | null }>();
        finalSent = (prev?.recipient_count || 0) + sentCount;
        finalCost = (prev?.cost_cents || 0) + Math.round(costCentsActual);
      }
      await supabaseAdmin
        .from('sms_campaigns')
        .update({
          status: finalSent > 0 ? 'done' : 'failed',
          sent_at: new Date().toISOString(),
          recipient_count: finalSent,
          cost_cents: finalCost,
          pending_phones: [],
          review_note: blockedHit ? 'Quota SMS atteint pendant l\'envoi.' : null,
        })
        .eq('id', campaign.id);

      if (finalSent > 0 && merchant.user_id) {
        // Parallelise auth.admin.getUserById (GoTrue) + getSmsUsageThisMonth — independants.
        const [authResult, usage] = await Promise.all([
          supabaseAdmin.auth.admin.getUserById(merchant.user_id),
          getSmsUsageThisMonth(supabaseAdmin, campaign.merchant_id, merchant.billing_period_start, 100),
        ]);
        const merchantEmail = authResult.data?.user?.email;
        if (merchantEmail) {
          const quotaTotal = getEffectiveQuota(merchant, usage.periodStart);
          const packBalance = Number(merchant.sms_pack_balance || 0);
          // Total SMS reel = somme cumulee. smsPerRecipient affiche dans le mail
          // est la moyenne (peut etre fractionnaire si personnalisation).
          const totalSmsThisCampaign = (hasPendingPhones ? (Math.round((finalCost - Math.round(actualTotalSms * SMS_UNIT_COST_CENTS)) / SMS_UNIT_COST_CENTS) + actualTotalSms) : actualTotalSms);
          const avgSmsPerRecipient = finalSent > 0 ? Math.round((totalSmsThisCampaign / finalSent) * 10) / 10 : baselineSmsPerRecipient;
          void sendSmsCampaignSentEmail({
            to: merchantEmail,
            shopName: merchant.shop_name,
            recipientCount: finalSent,
            smsPerRecipient: avgSmsPerRecipient,
            totalSmsSent: totalSmsThisCampaign,
            quotaUsed: usage.sent,
            quotaTotal,
            packBalance,
            body: normalizedBody,
            bodyWasNormalized: normalizedBody !== campaign.body.trim(),
            locale: (merchant.locale as 'fr' | 'en') || 'fr',
          }).catch((err) => logger.error('SMS campaign sent email failed', { campaignId: campaign.id, err }));
        }
      }
    }
  }

  return NextResponse.json({ ok: true, ...results });
}
