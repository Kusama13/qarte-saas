import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { sendWelcomeEmail, sendAffiliationWelcomeEmail, sendNewMerchantNotification, cancelScheduledEmail } from '@/lib/email';
import { generateSlug, generateScanCode, generateReferralCode, formatPhoneNumber } from '@/lib/utils';
import { PG_UNIQUE_VIOLATION } from '@/lib/postgres-errors';

// Client avec service role (bypass RLS)
const supabaseAdmin = getSupabaseAdmin();

const createSchema = z.object({
  user_id: z.string().uuid(),
  shop_name: z.string().trim().min(1),
  shop_type: z.enum(['coiffeur', 'barbier', 'institut_beaute', 'onglerie', 'spa', 'estheticienne', 'tatouage', 'autre']),
  phone: z.string().trim().min(1),
  shop_address: z.string().trim().optional().default(''),
  country: z.enum(['FR', 'BE', 'CH', 'LU', 'US', 'GB', 'CA', 'AU', 'ES', 'IT']).optional().default('FR'),
  signup_source: z.string().optional(),
  locale: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 créations par heure par IP
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`merchant-create:${ip}`, RATE_LIMITS.signup);

    if (!rateLimit.success) {
      logger.warn(`Rate limit exceeded for merchant creation: ${ip}`);
      return rateLimitResponse(rateLimit.resetTime);
    }

    const parsed = createSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }
    const { user_id, shop_name: trimmedShopName, shop_type, shop_address: trimmedAddress,
            phone, country: merchantCountry, signup_source, locale } = parsed.data;
    const formattedPhone = formatPhoneNumber(phone, merchantCountry);

    // Vérifier l'authentification — Bearer token obligatoire (C12)
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Non autorisé — token requis' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      logger.warn('Invalid auth token for merchant creation');
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    if (user.id !== user_id) {
      logger.warn(`User ${user.id} tried to create merchant for different user ${user_id}`);
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 403 }
      );
    }

    // Guard: si un merchant existe déjà pour ce user_id, le retourner sans recréer
    const { data: existingMerchant } = await supabaseAdmin
      .from('merchants')
      .select()
      .eq('user_id', user_id)
      .single();

    if (existingMerchant) {
      logger.info(`Merchant already exists for user ${user_id}, returning existing`);
      return NextResponse.json({ merchant: existingMerchant });
    }

    // Générer un slug unique (dédupliqué si déjà pris)
    let slug = generateSlug(trimmedShopName);
    const { data: existingSlug } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingSlug) {
      const suffix = Math.random().toString(36).substring(2, 6);
      slug = `${slug}-${suffix}`;
    }

    // Générer un code de scan unique
    let scan_code = generateScanCode();
    let attempts = 0;
    const maxAttempts = 5;

    // Vérifier l'unicité du code (très rare mais possible)
    while (attempts < maxAttempts) {
      const { data: existing } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .eq('scan_code', scan_code)
        .single();

      if (!existing) break;
      scan_code = generateScanCode();
      attempts++;
    }

    // Générer un code de parrainage unique
    let referral_code = generateReferralCode();
    let referralAttempts = 0;

    while (referralAttempts < maxAttempts) {
      const { data: existingRef } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .eq('referral_code', referral_code)
        .single();

      if (!existingRef) break;
      referral_code = generateReferralCode();
      referralAttempts++;
    }

    // Stamps par défaut selon le type de commerce (récompense laissée null pour forcer la config)
    const defaultStamps: Record<string, number> = {
      coiffeur: 10, barbier: 10, institut_beaute: 10, onglerie: 10,
      spa: 8, estheticienne: 10, tatouage: 8, autre: 10,
    };

    // Affiliation merchant->merchant : si signup_source est `affiliate_<slug>`
    // et que <slug> matche un merchant existant, on stocke le parrain.
    let referred_by_merchant_id: string | null = null;
    let parentShopName: string | null = null;
    if (typeof signup_source === 'string' && signup_source.startsWith('affiliate_')) {
      const refSlug = signup_source.slice('affiliate_'.length);
      if (/^[a-z0-9-]+$/.test(refSlug)) {
        const { data: refMerchant } = await supabaseAdmin
          .from('merchants')
          .select('id, shop_name, user_id')
          .eq('slug', refSlug)
          .maybeSingle();
        if (refMerchant && refMerchant.user_id !== user_id) {
          referred_by_merchant_id = refMerchant.id;
          parentShopName = refMerchant.shop_name;
        }
      }
    }

    const { data, error } = await supabaseAdmin
      .from('merchants')
      .insert({
        user_id,
        slug,
        scan_code,
        referral_code,
        shop_name: trimmedShopName,
        shop_type,
        shop_address: trimmedAddress,
        phone: formattedPhone,
        country: merchantCountry,
        stamps_required: defaultStamps[shop_type] || 10,
        // Symbiose résa → fidélité activée par défaut pour les nouveaux merchants (mig 180).
        // Ne crédite que les résas EN LIGNE honorées (garde booked_online dans booking-loyalty.ts),
        // donc sans effet tant que la résa en ligne n'est pas activée. Les merchants existants
        // gardent leur valeur (défaut colonne FALSE) et restent en opt-in.
        booking_earns_loyalty: true,
        ...(signup_source && { signup_source: String(signup_source).slice(0, 100) }),
        ...(referred_by_merchant_id && { referred_by_merchant_id }),
        ...(locale === 'en' && { locale: 'en' }),
      })
      .select()
      .single();

    if (error) {
      // Race condition: UNIQUE violation = un autre appel a créé le merchant entre-temps
      if (error.code === PG_UNIQUE_VIOLATION) {
        const { data: raceExisting } = await supabaseAdmin
          .from('merchants')
          .select()
          .eq('user_id', user_id)
          .single();

        if (raceExisting) {
          logger.info(`Merchant created by race condition for user ${user_id}, returning existing`);
          return NextResponse.json({ merchant: raceExisting });
        }
      }

      logger.error('Merchant creation error', error);
      return NextResponse.json(
        { error: 'Erreur serveur' },
        { status: 500 }
      );
    }

    // Récupérer l'email de l'utilisateur et envoyer les emails
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user_id);

    if (userData?.user?.email) {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Cancel scheduled incomplete signup emails if they exist
      const scheduledEmailId = userData.user.user_metadata?.scheduled_incomplete_email_id;
      const scheduledEmailId2 = userData.user.user_metadata?.scheduled_incomplete_email_id_2;

      const cancelPromises = [scheduledEmailId, scheduledEmailId2].filter(Boolean).map(id =>
        cancelScheduledEmail(id!).catch((err) => {
          logger.error('Failed to cancel scheduled incomplete email', err);
        })
      );
      if (cancelPromises.length > 0) {
        await Promise.all(cancelPromises);
        await delay(600);
      }

      if (scheduledEmailId || scheduledEmailId2) {
        await supabaseAdmin.auth.admin.updateUserById(user_id, {
          user_metadata: {
            ...userData.user.user_metadata,
            scheduled_incomplete_email_id: null,
            scheduled_incomplete_email_id_2: null,
          },
        }).catch((err) => {
          logger.error('Failed to clear scheduled email metadata', err);
        });
      }

      // Welcome email en priorité (Resend API call #2)
      // Si parraine par un autre merchant : email affiliation (code promo)
      // AU LIEU du welcome standard. parentShopName resolu en amont du
      // slug lookup, pas de requete supplementaire.
      const emailLocale = locale === 'en' ? 'en' : 'fr';
      if (referred_by_merchant_id) {
        await sendAffiliationWelcomeEmail(
          userData.user.email,
          trimmedShopName,
          parentShopName,
          emailLocale,
        ).catch((err) => {
          logger.error('Failed to send affiliation welcome email', err);
        });
      } else {
        await sendWelcomeEmail(userData.user.email, trimmedShopName, slug, emailLocale).catch((err) => {
          logger.error('Failed to send welcome email', err);
        });
      }

      // Track welcome email in pending_email_tracking for admin visibility
      await supabaseAdmin.from('pending_email_tracking').insert({
        merchant_id: data.id,
        reminder_day: -200,
        pending_count: 0,
      });

      // Resend rate limit: attendre avant le prochain appel
      await delay(600);

      // Notification interne (Resend API call #3)
      await sendNewMerchantNotification(
        trimmedShopName,
        shop_type,
        trimmedAddress,
        phone,
        userData.user.email
      ).catch((err) => {
        logger.error('Failed to send new merchant notification', err);
      });
    }

    return NextResponse.json({ merchant: data });
  } catch (error) {
    logger.error('API error', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
