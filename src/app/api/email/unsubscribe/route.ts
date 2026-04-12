import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function verifyUnsubscribeToken(token: string): string | null {
  const secret = process.env.CRON_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [merchantId, timestamp, signature] = parts;

  // Token expires after 90 days
  const ts = parseInt(timestamp, 10);
  if (isNaN(ts) || Math.floor(Date.now() / 1000) - ts > 90 * 24 * 3600) return null;

  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(`${merchantId}.${timestamp}`)
    .digest('hex')
    .slice(0, 16);

  if (signature !== expectedSignature) return null;

  return merchantId;
}

// POST: One-click unsubscribe (RFC 8058 — List-Unsubscribe-Post)
// Gmail/Yahoo send: POST with body "List-Unsubscribe=One-Click"
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({ error: 'Token required' }, { status: 400 });
    }

    const merchantId = verifyUnsubscribeToken(token);
    if (!merchantId) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 });
    }

    const { error } = await supabase
      .from('merchants')
      .update({ email_unsubscribed_at: new Date().toISOString() })
      .eq('id', merchantId)
      .is('email_unsubscribed_at', null);

    if (error) {
      logger.error('[unsubscribe] DB error:', error);
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    logger.info(`[unsubscribe] Merchant ${merchantId} unsubscribed via one-click`);
    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('[unsubscribe] Error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

// GET: Browser-based unsubscribe (user clicks link in email footer)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return new NextResponse(unsubscribePage('Lien invalide.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const merchantId = verifyUnsubscribeToken(token);
  if (!merchantId) {
    return new NextResponse(unsubscribePage('Ce lien a expire. Contacte support@getqarte.com pour te desinscrire.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const { error } = await supabase
    .from('merchants')
    .update({ email_unsubscribed_at: new Date().toISOString() })
    .eq('id', merchantId)
    .is('email_unsubscribed_at', null);

  if (error) {
    logger.error('[unsubscribe] DB error:', error);
    return new NextResponse(unsubscribePage('Erreur serveur. Reessaie plus tard.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  logger.info(`[unsubscribe] Merchant ${merchantId} unsubscribed via link`);
  return new NextResponse(unsubscribePage('Tu as ete desinscrit(e) des emails Qarte. Tu peux fermer cette page.', true), {
    status: 200,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function unsubscribePage(message: string, success: boolean): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Desinscription — Qarte</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb}
.card{max-width:400px;padding:2rem;text-align:center;background:white;border-radius:1rem;box-shadow:0 1px 3px rgba(0,0,0,.1)}
.icon{font-size:3rem;margin-bottom:1rem}
p{color:#374151;line-height:1.6}</style></head>
<body><div class="card"><div class="icon">${success ? '✓' : '⚠'}</div><p>${message}</p></div></body></html>`;
}
