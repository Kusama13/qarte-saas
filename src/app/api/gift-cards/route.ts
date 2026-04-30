/**
 * GET /api/gift-cards?merchantId=…&status=pending_payment|active|used|cancelled
 *
 * Liste paginée des bons cadeaux du merchant. Auth merchant requise.
 * Si pas de status → renvoie pending_payment + active (vue par défaut dashboard).
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

const VALID_STATUSES = ['pending_payment', 'active', 'used', 'cancelled', 'expired'] as const;

export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    const statusParam = searchParams.get('status');
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Vérif ownership
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();
    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Filter status (si fourni, sinon retourne tout)
    let query = supabase
      .from('gift_cards')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (statusParam) {
      const statuses = statusParam.split(',').filter((s) => (VALID_STATUSES as readonly string[]).includes(s));
      if (statuses.length > 0) {
        query = query.in('status', statuses);
      }
    }

    const { data: giftCards, error } = await query;
    if (error) {
      logger.error('Gift cards list error:', error);
      return NextResponse.json({ error: 'Erreur lors du chargement' }, { status: 500 });
    }

    // Compteurs par status (utile pour les badges des onglets)
    const { data: counts } = await supabase
      .from('gift_cards')
      .select('status')
      .eq('merchant_id', merchantId);

    const statusCounts = (counts || []).reduce<Record<string, number>>((acc, row) => {
      const s = (row as { status: string }).status;
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    // Live lookup des services pour les bons kind=services :
    // si le merchant a renommé / supprimé un service, on prend le nom LIVE,
    // sinon fallback sur service_snapshot (résilience).
    const cardsList = (giftCards as Array<{ kind?: string; service_ids?: string[] | null; service_snapshot?: Array<{ id: string; name: string; price: number }> | null }>) || [];
    const allServiceIds = new Set<string>();
    for (const g of cardsList) {
      if (g.kind === 'services' && Array.isArray(g.service_ids)) {
        g.service_ids.forEach((id) => allServiceIds.add(id));
      }
    }

    const liveServicesById = new Map<string, { id: string; name: string; price: number }>();
    if (allServiceIds.size > 0) {
      const { data: liveSvc } = await supabase
        .from('merchant_services')
        .select('id, name, price')
        .eq('merchant_id', merchantId)
        .in('id', Array.from(allServiceIds));
      for (const s of (liveSvc as Array<{ id: string; name: string; price: number | string }>) || []) {
        liveServicesById.set(s.id, { id: s.id, name: s.name, price: Number(s.price || 0) });
      }
    }

    // Attache services_resolved (live + fallback snapshot) à chaque carte concernée
    const enriched = cardsList.map((g) => {
      if (g.kind !== 'services' || !Array.isArray(g.service_ids)) return g;
      const snapById = new Map((g.service_snapshot || []).map((s) => [s.id, s]));
      const resolved = g.service_ids.map((id) => liveServicesById.get(id) || snapById.get(id) || null);
      return { ...g, services_resolved: resolved.filter(Boolean) };
    });

    return NextResponse.json({
      gift_cards: enriched,
      counts: {
        pending_payment: statusCounts.pending_payment || 0,
        active: statusCounts.active || 0,
        used: statusCounts.used || 0,
        cancelled: statusCounts.cancelled || 0,
        expired: statusCounts.expired || 0,
      },
    });
  } catch (error) {
    logger.error('Gift cards list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
