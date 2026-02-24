import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

// PUT: Merchant updates customer first_name / last_name
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { customer_id, first_name, last_name } = body;

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id requis' }, { status: 400 });
    }

    const trimmedFirst = (first_name || '').trim();
    const trimmedLast = (last_name || '').trim();

    if (!trimmedFirst || trimmedFirst.length > 50) {
      return NextResponse.json({ error: 'Prénom requis (50 caractères max)' }, { status: 400 });
    }

    if (trimmedLast.length > 50) {
      return NextResponse.json({ error: 'Nom trop long (50 caractères max)' }, { status: 400 });
    }

    // Verify merchant owns this customer
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .eq('merchant_id', merchant.id)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }

    const { error } = await supabaseAdmin
      .from('customers')
      .update({
        first_name: trimmedFirst,
        last_name: trimmedLast || null,
      })
      .eq('id', customer_id);

    if (error) {
      logger.error('Update name error:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Update name error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
