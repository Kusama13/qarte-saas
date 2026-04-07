import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import logger from '@/lib/logger';
import { z } from 'zod';

const patchSchema = z.union([
  z.object({ action: z.literal('restore') }),
  z.object({ no_contact: z.boolean().optional(), admin_notes: z.string().nullable().optional() }).refine(
    (d) => d.no_contact !== undefined || d.admin_notes !== undefined,
    { message: 'Au moins un champ requis' }
  ),
]);

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
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

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
      weeklyScansRes,
      lastVisitRes,
      totalReferralsRes,
      pendingReferralsRes,
      completedReferralsRes,
      servicesCountRes,
      photosCountRes,
      welcomeVouchersRes,
      offerVouchersRes,
      planningSlotsRes,
      planningBookingsRes,
      pendingDepositsRes,
      smsSentRes,
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
      supabaseAdmin.from('visits').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).gte('visited_at', sevenDaysAgo.toISOString()),
      supabaseAdmin.from('visits').select('visited_at').eq('merchant_id', merchantId).order('visited_at', { ascending: false }).limit(1),
      supabaseAdmin.from('referrals').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
      supabaseAdmin.from('referrals').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('status', 'pending'),
      supabaseAdmin.from('referrals').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('status', 'completed'),
      supabaseAdmin.from('merchant_services').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
      supabaseAdmin.from('merchant_photos').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId),
      supabaseAdmin.from('vouchers').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('source', 'welcome'),
      supabaseAdmin.from('vouchers').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('source', 'offer'),
      supabaseAdmin.from('merchant_planning_slots').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).gte('slot_date', new Date().toISOString().split('T')[0]),
      supabaseAdmin.from('merchant_planning_slots').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).not('client_name', 'is', null).is('primary_slot_id', null).gte('slot_date', new Date().toISOString().split('T')[0]),
      // Pending deposits: booked slots (future) with deposit required but not yet confirmed
      supabaseAdmin.from('merchant_planning_slots').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('deposit_confirmed', false).not('client_name', 'is', null).is('primary_slot_id', null).gte('slot_date', new Date().toISOString().split('T')[0]),
      supabaseAdmin.from('sms_logs').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).neq('status', 'failed'),
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
        weeklyScans: weeklyScansRes.count || 0,
        lastVisitDate: lastVisitRes.data?.[0]?.visited_at || null,
        totalReferrals: totalReferralsRes.count || 0,
        pendingReferrals: pendingReferralsRes.count || 0,
        completedReferrals: completedReferralsRes.count || 0,
        servicesCount: servicesCountRes.count || 0,
        photosCount: photosCountRes.count || 0,
        welcomeVouchers: welcomeVouchersRes.count || 0,
        offerVouchers: offerVouchersRes.count || 0,
        planningSlotsCount: planningSlotsRes.count || 0,
        planningBookingsCount: planningBookingsRes.count || 0,
        pendingDepositsCount: pendingDepositsRes.count || 0,
        smsSent: smsSentRes.count || 0,
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
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
    }

    // Restore soft-deleted merchant
    if ('action' in parsed.data && parsed.data.action === 'restore') {
      const { data, error } = await supabaseAdmin
        .from('merchants')
        .update({ deleted_at: null, updated_at: new Date().toISOString() })
        .eq('id', merchantId)
        .not('deleted_at', 'is', null)
        .select('id, shop_name')
        .single();

      if (error || !data) {
        return NextResponse.json({ error: 'Merchant introuvable ou non supprimé' }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: `"${data.shop_name}" restauré` });
    }

    const updates: Record<string, unknown> = {};
    const fields = parsed.data as { no_contact?: boolean; admin_notes?: string | null };
    if (fields.no_contact !== undefined) updates.no_contact = fields.no_contact;
    if (fields.admin_notes !== undefined) updates.admin_notes = fields.admin_notes || null;

    updates.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('merchants')
      .update(updates)
      .eq('id', merchantId)
      .select('no_contact, admin_notes')
      .single();

    if (error) {
      logger.error('Admin merchant DB error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
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

    // Soft-delete: mark as deleted instead of hard delete (preserves history)
    const { error: deleteError } = await supabaseAdmin
      .from('merchants')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', merchantId)
      .is('deleted_at', null);

    if (deleteError) {
      logger.error('Soft-delete merchant error:', deleteError);
      return NextResponse.json(
        { error: 'Erreur lors de la suppression', details: deleteError.message },
        { status: 500 }
      );
    }

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
