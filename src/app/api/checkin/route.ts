import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { formatPhoneNumber, validatePhone, getTodayForCountry, getTodayStartForCountry, getTimezoneForCountry, getTrialStatus } from '@/lib/utils';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import type { VisitStatus, MerchantCountry } from '@/types';
import { setPhoneCookie } from '@/lib/customer-auth';
import logger from '@/lib/logger';

// Use singleton admin client for server-side operations
const supabaseAdmin = getSupabaseAdmin();

const checkinSchema = z.object({
  scan_code: z.string().min(1),
  phone_number: z.string().min(1),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
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

// Hash IP for GDPR compliance - use dedicated salt (not secret keys)
function getIPHashSalt(): string {
  return process.env.IP_HASH_SALT || 'qarte-default-ip-salt';
}
function hashIP(ip: string): string {
  return createHash('sha256').update(ip + getIPHashSalt()).digest('hex');
}

// Quarantine threshold: 1 visit per day confirmed, 2nd+ pending
const QUARANTINE_THRESHOLD = 1;

// Double days: 2 stamps if today is a configured double-stamp day (merchant timezone)
function getPointsEarned(m: { double_days_enabled: boolean; double_days_of_week: string; country?: string }): number {
  if (!m.double_days_enabled) return 1;
  try {
    const days = JSON.parse(m.double_days_of_week || '[]') as number[];
    const tz = getTimezoneForCountry(m.country);
    const localDate = new Date(new Date().toLocaleString('en-US', { timeZone: tz }));
    return days.includes(localDate.getDay()) ? 2 : 1;
  } catch {
    return 1;
  }
}

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
    const parsed = checkinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { scan_code, phone_number, first_name, last_name } = parsed.data;

    // ── Step 1: Fetch merchant (required for phone formatting + all subsequent queries)
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('scan_code', scan_code)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Commerce introuvable' },
        { status: 404 }
      );
    }

    // Cagnotte merchants must use /api/cagnotte/checkin
    if (merchant.loyalty_mode === 'cagnotte') {
      return NextResponse.json(
        { error: 'Ce commerce utilise le mode cagnotte. Veuillez utiliser le bon endpoint.' },
        { status: 400 }
      );
    }

    const merchantCountry: MerchantCountry = merchant.country || 'FR';
    const formattedPhone = formatPhoneNumber(phone_number, merchantCountry);

    if (!validatePhone(formattedPhone, merchantCountry)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // Check trial status (no DB call, just logic)
    const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);

    // Scans autorisés pendant la grâce, bloqués après
    if (trialStatus.isFullyExpired) {
      return NextResponse.json(
        {
          error: 'Ce commerce n\'accepte plus les passages pour le moment.',
          trial_expired: true
        },
        { status: 403 }
      );
    }

    // ── Step 2: Parallel — banned check + customer fetch
    const [bannedResult, customerResult] = await Promise.all([
      supabaseAdmin
        .from('banned_numbers')
        .select('id')
        .eq('phone_number', formattedPhone)
        .eq('merchant_id', merchant.id)
        .maybeSingle(),
      supabaseAdmin
        .from('customers')
        .select('*')
        .eq('phone_number', formattedPhone)
        .eq('merchant_id', merchant.id)
        .maybeSingle(),
    ]);

    if (bannedResult.data) {
      return NextResponse.json(
        {
          error: 'Ce numéro n\'est plus autorisé à utiliser ce programme de fidélité.',
          banned: true
        },
        { status: 403 }
      );
    }

    // ── Step 3: Get or create customer
    let customer;
    if (customerResult.data) {
      customer = customerResult.data;
    } else {
      // New customer for this merchant - need first_name
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
        .select('id, status, points_earned, flagged_reason')
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
        pending_stamps: recentVisit.status === 'pending' ? (recentVisit.points_earned || 1) : 0,
        pending_count: 0,
        required_stamps: merchant.stamps_required,
        reward_unlocked: false,
        reward_tier: null,
        tier1_redeemed: false,
        tier2_redeemed: false,
        tier2_enabled: tier2Enabled,
        tier2_stamps_required: merchant.tier2_stamps_required || 0,
        tier2_reward_description: merchant.tier2_reward_description,
        customer_name: customer.first_name,
        flagged_reason: recentVisit.flagged_reason,
        points_earned: getPointsEarned(merchant),
      });
    }

    // ── Step 5: Qarte Shield — determine visit status
    const today = getTodayForCountry(merchantCountry);
    const pointsEarned = getPointsEarned(merchant);
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

    // Hash IP for GDPR
    const ipHash = hashIP(ip);

    // ── Step 6: Insert visit record
    const { data: visitData, error: visitError } = await supabaseAdmin
      .from('visits')
      .insert({
        loyalty_card_id: loyaltyCard.id,
        merchant_id: merchant.id,
        customer_id: customer.id,
        ip_hash: ipHash,
        points_earned: pointsEarned,
        status: visitStatus,
        flagged_reason: flaggedReason,
      })
      .select()
      .single();

    if (visitError) {
      logger.error('Visit insert error:', visitError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du passage' },
        { status: 500 }
      );
    }

    // ── Step 7: Update stamps if confirmed
    let newStamps = loyaltyCard.current_stamps;

    if (visitStatus === 'confirmed') {
      newStamps = loyaltyCard.current_stamps + pointsEarned;

      const { error: updateError } = await supabaseAdmin
        .from('loyalty_cards')
        .update({
          current_stamps: newStamps,
          last_visit_date: today,
        })
        .eq('id', loyaltyCard.id);

      if (updateError) {
        // Rollback visit
        await supabaseAdmin.from('visits').delete().eq('id', visitData.id);
        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour de la carte' },
          { status: 500 }
        );
      }
    }

    // ── Step 8: Parallel — pending count + tier 2 redemption check
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

    // ── Step 9: Tier 1 in cycle check (depends on tier 2 result)
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

    // Tier 2 redeemed status: check if current stamps warrant showing tier 2
    // If tier 2 was just redeemed (last redemption), we're in a new cycle
    const tier2Redeemed = false; // Tier 2 is never "redeemed" in terms of blocking - it just resets the cycle

    // Calculate tier reward unlocks
    const tier2Enabled = merchant.tier2_enabled && merchant.tier2_stamps_required;
    const tier1Threshold = merchant.stamps_required;
    const tier2Threshold = merchant.tier2_stamps_required || 0;

    // Tier 1: unlocked if stamps >= tier1 threshold AND not already redeemed
    const tier1RewardUnlocked = newStamps >= tier1Threshold && !tier1Redeemed;
    // Tier 2: unlocked if tier2 enabled AND stamps >= tier2 threshold AND not already redeemed
    const tier2RewardUnlocked = tier2Enabled && newStamps >= tier2Threshold && !tier2Redeemed;

    // Determine which reward to show (prioritize tier 2 if both unlocked)
    let rewardUnlocked = false;
    let rewardTier: number | null = null;

    if (tier2RewardUnlocked) {
      rewardUnlocked = true;
      rewardTier = 2;
    } else if (tier1RewardUnlocked) {
      rewardUnlocked = true;
      rewardTier = 1;
    }

    // Build response
    const response = {
      success: true,
      customer_id: customer.id,
      status: visitStatus,
      visit_id: visitData.id,
      loyalty_card_id: loyaltyCard.id,
      message: visitStatus === 'pending'
        ? 'Passage en cours de vérification'
        : rewardUnlocked
          ? 'Félicitations ! Vous avez débloqué votre récompense !'
          : 'Passage enregistré avec succès',
      current_stamps: newStamps,
      pending_stamps: visitStatus === 'pending' ? pointsEarned : 0,
      pending_count: pendingCount || 0,
      required_stamps: merchant.stamps_required,
      reward_unlocked: rewardUnlocked && visitStatus === 'confirmed',
      reward_tier: rewardTier,
      tier1_redeemed: tier1Redeemed,
      tier2_redeemed: tier2Redeemed,
      tier2_enabled: tier2Enabled,
      tier2_stamps_required: tier2Threshold,
      tier2_reward_description: merchant.tier2_reward_description,
      customer_name: customer.first_name,
      flagged_reason: flaggedReason,
      points_earned: pointsEarned,
    };

    const jsonResponse = NextResponse.json(response);
    setPhoneCookie(jsonResponse, formattedPhone);
    return jsonResponse;
  } catch (error) {
    logger.error('Checkin error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
