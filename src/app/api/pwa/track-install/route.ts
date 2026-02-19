import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

export async function POST() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    // Set pwa_installed_at only if not already set (idempotent)
    const { error: updateError } = await supabase
      .from('merchants')
      .update({ pwa_installed_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .is('pwa_installed_at', null);

    if (updateError) {
      logger.error('Error tracking PWA install:', updateError);
      return NextResponse.json({ error: 'Erreur mise à jour' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
