import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-activity-feed:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Date parameter: "yesterday" or default to today
    const dateParam = request.nextUrl.searchParams.get('date');

    // Today in Paris timezone
    const now = new Date();
    const parisOffset = new Intl.DateTimeFormat('fr-FR', {
      timeZone: 'Europe/Paris',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now);
    // parisOffset = "DD/MM/YYYY" → parse to YYYY-MM-DD
    const [dd, mm, yyyy] = parisOffset.split('/');

    let periodStart: string;
    let periodEnd: string | null = null;

    if (dateParam === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yOffset = new Intl.DateTimeFormat('fr-FR', {
        timeZone: 'Europe/Paris',
        year: 'numeric', month: '2-digit', day: '2-digit',
      }).format(yesterday);
      const [yd, ym, yy] = yOffset.split('/');
      periodStart = `${yy}-${ym}-${yd}T00:00:00`;
      periodEnd = `${yyyy}-${mm}-${dd}T00:00:00`;
    } else {
      periodStart = `${yyyy}-${mm}-${dd}T00:00:00`;
    }

    // Fetch all data in parallel
    const [
      { data: visits },
      { data: merchants },
      { data: redemptions },
      { data: newCards },
      { data: contacts },
      { data: allMerchants },
      { data: superAdmins },
    ] = await Promise.all([
      (() => {
        let q = supabaseAdmin
          .from('visits')
          .select('id, merchant_id, customer_id, visited_at, points_earned')
          .gte('visited_at', periodStart);
        if (periodEnd) q = q.lt('visited_at', periodEnd);
        return q.order('visited_at', { ascending: false }).limit(200);
      })(),
      (() => {
        let q = supabaseAdmin
          .from('merchants')
          .select('id, shop_name, created_at, user_id')
          .gte('created_at', periodStart);
        if (periodEnd) q = q.lt('created_at', periodEnd);
        return q.order('created_at', { ascending: false });
      })(),
      (() => {
        let q = supabaseAdmin
          .from('redemptions')
          .select('id, merchant_id, customer_id, redeemed_at, tier')
          .gte('redeemed_at', periodStart);
        if (periodEnd) q = q.lt('redeemed_at', periodEnd);
        return q.order('redeemed_at', { ascending: false });
      })(),
      (() => {
        let q = supabaseAdmin
          .from('loyalty_cards')
          .select('id, merchant_id, customer_id, created_at')
          .gte('created_at', periodStart);
        if (periodEnd) q = q.lt('created_at', periodEnd);
        return q.order('created_at', { ascending: false });
      })(),
      (() => {
        let q = supabaseAdmin
          .from('contact_messages')
          .select('id, name, email, subject, created_at')
          .gte('created_at', periodStart);
        if (periodEnd) q = q.lt('created_at', periodEnd);
        return q.order('created_at', { ascending: false });
      })(),
      supabaseAdmin
        .from('merchants')
        .select('id, shop_name, user_id'),
      supabaseAdmin
        .from('super_admins')
        .select('user_id'),
    ]);

    // Build merchant name lookup
    const superAdminUserIds = new Set((superAdmins || []).map((sa: { user_id: string }) => sa.user_id));
    const merchantNameMap = new Map<string, string>();
    (allMerchants || []).forEach((m: { id: string; shop_name: string }) => {
      merchantNameMap.set(m.id, m.shop_name);
    });

    // Filter out super admin signups
    const filteredSignups = (merchants || []).filter(
      (m: { user_id: string }) => !superAdminUserIds.has(m.user_id)
    );

    // Build events timeline
    interface ActivityEvent {
      type: 'scan' | 'signup' | 'redemption' | 'new_customer' | 'contact';
      timestamp: string;
      title: string;
      subtitle: string;
    }

    const events: ActivityEvent[] = [];

    (visits || []).forEach((v: { visited_at: string; merchant_id: string; points_earned: number }) => {
      events.push({
        type: 'scan',
        timestamp: v.visited_at,
        title: `Scan chez ${merchantNameMap.get(v.merchant_id) || 'Inconnu'}`,
        subtitle: `+${v.points_earned} point${v.points_earned > 1 ? 's' : ''}`,
      });
    });

    filteredSignups.forEach((m: { created_at: string; shop_name: string }) => {
      events.push({
        type: 'signup',
        timestamp: m.created_at,
        title: `Nouveau commerçant : ${m.shop_name}`,
        subtitle: 'Inscription complétée',
      });
    });

    (redemptions || []).forEach((r: { redeemed_at: string; merchant_id: string; tier: number }) => {
      events.push({
        type: 'redemption',
        timestamp: r.redeemed_at,
        title: `Récompense utilisée chez ${merchantNameMap.get(r.merchant_id) || 'Inconnu'}`,
        subtitle: `Palier ${r.tier}`,
      });
    });

    (newCards || []).forEach((c: { created_at: string; merchant_id: string }) => {
      events.push({
        type: 'new_customer',
        timestamp: c.created_at,
        title: `Nouveau client chez ${merchantNameMap.get(c.merchant_id) || 'Inconnu'}`,
        subtitle: 'Carte de fidélité créée',
      });
    });

    (contacts || []).forEach((c: { created_at: string; name: string; subject: string }) => {
      events.push({
        type: 'contact',
        timestamp: c.created_at,
        title: `Message de ${c.name}`,
        subtitle: c.subject,
      });
    });

    // Sort by timestamp descending
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const summary = {
      scans: (visits || []).length,
      signups: filteredSignups.length,
      redemptions: (redemptions || []).length,
      newCustomers: (newCards || []).length,
      contacts: (contacts || []).length,
    };

    return NextResponse.json({ events, summary });
  } catch (error) {
    console.error('Activity feed API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
