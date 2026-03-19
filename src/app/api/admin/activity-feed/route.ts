import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-activity-feed');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
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
      { data: usedVouchers },
      { data: welcomeClaims },
      { data: bookings },
      { data: superAdmins },
    ] = await Promise.all([
      (() => {
        let q = supabaseAdmin
          .from('visits')
          .select('merchant_id, visited_at, points_earned')
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
          .select('merchant_id, redeemed_at, tier')
          .gte('redeemed_at', periodStart);
        if (periodEnd) q = q.lt('redeemed_at', periodEnd);
        return q.order('redeemed_at', { ascending: false }).limit(500);
      })(),
      (() => {
        let q = supabaseAdmin
          .from('loyalty_cards')
          .select('merchant_id, created_at')
          .gte('created_at', periodStart);
        if (periodEnd) q = q.lt('created_at', periodEnd);
        return q.order('created_at', { ascending: false }).limit(1000);
      })(),
      (() => {
        let q = supabaseAdmin
          .from('contact_messages')
          .select('name, subject, created_at')
          .gte('created_at', periodStart);
        if (periodEnd) q = q.lt('created_at', periodEnd);
        return q.order('created_at', { ascending: false }).limit(100);
      })(),
      (() => {
        let q = supabaseAdmin
          .from('vouchers')
          .select('merchant_id, source, reward_description, used_at')
          .eq('is_used', true)
          .gte('used_at', periodStart);
        if (periodEnd) q = q.lt('used_at', periodEnd);
        return q.order('used_at', { ascending: false }).limit(200);
      })(),
      (() => {
        let q = supabaseAdmin
          .from('vouchers')
          .select('merchant_id, reward_description, created_at')
          .eq('source', 'welcome')
          .gte('created_at', periodStart);
        if (periodEnd) q = q.lt('created_at', periodEnd);
        return q.order('created_at', { ascending: false }).limit(100);
      })(),
      (() => {
        let q = supabaseAdmin
          .from('merchant_planning_slots')
          .select('merchant_id, client_name, slot_date, start_time, created_at')
          .not('client_name', 'is', null)
          .gte('created_at', periodStart);
        if (periodEnd) q = q.lt('created_at', periodEnd);
        return q.order('created_at', { ascending: false }).limit(200);
      })(),
      supabaseAdmin
        .from('super_admins')
        .select('user_id'),
    ]);

    // Collect all referenced merchant IDs, then fetch only those
    const merchantIdSet = new Set<string>();
    for (const v of visits || []) merchantIdSet.add(v.merchant_id);
    for (const m of merchants || []) merchantIdSet.add(m.id);
    for (const r of redemptions || []) merchantIdSet.add(r.merchant_id);
    for (const c of newCards || []) merchantIdSet.add(c.merchant_id);
    for (const v of usedVouchers || []) merchantIdSet.add(v.merchant_id);
    for (const b of bookings || []) merchantIdSet.add(b.merchant_id);
    for (const w of welcomeClaims || []) merchantIdSet.add(w.merchant_id);
    const merchantIds = [...merchantIdSet];

    const { data: allMerchants } = merchantIds.length > 0
      ? await supabaseAdmin.from('merchants').select('id, shop_name, user_id').in('id', merchantIds)
      : { data: [] as { id: string; shop_name: string; user_id: string }[] };

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
      type: 'scan' | 'signup' | 'redemption' | 'new_customer' | 'contact' | 'voucher' | 'booking' | 'welcome';
      timestamp: string;
      title: string;
      subtitle: string;
      merchant_id?: string;
    }

    const events: ActivityEvent[] = [];

    (visits || []).forEach((v: { visited_at: string; merchant_id: string; points_earned: number }) => {
      events.push({
        type: 'scan',
        timestamp: v.visited_at,
        title: `Scan chez ${merchantNameMap.get(v.merchant_id) || 'Inconnu'}`,
        subtitle: `+${v.points_earned} point${v.points_earned > 1 ? 's' : ''}`,
        merchant_id: v.merchant_id,
      });
    });

    filteredSignups.forEach((m: { id: string; created_at: string; shop_name: string }) => {
      events.push({
        type: 'signup',
        timestamp: m.created_at,
        title: `Nouveau commerçant : ${m.shop_name}`,
        subtitle: 'Inscription complétée',
        merchant_id: m.id,
      });
    });

    (redemptions || []).forEach((r: { redeemed_at: string; merchant_id: string; tier: number }) => {
      events.push({
        type: 'redemption',
        timestamp: r.redeemed_at,
        title: `Récompense utilisée chez ${merchantNameMap.get(r.merchant_id) || 'Inconnu'}`,
        subtitle: `Palier ${r.tier}`,
        merchant_id: r.merchant_id,
      });
    });

    (newCards || []).forEach((c: { created_at: string; merchant_id: string }) => {
      events.push({
        type: 'new_customer',
        timestamp: c.created_at,
        title: `Nouveau client chez ${merchantNameMap.get(c.merchant_id) || 'Inconnu'}`,
        subtitle: 'Carte de fidélité créée',
        merchant_id: c.merchant_id,
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

    const SOURCE_LABELS: Record<string, string> = { birthday: 'Anniversaire', welcome: 'Bienvenue', offer: 'Offre promo', referral: 'Parrainage', redemption: 'Récompense' };
    (usedVouchers || []).forEach((v: { used_at: string; merchant_id: string; source: string; reward_description: string | null }) => {
      const sourceLabel = SOURCE_LABELS[v.source] || v.source;
      events.push({
        type: 'voucher',
        timestamp: v.used_at,
        title: `${sourceLabel} utilisé chez ${merchantNameMap.get(v.merchant_id) || 'Inconnu'}`,
        subtitle: v.reward_description || sourceLabel,
        merchant_id: v.merchant_id,
      });
    });

    (bookings || []).forEach((b: { created_at: string; merchant_id: string; client_name: string; slot_date: string; start_time: string }) => {
      events.push({
        type: 'booking',
        timestamp: b.created_at,
        title: `Réservation chez ${merchantNameMap.get(b.merchant_id) || 'Inconnu'}`,
        subtitle: `${b.client_name} — ${b.slot_date} à ${b.start_time}`,
        merchant_id: b.merchant_id,
      });
    });

    (welcomeClaims || []).forEach((w: { created_at: string; merchant_id: string; reward_description: string | null }) => {
      events.push({
        type: 'welcome',
        timestamp: w.created_at,
        title: `Offre bienvenue chez ${merchantNameMap.get(w.merchant_id) || 'Inconnu'}`,
        subtitle: w.reward_description || 'Offre de bienvenue',
        merchant_id: w.merchant_id,
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
      vouchers: (usedVouchers || []).length,
      bookings: (bookings || []).length,
      welcome: (welcomeClaims || []).length,
    };

    return NextResponse.json({ events, summary });
  } catch (error) {
    logger.error('Activity feed API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
