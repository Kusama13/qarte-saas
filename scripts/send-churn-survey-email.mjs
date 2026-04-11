/**
 * One-off script: Send churn survey reminder email to all fully-expired merchants (> J+3)
 * who haven't completed the survey yet AND haven't already received the email (tracking code -213).
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... node scripts/send-churn-survey-email.mjs [--dry-run]
 *
 * Behavior:
 *   - Selects merchants with subscription_status='trial', trial_ends_at < NOW - 3 days, churn_survey_seen_at IS NULL
 *   - Excludes admins, no_contact, and merchants who already have tracking code -213 in pending_email_tracking
 *   - Sends email and inserts tracking row -213 to prevent tomorrow's cron from re-sending
 *   - Respects Resend rate limit (600ms between calls)
 */

const SUPABASE_URL = 'https://deaoytdanrsacmabnnpa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const isDryRun = process.argv.includes('--dry-run');
const TRACKING_CODE = -213;

if (!SUPABASE_KEY || !RESEND_KEY) {
  console.error('Missing env vars. Run with: SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... node scripts/send-churn-survey-email.mjs');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`Supabase GET error: ${res.status} ${await res.text()}`);
  return res.json();
}

async function supabasePost(path, body) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Supabase POST error: ${res.status} ${await res.text()}`);
}

async function getUserEmail(userId) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, { headers });
  if (!res.ok) return null;
  const data = await res.json();
  return data.email || null;
}

function buildHtml(shopName, locale) {
  const isEN = locale === 'en';

  const t = {
    preview: isEN
      ? `${shopName}, 2 free days if you help us understand`
      : `${shopName}, 2 jours offerts si tu nous aides à comprendre`,
    heading: isEN
      ? '2 free days, in exchange for 30 seconds'
      : "2 jours offerts, en échange de 30 secondes",
    greeting: isEN ? `Hi <strong>${shopName}</strong>,` : `Bonjour <strong>${shopName}</strong>,`,
    intro: isEN
      ? "Your Qarte trial has ended and we'd really love to understand what held you back. Your feedback helps us improve the tool for all salons."
      : "Ton essai Qarte est terminé, et on aimerait vraiment comprendre ce qui t'a bloqué. Ton retour nous aide à améliorer l'outil pour tous les salons.",
    offerBadge: isEN ? 'Thank-you gift' : 'Cadeau de remerciement',
    offerTitle: isEN ? '2 extra trial days' : "2 jours d'essai en plus",
    offerText: isEN
      ? "Answer 4 quick questions about your experience and we'll reactivate your account for 2 more days. Our way of saying thank you."
      : "Réponds à 4 questions rapides sur ton expérience et on te rallume ton compte pour 2 jours supplémentaires. C'est notre façon de te dire merci.",
    cta: isEN ? 'Answer and get 2 days' : 'Répondre et obtenir 2 jours',
    duration: isEN ? '4 questions, under 1 minute.' : '4 questions, moins de 1 minute.',
    questionText: isEN
      ? 'A question? Just reply to this email, we read everything.'
      : 'Une question ? Réponds directement à cet email, on te lit.',
    signaturePrefix: isEN ? 'Talk soon,' : 'À très vite,',
    signature: isEN ? 'The Qarte Team' : "L'équipe Qarte",
    allRights: `© ${new Date().getFullYear()} Qarte. ${isEN ? 'All rights reserved.' : 'Tous droits réservés.'}`,
    address: 'SAS Tenga Labs — 60 rue François 1er, 75008 Paris',
    website: isEN ? 'Website' : 'Site web',
    contact: 'Contact',
    privacy: isEN ? 'Privacy' : 'Confidentialité',
    unsubscribe: isEN ? 'Unsubscribe' : 'Se désinscrire',
  };

  return `<!DOCTYPE html>
<html lang="${locale}">
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width"/></head>
<body style="background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif;margin:0;padding:0">
<div style="display:none;max-height:0;overflow:hidden">${t.preview}</div>
<div style="background-color:#ffffff;margin:40px auto;border-radius:16px;overflow:hidden;max-width:600px">

<!-- Banner -->
<div style="padding:0;text-align:center">
<img src="https://getqarte.com/images/email-banner.png" alt="Qarte" width="600" style="width:100%;display:block"/>
</div>

<!-- Content -->
<div style="padding:40px">

<h1 style="color:#1a1a1a;font-size:24px;font-weight:600;line-height:1.3;margin:0 0 24px">${t.heading}</h1>

<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px">${t.greeting}</p>
<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px">${t.intro}</p>

<!-- Offer card (gradient) -->
<div style="background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);border-radius:12px;padding:24px;margin:28px 0;text-align:center">
<p style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin:0 0 8px;opacity:0.85">${t.offerBadge}</p>
<p style="color:#ffffff;font-size:22px;font-weight:700;line-height:1.3;margin:0 0 12px">${t.offerTitle}</p>
<p style="color:#ffffff;font-size:15px;line-height:1.6;margin:0;opacity:0.92">${t.offerText}</p>
</div>

<!-- CTA -->
<div style="text-align:center;margin:28px 0 16px">
<a href="https://getqarte.com/dashboard/survey" style="display:inline-block;background-color:#4b0082;border-radius:8px;color:#ffffff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px">${t.cta}</a>
</div>

<p style="color:#9ca3af;font-size:13px;text-align:center;margin:0 0 24px">${t.duration}</p>

<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px">${t.questionText}</p>

<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:24px 0 0">
${t.signaturePrefix}<br/>
${t.signature}
</p>

</div>

<!-- Footer -->
<div style="background-color:#f6f9fc;padding:24px 40px;text-align:center">
<p style="font-size:13px;margin:0 0 12px">
<a href="https://www.instagram.com/qarte.app" style="color:#4b0082;text-decoration:none;font-weight:600">Instagram</a> •
<a href="https://www.facebook.com/profile.php?id=61587048661028" style="color:#4b0082;text-decoration:none;font-weight:600">Facebook</a> •
<a href="https://www.tiktok.com/@getqarte" style="color:#4b0082;text-decoration:none;font-weight:600">TikTok</a>
</p>
<p style="color:#8898aa;font-size:12px;margin:0 0 8px">${t.allRights}</p>
<p style="color:#8898aa;font-size:11px;margin:0 0 8px">${t.address}</p>
<p style="color:#8898aa;font-size:12px;margin:0">
<a href="https://getqarte.com" style="color:#4b0082;text-decoration:none">${t.website}</a> •
<a href="https://getqarte.com/contact" style="color:#4b0082;text-decoration:none">${t.contact}</a> •
<a href="https://getqarte.com/politique-confidentialite" style="color:#4b0082;text-decoration:none">${t.privacy}</a>
</p>
<p style="color:#8898aa;font-size:11px;margin-top:16px">
<a href="mailto:contact@getqarte.com?subject=D%C3%A9sinscription" style="color:#8898aa;text-decoration:underline">${t.unsubscribe}</a>
</p>
</div>

</div>
</body>
</html>`;
}

async function main() {
  // 1. Fetch admin IDs to exclude
  const admins = await supabaseGet('super_admins?select=user_id');
  const adminIds = new Set(admins.map((a) => a.user_id));

  // 2. Fetch all trial merchants (filter fully expired in JS for safety)
  const allMerchants = await supabaseGet(
    'merchants?select=id,user_id,shop_name,locale,subscription_status,trial_ends_at,churn_survey_seen_at,no_contact,deleted_at&subscription_status=eq.trial'
  );

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const eligible = allMerchants.filter((m) => {
    if (adminIds.has(m.user_id)) return false;
    if (m.no_contact) return false;
    if (m.deleted_at) return false;
    if (m.churn_survey_seen_at) return false;
    if (!m.trial_ends_at) return false;
    return new Date(m.trial_ends_at) < threeDaysAgo;
  });

  console.log(`Found ${eligible.length} fully-expired merchants (> J+3, survey not completed)`);

  if (eligible.length === 0) {
    console.log('Nothing to send. Exiting.');
    return;
  }

  // 3. Fetch existing tracking rows for code -213 to skip merchants already notified
  const merchantIds = eligible.map((m) => m.id);
  const trackingFilter = `merchant_id=in.(${merchantIds.join(',')})&reminder_day=eq.${TRACKING_CODE}`;
  const existingTracking = await supabaseGet(`pending_email_tracking?select=merchant_id&${trackingFilter}`);
  const alreadySent = new Set(existingTracking.map((t) => t.merchant_id));

  const toSend = eligible.filter((m) => !alreadySent.has(m.id));

  console.log(`${alreadySent.size} already received the email (tracking code ${TRACKING_CODE}), ${toSend.length} to send`);

  if (toSend.length === 0) {
    console.log('All eligible merchants already received the email. Exiting.');
    return;
  }

  // 4. Fetch emails
  console.log('\nFetching user emails...');
  const merchantsWithEmail = [];
  for (const m of toSend) {
    const email = await getUserEmail(m.user_id);
    if (email) {
      merchantsWithEmail.push({ ...m, email });
    }
  }

  console.log(`\nReady to send to ${merchantsWithEmail.length} merchants:\n`);
  for (const m of merchantsWithEmail) {
    console.log(
      `  - ${m.shop_name} | ${m.email} | ${m.locale || 'fr'} | trial_ends: ${m.trial_ends_at?.slice(0, 10)}`
    );
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] No emails sent, no tracking inserted.');
    return;
  }

  console.log(`\nSending ${merchantsWithEmail.length} churn survey emails + inserting tracking rows...\n`);

  let sent = 0;
  let failed = 0;

  for (const merchant of merchantsWithEmail) {
    const locale = merchant.locale === 'en' ? 'en' : 'fr';
    const subject =
      locale === 'en'
        ? `${merchant.shop_name}, 2 free days`
        : `${merchant.shop_name}, 2 jours offerts`;

    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${RESEND_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Qarte <noreply@getqarte.com>',
          reply_to: 'contact@getqarte.com',
          to: merchant.email,
          subject,
          html: buildHtml(merchant.shop_name, locale),
          headers: {
            'List-Unsubscribe': '<mailto:contact@getqarte.com?subject=D%C3%A9sinscription>',
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error(`  FAIL ${merchant.shop_name}: ${err}`);
        failed++;
      } else {
        // Insert tracking row to prevent tomorrow's cron from re-sending
        try {
          await supabasePost('pending_email_tracking', {
            merchant_id: merchant.id,
            reminder_day: TRACKING_CODE,
            pending_count: 0,
          });
          console.log(`  OK   ${merchant.shop_name} (${merchant.email})`);
          sent++;
        } catch (trackErr) {
          console.error(
            `  WARN ${merchant.shop_name}: email sent but tracking insert failed: ${trackErr.message}`
          );
          sent++;
        }
      }

      // Resend rate limit: 600ms
      await new Promise((r) => setTimeout(r, 600));
    } catch (err) {
      console.error(`  FAIL ${merchant.shop_name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed out of ${merchantsWithEmail.length}`);
  console.log(`Tomorrow's cron (/api/cron/morning) will skip these merchants thanks to tracking code ${TRACKING_CODE}.`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
