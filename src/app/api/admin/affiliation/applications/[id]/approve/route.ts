import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { randomBytes } from 'crypto';
import { z } from 'zod';
import { sendAmbassadorWelcomeEmail } from '@/lib/email';
import logger from '@/lib/logger';

const approveSchema = z.object({
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/).optional(),
}).strict();

function generateAffiliateSlug(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = randomBytes(6);
  let slug = '';
  for (const byte of bytes) {
    slug += chars[byte % chars.length];
  }
  return slug;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await authorizeAdmin(request, 'admin-affiliation');
  if (auth.response) return auth.response;
  const { supabaseAdmin } = auth;

  const { id } = await params;

  try {
    // Fetch application
    const { data: app, error: fetchErr } = await supabaseAdmin
      .from('ambassador_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchErr || !app) {
      return NextResponse.json({ error: 'Application non trouvée' }, { status: 404 });
    }

    // Idempotent: if already approved, return existing data
    if (app.status === 'approved' && app.affiliate_id) {
      const { data: existingLink } = await supabaseAdmin
        .from('affiliate_links')
        .select('*')
        .eq('id', app.affiliate_id)
        .single();
      return NextResponse.json({ link: existingLink, application: app });
    }

    if (app.status !== 'pending') {
      return NextResponse.json({ error: 'Cette candidature n\'est pas en attente' }, { status: 400 });
    }

    // Admin can override the slug, otherwise use requested_slug from application, fallback to random
    const body = await request.json().catch(() => ({}));
    const parsed = approveSchema.safeParse(body);
    const preferredSlug = parsed.success ? parsed.data.slug : undefined;

    // Generate unique slug with retry
    let slug = '';
    let linkData = null;
    const baseSlug = preferredSlug || app.requested_slug;
    for (let attempt = 0; attempt < 5; attempt++) {
      slug = attempt === 0 && baseSlug ? baseSlug : generateAffiliateSlug();
      const { data, error } = await supabaseAdmin
        .from('affiliate_links')
        .insert({
          name: `${app.first_name} ${app.last_name}`,
          slug,
          commission_percent: 20,
          notes: `Ambassadeur — ${app.email}`,
          active: true,
        })
        .select()
        .single();

      if (!error) {
        linkData = data;
        break;
      }
      // Retry on unique constraint violation (slug collision)
      if (error.code !== '23505') {
        logger.error('Affiliate link insert error:', error);
        return NextResponse.json({ error: 'Erreur création lien' }, { status: 500 });
      }
    }

    if (!linkData) {
      return NextResponse.json({ error: 'Impossible de générer un slug unique' }, { status: 500 });
    }

    // Update application + send welcome email in parallel
    const [updateResult] = await Promise.all([
      supabaseAdmin
        .from('ambassador_applications')
        .update({
          status: 'approved',
          affiliate_id: linkData.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single(),
      sendAmbassadorWelcomeEmail(app.email, app.first_name, slug).catch((emailErr) => {
        logger.error('Ambassador welcome email error:', emailErr);
      }),
    ]);

    if (updateResult.error) {
      logger.error('Ambassador application update error:', updateResult.error);
    }

    return NextResponse.json({ link: linkData, application: updateResult.data || app });
  } catch (err) {
    logger.error('Ambassador approve error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
