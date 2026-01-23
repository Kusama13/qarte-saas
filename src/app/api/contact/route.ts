import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { validateEmail } from '@/lib/utils';
import { z } from 'zod';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';
import logger from '@/lib/logger';
import { resend, EMAIL_FROM } from '@/lib/resend';

const contactSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  subject: z.enum(['question', 'bug', 'feature', 'other']),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 5 messages par heure par IP
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`contact:${ip}`, RATE_LIMITS.contact);

    if (!rateLimit.success) {
      logger.warn(`Rate limit exceeded for contact: ${ip}`);
      return rateLimitResponse(rateLimit.resetTime);
    }

    const body = await request.json();
    const parsed = contactSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Données invalides', details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, subject, message } = parsed.data;

    if (!validateEmail(email)) {
      return NextResponse.json(
        { error: 'Email invalide' },
        { status: 400 }
      );
    }

    const supabase = createServerClient();

    const subjectLabels: Record<string, string> = {
      question: 'Question',
      bug: 'Bug',
      feature: 'Demande de fonctionnalité',
      other: 'Autre',
    };

    const { error } = await supabase.from('contact_messages').insert({
      name,
      email,
      subject: subjectLabels[subject] || subject,
      message,
    });

    if (error) {
      logger.error('Contact insert error:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message' },
        { status: 500 }
      );
    }

    // Envoyer l'email à contact@getqarte.com
    if (resend) {
      try {
        await resend.emails.send({
          from: EMAIL_FROM,
          to: 'contact@getqarte.com',
          replyTo: email,
          subject: `[Contact Qarte] ${subjectLabels[subject] || subject} - ${name}`,
          html: `
            <h2>Nouveau message de contact</h2>
            <p><strong>Nom :</strong> ${name}</p>
            <p><strong>Email :</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Sujet :</strong> ${subjectLabels[subject] || subject}</p>
            <hr />
            <p><strong>Message :</strong></p>
            <p style="white-space: pre-wrap;">${message}</p>
            <hr />
            <p style="color: #666; font-size: 12px;">
              Envoyé depuis le formulaire de contact Qarte le ${new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris' })}
            </p>
          `,
        });
        logger.info(`Contact email sent from ${email}`);
      } catch (emailError) {
        logger.error('Failed to send contact email:', emailError);
        // On continue même si l'email échoue, le message est en base
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Votre message a été envoyé avec succès',
    });
  } catch (error) {
    logger.error('Contact error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
