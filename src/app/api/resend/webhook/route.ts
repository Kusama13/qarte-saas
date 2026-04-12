import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import logger from '@/lib/logger';
import crypto from 'crypto';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Resend webhook events we care about
// See: https://resend.com/docs/dashboard/webhooks/introduction
type ResendEvent = {
  type: string;
  created_at: string;
  data: {
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    created_at: string;
  };
};

// Verify Resend webhook signature (svix)
function verifySignature(payload: string, headers: Headers): boolean {
  const signingSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!signingSecret) {
    logger.warn('[resend-webhook] RESEND_WEBHOOK_SECRET not configured, skipping verification');
    return true; // Allow in dev
  }

  const svixId = headers.get('svix-id');
  const svixTimestamp = headers.get('svix-timestamp');
  const svixSignature = headers.get('svix-signature');

  if (!svixId || !svixTimestamp || !svixSignature) return false;

  // Prevent replay attacks (reject if timestamp is older than 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  const ts = parseInt(svixTimestamp, 10);
  if (Math.abs(now - ts) > 300) return false;

  // Compute expected signature
  const secretBytes = Buffer.from(signingSecret.replace('whsec_', ''), 'base64');
  const toSign = `${svixId}.${svixTimestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac('sha256', secretBytes)
    .update(toSign)
    .digest('base64');

  // svix-signature can contain multiple signatures separated by space
  const signatures = svixSignature.split(' ');
  return signatures.some(sig => {
    const sigValue = sig.replace(/^v\d+,/, '');
    const a = Buffer.from(sigValue);
    const b = Buffer.from(expectedSignature);
    if (a.length !== b.length) return false;
    return crypto.timingSafeEqual(a, b);
  });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    // Verify signature
    if (!verifySignature(rawBody, request.headers)) {
      logger.warn('[resend-webhook] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event: ResendEvent = JSON.parse(rawBody);
    const recipientEmail = event.data?.to?.[0];

    if (!recipientEmail) {
      return NextResponse.json({ received: true });
    }

    logger.info(`[resend-webhook] ${event.type} for ${recipientEmail}`);

    switch (event.type) {
      case 'email.bounced': {
        // Hard bounce — mark merchant so we stop sending
        const { data: bounceUser } = await supabase.rpc('get_user_id_by_email', { target_email: recipientEmail }) as { data: { id: string }[] | null };
        const bounceUserId = bounceUser?.[0]?.id;

        if (bounceUserId) {
          const { error } = await supabase
            .from('merchants')
            .update({ email_bounced_at: new Date().toISOString() })
            .eq('user_id', bounceUserId)
            .is('email_bounced_at', null);

          if (error) {
            logger.error('[resend-webhook] Failed to mark bounce:', error);
          } else {
            logger.info(`[resend-webhook] Marked merchant as bounced for ${recipientEmail}`);
          }
        } else {
          logger.info(`[resend-webhook] No merchant found for bounced email ${recipientEmail}`);
        }
        break;
      }

      case 'email.complained': {
        // Spam complaint — treat like unsubscribe
        const { data: complaintUser } = await supabase.rpc('get_user_id_by_email', { target_email: recipientEmail }) as { data: { id: string }[] | null };
        const complaintUserId = complaintUser?.[0]?.id;

        if (complaintUserId) {
          await supabase
            .from('merchants')
            .update({ email_unsubscribed_at: new Date().toISOString() })
            .eq('user_id', complaintUserId)
            .is('email_unsubscribed_at', null);

          logger.info(`[resend-webhook] Marked merchant as unsubscribed (complaint) for ${recipientEmail}`);
        }
        break;
      }

      default:
        // email.sent, email.delivered, email.opened, email.clicked — logged by Resend, no action needed
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    logger.error('[resend-webhook] Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
