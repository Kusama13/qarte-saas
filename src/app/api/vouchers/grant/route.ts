import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient, getSupabaseAdmin } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

const grantSchema = z.object({
  customer_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
  type: z.enum(['welcome', 'offer']),
  offer_id: z.string().uuid().optional(),
});

// GET: Fetch unused vouchers for a customer (merchant auth, uses admin client to bypass RLS)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const customerId = searchParams.get('customer_id');
    const merchantId = searchParams.get('merchant_id');

    if (!customerId || !merchantId) {
      return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 });
    }

    // Verify merchant ownership
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { data: vouchers } = await supabaseAdmin
      .from('vouchers')
      .select('id, source, offer_id, reward_description, created_at')
      .eq('customer_id', customerId)
      .eq('merchant_id', merchantId)
      .eq('is_used', false)
      .order('created_at', { ascending: false });

    return NextResponse.json({ vouchers: vouchers || [] });
  } catch (error) {
    logger.error('Voucher list error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const parsed = grantSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { customer_id, merchant_id, type, offer_id } = parsed.data;

    // Verify merchant ownership + get loyalty card in parallel
    const [{ data: merchant }, { data: card }] = await Promise.all([
      supabaseAdmin
        .from('merchants')
        .select('id, welcome_offer_enabled, welcome_offer_description')
        .eq('id', merchant_id)
        .eq('user_id', user.id)
        .single(),
      supabaseAdmin
        .from('loyalty_cards')
        .select('id, current_stamps')
        .eq('customer_id', customer_id)
        .eq('merchant_id', merchant_id)
        .maybeSingle(),
    ]);

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    if (!card) {
      return NextResponse.json({ error: 'Carte fidélité introuvable' }, { status: 404 });
    }

    if (type === 'welcome') {
      if (!merchant.welcome_offer_enabled) {
        return NextResponse.json({ error: 'Offre de bienvenue non activée' }, { status: 400 });
      }

      // Block if client already has stamps
      if (Number(card.current_stamps || 0) > 0) {
        return NextResponse.json({ error: 'not_new_client' }, { status: 400 });
      }

      // Check duplicate (any welcome voucher, used or not)
      const { data: existing } = await supabaseAdmin
        .from('vouchers')
        .select('id')
        .eq('customer_id', customer_id)
        .eq('merchant_id', merchant_id)
        .eq('source', 'welcome')
        .maybeSingle();

      if (existing) {
        return NextResponse.json({ error: 'already_granted' }, { status: 409 });
      }

      const { error: insertError } = await supabaseAdmin.from('vouchers').insert({
        loyalty_card_id: card.id,
        merchant_id,
        customer_id,
        reward_description: merchant.welcome_offer_description || 'Offre de bienvenue',
        source: 'welcome',
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (insertError) {
        logger.error('Voucher insert error:', insertError);
        return NextResponse.json({ error: 'Erreur' }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // type === 'offer'
    if (!offer_id) {
      return NextResponse.json({ error: 'offer_id requis' }, { status: 400 });
    }

    const { data: offer } = await supabaseAdmin
      .from('merchant_offers')
      .select('id, title, description, expires_at, max_claims, claim_count')
      .eq('id', offer_id)
      .eq('merchant_id', merchant_id)
      .eq('active', true)
      .maybeSingle();

    if (!offer) {
      return NextResponse.json({ error: 'Offre introuvable' }, { status: 404 });
    }

    if (offer.expires_at && new Date(offer.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Offre expirée' }, { status: 410 });
    }

    if (offer.max_claims && offer.claim_count >= offer.max_claims) {
      return NextResponse.json({ error: 'Limite atteinte' }, { status: 410 });
    }

    // Check duplicate
    const { data: existingOffer } = await supabaseAdmin
      .from('vouchers')
      .select('id')
      .eq('customer_id', customer_id)
      .eq('offer_id', offer_id)
      .eq('is_used', false)
      .maybeSingle();

    if (existingOffer) {
      return NextResponse.json({ error: 'already_granted' }, { status: 409 });
    }

    // Increment claim count
    await supabaseAdmin.rpc('increment_offer_claim', { p_offer_id: offer.id });

    const { error: insertError } = await supabaseAdmin.from('vouchers').insert({
      loyalty_card_id: card.id,
      merchant_id,
      customer_id,
      reward_description: offer.description,
      source: 'offer',
      offer_id: offer.id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    });

    if (insertError) {
      logger.error('Voucher insert error:', insertError);
      return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Voucher grant error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH: Mark voucher as used (merchant-side)
const useSchema = z.object({
  voucher_id: z.string().uuid(),
  merchant_id: z.string().uuid(),
});

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const parsed = useSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }

    const { voucher_id, merchant_id } = parsed.data;

    // Verify ownership
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('vouchers')
      .update({ is_used: true, used_at: new Date().toISOString() })
      .eq('id', voucher_id)
      .eq('merchant_id', merchant_id)
      .eq('is_used', false);

    if (error) {
      return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Voucher use error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE: Remove unused voucher (merchant-side)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const parsed = useSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides' }, { status: 400 });
    }
    const { voucher_id, merchant_id } = parsed.data;

    // Verify ownership
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('id', merchant_id)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const { error } = await supabaseAdmin
      .from('vouchers')
      .delete()
      .eq('id', voucher_id)
      .eq('merchant_id', merchant_id)
      .eq('is_used', false);

    if (error) {
      return NextResponse.json({ error: 'Erreur' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Voucher delete error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
