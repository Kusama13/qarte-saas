import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { formatPhoneNumber, validateFrenchPhone, getTodayInParis, getTrialStatus } from '@/lib/utils';
import { getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import type { VisitStatus } from '@/types';

// Use singleton admin client for server-side operations
const supabaseAdmin = getSupabaseAdmin();

const checkinSchema = z.object({
  scan_code: z.string().min(1),
  phone_number: z.string().min(1),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  points_to_add: z.number().min(1).max(20).optional().default(1),
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

// Hash IP for GDPR compliance
function hashIP(ip: string): string {
  return createHash('sha256').update(ip + process.env.SUPABASE_SERVICE_ROLE_KEY).digest('hex');
}

// Get today's start timestamp in Paris timezone
function getTodayStartParis(): string {
  const now = new Date();
  const parisTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Paris' }));
  parisTime.setHours(0, 0, 0, 0);
  return parisTime.toISOString();
}

// Quarantine thresholds
const QUARANTINE_THRESHOLDS = {
  visit: 1,   // 1st scan confirmed, 2nd+ pending
  article: 2, // 1-2 scans confirmed, 3rd+ pending
};

// Max articles per scan before quarantine
const MAX_ARTICLES_PER_SCAN = 3;

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

    const { scan_code, phone_number, first_name, last_name, points_to_add } = parsed.data;
    const formattedPhone = formatPhoneNumber(phone_number);

    if (!validateFrenchPhone(formattedPhone)) {
      return NextResponse.json(
        { error: 'Numéro de téléphone invalide' },
        { status: 400 }
      );
    }

    // Get merchant by scan_code
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

    // Check trial status
    const trialStatus = getTrialStatus(merchant.trial_ends_at, merchant.subscription_status);

    if (trialStatus.isInGracePeriod || trialStatus.isFullyExpired) {
      return NextResponse.json(
        {
          error: 'Ce commerce n\'accepte plus les passages pour le moment.',
          trial_expired: true
        },
        { status: 403 }
      );
    }

    // Check if phone is banned
    const { data: bannedCheck } = await supabaseAdmin
      .from('banned_numbers')
      .select('id')
      .eq('phone_number', formattedPhone)
      .eq('merchant_id', merchant.id)
      .single();

    if (bannedCheck) {
      return NextResponse.json(
        {
          error: 'Ce numéro n\'est plus autorisé à utiliser ce programme de fidélité.',
          banned: true
        },
        { status: 403 }
      );
    }

    // Get or create customer
    let customer;
    const { data: existingCustomer } = await supabaseAdmin
      .from('customers')
      .select('*')
      .eq('phone_number', formattedPhone)
      .eq('merchant_id', merchant.id)
      .single();

    if (existingCustomer) {
      customer = existingCustomer;
    } else {
      // Check if customer exists globally (for another merchant)
      const { data: globalCustomer } = await supabaseAdmin
        .from('customers')
        .select('*')
        .eq('phone_number', formattedPhone)
        .limit(1)
        .single();

      if (globalCustomer) {
        // Create customer for this merchant with same info
        const { data: newCustomer, error: customerError } = await supabaseAdmin
          .from('customers')
          .insert({
            phone_number: formattedPhone,
            first_name: globalCustomer.first_name,
            last_name: globalCustomer.last_name,
            merchant_id: merchant.id,
          })
          .select()
          .single();

        if (customerError) {
          return NextResponse.json(
            { error: 'Erreur lors de la création du compte' },
            { status: 500 }
          );
        }
        customer = newCustomer;
      } else {
        // New customer - need first_name
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
          return NextResponse.json(
            { error: 'Erreur lors de la création du compte' },
            { status: 500 }
          );
        }
        customer = newCustomer;
      }
    }

    // Get or create loyalty card
    let loyaltyCard;
    const { data: existingCard } = await supabaseAdmin
      .from('loyalty_cards')
      .select('*')
      .eq('customer_id', customer.id)
      .eq('merchant_id', merchant.id)
      .single();

    if (existingCard) {
      loyaltyCard = existingCard;
    } else {
      const { data: newCard, error: cardError } = await supabaseAdmin
        .from('loyalty_cards')
        .insert({
          customer_id: customer.id,
          merchant_id: merchant.id,
          current_stamps: 0,
          stamps_target: merchant.stamps_required,
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

    const today = getTodayInParis();
    const todayStart = getTodayStartParis();
    const loyaltyMode = merchant.loyalty_mode || 'visit';

    // =============================================
    // QARTE SHIELD: Quarantine Logic
    // =============================================

    // Count today's scans (confirmed + pending) for this customer/merchant
    const { count: todayScansCount } = await supabaseAdmin
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id)
      .eq('merchant_id', merchant.id)
      .gte('visited_at', todayStart)
      .in('status', ['confirmed', 'pending']);

    const currentScanNumber = (todayScansCount || 0) + 1;
    const threshold = QUARANTINE_THRESHOLDS[loyaltyMode as keyof typeof QUARANTINE_THRESHOLDS] || 1;

    // Points to add
    const pointsEarned = loyaltyMode === 'article' ? points_to_add : 1;

    // Determine status based on threshold
    let visitStatus: VisitStatus = 'confirmed';
    let flaggedReason: string | null = null;

    // Check 1: Too many scans today
    if (currentScanNumber > threshold) {
      visitStatus = 'pending';
      flaggedReason = loyaltyMode === 'visit'
        ? `${currentScanNumber}ème passage ce jour`
        : `${currentScanNumber}ème scan ce jour`;
    }

    // Check 2: Too many articles at once (only for article mode)
    if (loyaltyMode === 'article' && pointsEarned > MAX_ARTICLES_PER_SCAN) {
      visitStatus = 'pending';
      flaggedReason = `${pointsEarned} articles en une fois (max ${MAX_ARTICLES_PER_SCAN})`;
    }

    // Hash IP for GDPR
    const ipHash = hashIP(ip);

    // Insert visit record
    const { data: visitData, error: visitError } = await supabaseAdmin
      .from('visits')
      .insert({
        loyalty_card_id: loyaltyCard.id,
        merchant_id: merchant.id,
        customer_id: customer.id,
        ip_address: ip,
        ip_hash: ipHash,
        points_earned: pointsEarned,
        status: visitStatus,
        flagged_reason: flaggedReason,
      })
      .select()
      .single();

    if (visitError) {
      console.error('Visit insert error:', visitError);
      return NextResponse.json(
        { error: 'Erreur lors de l\'enregistrement du passage' },
        { status: 500 }
      );
    }

    // Only update stamps if confirmed
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

    // Count pending visits for this customer at this merchant
    const { count: pendingCount } = await supabaseAdmin
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('customer_id', customer.id)
      .eq('merchant_id', merchant.id)
      .eq('status', 'pending');

    const rewardUnlocked = newStamps >= merchant.stamps_required;

    // Build response
    const response = {
      success: true,
      status: visitStatus,
      visit_id: visitData.id,
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
      customer_name: customer.first_name,
      flagged_reason: flaggedReason,
      loyalty_mode: loyaltyMode,
      points_earned: pointsEarned,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Checkin error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
