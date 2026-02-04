import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';

// GET - Récupérer les stats d'un merchant (incluant push subscribers)
export async function GET(
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
    // Get merchant with user_id to fetch email
    const { data: merchant } = await supabase
      .from('merchants')
      .select('user_id')
      .eq('id', merchantId)
      .single();

    let userEmail: string | null = null;
    if (merchant?.user_id) {
      try {
        const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
        userEmail = userData?.user?.email || null;
      } catch {
        // Ignore auth errors
      }
    }

    // Get loyalty cards with customer phone numbers
    const { data: loyaltyCards } = await supabase
      .from('loyalty_cards')
      .select('customer_id, customers!inner(id, phone_number)')
      .eq('merchant_id', merchantId);

    let pushSubscribers = 0;

    if (loyaltyCards && loyaltyCards.length > 0) {
      // Build a map of phone numbers to merchant customer IDs
      const phoneToCustomerId = new Map<string, string>();
      for (const card of loyaltyCards) {
        // Supabase returns customers as object (not array) with !inner join
        const customer = card.customers as unknown as { id: string; phone_number: string };
        if (customer?.phone_number) {
          phoneToCustomerId.set(customer.phone_number, customer.id);
        }
      }

      const phoneNumbers = [...phoneToCustomerId.keys()];

      if (phoneNumbers.length > 0) {
        // Find ALL customer IDs with these phone numbers (cross-merchant)
        const { data: allCustomersWithPhone } = await supabase
          .from('customers')
          .select('id, phone_number')
          .in('phone_number', phoneNumbers);

        if (allCustomersWithPhone && allCustomersWithPhone.length > 0) {
          const allCustomerIds = allCustomersWithPhone.map(c => c.id);

          // Get push subscriptions for any of these customer IDs
          const { data: subscriptions } = await supabase
            .from('push_subscriptions')
            .select('customer_id')
            .in('customer_id', allCustomerIds);

          if (subscriptions) {
            // Build map of customer_id -> phone
            const customerIdToPhone = new Map<string, string>();
            for (const c of allCustomersWithPhone) {
              customerIdToPhone.set(c.id, c.phone_number);
            }

            // Count unique phones with push subscriptions
            const phonesWithPush = new Set<string>();
            for (const sub of subscriptions) {
              const phone = customerIdToPhone.get(sub.customer_id);
              if (phone && phoneToCustomerId.has(phone)) {
                phonesWithPush.add(phone);
              }
            }
            pushSubscribers = phonesWithPush.size;
          }
        }
      }
    }

    // Get push history count
    const { count: pushSent } = await supabase
      .from('push_history')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId);

    return NextResponse.json({
      pushSubscribers,
      pushSent: pushSent || 0,
      userEmail,
    });
  } catch (error) {
    console.error('Admin merchant stats error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

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
