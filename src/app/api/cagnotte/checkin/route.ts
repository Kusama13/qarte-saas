import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { formatPhoneNumber, validatePhone, getAllPhoneFormats, getTodayForCountry, getTodayStartForCountry, getTrialStatus } from '@/lib/utils';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import type { VisitStatus, MerchantCountry } from '@/types';
import { setPhoneCookie } from '@/lib/customer-auth';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

const cagnotteCheckinSchema = z.object({
  scan_code: z.string().min(1),
  phone_number: z.string().min(1),
  phone_country: z.enum(['FR', 'BE', 'CH']).optional(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  amount: z.number().min(0.01).max(99999),
});

// Rate limiting
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxRequests = 10;

  const record = rateLimitMap.get(ip);

  if (!record || now - record.timestamp > windowMs) {
    rateLimitMap.set(ip, { count: 1, timestamp: now });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}

function getIPHashSalt(): string {
  return process.env.IP_HASH_SALT || 'qarte-default-ip-salt';
}
function hashIP(ip: string): string {
  return createHash('sha256').update(ip + getIPHashSalt()).digest('hex');
}

const QUARANTINE_THRESHOLD = 1;

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Trop de requêtes. Veuillez réessayer dans une minute.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const parsed = cagnotteCheckinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { scan_code, phone_number, first_name, last_name, amount } = parsed.data;

    // ── Step 1: Fetch merchant
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('scan_code', scan_code)
      .is('deleted_at', null)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Commerce introuvable' },
        { status: 404 }
      );
    }

    // Verify cagnotte mode
    if (merchant.loyalty_mode !== 'cagnotte') {
      return NextResponse.json(
        { error: 'Ce commerce n\'utilise pas le mode cagnotte' },
        { status: 400 }
      );
    }

    const merchantCountry: MerchantCountry = (parsed.data.phone_country || merchant.country || 'FR') as MerchantCountry;
    const formattedPhone = formatPhoneNumber(phone_number, merchantCountry);

    if (!validatePhone(formattedPhone, merchantCountry)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // Check trial status
    const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);

    if (trialStatus.isFullyExpired) {
      return NextResponse.json(
        { error: 'Ce commerce n\'accepte plus les passages pour le moment.', trial_expired: true },
        { status: 403 }
      );
    }

    // ── Step 2: Parallel — banned check + customer fetch
    const phoneVariants = getAllPhoneFormats(formattedPhone);
    const [bannedResult, customerResult] = await Promise.all([
      supabaseAdmin
        .from('banned_numbers')
        .select('id')
        .in('phone_number', phoneVariants)
        .eq('merchant_id', merchant.id)
        .maybeSingle(),
      supabaseAdmin
        .from('customers')
        .select('*')
        .in('phone_number', phoneVariants)
        .eq('merchant_id', merchant.id)
        .maybeSingle(),
    ]);

    if (bannedResult.data) {
      return NextResponse.json(
        { error: 'Ce numéro n\'est plus autorisé à utiliser ce programme de fidélité.', banned: true },
        { status: 403 }
      );
    }

    // ── Step 3: Get or create customer
    let customer;
    if (customerResult.data) {
      customer = customerResult.data;
    } else {
      if (!first_name) {
        return NextResponse.json(
          { error: 'Le prénom est requis pour créer un compte', needs_registration: true },
          { status: 400 }
        );
      }

      const { data: newCustomer, error: customerError } = await supabaseAdmin
        .from('customers')
        .insert({
          phone_number: formattedPhone,
          first_name: first_name.trim(),
          last_name: last_name?.trim() || null,
          merchant_id: merchant.id,
        })
        .select()
        .single();

      if (customerError) {
        logger.error('Customer creation error:', customerError);
        return NextResponse.json(
          { error: 'Erreur lors de la création du compte' },
          { status: 500 }
        );
      }
      customer = newCustomer;
    }

    // ── Step 4: Parallel — loyalty card + recent visit (idempotency) + today scans (shield)
    const shieldEnabled = merchant.shield_enabled !== false;
    const threeMinAgo = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    const todayStart = getTodayStartForCountry(merchantCountry);

    const [cardResult, recentVisitResult, shieldResult] = await Promise.all([
      supabaseAdmin
        .from('loyalty_cards')
        .select('*')
        .eq('customer_id', customer.id)
        .eq('merchant_id', merchant.id)
        .maybeSingle(),
      supabaseAdmin
        .from('visits')
        .select('id, status, points_earned, flagged_reason, amount_spent')
        .eq('customer_id', customer.id)
        .eq('merchant_id', merchant.id)
        .gte('visited_at', threeMinAgo)
        .order('visited_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
      shieldEnabled
        ? supabaseAdmin
            .from('visits')
            .select('*', { count: 'exact', head: true })
            .eq('customer_id', customer.id)
            .eq('merchant_id', merchant.id)
            .gte('visited_at', todayStart)
            .in('status', ['confirmed', 'pending'])
        : Promise.resolve({ count: 0 } as { count: number }),
    ]);

    // Handle loyalty card — get or create
    let loyaltyCard;
    if (cardResult.data) {
      loyaltyCard = cardResult.data;
    } else {
      const { generateReferralCode } = await import('@/lib/utils');
      const { data: newCard, error: cardError } = await supabaseAdmin
        .from('loyalty_cards')
        .insert({
          customer_id: customer.id,
          merchant_id: merchant.id,
          current_stamps: 0,
          current_amount: 0,
          stamps_target: merchant.stamps_required,
          referral_code: generateReferralCode(),
        })
        .select()
        .single();

      if (cardError) {
        return NextResponse.json(
          { error: 'Erreur lors de la création de la carte' },
          { status: 500 }
        );
      }
      loyaltyCard = newCard;
    }

    // ── Idempotency: return early if duplicate (3-min window)
    const recentVisit = recentVisitResult.data;
    if (recentVisit) {
      const tier2Enabled = merchant.tier2_enabled && merchant.tier2_stamps_required;

      return NextResponse.json({
        success: true,
        customer_id: customer.id,
        duplicate: true,
        status: recentVisit.status,
        visit_id: recentVisit.id,
        loyalty_card_id: loyaltyCard.id,
        message: 'Passage déjà enregistré',
        current_stamps: loyaltyCard.current_stamps,
        current_amount: Number(loyaltyCard.current_amount),
        amount_added: Number(recentVisit.amount_spent || 0),
        pending_count: 0,
        required_stamps: merchant.stamps_required,
        reward_unlocked: false,
        reward_tier: null,
        tier1_redeemed: false,
        tier2_enabled: tier2Enabled,
        tier2_stamps_required: merchant.tier2_stamps_required || 0,
        cagnotte_percent: Number(merchant.cagnotte_percent),
        cagnotte_tier2_percent: merchant.cagnotte_tier2_percent ? Number(merchant.cagnotte_tier2_percent) : null,
        customer_name: customer.first_name,
        flagged_reason: recentVisit.flagged_reason,
      });
    }

    // ── Step 5: Qarte Shield — determine visit status
    const today = getTodayForCountry(merchantCountry);
    // No double days in cagnotte mode — always 1 point
    const pointsEarned = 1;
    let visitStatus: VisitStatus = 'confirmed';
    let flaggedReason: string | null = null;

    if (shieldEnabled) {
      const todayScansCount = ('count' in shieldResult ? shieldResult.count : 0) || 0;
      const currentScanNumber = todayScansCount + 1;

      if (currentScanNumber > QUARANTINE_THRESHOLD) {
        visitStatus = 'pending';
        flaggedReason = `${currentScanNumber}ème passage ce jour`;
      }
    }

    const ipHash = hashIP(ip);

    // ── Step 6: Insert visit with amount_spent
    const { data: visitData, error: visitError } = await supabaseAdmin
      .from('visits')
      .insert({
        loyalty_card_id: loyaltyCard.id,
        merchant_id: merchant.id,
        customer_id: customer.id,
        ip_hash: ipHash,
        points_earned: pointsEarned,
        amount_spent: amount,
        status: visitStatus,
        flagged_reason: flaggedReason,
      })
      .select()
      .single();

    if (visitError) {
      logger.error('Cagnotte visit insert error:', visitError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du passage' },
        { status: 500 }
      );
    }

    // ── Step 7: Update stamps + amount if confirmed
    let newStamps = loyaltyCard.current_stamps;
    let newAmount = Number(loyaltyCard.current_amount);

    if (visitStatus === 'confirmed') {
      newStamps = loyaltyCard.current_stamps + pointsEarned;
      newAmount = Number(loyaltyCard.current_amount) + amount;

      const { error: updateError } = await supabaseAdmin
        .from('loyalty_cards')
        .update({
          current_stamps: newStamps,
          current_amount: newAmount,
          last_visit_date: today,
        })
        .eq('id', loyaltyCard.id);

      if (updateError) {
        await supabaseAdmin.from('visits').delete().eq('id', visitData.id);
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour de la carte' },
          { status: 500 }
        );
      }
    }

    // ── Step 8: Parallel — pending count + tier checks
    const [pendingCountResult, lastTier2Result] = await Promise.all([
      supabaseAdmin
        .from('visits')
        .select('*', { count: 'exact', head: true })
        .eq('customer_id', customer.id)
        .eq('merchant_id', merchant.id)
        .eq('status', 'pending'),
      supabaseAdmin
        .from('redemptions')
        .select('redeemed_at')
        .eq('loyalty_card_id', loyaltyCard.id)
        .eq('tier', 2)
        .order('redeemed_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const pendingCount = pendingCountResult.count;
    const lastTier2Redemption = lastTier2Result.data;

    // ── Step 9: Tier 1 in cycle check
    let tier1Query = supabaseAdmin
      .from('redemptions')
      .select('id')
      .eq('loyalty_card_id', loyaltyCard.id)
      .eq('tier', 1);

    if (lastTier2Redemption) {
      tier1Query = tier1Query.gt('redeemed_at', lastTier2Redemption.redeemed_at);
    }

    const { data: tier1InCycle } = await tier1Query.limit(1).maybeSingle();
    const tier1Redeemed = !!tier1InCycle;

    // Calculate tier reward unlocks (same logic as stamps but reward is %)
    const tier2Enabled = merchant.tier2_enabled && merchant.tier2_stamps_required;
    const tier1Threshold = merchant.stamps_required;
    const tier2Threshold = merchant.tier2_stamps_required || 0;

    const tier1RewardUnlocked = newStamps >= tier1Threshold && !tier1Redeemed;
    const tier2RewardUnlocked = tier2Enabled && newStamps >= tier2Threshold;

    let rewardUnlocked = false;
    let rewardTier: number | null = null;
    let rewardValue: number | null = null;

    if (tier2RewardUnlocked && merchant.cagnotte_tier2_percent) {
      rewardUnlocked = true;
      rewardTier = 2;
      rewardValue = Math.round(newAmount * Number(merchant.cagnotte_tier2_percent)) / 100;
    } else if (tier1RewardUnlocked && merchant.cagnotte_percent) {
      rewardUnlocked = true;
      rewardTier = 1;
      rewardValue = Math.round(newAmount * Number(merchant.cagnotte_percent)) / 100;
    }

    const response = {
      success: true,
      customer_id: customer.id,
      status: visitStatus,
      visit_id: visitData.id,
      loyalty_card_id: loyaltyCard.id,
      message: visitStatus === 'pending'
        ? 'Passage en cours de vérification'
        : rewardUnlocked
          ? 'Félicitations ! Votre cagnotte fidélité est prête !'
          : 'Passage enregistré avec succès',
      current_stamps: newStamps,
      current_amount: newAmount,
      amount_added: amount,
      pending_count: pendingCount || 0,
      required_stamps: merchant.stamps_required,
      reward_unlocked: rewardUnlocked && visitStatus === 'confirmed',
      reward_tier: rewardTier,
      reward_value: rewardValue,
      tier1_redeemed: tier1Redeemed,
      tier2_enabled: tier2Enabled,
      tier2_stamps_required: tier2Threshold,
      cagnotte_percent: Number(merchant.cagnotte_percent),
      cagnotte_tier2_percent: merchant.cagnotte_tier2_percent ? Number(merchant.cagnotte_tier2_percent) : null,
      customer_name: customer.first_name,
      flagged_reason: flaggedReason,
    };

    const jsonResponse = NextResponse.json(response);
    setPhoneCookie(jsonResponse, formattedPhone);
    return jsonResponse;
  } catch (error) {
    logger.error('Cagnotte checkin error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
