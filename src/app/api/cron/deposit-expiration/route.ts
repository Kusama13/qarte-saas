export const maxDuration = 60;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import webpush from 'web-push';
import { verifyCronAuth } from '@/lib/cron-helpers';
import { releaseExpiredDeposits } from '@/lib/deposit-release';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails('mailto:contact@getqarte.com', vapidPublicKey, vapidPrivateKey);
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const start = Date.now();
  try {
    const result = await releaseExpiredDeposits(supabase, { limit: 200 });
    const elapsedMs = Date.now() - start;
    logger.info('Deposit expiration cron completed', { ...result, elapsedMs });
    return NextResponse.json({ success: true, elapsedMs, ...result });
  } catch (err) {
    logger.error('Deposit expiration cron error', err);
    return NextResponse.json({ success: false, error: String(err) }, { status: 500 });
  }
}
