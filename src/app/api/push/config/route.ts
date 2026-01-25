import { NextResponse } from 'next/server';

// This endpoint returns the VAPID public key for client-side push subscription
// The public key is safe to expose - it's needed for the Web Push protocol
export async function GET() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return NextResponse.json(
      { error: 'VAPID public key not configured' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    vapidPublicKey,
  });
}
