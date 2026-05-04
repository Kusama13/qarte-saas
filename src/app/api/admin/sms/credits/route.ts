import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { getOvhCredit } from '@/lib/ovh-sms';
import { getSmsPartnerCredit } from '@/lib/sms-partner';

// Cache module-level 5 min : Vercel revalidate ne fonctionne pas sur une route
// avec authorizeAdmin (request reading = dynamic). On cache nous-même.
// Cold start = fresh fetch (10s max) ; warm instance = sub-50ms.
const CACHE_TTL_MS = 5 * 60 * 1000;
let cached: { at: number; payload: unknown } | null = null;

export async function GET(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-sms-credits');
  if (auth.response) return auth.response;

  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json(cached.payload);
  }

  const [ovh, partner] = await Promise.all([getOvhCredit(), getSmsPartnerCredit()]);
  const payload = {
    ovh: { credits: ovh, available: ovh !== null },
    sms_partner: { credits: partner, available: partner !== null },
    fetched_at: new Date().toISOString(),
  };
  cached = { at: Date.now(), payload };
  return NextResponse.json(payload);
}
