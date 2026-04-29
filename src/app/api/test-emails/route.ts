import { NextRequest, NextResponse } from 'next/server';
import { render } from '@react-email/render';
import { QRCodeEmail } from '@/emails';
import {
  sendWelcomeEmail,
  sendTrialEndingEmail,
  sendTrialExpiredEmail,
  sendSubscriptionConfirmedEmail,
  sendQRCodeEmail,
  sendReactivationEmail,
} from '@/lib/email';
import logger from '@/lib/logger';

// GET - Preview emails in browser (dev only)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');

  try {
    let html: string;

    if (type === 'qrcode') {
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
      return NextResponse.json({ error: 'Invalid email type. Use ?type=qrcode' }, { status: 400 });
    }

    return NextResponse.json({ html });
  } catch (error) {
    logger.error('Error rendering email:', error);
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
    const welcome = await sendWelcomeEmail(email, 'Boulangerie Test', 'boulangerie-test');
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

    const subscription = await sendSubscriptionConfirmedEmail({ to: email, shopName: 'Boulangerie Test', billingInterval: 'monthly' });
    results.push({ type: 'subscription_confirmed_monthly', ...subscription });
    await delay(600);

    const subscriptionAnnual = await sendSubscriptionConfirmedEmail({ to: email, shopName: 'Boulangerie Test', billingInterval: 'annual', smsQuota: 120 });
    results.push({ type: 'subscription_confirmed_annual', ...subscriptionAnnual });
    await delay(600);

    // 6. Email réactivation J+14
    const reactivation14 = await sendReactivationEmail(email, 'Boulangerie Test', 14, 42);
    results.push({ type: 'reactivation_14days', ...reactivation14 });
    await delay(600);

    // 7. Email réactivation J+30
    const reactivation30 = await sendReactivationEmail(email, 'Boulangerie Test', 30, 42);
    results.push({ type: 'reactivation_30days', ...reactivation30 });

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount === results.length,
      message: `${successCount}/${results.length} emails envoyés à ${email}`,
      results,
    });
  } catch (error) {
    logger.error('Test emails error:', error);
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 });
  }
}
