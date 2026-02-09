import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { sendSocialKitEmail } from '@/lib/email';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-send-social-kit:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  try {
    const { merchantId } = await request.json();

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    // Fetch merchant data
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id, user_id, shop_name, reward_description, stamps_required, primary_color, logo_url, tier2_enabled, tier2_stamps_required, tier2_reward_description')
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

    const result = await sendSocialKitEmail(
      userEmail,
      merchant.shop_name,
      merchant.reward_description,
      merchant.stamps_required,
      merchant.primary_color,
      merchant.logo_url,
      undefined,
      merchant.tier2_enabled,
      merchant.tier2_stamps_required,
      merchant.tier2_reward_description
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Erreur envoi email' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, email: userEmail });
  } catch (error) {
    console.error('Admin send social kit error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
