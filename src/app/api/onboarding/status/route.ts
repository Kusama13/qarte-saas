import { NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

// GET - Check onboarding step statuses
export async function GET() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
    }

    // Check onboarding flags via pending_email_tracking
    const { data: flags } = await supabaseAdmin
      .from('pending_email_tracking')
      .select('reminder_day')
      .eq('merchant_id', merchant.id)
      .in('reminder_day', [-105, -106, -108]);

    const flagDays = new Set((flags || []).map(f => f.reminder_day));

    return NextResponse.json({
      qrDownloaded: flagDays.has(-105),
      previewDone: flagDays.has(-106),
      socialKitDownloaded: flagDays.has(-108),
    });
  } catch (error) {
    logger.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Mark onboarding step as done
// Body: { step: 'qr' | 'preview' } — defaults to 'qr' for backward compat
export async function POST(request: Request) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Commerce introuvable' }, { status: 404 });
    }

    // Determine which step to mark
    let step = 'qr';
    try {
      const body = await request.json();
      if (body.step) step = body.step;
    } catch {
      // No body = default to qr (backward compat)
    }

    const reminderDay = step === 'preview' ? -106 : step === 'social_kit' ? -108 : -105;

    // Upsert to avoid duplicates
    await supabaseAdmin.from('pending_email_tracking').upsert(
      { merchant_id: merchant.id, reminder_day: reminderDay, pending_count: 0 },
      { onConflict: 'merchant_id,reminder_day' }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Onboarding mark step error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
