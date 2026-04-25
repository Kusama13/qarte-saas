import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

const MAX_SKIPS_BEFORE_AUTO_SEEN = 3;

export async function POST() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data: m } = await supabase
      .from('merchants')
      .select('churn_survey_skip_count, churn_survey_seen_at')
      .eq('user_id', user.id)
      .single();

    if (!m) return NextResponse.json({ error: 'Merchant introuvable' }, { status: 404 });
    if (m.churn_survey_seen_at) return NextResponse.json({ ok: true, already_seen: true });

    const next = (m.churn_survey_skip_count ?? 0) + 1;
    const autoSeen = next >= MAX_SKIPS_BEFORE_AUTO_SEEN;

    const update: Record<string, unknown> = { churn_survey_skip_count: next };
    if (autoSeen) update.churn_survey_seen_at = new Date().toISOString();

    const { error } = await supabase
      .from('merchants')
      .update(update)
      .eq('user_id', user.id);

    if (error) {
      logger.error('survey-skip save failed', { userId: user.id, error });
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, skip_count: next, auto_seen: autoSeen });
  } catch (err) {
    logger.error('survey-skip route error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
