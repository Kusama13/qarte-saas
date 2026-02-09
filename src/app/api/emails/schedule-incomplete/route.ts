import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { scheduleIncompleteSignupEmail, scheduleIncompleteSignupReminder2Email } from '@/lib/email';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

// POST: Schedule incomplete signup reminder emails (T+15min and T+3h)
// Called from Phase 1 signup page after successful auth.signUp()
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 par heure par IP (aligne avec signup)
    const ip = getClientIP(request);
    const rateLimit = checkRateLimit(`schedule-incomplete:${ip}`, { maxRequests: 3, windowMs: 60 * 60 * 1000 });
    if (!rateLimit.success) {
      return rateLimitResponse(rateLimit.resetTime);
    }

    const { userId, email } = await request.json();

    if (!userId || !email) {
      return NextResponse.json(
        { error: 'userId and email required' },
        { status: 400 }
      );
    }

    // Verify user exists
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userError || !userData?.user) {
      logger.warn(`User ${userId} not found for scheduling incomplete email`);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if merchant already exists (shouldn't happen but safety check)
    const { data: merchant } = await supabaseAdmin
      .from('merchants')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (merchant) {
      logger.info(`User ${userId} already has merchant, skipping incomplete email`);
      return NextResponse.json({ success: true, skipped: true });
    }

    // Schedule email 1: T+15 minutes
    const result1 = await scheduleIncompleteSignupEmail(email, 15);

    if (!result1.success) {
      logger.error(`Failed to schedule incomplete email 1 for ${email}`, result1.error);
      return NextResponse.json(
        { error: result1.error },
        { status: 500 }
      );
    }

    // Resend rate limit: 2 req/s
    await new Promise(resolve => setTimeout(resolve, 600));

    // Schedule email 2: T+3 hours
    const result2 = await scheduleIncompleteSignupReminder2Email(email, 180);

    if (!result2.success) {
      logger.error(`Failed to schedule incomplete email 2 for ${email}`, result2.error);
      // Non-blocking: email 1 was already scheduled successfully
    }

    // Store both scheduled email IDs in user metadata for later cancellation
    const metadata: Record<string, string | null> = {
      ...userData.user.user_metadata,
    };
    if (result1.emailId) metadata.scheduled_incomplete_email_id = result1.emailId;
    if (result2.emailId) metadata.scheduled_incomplete_email_id_2 = result2.emailId;

    await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: metadata,
    });
    logger.info(`Stored scheduled email IDs for user ${userId}: email1=${result1.emailId}, email2=${result2.emailId}`);

    return NextResponse.json({
      success: true,
      emailId: result1.emailId,
      emailId2: result2.emailId,
    });
  } catch (error) {
    logger.error('Error in schedule-incomplete API', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
