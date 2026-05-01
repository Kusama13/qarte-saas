import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedPhone } from '@/lib/customer-auth';

// GET: returns the phone number from the signed customer cookie (or null).
// Used by BookingModal to prefill the phone field for returning customers.
// Cookie is HttpOnly, so the only way to read it client-side is via this endpoint.
export async function GET(request: NextRequest) {
  const phone = getAuthenticatedPhone(request);
  return NextResponse.json({ phone }, {
    headers: { 'Cache-Control': 'no-store, max-age=0' },
  });
}
