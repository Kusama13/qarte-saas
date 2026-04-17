import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authorizeAdmin } from '@/lib/api-helpers';
import { sendMerchantPush } from '@/lib/merchant-push';
import logger from '@/lib/logger';

const BodySchema = z.object({
  note: z.string().min(3).max(500),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeAdmin(request, 'admin-sms-campaigns');
  if (auth.response) return auth.response;
  const { supabaseAdmin, userId } = auth;

  try {
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Motif requis (3+ caractères)' }, { status: 400 });
    }

    const { data: existing } = await supabaseAdmin!
      .from('sms_campaigns')
      .select('id, status, merchant_id')
      .eq('id', id)
      .single();

    if (!existing) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    if (existing.status !== 'pending_review') {
      return NextResponse.json({ error: `Campagne déjà ${existing.status}` }, { status: 409 });
    }

    const { error } = await supabaseAdmin!
      .from('sms_campaigns')
      .update({
        status: 'rejected',
        review_note: parsed.data.note,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      logger.error('Reject campaign error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    void sendMerchantPush({
      supabase: supabaseAdmin!,
      merchantId: existing.merchant_id,
      notificationType: 'sms_campaign_rejected',
      referenceId: id,
      title: 'Campagne SMS refusée',
      body: `Motif : ${parsed.data.note.slice(0, 120)}`,
      url: '/dashboard/marketing?tab=sms',
      tag: `qarte-sms-campaign-${id}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id, status: 'rejected' });
  } catch (error) {
    logger.error('Reject campaign exception:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
