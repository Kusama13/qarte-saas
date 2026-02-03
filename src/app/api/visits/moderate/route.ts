import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { z } from 'zod';
import type { VisitStatus } from '@/types';

const supabaseAdmin = getSupabaseAdmin();

// Helper to verify merchant ownership
async function verifyMerchantOwnership(merchantId: string): Promise<{ authorized: boolean; userId?: string }> {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false };
  }

  const { data: merchant } = await supabaseAdmin
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .single();

  if (!merchant) {
    return { authorized: false };
  }

  return { authorized: true, userId: user.id };
}

// GET: Fetch pending visits for a merchant
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

    // SECURITY: Verify user owns this merchant
    const authCheck = await verifyMerchantOwnership(merchantId);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Get pending visits with customer and loyalty card info
    const { data: pendingVisits, error } = await supabaseAdmin
      .from('visits')
      .select(`
        *,
        customer:customers (*),
        loyalty_card:loyalty_cards (*)
      `)
      .eq('merchant_id', merchantId)
      .eq('status', 'pending')
      .order('visited_at', { ascending: false });

    if (error) {
      console.error('Error fetching pending visits:', error);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des visites' },
        { status: 500 }
      );
    }

    // Get count of pending visits
    const { count: pendingCount } = await supabaseAdmin
      .from('visits')
      .select('*', { count: 'exact', head: true })
      .eq('merchant_id', merchantId)
      .eq('status', 'pending');

    return NextResponse.json({
      visits: pendingVisits || [],
      pending_count: pendingCount || 0,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

const moderateSchema = z.object({
  visit_id: z.string().uuid(),
  action: z.enum(['confirm', 'reject']),
  merchant_id: z.string().uuid(),
});

// POST: Moderate a pending visit (confirm or reject)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = moderateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { visit_id, action, merchant_id } = parsed.data;

    // SECURITY: Verify user owns this merchant
    const authCheck = await verifyMerchantOwnership(merchant_id);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Get the visit
    const { data: visit, error: visitError } = await supabaseAdmin
      .from('visits')
      .select('*, loyalty_card:loyalty_cards (*)')
      .eq('id', visit_id)
      .eq('merchant_id', merchant_id)
      .eq('status', 'pending')
      .single();

    if (visitError || !visit) {
      return NextResponse.json(
        { error: 'Visite non trouvée ou déjà traitée' },
        { status: 404 }
      );
    }

    const newStatus: VisitStatus = action === 'confirm' ? 'confirmed' : 'rejected';

    // Update visit status
    const { error: updateVisitError } = await supabaseAdmin
      .from('visits')
      .update({ status: newStatus })
      .eq('id', visit_id);

    if (updateVisitError) {
      return NextResponse.json(
        { error: 'Erreur lors de la mise à jour de la visite' },
        { status: 500 }
      );
    }

    // If confirmed, add points to loyalty card
    if (action === 'confirm' && visit.loyalty_card) {
      const newStamps = (visit.loyalty_card.current_stamps || 0) + (visit.points_earned || 1);

      const { error: updateCardError } = await supabaseAdmin
        .from('loyalty_cards')
        .update({
          current_stamps: newStamps,
          last_visit_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', visit.loyalty_card_id);

      if (updateCardError) {
        // Rollback visit status
        await supabaseAdmin
          .from('visits')
          .update({ status: 'pending' })
          .eq('id', visit_id);

        return NextResponse.json(
          { error: 'Erreur lors de la mise à jour de la carte' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      action,
      visit_id,
      message: action === 'confirm'
        ? 'Point validé avec succès'
        : 'Point refusé',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}

// Bulk moderation
const bulkModerateSchema = z.object({
  visit_ids: z.array(z.string().uuid()),
  action: z.enum(['confirm', 'reject']),
  merchant_id: z.string().uuid(),
});

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = bulkModerateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { visit_ids, action, merchant_id } = parsed.data;

    // SECURITY: Verify user owns this merchant
    const authCheck = await verifyMerchantOwnership(merchant_id);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const newStatus: VisitStatus = action === 'confirm' ? 'confirmed' : 'rejected';

    let successCount = 0;
    let errorCount = 0;

    for (const visit_id of visit_ids) {
      // Get the visit
      const { data: visit, error: visitError } = await supabaseAdmin
        .from('visits')
        .select('*, loyalty_card:loyalty_cards (*)')
        .eq('id', visit_id)
        .eq('merchant_id', merchant_id)
        .eq('status', 'pending')
        .single();

      if (visitError || !visit) {
        errorCount++;
        continue;
      }

      // Update visit status
      const { error: updateVisitError } = await supabaseAdmin
        .from('visits')
        .update({ status: newStatus })
        .eq('id', visit_id);

      if (updateVisitError) {
        errorCount++;
        continue;
      }

      // If confirmed, add points to loyalty card
      if (action === 'confirm' && visit.loyalty_card) {
        const newStamps = (visit.loyalty_card.current_stamps || 0) + (visit.points_earned || 1);

        await supabaseAdmin
          .from('loyalty_cards')
          .update({
            current_stamps: newStamps,
            last_visit_date: new Date().toISOString().split('T')[0],
          })
          .eq('id', visit.loyalty_card_id);
      }

      successCount++;
    }

    return NextResponse.json({
      success: true,
      action,
      processed: successCount,
      errors: errorCount,
      message: action === 'confirm'
        ? `${successCount} point(s) validé(s)`
        : `${successCount} point(s) refusé(s)`,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
