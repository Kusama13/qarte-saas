import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

const ALLOWED_TOGGLES = ['inactive_reminder_enabled', 'reward_reminder_enabled', 'events_enabled'] as const;
const ALLOWED_TEXT_FIELDS = ['events_offer_text', 'inactive_reminder_offer_text'] as const;

// GET: Fetch automation settings for a merchant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    }

    // Auth: verify merchant ownership
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Check if user is super_admin
    const { data: superAdmin } = await supabaseAdmin
      .from('super_admins')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    const isAdmin = !!superAdmin;

    // Upsert: get or create settings
    let { data: settings } = await supabaseAdmin
      .from('push_automations')
      .select('*')
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (!settings) {
      const { data: newSettings } = await supabaseAdmin
        .from('push_automations')
        .insert({ merchant_id: merchantId })
        .select()
        .single();
      settings = newSettings;
    }

    return NextResponse.json({ settings, isAdmin });
  } catch (error) {
    console.error('Push automations GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Update automation settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, ...updates } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    }

    // Auth: verify merchant ownership
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Build safe update object
    const safeUpdates: Record<string, unknown> = { updated_at: new Date().toISOString() };

    for (const key of Object.keys(updates)) {
      if ((ALLOWED_TOGGLES as readonly string[]).includes(key) && typeof updates[key] === 'boolean') {
        safeUpdates[key] = updates[key];
      }
      if ((ALLOWED_TEXT_FIELDS as readonly string[]).includes(key) && typeof updates[key] === 'string') {
        safeUpdates[key] = updates[key].trim() || null;
      }
    }

    // Upsert then update
    const { data: existing } = await supabaseAdmin
      .from('push_automations')
      .select('id')
      .eq('merchant_id', merchantId)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin
        .from('push_automations')
        .insert({ merchant_id: merchantId, ...safeUpdates });
    } else {
      await supabaseAdmin
        .from('push_automations')
        .update(safeUpdates)
        .eq('merchant_id', merchantId);
    }

    // Return updated settings
    const { data: settings } = await supabaseAdmin
      .from('push_automations')
      .select('*')
      .eq('merchant_id', merchantId)
      .single();

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Push automations POST error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
