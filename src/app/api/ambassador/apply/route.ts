import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import { resend, EMAIL_FROM } from '@/lib/resend';
import logger from '@/lib/logger';

const applySchema = z.object({
  first_name: z.string().min(2).max(50).trim(),
  last_name: z.string().min(2).max(50).trim(),
  email: z.string().email().max(200).toLowerCase(),
  phone: z.string().max(30).optional().nullable(),
  profile_type: z.enum(['influencer', 'trainer', 'family_friend', 'sales_rep', 'other']),
  message: z.string().min(20).max(1000).trim(),
  requested_slug: z.string().min(3).max(30).regex(/^[a-z0-9-]+$/).optional(),
});

const PROFILE_LABELS: Record<string, string> = {
  influencer: 'Influenceur beauté',
  trainer: 'Formateur / école',
  family_friend: 'Proche d\'un(e) pro',
  sales_rep: 'Commercial / apporteur d\'affaires',
  other: 'Autre',
};

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rl = checkRateLimit(`ambassador-apply:${ip}`, RATE_LIMITS.contact);
    if (!rl.success) return rateLimitResponse(rl.resetTime);

    const body = await request.json();
    const parsed = applySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 });
    }

    const { first_name, last_name, email, phone, profile_type, message, requested_slug } = parsed.data;
    const supabase = getSupabaseAdmin();

    const { error } = await supabase
      .from('ambassador_applications')
      .insert({
        first_name,
        last_name,
        email,
        phone: phone || null,
        profile_type,
        message,
        status: 'pending',
        requested_slug: requested_slug || null,
      });

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Une candidature avec cet email est déjà en cours d\'examen.' },
          { status: 409 }
        );
      }
      logger.error('Ambassador apply insert error:', error);
      return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
    }

    // Notify admin
    if (resend) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: 'hello@getqarte.com',
          subject: `Nouvelle candidature ambassadeur : ${first_name} ${last_name}`,
          html: `
            <h2>Nouvelle candidature ambassadeur</h2>
            <p><strong>Nom :</strong> ${escapeHtml(first_name)} ${escapeHtml(last_name)}</p>
            <p><strong>Email :</strong> ${escapeHtml(email)}</p>
            ${phone ? `<p><strong>Téléphone :</strong> ${escapeHtml(phone)}</p>` : ''}
            <p><strong>Profil :</strong> ${escapeHtml(PROFILE_LABELS[profile_type] || profile_type)}</p>
            ${requested_slug ? `<p><strong>Code souhaité :</strong> <code>${escapeHtml(requested_slug)}</code></p>` : ''}
            <p><strong>Message :</strong></p>
            <blockquote style="border-left:3px solid #654EDA;padding-left:12px;color:#555">${escapeHtml(message)}</blockquote>
            <br>
            <p><a href="https://getqarte.com/admin/affiliation">Voir dans l'admin</a></p>
          `,
        });
      } catch (emailErr) {
        logger.error('Ambassador apply notification email error:', emailErr);
      }
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    logger.error('Ambassador apply error:', err);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
