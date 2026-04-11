/**
 * One-off script: Send "Qarte features recap" email to all fully-expired merchants (> J+3).
 * Uses Resend scheduled_at to deliver at 18h Paris time (16h UTC in DST).
 *
 * Usage:
 *   SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... node scripts/send-features-recap.mjs [--dry-run]
 *
 * Schedule:
 *   All emails are scheduled via Resend for the same timestamp — Resend holds them
 *   in queue and delivers at the target time. Safe to run the script at any time.
 *
 * Tracking code: -214 (distinct from -213 churn survey reminder).
 */

const SUPABASE_URL = 'https://deaoytdanrsacmabnnpa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const isDryRun = process.argv.includes('--dry-run');
const TRACKING_CODE = -214;

// Target delivery: today at 18h00 Paris (CEST UTC+2 in April)
const SCHEDULED_AT = '2026-04-11T16:00:00Z';

if (!SUPABASE_KEY || !RESEND_KEY) {
  console.error('Missing env vars. Run with: SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... node scripts/send-features-recap.mjs');
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
      ? `${shopName}, here's everything Qarte does beyond loyalty`
      : `${shopName}, voici tout ce que Qarte fait au-delà de la fidélité`,
    heading: isEN ? 'Qarte is much more than loyalty' : "Qarte, c'est bien plus que de la fidélité",
    greeting: isEN ? `Hi <strong>${shopName}</strong>,` : `Bonjour <strong>${shopName}</strong>,`,
    intro: isEN
      ? "You may not have had the time to explore everything during your trial. Here's a recap of what Qarte really does for beauty salons who use it daily."
      : "Tu n'as peut-être pas eu le temps de tout explorer pendant ton essai. Voici un résumé de ce que Qarte fait vraiment pour les salons qui l'utilisent au quotidien.",

    f1Title: isEN ? 'Your own online salon page' : 'Ta vitrine en ligne pro',
    f1Desc: isEN
      ? 'A dedicated page with your bio, services, photos, opening hours and Google reviews. Referenced on Google. One link for your Instagram bio.'
      : 'Une page dédiée avec ta bio, tes prestations, tes photos, tes horaires et tes avis Google. Référencée sur Google. Un seul lien pour ta bio Instagram.',

    f2Title: isEN ? 'Online booking + calendar' : 'Réservation en ligne + planning',
    f2Desc: isEN
      ? 'Clients book directly from your page. Slot mode or free mode, optional deposit. No external app needed.'
      : 'Tes clientes réservent directement depuis ta page. Mode créneaux ou mode libre, acompte en option. Zéro app externe.',

    f3Title: isEN ? 'Automatic SMS' : 'SMS automatiques',
    f3Desc: isEN
      ? 'Booking confirmations, day-before reminders, birthday wishes, inactive client win-back. All sent automatically.'
      : 'Confirmations de RDV, rappels la veille, messages anniversaire, relance des clientes inactives. Tout est envoyé automatiquement.',

    f4Title: isEN ? 'Loyalty program (stamps or cashback)' : 'Programme fidélité (tampons ou cagnotte)',
    f4Desc: isEN
      ? 'Your clients collect stamps or cashback at every visit and come back more often. Set it up once, Qarte handles the rest.'
      : 'Tes clientes gagnent des tampons ou de la cagnotte à chaque visite et reviennent plus souvent. Configuration unique, Qarte gère le reste.',

    f5Title: isEN ? 'Welcome offer for new clients' : 'Offre de bienvenue pour nouvelles clientes',
    f5Desc: isEN
      ? 'An automatic promo (e.g. -20% on the 1st visit) triggered for every new client. A real acquisition lever.'
      : 'Une promo automatique (par exemple -20% dès le 1er RDV) déclenchée pour chaque nouvelle cliente. Un vrai levier d\'acquisition.',

    f6Title: isEN ? 'Automatic Google reviews' : 'Avis Google automatiques',
    f6Desc: isEN
      ? 'Qarte automatically asks satisfied clients to leave a Google review. Your star rating grows without any effort.'
      : 'Qarte propose automatiquement aux clientes satisfaites de laisser un avis Google. Tes étoiles grimpent sans effort de ta part.',

    giftBadge: isEN ? 'A gift just for you' : 'Un cadeau pour toi',
    giftTitle: isEN ? 'We give you 2 free days' : 'On t\'offre 2 jours gratuits',
    giftText: isEN
      ? 'Your account is ready to be reactivated for 2 days so you can test everything above. Answer 4 quick questions and your 2 days are unlocked instantly.'
      : 'Ton compte est prêt à être réactivé pendant 2 jours pour que tu puisses tout tester. Réponds à 4 questions rapides et tes 2 jours sont débloqués instantanément.',
    giftCta: isEN ? 'Get my 2 free days' : 'Récupérer mes 2 jours',

    cta: isEN ? 'Reactivate my account' : 'Réactiver mon compte',
    reassurance: isEN
      ? 'Your client data is still there. Nothing has been deleted.<br/>No commitment — cancel anytime.'
      : "Tes données clients sont toujours là. Rien n'a été supprimé.<br/>Sans engagement — annulable à tout moment.",
    signaturePrefix: isEN ? 'Talk soon,' : 'À très vite,',
    signature: isEN ? 'The Qarte Team' : "L'équipe Qarte",
    allRights: `© ${new Date().getFullYear()} Qarte. ${isEN ? 'All rights reserved.' : 'Tous droits réservés.'}`,
    address: 'SAS Tenga Labs — 60 rue François 1er, 75008 Paris',
    website: isEN ? 'Website' : 'Site web',
    contact: 'Contact',
    privacy: isEN ? 'Privacy' : 'Confidentialité',
    unsubscribe: isEN ? 'Unsubscribe' : 'Se désinscrire',
  };

  const feature = (color, title, desc) => `
<div style="background-color:#ffffff;border:1px solid #e5e7eb;border-left:4px solid ${color};border-radius:12px;padding:20px 24px;margin:0 0 12px">
<p style="color:#1a1a1a;font-size:17px;font-weight:700;margin:0 0 6px">${title}</p>
<p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0">${desc}</p>
</div>`;

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

<h1 style="color:#1a1a1a;font-size:26px;font-weight:700;line-height:1.3;margin:0 0 24px;text-align:center">${t.heading}</h1>

<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px">${t.greeting}</p>
<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 28px">${t.intro}</p>

<!-- Features -->
${feature('#10b981', t.f1Title, t.f1Desc)}
${feature('#3b82f6', t.f2Title, t.f2Desc)}
${feature('#f59e0b', t.f3Title, t.f3Desc)}
${feature('#ec4899', t.f4Title, t.f4Desc)}
${feature('#4b0082', t.f5Title, t.f5Desc)}
${feature('#eab308', t.f6Title, t.f6Desc)}

<!-- Gift box: 2 free days -->
<div style="background:linear-gradient(135deg,#4b0082 0%,#7c3aed 100%);border-radius:16px;padding:28px 24px;margin:32px 0 20px;text-align:center">
<p style="color:#ffffff;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;margin:0 0 10px;opacity:0.9">${t.giftBadge}</p>
<p style="color:#ffffff;font-size:24px;font-weight:800;line-height:1.3;margin:0 0 12px">${t.giftTitle}</p>
<p style="color:#ffffff;font-size:15px;line-height:1.6;margin:0 0 24px;opacity:0.95">${t.giftText}</p>
<a href="https://getqarte.com/dashboard/survey" style="display:inline-block;background-color:#ffffff;border-radius:12px;color:#4b0082;font-size:16px;font-weight:700;text-decoration:none;padding:16px 36px">${t.giftCta}</a>
</div>

<!-- Reassurance -->
<p style="color:#9ca3af;font-size:13px;text-align:center;margin:0 0 24px;line-height:1.5">${t.reassurance}</p>

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

  // 2. Fetch all trial merchants (filter fully expired in JS)
  const allMerchants = await supabaseGet(
    'merchants?select=id,user_id,shop_name,locale,subscription_status,trial_ends_at,churn_survey_seen_at,no_contact,deleted_at&subscription_status=eq.trial'
  );

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const eligible = allMerchants.filter((m) => {
    if (adminIds.has(m.user_id)) return false;
    if (m.no_contact) return false;
    if (m.deleted_at) return false;
    if (!m.trial_ends_at) return false;
    return new Date(m.trial_ends_at) < threeDaysAgo;
  });

  console.log(`Found ${eligible.length} fully-expired merchants (> J+3)`);

  if (eligible.length === 0) {
    console.log('Nothing to send. Exiting.');
    return;
  }

  // 3. Skip merchants already tracked with code -214 (idempotence)
  const merchantIds = eligible.map((m) => m.id);
  const trackingFilter = `merchant_id=in.(${merchantIds.join(',')})&reminder_day=eq.${TRACKING_CODE}`;
  const existingTracking = await supabaseGet(`pending_email_tracking?select=merchant_id&${trackingFilter}`);
  const alreadySent = new Set(existingTracking.map((t) => t.merchant_id));

  const toSend = eligible.filter((m) => !alreadySent.has(m.id));

  console.log(`${alreadySent.size} already received this email (tracking code ${TRACKING_CODE}), ${toSend.length} to send`);

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

  console.log(`\nReady to send (scheduled for ${SCHEDULED_AT} / 18h Paris) to ${merchantsWithEmail.length} merchants:\n`);
  for (const m of merchantsWithEmail) {
    console.log(`  - ${m.shop_name} | ${m.email} | ${m.locale || 'fr'}`);
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] No emails scheduled, no tracking inserted.');
    return;
  }

  console.log(`\nScheduling ${merchantsWithEmail.length} features recap emails for ${SCHEDULED_AT}...\n`);

  let sent = 0;
  let failed = 0;

  for (const merchant of merchantsWithEmail) {
    const locale = merchant.locale === 'en' ? 'en' : 'fr';
    const subject =
      locale === 'en'
        ? `${merchant.shop_name}, what Qarte really does`
        : `${merchant.shop_name}, ce que Qarte fait vraiment`;

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
          scheduled_at: SCHEDULED_AT,
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
        try {
          await supabasePost('pending_email_tracking', {
            merchant_id: merchant.id,
            reminder_day: TRACKING_CODE,
            pending_count: 0,
          });
          console.log(`  OK   ${merchant.shop_name} (${merchant.email})`);
          sent++;
        } catch (trackErr) {
          console.error(`  WARN ${merchant.shop_name}: scheduled but tracking insert failed: ${trackErr.message}`);
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

  console.log(`\nDone: ${sent} scheduled, ${failed} failed out of ${merchantsWithEmail.length}`);
  console.log(`Resend will deliver all emails at ${SCHEDULED_AT} (18h Paris time).`);
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
