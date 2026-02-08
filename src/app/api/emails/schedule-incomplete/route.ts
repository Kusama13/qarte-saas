import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { scheduleIncompleteSignupEmail } from '@/lib/email';
import logger from '@/lib/logger';
import { checkRateLimit, getClientIP, rateLimitResponse } from '@/lib/rate-limit';

const supabaseAdmin = getSupabaseAdmin();

// POST: Schedule an incomplete signup reminder email (1h after signup)
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

    // Schedule the email for 15 minutes from now
    const result = await scheduleIncompleteSignupEmail(email, 15);

    if (!result.success) {
      logger.error(`Failed to schedule incomplete email for ${email}`, result.error);
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    // Store the scheduled email ID in user metadata for later cancellation
    if (result.emailId) {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          ...userData.user.user_metadata,
          scheduled_incomplete_email_id: result.emailId,
        },
      });
      logger.info(`Stored scheduled email ID ${result.emailId} for user ${userId}`);
    }

    return NextResponse.json({ success: true, emailId: result.emailId });
  } catch (error) {
    logger.error('Error in schedule-incomplete API', error);
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    );
  }
}
