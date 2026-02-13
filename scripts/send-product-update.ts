import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import { ProductUpdateEmail } from '../src/emails/index';

const resend = new Resend(process.env.RESEND_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function main() {
  // Fetch all active/trial merchants
  const { data: merchants, error: dbError } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, referral_code')
    .in('subscription_status', ['trial', 'active']);

  if (dbError) {
    console.error('DB error:', dbError.message);
    process.exit(1);
  }

  if (!merchants || merchants.length === 0) {
    console.log('No active merchants found.');
    process.exit(0);
  }

  console.log(`Found ${merchants.length} active merchants.`);

  // Batch fetch user emails
  const emailMap = new Map<string, string>();
  const userIds = [...new Set(merchants.map(m => m.user_id))];

  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    await Promise.allSettled(batch.map(async (userId) => {
      const { data: userData } = await supabase.auth.admin.getUserById(userId);
      const email = userData?.user?.email;
      if (email) emailMap.set(userId, email);
    }));
  }

  let sent = 0;
  let errors = 0;
  let skipped = 0;

  for (const merchant of merchants) {
    const email = emailMap.get(merchant.user_id);
    if (!email) {
      console.log(`  SKIP ${merchant.shop_name} — no email found`);
      skipped++;
      continue;
    }

    try {
      const html = await render(ProductUpdateEmail({
        shopName: merchant.shop_name,
        merchantId: merchant.id,
        referralCode: merchant.referral_code || undefined,
      }));
      const text = await render(ProductUpdateEmail({
        shopName: merchant.shop_name,
        merchantId: merchant.id,
        referralCode: merchant.referral_code || undefined,
      }), { plainText: true });

      const { error } = await resend.emails.send({
        from: 'Qarte <notifications@getqarte.com>',
        to: email,
        replyTo: 'support@getqarte.com',
        subject: `${merchant.shop_name}, découvrez les nouveautés Qarte de la semaine`,
        html,
        text,
        headers: {
          'List-Unsubscribe': '<mailto:contact@getqarte.com?subject=Desinscription>',
        },
      });

      if (error) {
        console.error(`  FAIL ${merchant.shop_name} (${email}):`, error.message);
        errors++;
      } else {
        console.log(`  OK   ${merchant.shop_name} (${email})`);
        sent++;
      }
    } catch (err) {
      console.error(`  ERR  ${merchant.shop_name}:`, err);
      errors++;
    }

    // Resend rate limit: 2 req/s
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  console.log(`\nDone: ${sent} sent, ${skipped} skipped, ${errors} errors (total: ${merchants.length})`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch(err => { console.error(err); process.exit(1); });
