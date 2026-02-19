import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { verifyAdminAuth } from '@/lib/admin-auth';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import logger from '@/lib/logger';

const supabaseAdmin = getSupabaseAdmin();

// ── Zod schemas ──

const createAnnouncementSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  body: z.string().min(1, 'Le contenu est requis'),
  type: z.enum(['info', 'warning', 'success', 'urgent']),
  target_filter: z.enum(['all', 'trial', 'active', 'pwa_installed', 'admin']),
  duration_days: z.number().int().positive().optional().nullable(),
});

const updateAnnouncementSchema = z.object({
  title: z.string().min(1).optional(),
  body: z.string().min(1).optional(),
  type: z.enum(['info', 'warning', 'success', 'urgent']).optional(),
  target_filter: z.enum(['all', 'trial', 'active', 'pwa_installed', 'admin']).optional(),
  duration_days: z.number().int().positive().optional().nullable(),
  is_published: z.boolean().optional(),
});

// ── GET: List all announcements with dismissal counts ──

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-announcements:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

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
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-announcements:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

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
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-announcements:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

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

    // Special behavior when publishing
    if (updates.is_published === true) {
      // Fetch current record to check if it was already published
      const { data: current, error: fetchError } = await supabaseAdmin
        .from('admin_announcements')
        .select('is_published, duration_days')
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

    return NextResponse.json({ announcement: data });
  } catch (error) {
    logger.error('Error in PATCH /api/admin/announcements:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// ── DELETE: Delete an announcement (only if not published) ──

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAuth(request);
  if (!auth.authorized) return auth.error!;

  const rateLimit = checkRateLimit(`admin-announcements:${auth.userId}`, RATE_LIMITS.api);
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Trop de requêtes' },
      { status: 429, headers: { 'Retry-After': String(Math.ceil((rateLimit.resetTime - Date.now()) / 1000)) } }
    );
  }

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
