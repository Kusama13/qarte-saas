import { NextResponse } from 'next/server';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitResponse, RATE_LIMITS } from '@/lib/rate-limit';

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

    if (secretCode !== adminSecretCode) {
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
