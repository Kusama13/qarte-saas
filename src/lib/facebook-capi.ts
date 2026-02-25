import { createHash } from 'crypto';
import logger from '@/lib/logger';

const FB_PIXEL_ID = '1438158154679532';
const FB_API_VERSION = 'v21.0';

function sha256(value: string): string {
  return createHash('sha256').update(value.trim().toLowerCase()).digest('hex');
}

interface CapiPurchaseParams {
  email: string;
  value: number;
  currency?: string;
  contentName: string;
  eventId: string;
  sourceUrl?: string;
}

/**
 * Send a Purchase event to Facebook Conversions API.
 * Fire-and-forget — errors are logged but never thrown.
 */
export async function sendCapiPurchaseEvent({
  email,
  value,
  currency = 'EUR',
  contentName,
  eventId,
  sourceUrl = 'https://getqarte.com/dashboard/subscription',
}: CapiPurchaseParams): Promise<void> {
  const accessToken = process.env.FACEBOOK_CAPI_ACCESS_TOKEN;
  if (!accessToken) {
    logger.debug('FACEBOOK_CAPI_ACCESS_TOKEN not set — skipping CAPI event');
    return;
  }

  const payload = {
    data: [
      {
        event_name: 'Purchase',
        event_time: Math.floor(Date.now() / 1000),
        event_id: eventId,
        event_source_url: sourceUrl,
        action_source: 'website',
        user_data: {
          em: [sha256(email)],
        },
        custom_data: {
          value,
          currency,
          content_name: contentName,
        },
      },
    ],
    // In dev/test, add test_event_code to validate without polluting real data
    ...(process.env.FACEBOOK_CAPI_TEST_CODE && {
      test_event_code: process.env.FACEBOOK_CAPI_TEST_CODE,
    }),
  };

  const url = `https://graph.facebook.com/${FB_API_VERSION}/${FB_PIXEL_ID}/events?access_token=${accessToken}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    logger.error('Facebook CAPI error:', `${response.status} ${body}`);
  } else {
    logger.debug('Facebook CAPI Purchase sent:', eventId);
  }
}
