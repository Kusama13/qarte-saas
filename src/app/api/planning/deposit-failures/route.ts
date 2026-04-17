import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

async function verifyOwnership(
  supabase: Awaited<ReturnType<typeof createRouteHandlerSupabaseClient>>,
  merchantId: string,
  userId: string,
) {
  const { data } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', userId)
    .single();
  return !!data;
}

// GET /api/planning/deposit-failures?merchantId=X — list merchant's archived failures.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    if (!merchantId) return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });

    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    if (!(await verifyOwnership(supabase, merchantId, user.id))) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('booking_deposit_failures')
      .select('*')
      .eq('merchant_id', merchantId)
      .order('expired_at', { ascending: false })
      .limit(100);

    if (error) {
      logger.error('Deposit failures GET error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ failures: data || [] });
  } catch (error) {
    logger.error('Deposit failures GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE /api/planning/deposit-failures — body: { id, merchantId }
const deleteSchema = z.object({
  id: z.string().uuid(),
  merchantId: z.string().uuid(),
});

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });

    const body = await request.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Données invalides' }, { status: 400 });

    const { id, merchantId } = parsed.data;
    if (!(await verifyOwnership(supabase, merchantId, user.id))) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin
      .from('booking_deposit_failures')
      .delete()
      .eq('id', id)
      .eq('merchant_id', merchantId);

    if (error) {
      logger.error('Deposit failures DELETE error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Deposit failures DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
