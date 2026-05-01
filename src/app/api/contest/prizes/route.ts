import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const upsertSchema = z.object({
  merchantId: z.string().uuid(),
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Format YYYY-MM requis'),
  prize: z.string().trim().min(1).max(300),
});

// Authent + ownership check du merchant. Retourne la response d'erreur ou null si OK.
async function authorizeMerchant(merchantId: string): Promise<NextResponse | null> {
  const supabaseAuth = await createRouteHandlerSupabaseClient();
  const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }
  const { data: merchant } = await getSupabaseAdmin()
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .single();
  if (!merchant) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }
  return null;
}

// GET — liste tous les lots planifiés (12 derniers / à venir).
export async function GET(request: NextRequest) {
  try {
    const merchantId = new URL(request.url).searchParams.get('merchantId');
    if (!merchantId) return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    const authError = await authorizeMerchant(merchantId);
    if (authError) return authError;

    const { data: prizes } = await getSupabaseAdmin()
      .from('merchant_contest_prizes')
      .select('contest_month, prize_description, updated_at')
      .eq('merchant_id', merchantId)
      .order('contest_month', { ascending: true });

    return NextResponse.json({ prizes: prizes || [] });
  } catch (error) {
    logger.error('Contest prizes GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PUT — upsert le lot pour un mois donné.
export async function PUT(request: NextRequest) {
  try {
    const parsed = upsertSchema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    const { merchantId, month, prize } = parsed.data;

    const authError = await authorizeMerchant(merchantId);
    if (authError) return authError;

    const { error } = await getSupabaseAdmin()
      .from('merchant_contest_prizes')
      .upsert({
        merchant_id: merchantId,
        contest_month: month,
        prize_description: prize,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'merchant_id,contest_month' });
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Contest prizes PUT error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — efface le lot d'un mois (revient au fallback merchants.contest_prize).
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const merchantId = String(body.merchantId || '');
    const month = String(body.month || '');
    if (!merchantId || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const authError = await authorizeMerchant(merchantId);
    if (authError) return authError;

    const { error } = await getSupabaseAdmin()
      .from('merchant_contest_prizes')
      .delete()
      .eq('merchant_id', merchantId)
      .eq('contest_month', month);
    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Contest prizes DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
