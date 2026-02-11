import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { EbookEmail, QRCodeEmail } from '@/emails';
import {
  sendWelcomeEmail,
  sendTrialEndingEmail,
  sendTrialExpiredEmail,
  sendSubscriptionConfirmedEmail,
  sendQRCodeEmail,
  sendReactivationEmail,
} from '@/lib/email';

// GET - Preview emails in browser (dev only)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    let html: string;

    if (type === 'ebook') {
      html = await render(EbookEmail({
        downloadUrl: 'https://getqarte.com/ebooks/guide-fidelisation.pdf',
      }));
    } else if (type === 'qrcode') {
      html = await render(QRCodeEmail({
        shopName: 'Le Salon de Clara',
        rewardDescription: '1 brushing offert',
        stampsRequired: 10,
        primaryColor: '#654EDA',
        logoUrl: 'https://images.unsplash.com/photo-1560066984-138dadb4c035?w=200',
        tier2Enabled: true,
        tier2StampsRequired: 15,
        tier2RewardDescription: '1 soin complet offert',
      }));
    } else {
      return NextResponse.json({ error: 'Invalid email type. Use ?type=ebook or ?type=qrcode' }, { status: 400 });
    }

    return NextResponse.json({ html });
  } catch (error) {
    console.error('Error rendering email:', error);
    return NextResponse.json({ error: 'Failed to render email' }, { status: 500 });
  }
}

// POST - Send test emails (requires admin token)
export async function POST(request: NextRequest) {
  // Vérifier l'authentification admin (obligatoire)
  const authHeader = request.headers.get('authorization');
  const adminToken = process.env.ADMIN_SECRET_TOKEN;

  // Token obligatoire - refuse si non configuré ou invalide
  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { email, type } = await request.json();

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
    await delay(600);

    // 6. Email essai expiré AVEC code promo QARTE50
    const trialExpiredPromo = await sendTrialExpiredEmail(email, 'Boulangerie Test', 5, 'QARTE50');
    results.push({ type: 'trial_expired_promo', ...trialExpiredPromo });
    await delay(600);

    // 7. Email réactivation AVEC code promo QARTEBOOST (2 mois)
    const reactivationPromo = await sendReactivationEmail(email, 'Boulangerie Test', 14, 42, 'QARTEBOOST', 2);
    results.push({ type: 'reactivation_promo_2months', ...reactivationPromo });
    await delay(600);

    // 8. Email réactivation AVEC code promo QARTELAST (3 mois)
    const reactivationLast = await sendReactivationEmail(email, 'Boulangerie Test', 30, 42, 'QARTELAST', 3);
    results.push({ type: 'reactivation_promo_3months', ...reactivationLast });

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
