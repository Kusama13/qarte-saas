import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';

// DELETE - Supprimer un merchant et toutes ses données
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier que l'utilisateur est super admin
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const supabase = getSupabaseAdmin();
  const { id: merchantId } = await params;

  if (!merchantId) {
    return NextResponse.json(
      { error: 'ID merchant requis' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que le merchant existe
    const { data: merchant, error: fetchError } = await supabase
      .from('merchants')
      .select('id, shop_name, user_id')
      .eq('id', merchantId)
      .single();

    if (fetchError || !merchant) {
      return NextResponse.json(
        { error: 'Merchant introuvable' },
        { status: 404 }
      );
    }

    // 1. Libérer la référence dans prospects (si existe)
    await supabase
      .from('prospects')
      .update({ converted_merchant_id: null })
      .eq('converted_merchant_id', merchantId);

    // 2. Supprimer le merchant (CASCADE supprime automatiquement):
    //    - loyalty_cards
    //    - visits
    //    - redemptions
    //    - push_history
    //    - push_automations
    //    - scheduled_push
    //    - banned_numbers
    //    - point_adjustments
    //    - member_programs (et member_cards via cascade)
    //    - merchant_offers
    const { error: deleteError } = await supabase
      .from('merchants')
      .delete()
      .eq('id', merchantId);

    if (deleteError) {
      console.error('Delete merchant error:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression', details: deleteError.message },
        { status: 500 }
      );
    }

    // 3. Optionnel: Supprimer l'utilisateur auth (le merchant ne pourra plus se connecter)
    // Décommente si tu veux aussi supprimer le compte utilisateur
    // if (merchant.user_id) {
    //   await supabase.auth.admin.deleteUser(merchant.user_id);
    // }

    return NextResponse.json({
      success: true,
      message: `Merchant "${merchant.shop_name}" supprimé avec succès`,
    });
  } catch (error) {
    console.error('Delete merchant error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
