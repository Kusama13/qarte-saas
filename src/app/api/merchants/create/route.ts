import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { sendWelcomeEmail, sendNewMerchantNotification, cancelScheduledEmail } from '@/lib/email';
import { generateScanCode, generateReferralCode, formatPhoneNumber } from '@/lib/utils';
import type { MerchantCountry } from '@/types';

// Client avec service role (bypass RLS)
const supabaseAdmin = getSupabaseAdmin();

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 3 créations par heure par IP
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`merchant-create:${ip}`, RATE_LIMITS.signup);

    if (!rateLimit.success) {
      logger.warn(`Rate limit exceeded for merchant creation: ${ip}`);
      return rateLimitResponse(rateLimit.resetTime);
    }

    const body = await request.json();
    const { user_id, slug, shop_name, shop_type, shop_address, phone, country } = body;
    const merchantCountry: MerchantCountry = country || 'FR';
    const formattedPhone = formatPhoneNumber(phone, merchantCountry);

    if (!user_id || !shop_name || !shop_type || !phone || !shop_address) {
      return NextResponse.json(
        { error: 'Champs requis manquants' },
        { status: 400 }
      );
    }

    // Vérifier l'authentification ou que l'utilisateur existe
    const authHeader = request.headers.get('authorization');

    if (authHeader?.startsWith('Bearer ')) {
      // Si un token est fourni, vérifier qu'il correspond au user_id
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
    } else {
      // Pas de token (email non confirmé) - vérifier que l'utilisateur existe et n'a pas de merchant
      const { data: existingUser } = await supabaseAdmin.auth.admin.getUserById(user_id);

      if (!existingUser?.user) {
        logger.warn(`User ${user_id} not found for merchant creation`);
        return NextResponse.json(
          { error: 'Utilisateur non trouvé' },
          { status: 404 }
        );
      }

      // Vérifier qu'il n'y a pas déjà un merchant pour cet utilisateur
      const { data: existingMerchant } = await supabaseAdmin
        .from('merchants')
        .select('id')
        .eq('user_id', user_id)
        .single();

      if (existingMerchant) {
        logger.warn(`Merchant already exists for user ${user_id}`);
        return NextResponse.json(
          { error: 'Un compte commerçant existe déjà' },
          { status: 409 }
        );
      }
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
      spa: 8, estheticienne: 10, massage: 8, epilation: 8, autre: 10,
    };

    const { data, error } = await supabaseAdmin
      .from('merchants')
      .insert({
        user_id,
        slug,
        scan_code,
        referral_code,
        shop_name,
        shop_type,
        shop_address,
        phone: formattedPhone,
        country: merchantCountry,
        stamps_required: defaultStamps[shop_type] || 10,
      })
      .select()
      .single();

    if (error) {
      logger.error('Merchant creation error', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    // Récupérer l'email de l'utilisateur et envoyer les emails
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(user_id);

    if (userData?.user?.email) {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Cancel scheduled incomplete signup emails (both) if they exist
      const scheduledEmailId = userData.user.user_metadata?.scheduled_incomplete_email_id;
      const scheduledEmailId2 = userData.user.user_metadata?.scheduled_incomplete_email_id_2;

      if (scheduledEmailId) {
        await cancelScheduledEmail(scheduledEmailId).catch((err) => {
          logger.error('Failed to cancel scheduled incomplete email 1', err);
        });
        await delay(600);
      }

      if (scheduledEmailId2) {
        await cancelScheduledEmail(scheduledEmailId2).catch((err) => {
          logger.error('Failed to cancel scheduled incomplete email 2', err);
        });
        await delay(600);
      }

      if (scheduledEmailId || scheduledEmailId2) {
        // Clear both metadata entries
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
      await sendWelcomeEmail(userData.user.email, shop_name).catch((err) => {
        logger.error('Failed to send welcome email', err);
      });

      // Resend rate limit: attendre avant le prochain appel
      await delay(600);

      // Notification interne (Resend API call #3)
      await sendNewMerchantNotification(
        shop_name,
        shop_type,
        shop_address,
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
