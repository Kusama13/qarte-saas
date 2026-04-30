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

    return NextResponse.json({
      gift_cards: giftCards || [],
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
