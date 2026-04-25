import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const REASONS = ['too_expensive', 'not_using', 'missing_feature', 'switching', 'temporary', 'other'] as const;

const schema = z.object({
  reason: z.enum(REASONS),
});

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Raison invalide' }, { status: 400 });
    }

    const { error } = await supabase
      .from('merchants')
      .update({
        cancellation_reason: parsed.data.reason,
        cancellation_reason_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (error) {
      logger.error('cancellation-reason save failed', { userId: user.id, error });
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    logger.error('cancellation-reason route error', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
