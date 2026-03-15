import { createClient } from '@supabase/supabase-js';
import { sendAnnouncementMaPageEmail } from '../src/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function main() {
  // Fetch all merchants
  const { data: merchants, error } = await supabase
    .from('merchants')
    .select('id, user_id, shop_name, slug, subscription_status');

  if (error || !merchants) {
    console.error('Error fetching merchants:', error);
    return;
  }

  // Fetch emails from auth.users
  const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers({ perPage: 1000 });

  if (usersError || !users) {
    console.error('Error fetching users:', usersError);
    return;
  }

  const emailMap = new Map(users.map(u => [u.id, u.email]));

  // Exclude admin accounts
  const adminEmails = ['getqarte@gmail.com', 'judicael@getqarte.com'];

  const targets = merchants
    .map(m => ({
      ...m,
      email: emailMap.get(m.user_id),
    }))
    .filter(m => m.email && m.slug && !adminEmails.includes(m.email!));

  console.log(`Found ${targets.length} merchants to email (out of ${merchants.length} total).\n`);

  let sent = 0;
  let failed = 0;

  for (const m of targets) {
    const isSubscribed = ['active', 'trial', 'canceling'].includes(m.subscription_status);

    try {
      const result = await sendAnnouncementMaPageEmail(
        m.email!,
        m.shop_name,
        m.slug,
        isSubscribed
      );

      if (result.success) {
        sent++;
        console.log(`OK: ${m.shop_name} (${m.email}) — subscribed: ${isSubscribed}`);
      } else {
        failed++;
        console.log(`FAIL: ${m.shop_name} (${m.email}) — ${result.error}`);
      }
    } catch (err) {
      failed++;
      console.log(`ERROR: ${m.shop_name} (${m.email}) — ${err}`);
    }

    // Rate limit: 500ms entre chaque envoi (Resend limit: 10/s)
    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\nDone! Sent: ${sent}, Failed: ${failed}, Total: ${targets.length}`);
}

main().catch(console.error);
