import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import logger from '@/lib/logger';

// GET - Récupérer toutes les données d'un merchant (H5: service_role pour bypasser RLS)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier que l'utilisateur est super admin
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const { id: merchantId } = await params;

  if (!merchantId) {
    return NextResponse.json(
      { error: 'ID merchant requis' },
      { status: 400 }
    );
  }

  try {
    // Get full merchant data
    const { data: merchant, error: merchantError } = await supabaseAdmin
      .from('merchants')
      .select('*')
      .eq('id', merchantId)
      .single();

    if (merchantError || !merchant) {
      return NextResponse.json({ error: 'Merchant introuvable' }, { status: 404 });
    }

    // Fetch user email
    let userEmail: string | null = null;
    if (merchant.user_id) {
      try {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(merchant.user_id);
        userEmail = userData?.user?.email || null;
      } catch {
        // Ignore auth errors
      }
    }

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Parallel: counts + member programs + email trackings + push stats
    const [
      totalCustomersRes,
      activeCustomersRes,
      totalVisitsRes,
      totalRedemptionsRes,
      pendingPointsRes,
      memberProgramsRes,
      emailTrackingsRes,
      pushSentRes,
      loyaltyCardsRes,
    ] = await Promise.all([
      supabaseAdmin.from('loyalty_cards').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
      supabaseAdmin.from('loyalty_cards').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).gte('last_visit_date', thirtyDaysAgo.toISOString().split('T')[0]),
      supabaseAdmin.from('visits').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
      supabaseAdmin.from('redemptions').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
      supabaseAdmin.from('visits').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('status', 'pending'),
      supabaseAdmin.from('member_programs').select('*, member_cards(count)').eq('merchant_id', merchantId).order('created_at', { ascending: false }),
      supabaseAdmin.from('pending_email_tracking').select('reminder_day, sent_at').eq('merchant_id', merchantId).order('sent_at', { ascending: false }),
      supabaseAdmin.from('push_history').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
      supabaseAdmin.from('loyalty_cards').select('customer_id, customers!inner(id, phone_number)').eq('merchant_id', merchantId),
    ]);

    // Compute push subscribers (same logic as before)
    let pushSubscribers = 0;
    const loyaltyCards = loyaltyCardsRes.data;

    if (loyaltyCards && loyaltyCards.length > 0) {
      const phoneToCustomerId = new Map<string, string>();
      for (const card of loyaltyCards) {
        const customer = card.customers as unknown as { id: string; phone_number: string };
        if (customer?.phone_number) {
          phoneToCustomerId.set(customer.phone_number, customer.id);
        }
      }

      const phoneNumbers = [...phoneToCustomerId.keys()];

      if (phoneNumbers.length > 0) {
        const { data: allCustomersWithPhone } = await supabaseAdmin
          .from('customers')
          .select('id, phone_number')
          .in('phone_number', phoneNumbers);

        if (allCustomersWithPhone && allCustomersWithPhone.length > 0) {
          const allCustomerIds = allCustomersWithPhone.map(c => c.id);
          const { data: subscriptions } = await supabaseAdmin
            .from('push_subscriptions')
            .select('customer_id')
            .in('customer_id', allCustomerIds);

          if (subscriptions) {
            const customerIdToPhone = new Map<string, string>();
            for (const c of allCustomersWithPhone) {
              customerIdToPhone.set(c.id, c.phone_number);
            }
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

    return NextResponse.json({
      merchant,
      userEmail,
      stats: {
        totalCustomers: totalCustomersRes.count || 0,
        activeCustomers: activeCustomersRes.count || 0,
        totalVisits: totalVisitsRes.count || 0,
        totalRedemptions: totalRedemptionsRes.count || 0,
        pendingPoints: pendingPointsRes.count || 0,
        pushSubscribers,
        pushSent: pushSentRes.count || 0,
      },
      memberPrograms: memberProgramsRes.data || [],
      emailTrackings: emailTrackingsRes.data || [],
    });
  } catch (error) {
    logger.error('Admin merchant stats error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// PATCH - Update merchant admin fields (no_contact, admin_notes)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const { id: merchantId } = await params;

  if (!merchantId) {
    return NextResponse.json({ error: 'ID merchant requis' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.no_contact === 'boolean') updates.no_contact = body.no_contact;
    if (typeof body.admin_notes === 'string') updates.admin_notes = body.admin_notes || null;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Aucun champ à mettre à jour' }, { status: 400 });
    }

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('merchants')
      .update(updates)
      .eq('id', merchantId)
      .select('no_contact, admin_notes')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    logger.error('Admin merchant PATCH error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE - Supprimer un merchant et toutes ses données
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Vérifier que l'utilisateur est super admin
  const auth = await authorizeAdmin(request);
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const { id: merchantId } = await params;

  if (!merchantId) {
    return NextResponse.json(
      { error: 'ID merchant requis' },
      { status: 400 }
    );
  }

  try {
    // Vérifier que le merchant existe
    const { data: merchant, error: fetchError } = await supabaseAdmin
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
    await supabaseAdmin
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
    const { error: deleteError } = await supabaseAdmin
      .from('merchants')
      .delete()
      .eq('id', merchantId);

    if (deleteError) {
      logger.error('Delete merchant error:', deleteError);
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
    logger.error('Delete merchant error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
