import { NextResponse } from 'next/server';
import { clearPhoneCookie } from '@/lib/customer-auth';

// POST: Clear the HttpOnly customer cookie (logout)
export async function POST() {
  const response = NextResponse.json({ success: true });
  return clearPhoneCookie(response);
}
