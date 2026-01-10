import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { validateEmail } from '@/lib/utils';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  subject: z.enum(['question', 'bug', 'feature', 'other']),
  message: z.string().min(10, 'Le message doit contenir au moins 10 caractères'),
});

export async function POST(request: NextRequest) {
  try {
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
      console.error('Contact insert error:', error);
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Votre message a été envoyé avec succès',
    });
  } catch (error) {
    console.error('Contact error:', error);
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    );
  }
}
