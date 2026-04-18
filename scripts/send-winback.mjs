/**
 * One-off script: Send win-back email to all expired trial merchants (3+ days)
 * Usage: node scripts/send-winback.mjs [--dry-run]
 */

const SUPABASE_URL = 'https://deaoytdanrsacmabnnpa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const isDryRun = process.argv.includes('--dry-run');

if (!SUPABASE_KEY || !RESEND_KEY) {
  console.error('Missing env vars. Run with: SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... node scripts/send-winback.mjs');
  process.exit(1);
}

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function supabaseGet(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`Supabase error: ${res.status} ${await res.text()}`);
  return res.json();
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
    preview: isEN ? "A lot has changed since you left \u2014 come take a look" : "On a tout chang\u00e9 depuis ton d\u00e9part \u2014 reviens voir",
    heading: isEN ? "A lot has changed since you left" : "On a bien chang\u00e9 depuis ton d\u00e9part",
    greeting: isEN ? `Hey <strong>${shopName}</strong>,` : `Salut <strong>${shopName}</strong>,`,
    intro: isEN
      ? "It\u2019s been a while since we last saw you. We\u2019ve been busy \u2014 here\u2019s what\u2019s new on Qarte."
      : "\u00c7a fait un moment qu\u2019on ne s\u2019est pas vus. On n\u2019a pas ch\u00f4m\u00e9 depuis \u2014 voici ce qui est nouveau sur Qarte.",
    badgeNew: isEN ? 'NEW' : 'NOUVEAU',
    f1Title: isEN ? 'Your online salon page' : 'Ta vitrine en ligne',
    f1Desc: isEN
      ? 'Your salon now has its own pro page: services, photos, hours, Google reviews. One link for your Instagram bio.'
      : 'Ton salon a maintenant sa propre page pro\u00a0: prestations, photos, horaires, avis Google. Un seul lien pour ta bio Instagram.',
    f2Title: isEN ? 'Built-in scheduling' : 'Planning int\u00e9gr\u00e9',
    f2Desc: isEN
      ? 'Your clients book directly from your page. No need for an external tool.'
      : 'Tes clientes r\u00e9servent directement depuis ta page. Plus besoin d\u2019un outil externe.',
    f3Title: isEN ? 'Automatic birthdays' : 'Anniversaires automatiques',
    f3Desc: isEN
      ? 'Qarte sends an automatic gift to your clients on their birthday. Zero effort.'
      : 'Qarte envoie un cadeau automatique \u00e0 tes clientes pour leur anniversaire. Z\u00e9ro effort.',
    socialProof: isEN
      ? 'Over a thousand beauty pros use Qarte every day.'
      : 'Plus d\u2019un millier de pros de la beaut\u00e9 utilisent Qarte au quotidien.',
    promoTitle: isEN ? 'Welcome back offer' : 'Offre de retour',
    promoPrice: isEN ? '2 months at $9/mo instead of $19' : '2 mois \u00e0 9\u20ac/mois au lieu de 19\u20ac',
    cta: isEN ? 'Reactivate my account' : 'R\u00e9activer mon compte',
    reassurance: isEN
      ? 'Your client data is still there. Nothing has been deleted.<br/>No commitment \u2014 cancel anytime.'
      : 'Tes donn\u00e9es clients sont toujours l\u00e0. Rien n\u2019a \u00e9t\u00e9 supprim\u00e9.<br/>Sans engagement \u2014 annulable \u00e0 tout moment.',
    signature: isEN ? 'The Qarte Team' : 'L\u2019\u00e9quipe Qarte',
    allRights: `\u00a9 ${new Date().getFullYear()} Qarte. ${isEN ? 'All rights reserved.' : 'Tous droits r\u00e9serv\u00e9s.'}`,
    address: 'SAS Tenga Labs \u2014 60 rue Fran\u00e7ois 1er, 75008 Paris',
    website: isEN ? 'Website' : 'Site web',
    contact: 'Contact',
    privacy: isEN ? 'Privacy' : 'Confidentialit\u00e9',
    unsubscribe: isEN ? 'Unsubscribe' : 'Se d\u00e9sinscrire',
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

<h1 style="color:#1a1a1a;font-size:26px;font-weight:700;line-height:1.3;margin:0 0 24px;text-align:center">${t.heading}</h1>

<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px">${t.greeting}</p>
<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px">${t.intro}</p>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0"/>

<!-- Feature 1 -->
<div style="background-color:#ecfdf5;border-radius:12px;padding:20px 24px;margin:0 0 12px;border-left:4px solid #10b981">
<p style="color:#10b981;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px">${t.badgeNew}</p>
<p style="color:#1a1a1a;font-size:17px;font-weight:700;margin:0 0 6px">${t.f1Title}</p>
<p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0">${t.f1Desc}</p>
</div>

<!-- Feature 2 -->
<div style="background-color:#eff6ff;border-radius:12px;padding:20px 24px;margin:0 0 12px;border-left:4px solid #3b82f6">
<p style="color:#3b82f6;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px">${t.badgeNew}</p>
<p style="color:#1a1a1a;font-size:17px;font-weight:700;margin:0 0 6px">${t.f2Title}</p>
<p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0">${t.f2Desc}</p>
</div>

<!-- Feature 3 -->
<div style="background-color:#faf5ff;border-radius:12px;padding:20px 24px;margin:0 0 12px;border-left:4px solid #7c3aed">
<p style="color:#7c3aed;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 6px">${t.badgeNew}</p>
<p style="color:#1a1a1a;font-size:17px;font-weight:700;margin:0 0 6px">${t.f3Title}</p>
<p style="color:#4a5568;font-size:15px;line-height:1.6;margin:0">${t.f3Desc}</p>
</div>

<hr style="border:none;border-top:1px solid #e5e7eb;margin:28px 0"/>

<!-- Social proof -->
<p style="color:#6b7280;font-size:14px;font-style:italic;text-align:center;margin:0 0 8px">${t.socialProof}</p>

<!-- Promo box -->
<div style="background-color:#f0edfc;border-radius:16px;padding:28px 24px;margin:20px 0;text-align:center;border:2px dashed #4b0082">
<p style="color:#4b0082;font-size:16px;font-weight:600;margin:0 0 8px">${t.promoTitle}</p>
<p style="color:#1a1a1a;font-size:22px;font-weight:700;margin:0 0 16px">${t.promoPrice}</p>
<p style="color:#8898aa;font-size:11px;font-weight:600;margin:0 0 4px;text-transform:uppercase;letter-spacing:1px">CODE PROMO</p>
<p style="color:#4b0082;font-size:28px;font-weight:700;margin:0;letter-spacing:3px">QARTEBOOST</p>
</div>

<!-- CTA -->
<div style="text-align:center;margin:28px 0">
<a href="https://getqarte.com/dashboard/subscription" style="display:inline-block;background-color:#4b0082;border-radius:12px;color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:16px 40px">${t.cta}</a>
</div>

<!-- Reassurance -->
<p style="color:#9ca3af;font-size:13px;text-align:center;margin:0 0 24px;line-height:1.5">${t.reassurance}</p>

<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0">${t.signature}</p>

</div>

<!-- Footer -->
<div style="background-color:#f6f9fc;padding:24px 40px;text-align:center">
<p style="font-size:13px;margin:0 0 12px">
<a href="https://www.instagram.com/qarte.app" style="color:#4b0082;text-decoration:none;font-weight:600">Instagram</a> \u2022
<a href="https://www.facebook.com/profile.php?id=61587048661028" style="color:#4b0082;text-decoration:none;font-weight:600">Facebook</a> \u2022
<a href="https://www.tiktok.com/@getqarte" style="color:#4b0082;text-decoration:none;font-weight:600">TikTok</a>
</p>
<p style="color:#8898aa;font-size:12px;margin:0 0 8px">${t.allRights}</p>
<p style="color:#8898aa;font-size:11px;margin:0 0 8px">${t.address}</p>
<p style="color:#8898aa;font-size:12px;margin:0">
<a href="https://getqarte.com" style="color:#4b0082;text-decoration:none">${t.website}</a> \u2022
<a href="https://getqarte.com/contact" style="color:#4b0082;text-decoration:none">${t.contact}</a> \u2022
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
  // Get admin IDs to exclude
  const admins = await supabaseGet('super_admins?select=user_id');
  const adminIds = admins.map(a => a.user_id);

  // Get expired trial merchants (trial_ends_at < 3 days ago) + canceled merchants
  const allMerchants = await supabaseGet('merchants?select=id,user_id,subscription_status,trial_ends_at,shop_name,locale&shop_name=not.is.null');

  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const eligible = allMerchants.filter(m => {
    // Exclude admins
    if (adminIds.includes(m.user_id)) return false;
    // Canceled subscription
    if (m.subscription_status === 'canceled') return true;
    // Expired trial (3+ days)
    if (m.subscription_status === 'trial' && m.trial_ends_at && new Date(m.trial_ends_at) < threeDaysAgo) return true;
    return false;
  });

  // Fetch emails from auth for each merchant
  console.log(`Fetching emails for ${eligible.length} eligible merchants...\n`);

  const merchantsWithEmail = [];
  for (const m of eligible) {
    const email = await getUserEmail(m.user_id);
    if (email) {
      merchantsWithEmail.push({ ...m, email });
    }
  }

  console.log(`Found ${merchantsWithEmail.length} merchants with email:\n`);
  for (const m of merchantsWithEmail) {
    console.log(`  - ${m.shop_name} | ${m.email} | ${m.locale || 'fr'} | status: ${m.subscription_status} | trial_ends: ${m.trial_ends_at?.slice(0, 10) || 'N/A'}`);
  }

  if (isDryRun) {
    console.log('\n[DRY RUN] No emails sent.');
    return;
  }

  console.log(`\nSending ${merchantsWithEmail.length} win-back emails...\n`);

  let sent = 0;
  let failed = 0;

  for (const merchant of merchantsWithEmail) {
    const locale = merchant.locale || 'fr';
    const subject = locale === 'en'
      ? `${merchant.shop_name} \u2014 we\u2019ve changed a lot, come take a look`
      : `${merchant.shop_name} \u2014 on a tout chang\u00e9, reviens voir`;

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
        console.log(`  OK   ${merchant.shop_name} (${merchant.email})`);
        sent++;
      }

      // Rate limit: 600ms
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.error(`  FAIL ${merchant.shop_name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone: ${sent} sent, ${failed} failed out of ${merchantsWithEmail.length}`);
}

main();
