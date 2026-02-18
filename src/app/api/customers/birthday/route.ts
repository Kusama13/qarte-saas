import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedPhone } from '@/lib/customer-auth';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

// PUT: Customer sets their birthday (one-time only)
export async function PUT(request: NextRequest) {
  try {
    const phone_number = getAuthenticatedPhone(request);
    if (!phone_number) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { customer_id, birth_month, birth_day } = body;

    if (!customer_id || !birth_month || !birth_day) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    // Validate ranges
    const month = parseInt(birth_month);
    const day = parseInt(birth_day);
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
    }

    // Security: verify phone matches customer
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, birth_month')
      .eq('id', customer_id)
      .eq('phone_number', phone_number)
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ error: 'Vérification échouée' }, { status: 403 });
    }

    // One-time only: check if already set
    if (customer.birth_month != null) {
      return NextResponse.json({ error: 'Anniversaire déjà enregistré' }, { status: 409 });
    }

    // Update
    const { error } = await supabaseAdmin
      .from('customers')
      .update({ birth_month: month, birth_day: day })
      .eq('id', customer_id);

    if (error) {
      logger.error('Birthday save error:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Customer birthday error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
