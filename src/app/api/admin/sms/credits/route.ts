import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin, createTtlCache } from '@/lib/api-helpers';
import { getOvhCredit } from '@/lib/ovh-sms';
import { getSmsPartnerCredit } from '@/lib/sms-partner';

const cache = createTtlCache<string, unknown>(5 * 60 * 1000);

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-sms-credits');
  if (auth.response) return auth.response;

  const hit = cache.get('default');
  if (hit) return NextResponse.json(hit);

  const [ovh, partner] = await Promise.all([getOvhCredit(), getSmsPartnerCredit()]);
  const payload = {
    ovh: { credits: ovh, available: ovh !== null },
    sms_partner: { credits: partner, available: partner !== null },
    fetched_at: new Date().toISOString(),
  };
  cache.set('default', payload);
  return NextResponse.json(payload);
}
