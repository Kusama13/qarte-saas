import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { sendMerchantPush } from '@/lib/merchant-push';
import logger from '@/lib/logger';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await authorizeAdmin(request, 'admin-sms-campaigns');
  if (auth.response) return auth.response;
  const { supabaseAdmin, userId } = auth;

  try {
    const { data: existing } = await supabaseAdmin!
      .from('sms_campaigns')
      .select('id, status, merchant_id, scheduled_at')
      .eq('id', id)
      .single();

    if (!existing) return NextResponse.json({ error: 'Campagne introuvable' }, { status: 404 });
    if (existing.status !== 'pending_review') {
      return NextResponse.json({ error: `Campagne déjà ${existing.status}` }, { status: 409 });
    }

    const { error } = await supabaseAdmin!
      .from('sms_campaigns')
      .update({
        status: 'scheduled',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) {
      logger.error('Approve campaign error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    const scheduledDate = existing.scheduled_at
      ? new Date(existing.scheduled_at).toLocaleDateString('fr-FR', {
          day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
        })
      : null;

    void sendMerchantPush({
      supabase: supabaseAdmin!,
      merchantId: existing.merchant_id,
      notificationType: 'sms_campaign_approved',
      referenceId: id,
      title: 'Campagne SMS approuvée',
      body: scheduledDate ? `Envoi prévu le ${scheduledDate}.` : 'Envoi programmé.',
      url: '/dashboard/marketing?tab=sms',
      tag: `qarte-sms-campaign-${id}`,
    }).catch(() => {});

    return NextResponse.json({ ok: true, id, status: 'scheduled' });
  } catch (error) {
    logger.error('Approve campaign exception:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
