import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { z } from 'zod';
import logger from '@/lib/logger';

const rejectSchema = z.object({
  notes: z.string().max(500).optional(),
}).strict();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdmin(request, 'admin-affiliation');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const { id } = await params;

  try {
    const body = await request.json().catch(() => ({}));
    const parsed = rejectSchema.safeParse(body);

    // Fetch application
    const { data: app, error: fetchErr } = await supabaseAdmin
      .from('ambassador_applications')
      .select('id, status')
      .eq('id', id)
      .single();

    if (fetchErr || !app) {
      return NextResponse.json({ error: 'Application non trouvée' }, { status: 404 });
    }

    if (app.status !== 'pending') {
      return NextResponse.json({ error: 'Cette candidature n\'est pas en attente' }, { status: 400 });
    }

    const { error: updateErr } = await supabaseAdmin
      .from('ambassador_applications')
      .update({
        status: 'rejected',
        reviewed_at: new Date().toISOString(),
        ...(parsed.success && parsed.data.notes ? { notes: parsed.data.notes } : {}),
      })
      .eq('id', id);

    if (updateErr) {
      logger.error('Ambassador reject update error:', updateErr);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    logger.error('Ambassador reject error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
