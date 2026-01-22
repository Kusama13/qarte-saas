import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPendingPointsEmail } from '@/lib/email';
import logger from '@/lib/logger';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const CRON_SECRET = process.env.CRON_SECRET;

// Email schedule: Initial alert (day 0-1), then reminders at day 2 and day 3
// After day 3, we stop sending reminders
const INITIAL_ALERT_DAYS = [0, 1]; // Send initial alert on day 0 or 1
const REMINDER_DAYS = [2, 3]; // Send reminders on day 2 and 3

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Get all merchants with pending visits
    const { data: merchantsWithPending, error: merchantsError } = await supabase
      .from('visits')
      .select('merchant_id')
      .eq('status', 'pending')
      .order('merchant_id');

    if (merchantsError) {
      logger.error('Failed to fetch pending visits', merchantsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Get unique merchant IDs
    const uniqueMerchantIds = [...new Set(merchantsWithPending?.map(v => v.merchant_id) || [])];

    const results = {
      processed: 0,
      emailsSent: 0,
      skipped: 0,
      errors: 0,
    };

    for (const merchantId of uniqueMerchantIds) {
      results.processed++;

      // Get merchant info
      const { data: merchant, error: merchantError } = await supabase
        .from('merchants')
        .select('id, shop_name, user_id')
        .eq('id', merchantId)
        .single();

      if (merchantError || !merchant) {
        logger.warn(`Merchant not found: ${merchantId}`);
        results.errors++;
        continue;
      }

      // Get user email
      const { data: userData } = await supabase.auth.admin.getUserById(merchant.user_id);
      const email = userData?.user?.email;

      if (!email) {
        logger.warn(`No email found for merchant ${merchant.shop_name}`);
        results.skipped++;
        continue;
      }

      // Get pending visits count and oldest pending date
      const { data: pendingVisits, error: pendingError } = await supabase
        .from('visits')
        .select('id, visited_at')
        .eq('merchant_id', merchantId)
        .eq('status', 'pending')
        .order('visited_at', { ascending: true });

      if (pendingError || !pendingVisits || pendingVisits.length === 0) {
        results.skipped++;
        continue;
      }

      const pendingCount = pendingVisits.length;
      const oldestPendingDate = new Date(pendingVisits[0].visited_at);
      const now = new Date();
      const daysSinceFirst = Math.floor(
        (now.getTime() - oldestPendingDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Determine email type
      const isInitialAlert = INITIAL_ALERT_DAYS.includes(daysSinceFirst);
      const isReminder = REMINDER_DAYS.includes(daysSinceFirst);

      // Check if we should send any email
      if (!isInitialAlert && !isReminder) {
        results.skipped++;
        continue;
      }

      // Check email tracking to avoid duplicate emails
      const { data: existingTracking } = await supabase
        .from('pending_email_tracking')
        .select('id')
        .eq('merchant_id', merchantId)
        .eq('reminder_day', daysSinceFirst)
        .single();

      if (existingTracking) {
        logger.info(`Reminder already sent for ${merchant.shop_name} on day ${daysSinceFirst}`);
        results.skipped++;
        continue;
      }

      try {
        // Send email (initial alert or reminder)
        const result = await sendPendingPointsEmail(
          email,
          merchant.shop_name,
          pendingCount,
          isReminder, // false for initial alert, true for reminder
          isReminder ? daysSinceFirst : undefined
        );

        if (result.success) {
          // Track that we sent this email
          await supabase.from('pending_email_tracking').insert({
            merchant_id: merchantId,
            reminder_day: daysSinceFirst,
            pending_count: pendingCount,
          });

          results.emailsSent++;
          const emailType = isReminder ? 'Reminder' : 'Initial alert';
          logger.info(`${emailType} sent to ${merchant.shop_name}: ${pendingCount} pending, day ${daysSinceFirst}`);
        } else {
          results.errors++;
        }
      } catch (err) {
        logger.error(`Failed to send email to ${merchant.shop_name}`, err);
        results.errors++;
      }
    }

    // Clean up old tracking records (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    await supabase
      .from('pending_email_tracking')
      .delete()
      .lt('sent_at', sevenDaysAgo.toISOString());

    logger.info('Pending reminders cron completed', results);

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    logger.error('Cron job error', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
