import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

const ALLOWED_SMS_TOGGLES = [
  'reminder_j1_enabled',
  'reminder_j0_enabled',
  'post_visit_review_enabled',
  'review_sms_include_link',
  'referral_reward_sms_enabled',
  'voucher_expiry_sms_enabled',
  'referral_invite_sms_enabled',
  'inactive_sms_enabled',
  'near_reward_sms_enabled',
] as const;

type SmsToggle = typeof ALLOWED_SMS_TOGGLES[number];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    if (!merchantId) return NextResponse.json({ error: 'merchantId required' }, { status: 400 });

    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id, reminder_j1_enabled, reminder_j0_enabled, post_visit_review_enabled, review_sms_include_link, review_link, referral_reward_sms_enabled, voucher_expiry_sms_enabled, referral_invite_sms_enabled, inactive_sms_enabled, near_reward_sms_enabled, referral_program_enabled, referral_reward_referrer, referral_reward_referred, planning_enabled, reward_description, tier2_enabled, tier2_reward_description')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    return NextResponse.json({ settings: merchant });
  } catch (error) {
    logger.error('SMS automations GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, ...updates } = body;
    if (!merchantId) return NextResponse.json({ error: 'merchantId required' }, { status: 400 });

    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();
    if (!merchant) return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });

    const safeUpdates: Record<string, boolean> = {};
    for (const key of Object.keys(updates)) {
      if ((ALLOWED_SMS_TOGGLES as readonly string[]).includes(key) && typeof updates[key] === 'boolean') {
        safeUpdates[key as SmsToggle] = updates[key];
      }
    }

    if (Object.keys(safeUpdates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ valide' }, { status: 400 });
    }

    await supabaseAdmin.from('merchants').update(safeUpdates).eq('id', merchantId);

    const { data: settings } = await supabaseAdmin
      .from('merchants')
      .select('id, reminder_j1_enabled, reminder_j0_enabled, post_visit_review_enabled, review_sms_include_link, review_link, referral_reward_sms_enabled, voucher_expiry_sms_enabled, referral_invite_sms_enabled, inactive_sms_enabled, near_reward_sms_enabled, referral_program_enabled, referral_reward_referrer, referral_reward_referred, planning_enabled, reward_description, tier2_enabled, tier2_reward_description')
      .eq('id', merchantId)
      .single();

    return NextResponse.json({ settings });
  } catch (error) {
    logger.error('SMS automations POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
