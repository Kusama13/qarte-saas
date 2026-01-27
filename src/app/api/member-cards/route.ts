import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const createMemberCardSchema = z.object({
  merchant_id: z.string().uuid(),
  customer_id: z.string().uuid(),
  benefit_label: z.string().min(1, 'L\'avantage est requis'),
  duration_months: z.number().int().min(1).max(12),
});

// GET: Liste des cartes membre d'un commerçant
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchant_id');

    if (!merchantId) {
      return NextResponse.json(
        { error: 'merchant_id requis' },
        { status: 400 }
      );
    }

    const { data: memberCards, error } = await supabaseAdmin
      .from('member_cards')
      .select(`
        *,
        customer:customers (*)
      `)
      .eq('merchant_id', merchantId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching member cards:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memberCards });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// POST: Créer une carte membre
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createMemberCardSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { merchant_id, customer_id, benefit_label, duration_months } = parsed.data;

    // Vérifier si le client a déjà une carte membre active pour ce commerçant
    const { data: existingCard } = await supabaseAdmin
      .from('member_cards')
      .select('id')
      .eq('merchant_id', merchant_id)
      .eq('customer_id', customer_id)
      .single();

    if (existingCard) {
      return NextResponse.json(
        { error: 'Ce client possède déjà une carte membre' },
        { status: 400 }
      );
    }

    // Calculer la date de fin
    const validFrom = new Date();
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + duration_months);

    const { data: memberCard, error } = await supabaseAdmin
      .from('member_cards')
      .insert({
        merchant_id,
        customer_id,
        benefit_label: benefit_label.trim(),
        valid_from: validFrom.toISOString(),
        valid_until: validUntil.toISOString(),
      })
      .select(`
        *,
        customer:customers (*)
      `)
      .single();

    if (error) {
      console.error('Error creating member card:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ memberCard });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
