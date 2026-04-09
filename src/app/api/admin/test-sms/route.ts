import { NextRequest, NextResponse } from 'next/server';
import { authorizeAdmin } from '@/lib/api-helpers';
import { sendSms } from '@/lib/ovh-sms';

export async function POST(request: NextRequest) {
  const auth = await authorizeAdmin(request, 'admin-test-sms');
  if (auth.response) return auth.response;

  const { phone, message } = await request.json();
  if (!phone || !message) {
    return NextResponse.json({ error: 'phone and message required' }, { status: 400 });
  }

  const result = await sendSms(phone, message);
  return NextResponse.json(result);
}
