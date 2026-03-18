import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const updateSocialSchema = z.object({
  customerId: z.string().uuid(),
  merchantId: z.string().uuid(),
  instagram_handle: z.string().max(100).nullable().optional(),
  tiktok_handle: z.string().max(100).nullable().optional(),
  facebook_url: z.string().max(300).nullable().optional(),
});

// PATCH — update customer social links
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = updateSocialSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
    }

    const { customerId, merchantId, instagram_handle, tiktok_handle, facebook_url } = parsed.data;

    // Verify merchant ownership
    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorise' }, { status: 403 });
    }

    // Verify customer belongs to this merchant (via loyalty_cards)
    const supabaseAdmin = getSupabaseAdmin();
    const { data: card } = await supabaseAdmin
      .from('loyalty_cards')
      .select('id')
      .eq('customer_id', customerId)
      .eq('merchant_id', merchantId)
      .limit(1)
      .single();

    if (!card) {
      return NextResponse.json({ error: 'Client introuvable' }, { status: 404 });
    }

    // Update social links
    const updateData: Record<string, string | null> = {};
    if (instagram_handle !== undefined) updateData.instagram_handle = instagram_handle?.trim() || null;
    if (tiktok_handle !== undefined) updateData.tiktok_handle = tiktok_handle?.trim() || null;
    if (facebook_url !== undefined) updateData.facebook_url = facebook_url?.trim() || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ success: true });
    }

    const { error } = await supabaseAdmin
      .from('customers')
      .update(updateData)
      .eq('id', customerId);

    if (error) {
      logger.error('Customer social update error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Customer social update error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
