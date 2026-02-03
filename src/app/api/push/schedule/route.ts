import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

const supabaseAdmin = getSupabaseAdmin();

// Helper to verify merchant ownership
async function verifyMerchantOwnership(merchantId: string): Promise<{ authorized: boolean }> {
  const cookieStore = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => Promise.resolve(cookieStore) });
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

  return { authorized: true };
}

// GET - Fetch scheduled pushes for a merchant
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId');

  if (!merchantId) {
    return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 });
  }

  // SECURITY: Verify user owns this merchant
  const authCheck = await verifyMerchantOwnership(merchantId);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  // Get pending scheduled pushes
  const { data: scheduled, error } = await supabaseAdmin
    .from('scheduled_push')
    .select('*')
    .eq('merchant_id', merchantId)
    .eq('status', 'pending')
    .gte('scheduled_date', new Date().toISOString().split('T')[0])
    .order('scheduled_date', { ascending: true })
    .order('scheduled_time', { ascending: true });

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch scheduled pushes' }, { status: 500 });
  }

  return NextResponse.json({ scheduled: scheduled || [] });
}

// POST - Schedule a new push notification
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { merchantId, title, body: messageBody, scheduledTime, scheduledDate } = body;

    if (!merchantId || !title || !messageBody || !scheduledTime || !scheduledDate) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // SECURITY: Verify user owns this merchant
    const authCheck = await verifyMerchantOwnership(merchantId);
    if (!authCheck.authorized) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    // Validate scheduled time
    if (!['10:00', '18:00'].includes(scheduledTime)) {
      return NextResponse.json({ error: 'Invalid scheduled time' }, { status: 400 });
    }

    // Validate date is today or future
    const today = new Date().toISOString().split('T')[0];
    if (scheduledDate < today) {
      return NextResponse.json({ error: 'Cannot schedule in the past' }, { status: 400 });
    }

    // Check if same time slot already scheduled
    const { data: existing } = await supabaseAdmin
      .from('scheduled_push')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('scheduled_date', scheduledDate)
      .eq('scheduled_time', scheduledTime)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Ce créneau est déjà programmé' }, { status: 400 });
    }

    // Create scheduled push
    const { data, error } = await supabaseAdmin
      .from('scheduled_push')
      .insert({
        merchant_id: merchantId,
        title,
        body: messageBody,
        scheduled_time: scheduledTime,
        scheduled_date: scheduledDate,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to schedule push:', error);
      return NextResponse.json({ error: 'Failed to schedule push' }, { status: 500 });
    }

    return NextResponse.json({ success: true, scheduled: data });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}

// DELETE - Cancel a scheduled push
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  // Get the scheduled push to verify ownership
  const { data: scheduledPush } = await supabaseAdmin
    .from('scheduled_push')
    .select('merchant_id')
    .eq('id', id)
    .single();

  if (!scheduledPush) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // SECURITY: Verify user owns this merchant
  const authCheck = await verifyMerchantOwnership(scheduledPush.merchant_id);
  if (!authCheck.authorized) {
    return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
  }

  const { error } = await supabaseAdmin
    .from('scheduled_push')
    .delete()
    .eq('id', id)
    .eq('status', 'pending');

  if (error) {
    return NextResponse.json({ error: 'Failed to cancel' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
