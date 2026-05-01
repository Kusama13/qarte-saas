import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { getAuthenticatedPhone } from '@/lib/customer-auth';
import { getAllPhoneFormats, validateEmail } from '@/lib/utils';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

// PUT: Customer sets / updates their email (modifiable any time)
// DELETE: Customer removes their email
export async function PUT(request: NextRequest) {
  try {
    const phone_number = getAuthenticatedPhone(request);
    if (!phone_number) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const body = await request.json();
    const { customer_id, email } = body;

    if (!customer_id || !email) {
      return NextResponse.json({ error: 'Données manquantes' }, { status: 400 });
    }

    const trimmed = String(email).trim().toLowerCase();
    if (!validateEmail(trimmed)) {
      return NextResponse.json({ error: 'Email invalide' }, { status: 400 });
    }

    // Security: verify phone matches customer (any of its formats)
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .in('phone_number', getAllPhoneFormats(phone_number))
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ error: 'Vérification échouée' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('customers')
      .update({ email: trimmed })
      .eq('id', customer_id);

    if (error) {
      logger.error('Email update error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ success: true, email: trimmed });
  } catch (error) {
    logger.error('Email PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const phone_number = getAuthenticatedPhone(request);
    if (!phone_number) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customer_id = searchParams.get('customer_id');
    if (!customer_id) {
      return NextResponse.json({ error: 'customer_id manquant' }, { status: 400 });
    }

    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id')
      .eq('id', customer_id)
      .in('phone_number', getAllPhoneFormats(phone_number))
      .maybeSingle();

    if (!customer) {
      return NextResponse.json({ error: 'Vérification échouée' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('customers')
      .update({ email: null })
      .eq('id', customer_id);

    if (error) {
      logger.error('Email delete error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Email DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
