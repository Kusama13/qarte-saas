import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export interface AutomationSettings {
  welcome_enabled: boolean;
  close_to_reward_enabled: boolean;
  reward_ready_enabled: boolean;
  inactive_reminder_enabled: boolean;
  reward_reminder_enabled: boolean;
  welcome_sent: number;
  close_to_reward_sent: number;
  reward_ready_sent: number;
  inactive_reminder_sent: number;
  reward_reminder_sent: number;
}

// GET - Get automation settings for a merchant
export async function GET(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    // Get or create settings
    let { data: settings, error } = await supabase
      .from('push_automations')
      .select('*')
      .eq('merchant_id', merchantId)
      .single();

    if (error && error.code === 'PGRST116') {
      // No settings found, create default
      const { data: newSettings, error: insertError } = await supabase
        .from('push_automations')
        .insert({ merchant_id: merchantId })
        .select()
        .single();

      if (insertError) {
        console.error('Error creating automation settings:', insertError);
        return NextResponse.json({ error: 'Erreur création paramètres' }, { status: 500 });
      }
      settings = newSettings;
    } else if (error) {
      console.error('Error fetching automation settings:', error);
      return NextResponse.json({ error: 'Erreur récupération paramètres' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Automation settings error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST - Update automation settings
export async function POST(request: NextRequest) {
  const supabase = getSupabase();

  try {
    const body = await request.json();
    const { merchantId, ...updates } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    // Only allow updating specific fields
    const allowedFields = [
      'welcome_enabled',
      'close_to_reward_enabled',
      'reward_ready_enabled',
      'inactive_reminder_enabled',
      'reward_reminder_enabled',
    ];

    const sanitizedUpdates: Record<string, boolean> = {};
    for (const field of allowedFields) {
      if (typeof updates[field] === 'boolean') {
        sanitizedUpdates[field] = updates[field];
      }
    }

    if (Object.keys(sanitizedUpdates).length === 0) {
      return NextResponse.json({ error: 'Aucune modification valide' }, { status: 400 });
    }

    // Upsert settings
    const { data: settings, error } = await supabase
      .from('push_automations')
      .upsert(
        { merchant_id: merchantId, ...sanitizedUpdates, updated_at: new Date().toISOString() },
        { onConflict: 'merchant_id' }
      )
      .select()
      .single();

    if (error) {
      console.error('Error updating automation settings:', error);
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ settings });
  } catch (error) {
    console.error('Automation update error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
