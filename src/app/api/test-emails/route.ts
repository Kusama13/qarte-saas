import { NextRequest, NextResponse } from 'next/server';
import {
  sendWelcomeEmail,
  sendTrialEndingEmail,
  sendTrialExpiredEmail,
  sendSubscriptionConfirmedEmail,
} from '@/lib/email';

// Route de test - À SUPPRIMER EN PRODUCTION
export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_SECRET_TOKEN;

  if (adminToken && authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email requis' }, { status: 400 });
    }

    const results = [];
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Email de bienvenue
    const welcome = await sendWelcomeEmail(email, 'Boulangerie Test');
    results.push({ type: 'welcome', ...welcome });
    await delay(600);

    // 2. Email fin d'essai (3 jours)
    const trialEnding3 = await sendTrialEndingEmail(email, 'Boulangerie Test', 3);
    results.push({ type: 'trial_ending_3days', ...trialEnding3 });
    await delay(600);

    // 3. Email fin d'essai (1 jour - urgent)
    const trialEnding1 = await sendTrialEndingEmail(email, 'Boulangerie Test', 1);
    results.push({ type: 'trial_ending_1day', ...trialEnding1 });
    await delay(600);

    // 4. Email essai expiré (5 jours avant suppression)
    const trialExpired = await sendTrialExpiredEmail(email, 'Boulangerie Test', 5);
    results.push({ type: 'trial_expired', ...trialExpired });
    await delay(600);

    // 5. Email confirmation abonnement
    const subscription = await sendSubscriptionConfirmedEmail(email, 'Boulangerie Test');
    results.push({ type: 'subscription_confirmed', ...subscription });

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount === results.length,
      message: `${successCount}/${results.length} emails envoyés à ${email}`,
      results,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Erreur serveur',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
