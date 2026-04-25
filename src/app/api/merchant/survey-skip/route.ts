import { NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { MAX_SURVEY_SKIPS_BEFORE_AUTO_SEEN } from '@/lib/churn-survey-config';
import logger from '@/lib/logger';

export async function POST() {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { data, error } = await supabase.rpc('increment_churn_survey_skip', {
      p_user_id: user.id,
      p_max: MAX_SURVEY_SKIPS_BEFORE_AUTO_SEEN,
    });

    if (error) {
      logger.error('survey-skip rpc failed', { userId: user.id, error });
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] : null;
    if (!row) return NextResponse.json({ ok: true, already_seen: true });

    return NextResponse.json({ ok: true, skip_count: row.skip_count, auto_seen: row.auto_seen });
  } catch (err) {
    logger.error('survey-skip route error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
