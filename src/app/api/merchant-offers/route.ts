import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerSupabaseClient } from '@/lib/supabase';
import logger from '@/lib/logger';

// GET: list offers for a merchant (public or authenticated)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');
  const publicView = searchParams.get('public') === 'true';

  if (!merchantId) {
    return NextResponse.json({ error: 'merchantId required' }, { status: 400 });
  }

  const supabase = await createRouteHandlerSupabaseClient();

  if (publicView) {
    // Public: only active, non-expired offers
    const { data, error } = await supabase
      .from('merchant_offers')
      .select('id, title, description, expires_at')
      .eq('merchant_id', merchantId)
      .eq('active', true)
      .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ offers: data || [] });
  }

  // Authenticated: all offers for merchant owner
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { data, error } = await supabase
    .from('merchant_offers')
    .select('*')
    .eq('merchant_id', merchantId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ offers: data || [] });
}

// POST: create a new offer
export async function POST(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { merchantId, title, description, expiresAt } = body;

    if (!merchantId || !title?.trim() || !description?.trim()) {
      return NextResponse.json({ error: 'merchantId, title et description requis' }, { status: 400 });
    }

    if (title.trim().length > 100) {
      return NextResponse.json({ error: 'Le titre ne doit pas dépasser 100 caractères' }, { status: 400 });
    }
    if (description.trim().length > 500) {
      return NextResponse.json({ error: 'La description ne doit pas dépasser 500 caractères' }, { status: 400 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // If date-only (YYYY-MM-DD), store as end of day to avoid timezone issues
    let normalizedExpiry = expiresAt || null;
    if (normalizedExpiry && /^\d{4}-\d{2}-\d{2}$/.test(normalizedExpiry)) {
      normalizedExpiry = `${normalizedExpiry}T23:59:59`;
    }

    const { data: offer, error } = await supabase
      .from('merchant_offers')
      .insert({
        merchant_id: merchantId,
        title: title.trim(),
        description: description.trim(),
        expires_at: normalizedExpiry,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, offer });
  } catch (error) {
    logger.error('Error creating offer:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// PATCH: update offer (toggle active, edit)
export async function PATCH(request: NextRequest) {
  const supabase = await createRouteHandlerSupabaseClient();

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const { offerId, merchantId, ...updates } = body;

    if (!offerId || !merchantId) {
      return NextResponse.json({ error: 'offerId et merchantId requis' }, { status: 400 });
    }

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Only allow safe fields
    const safeUpdates: Record<string, unknown> = {};
    if ('title' in updates) {
      const trimmed = updates.title?.trim();
      if (trimmed !== undefined && trimmed.length === 0) {
        return NextResponse.json({ error: 'Le titre ne peut pas être vide' }, { status: 400 });
      }
      if (trimmed && trimmed.length > 100) {
        return NextResponse.json({ error: 'Le titre ne doit pas dépasser 100 caractères' }, { status: 400 });
      }
      safeUpdates.title = trimmed;
    }
    if ('description' in updates) {
      const trimmed = updates.description?.trim();
      if (trimmed !== undefined && trimmed.length === 0) {
        return NextResponse.json({ error: 'La description ne peut pas être vide' }, { status: 400 });
      }
      if (trimmed && trimmed.length > 500) {
        return NextResponse.json({ error: 'La description ne doit pas dépasser 500 caractères' }, { status: 400 });
      }
      safeUpdates.description = trimmed;
    }
    if ('active' in updates) safeUpdates.active = updates.active;
    // Accept both expiresAt (camelCase) and expires_at (snake_case)
    const expiresValue = updates.expires_at ?? updates.expiresAt;
    if (expiresValue !== undefined) {
      let normalized = expiresValue || null;
      if (normalized && /^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
        normalized = `${normalized}T23:59:59`;
      }
      safeUpdates.expires_at = normalized;
    }

    const { error } = await supabase
      .from('merchant_offers')
      .update(safeUpdates)
      .eq('id', offerId)
      .eq('merchant_id', merchantId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error updating offer:', error);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE: remove an offer
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const offerId = searchParams.get('offerId');
  const merchantId = searchParams.get('merchantId');

  if (!offerId || !merchantId) {
    return NextResponse.json({ error: 'offerId et merchantId requis' }, { status: 400 });
  }

  const supabase = await createRouteHandlerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
  }

  const { data: merchant } = await supabase
    .from('merchants')
    .select('id')
    .eq('id', merchantId)
    .eq('user_id', user.id)
    .single();

  if (!merchant) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { error } = await supabase
    .from('merchant_offers')
    .delete()
    .eq('id', offerId)
    .eq('merchant_id', merchantId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
