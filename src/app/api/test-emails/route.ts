import { NextRequest, NextResponse } from 'next/server';
import { resend, EMAIL_FROM, EMAIL_REPLY_TO } from '@/lib/resend';
import { render } from '@react-email/render';
import { WelcomeEmail } from '@/emails';

// Route de test - À SUPPRIMER EN PRODUCTION
export async function POST(request: NextRequest) {
  // Auth désactivée temporairement pour test
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    // Debug info
    const debug = {
      hasResend: !!resend,
      hasApiKey: !!process.env.RESEND_API_KEY,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 6) || 'none',
      emailFrom: EMAIL_FROM,
      emailReplyTo: EMAIL_REPLY_TO,
    };

    if (!resend) {
      return NextResponse.json({
        success: false,
        error: 'Resend not configured',
        debug,
      });
    }

    // Render email to HTML
    const html = await render(WelcomeEmail({ shopName: 'Boulangerie Test' }));

    // Test simple avec un seul email
    const { data, error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: email,
      replyTo: EMAIL_REPLY_TO,
      subject: 'Test Qarte - Bienvenue',
      html,
    });

    return NextResponse.json({
      success: !error,
      data,
      error: error ? { name: error.name, message: error.message } : null,
      debug,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 });
  }
}
