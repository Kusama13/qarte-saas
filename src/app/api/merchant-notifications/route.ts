import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin, createRouteHandlerSupabaseClient } from '@/lib/supabase';
import { z } from 'zod';
import logger from '@/lib/logger';

const patchSchema = z.object({
  merchantId: z.string().uuid(),
  notificationId: z.string().uuid().optional(),
});

// GET — fetch recent notifications + unread count for a merchant
export async function GET(request: NextRequest) {
  try {
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    const [{ data: notifications }, { count: unreadCount }] = await Promise.all([
      supabase
        .from('merchant_push_logs')
        .select('id, notification_type, title, body, url, read, sent_at')
        .eq('merchant_id', merchantId)
        .not('title', 'is', null)
        .order('sent_at', { ascending: false })
        .limit(20),
      supabase
        .from('merchant_push_logs')
        .select('*', { count: 'exact', head: true })
        .eq('merchant_id', merchantId)
        .eq('read', false)
        .not('title', 'is', null),
    ]);

    return NextResponse.json({
      notifications: notifications || [],
      unreadCount: unreadCount || 0,
    });
  } catch (error) {
    logger.error('Merchant notifications GET error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// PATCH — mark all notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Donnees invalides' }, { status: 400 });
    }
    const { merchantId, notificationId } = parsed.data;

    const supabase = getSupabaseAdmin();

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    let query = supabase
      .from('merchant_push_logs')
      .update({ read: true })
      .eq('merchant_id', merchantId)
      .eq('read', false);

    if (notificationId) {
      query = query.eq('id', notificationId);
    }

    await query;

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Merchant notifications PATCH error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}

// DELETE — clear all notifications for a merchant
export async function DELETE(request: NextRequest) {
  try {
    const supabaseAuth = await createRouteHandlerSupabaseClient();
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchantId');
    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId requis' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { data: merchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('id', merchantId)
      .eq('user_id', user.id)
      .single();

    if (!merchant) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 });
    }

    await supabase
      .from('merchant_push_logs')
      .delete()
      .eq('merchant_id', merchantId);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Merchant notifications DELETE error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
