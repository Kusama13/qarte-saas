import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

// PUT: Merchant updates customer birthday
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { customer_id, birth_month, birth_day } = body;

    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id requis' }, { status: 400 });
    }

    // Validate ranges if provided
    if (birth_month != null && birth_day != null) {
      const month = parseInt(birth_month);
      const day = parseInt(birth_day);
      if (month < 1 || month > 12 || day < 1 || day > 31) {
        return NextResponse.json({ error: 'Date invalide' }, { status: 400 });
      }
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

    // Update (can be null to clear)
    const { error } = await supabaseAdmin
      .from('customers')
      .update({
        birth_month: birth_month != null ? parseInt(birth_month) : null,
        birth_day: birth_day != null ? parseInt(birth_day) : null,
      })
      .eq('id', customer_id);

    if (error) {
      console.error('Birthday admin save error:', error);
      return NextResponse.json({ error: 'Erreur lors de la sauvegarde' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Birthday admin error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
