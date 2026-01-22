import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

// Timing-safe string comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Compare against itself to maintain constant time
    timingSafeEqual(Buffer.from(a), Buffer.from(a));
    return false;
  }
  return timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

export async function POST(request: Request) {
  try {
    // Rate limiting: 5 tentatives par minute
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`admin-auth:${ip}`, RATE_LIMITS.auth);

    if (!rateLimit.success) {
      logger.warn(`Rate limit exceeded for admin auth: ${ip}`);
      return rateLimitResponse(rateLimit.resetTime);
    }

    const { secretCode } = await request.json();

    const adminSecretCode = process.env.ADMIN_SECRET_CODE;

    if (!adminSecretCode) {
      logger.error('ADMIN_SECRET_CODE not configured');
      return NextResponse.json(
        { error: 'Configuration error' },
        { status: 500 }
      );
    }

    if (!secretCode || !safeCompare(secretCode, adminSecretCode)) {
      return NextResponse.json(
        { error: 'Invalid secret code' },
        { status: 401 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Admin auth error', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
