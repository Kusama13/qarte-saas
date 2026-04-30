import { createHmac } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from './customer-auth-shared';

export { COOKIE_NAME } from './customer-auth-shared';
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

function getSecret(): string {
  // Derive from service role key — always available server-side
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createHmac('sha256', key).update('qarte-customer-auth').digest('hex');
}

/** Sign a phone number → "phone.signature" */
function signPhone(phone: string): string {
  const sig = createHmac('sha256', getSecret()).update(phone).digest('base64url');
  return `${phone}.${sig}`;
}

/** Verify a signed cookie value → phone or null */
function verifyPhone(cookieValue: string): string | null {
  const dotIndex = cookieValue.lastIndexOf('.');
  if (dotIndex === -1) return null;

  const phone = cookieValue.slice(0, dotIndex);
  const sig = cookieValue.slice(dotIndex + 1);

  const expectedSig = createHmac('sha256', getSecret()).update(phone).digest('base64url');

  // Constant-time comparison
  if (sig.length !== expectedSig.length) return null;
  let mismatch = 0;
  for (let i = 0; i < sig.length; i++) {
    mismatch |= sig.charCodeAt(i) ^ expectedSig.charCodeAt(i);
  }
  return mismatch === 0 ? phone : null;
}

/** Read the authenticated phone from the request cookie. Returns null if missing/invalid. */
export function getAuthenticatedPhone(request: NextRequest): string | null {
  const cookie = request.cookies.get(COOKIE_NAME);
  if (!cookie?.value) return null;
  return verifyPhone(cookie.value);
}

/** Build a Set-Cookie header string for the signed phone cookie. */
function buildSetCookie(phone: string): string {
  const value = signPhone(phone);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE_NAME}=${value}; HttpOnly; SameSite=Strict${secure}; Path=/; Max-Age=${MAX_AGE_SECONDS}`;
}

/** Attach the signed phone cookie to a NextResponse. */
export function setPhoneCookie(response: NextResponse, phone: string): NextResponse {
  response.headers.append('Set-Cookie', buildSetCookie(phone));
  return response;
}

/** Build a Set-Cookie header that clears the phone cookie. */
export function clearPhoneCookie(response: NextResponse): NextResponse {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  response.headers.append(
    'Set-Cookie',
    `${COOKIE_NAME}=; HttpOnly; SameSite=Strict${secure}; Path=/; Max-Age=0`,
  );
  return response;
}
