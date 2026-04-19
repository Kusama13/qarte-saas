import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import logger from '@/lib/logger';

/**
 * Admin communications timeline unifiée (plan v2 §6).
 * Merge 3 sources : emails (pending_email_tracking) + SMS marketing merchant
 * (merchant_marketing_sms_logs) + push merchant (merchant_push_logs).
 *
 * Retourne timeline triée ts desc, limite 100 entrées (suffisant pour 10 jours trial).
 */

type ChannelType = 'email' | 'sms' | 'push';

interface TimelineEntry {
  ts: string;
  channel: ChannelType;
  type: string;
  status: 'sent' | 'failed' | 'skipped';
  summary: string;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: merchantId } = await params;
    const supabaseAdmin = getSupabaseAdmin();

    // TODO (Phase ultérieure) : vérifier super_admin auth
    // Pour l'instant on suppose que /admin/* est déjà gated par middleware

    const [emailsRes, smsRes, pushRes] = await Promise.all([
      supabaseAdmin
        .from('pending_email_tracking')
        .select('reminder_day, sent_at')
        .eq('merchant_id', merchantId)
        .order('sent_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('merchant_marketing_sms_logs')
        .select('sms_type, status, state_snapshot, tier_recommended, sent_at')
        .eq('merchant_id', merchantId)
        .order('sent_at', { ascending: false })
        .limit(100),
      supabaseAdmin
        .from('merchant_push_logs')
        .select('notification_type, sent_at')
        .eq('merchant_id', merchantId)
        .order('sent_at', { ascending: false })
        .limit(100),
    ]);

    const timeline: TimelineEntry[] = [];

    for (const row of emailsRes.data || []) {
      timeline.push({
        ts: row.sent_at,
        channel: 'email',
        type: `email_${row.reminder_day}`,
        status: 'sent',
        summary: `Email tracking code ${row.reminder_day}`,
      });
    }

    for (const row of smsRes.data || []) {
      const suffix = row.tier_recommended ? ` (reco ${row.tier_recommended})` : row.state_snapshot !== null ? ` (S${row.state_snapshot})` : '';
      timeline.push({
        ts: row.sent_at,
        channel: 'sms',
        type: row.sms_type,
        status: (row.status as 'sent' | 'failed' | 'skipped') || 'sent',
        summary: `SMS ${row.sms_type}${suffix}`,
      });
    }

    for (const row of pushRes.data || []) {
      timeline.push({
        ts: row.sent_at,
        channel: 'push',
        type: row.notification_type,
        status: 'sent',
        summary: `Push ${row.notification_type}`,
      });
    }

    timeline.sort((a, b) => b.ts.localeCompare(a.ts));

    return NextResponse.json({
      merchantId,
      count: timeline.length,
      timeline: timeline.slice(0, 100),
      sources: {
        emails: emailsRes.data?.length ?? 0,
        sms: smsRes.data?.length ?? 0,
        push: pushRes.data?.length ?? 0,
      },
    });
  } catch (error) {
    logger.error('admin_communications_error', { error: String(error) });
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
