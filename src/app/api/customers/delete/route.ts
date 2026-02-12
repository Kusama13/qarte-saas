import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';

const supabaseAdmin = getSupabaseAdmin();

// POST - Delete a customer's loyalty card and related data
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Non autorisé' },
        { status: 401 }
      );
    }

    // Get merchant for this user
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle();

    if (merchantError || !merchant) {
      return NextResponse.json(
        { error: 'Commerçant introuvable' },
        { status: 404 }
      );
    }

    const { loyalty_card_id, ban_number, phone_number, customer_name } = await request.json();

    if (!loyalty_card_id) {
      return NextResponse.json(
        { error: 'loyalty_card_id requis' },
        { status: 400 }
      );
    }

    // Verify the loyalty card belongs to this merchant
    const { data: card, error: cardError } = await supabaseAdmin
      .from('loyalty_cards')
      .select('id, merchant_id, customer_id')
      .eq('id', loyalty_card_id)
      .maybeSingle();

    if (cardError || !card || card.merchant_id !== merchant.id) {
      return NextResponse.json(
        { error: 'Carte non trouvée ou non autorisée' },
        { status: 403 }
      );
    }

    // If banning, add to banned_numbers first
    if (ban_number && phone_number) {
      const { error: banError } = await supabaseAdmin
        .from('banned_numbers')
        .upsert({
          phone_number,
          merchant_id: merchant.id,
          reason: `Banni par le commerçant - Client: ${customer_name || 'Inconnu'}`,
        }, {
          onConflict: 'phone_number,merchant_id',
          ignoreDuplicates: true,
        });

      if (banError) {
        console.error('Error banning number:', banError);
        // Continue with deletion even if ban fails
      }
    }

    // Delete in order: vouchers, referrals, visits, point_adjustments, redemptions, then loyalty_card
    // The ON DELETE CASCADE should handle this, but we do it explicitly for safety
    await Promise.all([
      supabaseAdmin.from('vouchers').delete().eq('loyalty_card_id', loyalty_card_id),
      supabaseAdmin.from('visits').delete().eq('loyalty_card_id', loyalty_card_id),
      supabaseAdmin.from('point_adjustments').delete().eq('loyalty_card_id', loyalty_card_id),
      supabaseAdmin.from('redemptions').delete().eq('loyalty_card_id', loyalty_card_id),
      supabaseAdmin.from('referrals').delete().eq('referrer_card_id', loyalty_card_id),
      supabaseAdmin.from('referrals').delete().eq('referred_card_id', loyalty_card_id),
      // Clean up push subscriptions and member cards linked to this customer
      ...(card.customer_id ? [
        supabaseAdmin.from('push_subscriptions').delete().eq('customer_id', card.customer_id),
        supabaseAdmin.from('member_cards').delete().eq('customer_id', card.customer_id),
      ] : []),
    ]);

    // Delete the loyalty card
    const { error: deleteError } = await supabaseAdmin
      .from('loyalty_cards')
      .delete()
      .eq('id', loyalty_card_id);

    if (deleteError) {
      console.error('Error deleting loyalty card:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression' },
        { status: 500 }
      );
    }

    // Delete the customer row (scoped to this merchant via merchant_id)
    if (card.customer_id) {
      await supabaseAdmin
        .from('customers')
        .delete()
        .eq('id', card.customer_id)
        .eq('merchant_id', merchant.id);
    }

    return NextResponse.json({
      success: true,
      banned: ban_number || false,
    });
  } catch (error) {
    console.error('Delete customer error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
