import { NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';

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

    // Check if QR was downloaded (reminder_day = -105)
    const { data: qrDownloaded } = await supabaseAdmin
      .from('pending_email_tracking')
      .select('id')
      .eq('merchant_id', merchant.id)
      .eq('reminder_day', -105)
      .maybeSingle();

    return NextResponse.json({ qrDownloaded: !!qrDownloaded });
  } catch (error) {
    console.error('Onboarding status error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Mark QR as downloaded
export async function POST() {
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

    // Upsert to avoid duplicates
    await supabaseAdmin.from('pending_email_tracking').upsert(
      { merchant_id: merchant.id, reminder_day: -105, pending_count: 0 },
      { onConflict: 'merchant_id,reminder_day' }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Onboarding mark QR error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
