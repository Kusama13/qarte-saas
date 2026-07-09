import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { sendQRCodeEmail } from '@/lib/email';
import { TRACKING_CODES } from '@/lib/email-tracking-codes';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-send-social-kit');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const { merchantId, force } = await request.json();

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    // Dédup : ne pas re-servir un merchant déjà tamponné (le kit QR n'a de sens qu'une fois).
    // `force: true` pour un renvoi explicite. Empêche un appel en boucle de re-blaster tout le parc.
    if (!force) {
      const { data: already } = await supabaseAdmin
        .from('pending_email_tracking')
        .select('merchant_id')
        .eq('merchant_id', merchantId)
        .eq('reminder_day', TRACKING_CODES.QR_CODE_SENT)
        .maybeSingle();
      if (already) {
        return NextResponse.json({ skipped: 'already_sent' });
      }
    }

    // Fetch merchant data
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, user_id, shop_name, reward_description, stamps_required, primary_color, logo_url, tier2_enabled, tier2_stamps_required, tier2_reward_description, loyalty_mode')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
    }

    if (!merchant.reward_description || !merchant.logo_url) {
      return NextResponse.json(
        { error: 'Programme non configuré ou logo manquant' },
        { status: 400 }
      );
    }

    // Get user email
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(merchant.user_id);
    const userEmail = userData?.user?.email;

    if (!userEmail) {
      return NextResponse.json({ error: 'Email utilisateur introuvable' }, { status: 400 });
    }

    const result = await sendQRCodeEmail(
      userEmail,
      merchant.shop_name,
      merchant.reward_description,
      merchant.stamps_required,
      merchant.primary_color,
      merchant.logo_url,
      merchant.tier2_enabled,
      merchant.tier2_stamps_required,
      merchant.tier2_reward_description,
      merchant.loyalty_mode || undefined
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur envoi email' },
        { status: 500 }
      );
    }

    // Trace l'envoi (dédup partagé avec le cron onboarding). ignoreDuplicates : garde le 1er sent_at.
    await supabaseAdmin
      .from('pending_email_tracking')
      .upsert(
        { merchant_id: merchantId, reminder_day: TRACKING_CODES.QR_CODE_SENT, pending_count: 0 },
        { onConflict: 'merchant_id,reminder_day', ignoreDuplicates: true }
      );

    return NextResponse.json({ success: true, email: userEmail });
  } catch (error) {
    logger.error('Admin send social kit error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
