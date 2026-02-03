import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';

// Helper to verify merchant ownership
async function verifyMerchantOwnership(merchantId: string): Promise<{ authorized: boolean; error?: string; status?: number }> {
  const supabase = await createRouteHandlerSupabaseClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { authorized: false, error: 'Non autorisé - connexion requise', status: 401 };
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .single();

  if (!merchant) {
    return { authorized: false, error: 'Non autorisé - vous ne pouvez pas gérer les offres de ce commerce', status: 403 };
  }

  return { authorized: true };
}

// GET current offer for a merchant
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');

  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
  }

  const supabase = await createRouteHandlerSupabaseClient();

  const { data: merchant, error } = await supabase
    .from('merchants')
    .select('offer_active, offer_title, offer_description, offer_image_url, offer_expires_at, offer_duration_days, offer_created_at, pwa_offer_text')
    .eq('id', merchantId)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Check if offer is expired
  const isExpired = merchant.offer_expires_at && new Date(merchant.offer_expires_at) < new Date();

  return NextResponse.json({
    offer: {
      active: merchant.offer_active && !isExpired,
      title: merchant.offer_title,
      description: merchant.offer_description,
      imageUrl: merchant.offer_image_url,
      expiresAt: merchant.offer_expires_at,
      durationDays: merchant.offer_duration_days,
      createdAt: merchant.offer_created_at,
      isExpired,
    },
    pwaOffer: merchant.pwa_offer_text || null,
  });
}

// POST/PUT to create or update offer
export async function POST(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();

  try {
    const body = await request.json();
    const { merchantId, title, description, imageUrl, durationDays } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    }

    if (!title || !description) {
      return NextResponse.json({ error: 'title and description required' }, { status: 400 });
    }

    // SECURITY: Verify merchant ownership
    const authCheck = await verifyMerchantOwnership(merchantId);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
    }

    // Validate duration
    const duration = Math.min(3, Math.max(1, durationDays || 1));

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + duration);
    expiresAt.setHours(23, 59, 59, 999); // End of day

    const { error } = await supabase
      .from('merchants')
      .update({
        offer_active: true,
        offer_title: title.trim(),
        offer_description: description.trim(),
        offer_image_url: imageUrl?.trim() || null,
        offer_duration_days: duration,
        offer_expires_at: expiresAt.toISOString(),
        offer_created_at: new Date().toISOString(),
      })
      .eq('id', merchantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error('Error saving offer:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// PATCH to update PWA offer
export async function PATCH(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();

  try {
    const body = await request.json();
    const { merchantId, pwaOfferText } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
    }

    // SECURITY: Verify merchant ownership
    const authCheck = await verifyMerchantOwnership(merchantId);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
    }

    const { error } = await supabase
      .from('merchants')
      .update({
        pwa_offer_text: pwaOfferText?.trim() || null,
      })
      .eq('id', merchantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving PWA offer:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE to deactivate offer
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');

  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
  }

  // SECURITY: Verify merchant ownership
  const authCheck = await verifyMerchantOwnership(merchantId);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status || 403 });
  }

  const supabase = await createRouteHandlerSupabaseClient();

  const { error } = await supabase
    .from('merchants')
    .update({
      offer_active: false,
    })
    .eq('id', merchantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
