import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { z } from 'zod';
import webpush from 'web-push';
import logger from '@/lib/logger';

// ── Zod schemas ──

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  body: z.string().min(1, 'Le contenu est requis'),
  type: z.enum(['info', 'warning', 'success', 'urgent']),
  target_filter: z.enum(['all', 'trial', 'active', 'pwa_installed', 'pwa_trial', 'admin']),
  duration_days: z.number().int().positive().optional().nullable(),
  link_url: z.string().url('URL invalide').optional().nullable(),
});

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  type: z.enum(['info', 'warning', 'success', 'urgent']).optional(),
  target_filter: z.enum(['all', 'trial', 'active', 'pwa_installed', 'pwa_trial', 'admin']).optional(),
  duration_days: z.number().int().positive().optional().nullable(),
  link_url: z.string().url('URL invalide').optional().nullable(),
  is_published: z.boolean().optional(),
});

// ── GET: List all announcements with dismissal counts ──

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-announcements');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    // Fetch all announcements ordered by created_at DESC
    const { data: announcements, error } = await supabaseAdmin
      .from('admin_announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Error fetching announcements:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch dismissal counts for each announcement
    const announcementIds = (announcements || []).map((a) => a.id);

    let dismissalCounts: Record<string, number> = {};

    if (announcementIds.length > 0) {
      const { data: dismissals, error: dismissalError } = await supabaseAdmin
        .from('admin_announcement_dismissals')
        .select('announcement_id')
        .in('announcement_id', announcementIds);

      if (dismissalError) {
        logger.error('Error fetching dismissal counts:', dismissalError);
      } else {
        // Count dismissals per announcement
        dismissalCounts = (dismissals || []).reduce((acc, d) => {
          acc[d.announcement_id] = (acc[d.announcement_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
      }
    }

    const result = (announcements || []).map((a) => ({
      ...a,
      dismissal_count: dismissalCounts[a.id] || 0,
    }));

    return NextResponse.json({ announcements: result });
  } catch (error) {
    logger.error('Error in GET /api/admin/announcements:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── POST: Create a new announcement ──

export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-announcements');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const body = await request.json();
    const validation = createAnnouncementSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from('admin_announcements')
      .insert({
        title: validation.data.title,
        body: validation.data.body,
        type: validation.data.type,
        target_filter: validation.data.target_filter,
        duration_days: validation.data.duration_days ?? null,
        link_url: validation.data.link_url ?? null,
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      logger.error('Error creating announcement:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ announcement: data }, { status: 201 });
  } catch (error) {
    logger.error('Error in POST /api/admin/announcements:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── PATCH: Update an announcement ──

export async function PATCH(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-announcements');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    }

    const validation = updateAnnouncementSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { ...validation.data };
    let isNewPublish = false;

    // Special behavior when publishing
    if (updates.is_published === true) {
      // Fetch current record to check if it was already published
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('admin_announcements')
        .select('is_published, duration_days, target_filter, title, body, type')
        .eq('id', id)
        .single();

      if (fetchError) {
        logger.error('Error fetching announcement for publish:', fetchError);
        return NextResponse.json({ error: fetchError.message }, { status: 500 });
      }

      if (!current) {
        return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
      }

      // Only set published_at when transitioning from unpublished to published
      if (!current.is_published) {
        isNewPublish = true;
        const now = new Date().toISOString();
        updates.published_at = now;

        // Compute expires_at based on duration_days (use updated value if provided, else current)
        const durationDays = (updates.duration_days !== undefined ? updates.duration_days : current.duration_days) as number | null;

        if (durationDays) {
          const expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + durationDays);
          updates.expires_at = expiresAt.toISOString();
        } else {
          updates.expires_at = null;
        }
      }
    }
    // If unpublishing, keep published_at as-is (no special handling needed)

    const { data, error } = await supabaseAdmin
      .from('admin_announcements')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      logger.error('Error updating announcement:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Send push notifications to matching merchants (fire-and-forget)
    if (isNewPublish) {
      sendAnnouncementPush(supabaseAdmin, data).catch((err) => {
        logger.error('Error sending announcement push:', err);
      });
    }

    return NextResponse.json({ announcement: data });
  } catch (error) {
    logger.error('Error in PATCH /api/admin/announcements:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE: Delete an announcement (only if not published) ──

export async function DELETE(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-announcements');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'Announcement ID required' }, { status: 400 });
    }

    // Check if the announcement is published
    const { data: announcement, error: fetchError } = await supabaseAdmin
      .from('admin_announcements')
      .select('is_published')
      .eq('id', id)
      .single();

    if (fetchError) {
      logger.error('Error fetching announcement for delete:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    if (announcement.is_published) {
      return NextResponse.json(
        { error: 'Impossible de supprimer une annonce publiée. Dépubliez-la d\'abord.' },
        { status: 400 }
      );
    }

    const { error } = await supabaseAdmin
      .from('admin_announcements')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Error deleting announcement:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Error in DELETE /api/admin/announcements:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── Push helper: send notification to merchants matching the announcement target ──

interface AnnouncementData {
  id: string;
  title: string;
  body: string;
  type: string;
  target_filter: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function sendAnnouncementPush(supabaseAdmin: any, announcement: AnnouncementData) {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;

  if (!vapidPublicKey || !vapidPrivateKey) {
    logger.warn('VAPID keys not configured — skipping announcement push');
    return;
  }

  webpush.setVapidDetails('mailto:contact@qarte.fr', vapidPublicKey, vapidPrivateKey);

  // 1. Find merchants matching the target filter
  let merchantQuery = supabaseAdmin
    .from('merchants')
    .select('id, subscription_status, pwa_installed_at, user_id');

  const filter = announcement.target_filter;
  if (filter === 'trial') {
    merchantQuery = merchantQuery.eq('subscription_status', 'trial');
  } else if (filter === 'active') {
    merchantQuery = merchantQuery.eq('subscription_status', 'active');
  } else if (filter === 'pwa_installed') {
    merchantQuery = merchantQuery.not('pwa_installed_at', 'is', null);
  } else if (filter === 'pwa_trial') {
    merchantQuery = merchantQuery.eq('subscription_status', 'trial').not('pwa_installed_at', 'is', null);
  } else if (filter === 'admin') {
    // Admin-only: get super admin user_ids first
    const { data: superAdmins } = await supabaseAdmin.from('super_admins').select('user_id');
    if (!superAdmins || superAdmins.length === 0) return;
    merchantQuery = merchantQuery.in('user_id', superAdmins.map((sa: { user_id: string }) => sa.user_id));
  }
  // 'all' → no filter

  const { data: merchants, error: merchantError } = await merchantQuery;
  if (merchantError || !merchants || merchants.length === 0) {
    if (merchantError) logger.error('Error querying merchants for push:', merchantError);
    return;
  }

  const merchantIds = merchants.map((m: { id: string }) => m.id);

  // 2. Get push subscriptions for these merchants
  const { data: subscriptions, error: subError } = await supabaseAdmin
    .from('merchant_push_subscriptions')
    .select('endpoint, p256dh, auth, merchant_id')
    .in('merchant_id', merchantIds);

  if (subError || !subscriptions || subscriptions.length === 0) {
    if (subError) logger.error('Error querying merchant push subscriptions:', subError);
    return;
  }

  // 3. Send push in batches of 50
  const payload = JSON.stringify({
    title: announcement.title,
    body: announcement.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: { url: '/dashboard' },
  });

  let sent = 0;
  let failed = 0;
  const staleEndpoints: string[] = [];

  for (let i = 0; i < subscriptions.length; i += 50) {
    const batch = subscriptions.slice(i, i + 50);

    await Promise.allSettled(
      batch.map(async (sub: { endpoint: string; p256dh: string; auth: string }) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: { p256dh: sub.p256dh, auth: sub.auth },
            },
            payload
          );
          sent++;
        } catch (err: unknown) {
          failed++;
          const statusCode = (err as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            staleEndpoints.push(sub.endpoint);
          }
        }
      })
    );

    // Pause between batches
    if (i + 50 < subscriptions.length) {
      await new Promise((r) => setTimeout(r, 100));
    }
  }

  // 4. Cleanup stale subscriptions
  if (staleEndpoints.length > 0) {
    await supabaseAdmin
      .from('merchant_push_subscriptions')
      .delete()
      .in('endpoint', staleEndpoints);
  }

  logger.info(`Announcement push: ${sent} sent, ${failed} failed, ${staleEndpoints.length} cleaned`);
}
