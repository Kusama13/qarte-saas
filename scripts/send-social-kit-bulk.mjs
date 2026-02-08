/**
 * One-off script: Send social kit email to all merchants with a real logo (not unsplash)
 * Uses raw fetch (no npm dependencies needed)
 * Usage: node scripts/send-social-kit-bulk.mjs [--dry-run]
 */

const SUPABASE_URL = 'https://deaoytdanrsacmabnnpa.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_KEY = process.env.RESEND_API_KEY;
const isDryRun = process.argv.includes('--dry-run');

if (!SUPABASE_KEY || !RESEND_KEY) {
  console.error('Missing env vars.');
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
  return data?.email || null;
}

async function sendResendEmail(to, subject, html, text, refId) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Qarte <hello@getqarte.com>',
      reply_to: 'hello@getqarte.com',
      to,
      subject,
      html,
      text,
      headers: { 'X-Entity-Ref-ID': refId },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || JSON.stringify(data));
  return data;
}

async function main() {
  // 1. Query merchants with non-unsplash logo and configured program
  const merchants = await supabaseGet(
    'merchants?select=id,shop_name,reward_description,stamps_required,primary_color,logo_url,user_id,tier2_enabled,tier2_stamps_required,tier2_reward_description&logo_url=not.is.null&logo_url=not.like.*unsplash*&reward_description=not.is.null'
  );

  const eligible = merchants.filter(m => m.logo_url && m.logo_url.trim() !== '');

  console.log(`\n=== Social Kit Bulk Email ===`);
  console.log(`Found ${eligible.length} merchants with real logos:\n`);

  // 2. Get user emails
  const targets = [];
  for (const m of eligible) {
    const email = await getUserEmail(m.user_id);
    if (email) {
      targets.push({ ...m, email });
      console.log(`  ✓ ${m.shop_name} → ${email} (${m.stamps_required} stamps)`);
    } else {
      console.log(`  ✗ ${m.shop_name} → no email`);
    }
  }

  console.log(`\n${targets.length} merchants to email.`);

  if (isDryRun) {
    console.log('\nDRY RUN — no emails sent.');
    return;
  }

  // 3. Send emails
  console.log('\nSending emails...\n');
  let sent = 0, failed = 0;

  for (const m of targets) {
    try {
      const subject = `${m.shop_name} — Votre visuel réseaux sociaux est prêt !`;
      const text = `Bonjour ${m.shop_name},\n\nVotre programme de fidélité est configuré. Téléchargez votre visuel prêt à poster sur vos réseaux sociaux !\n\nRécompense : ${m.reward_description} après ${m.stamps_required} passages.\n\nTéléchargez votre visuel : https://getqarte.com/dashboard/social-kit\n\nL'équipe Qarte`;

      await sendResendEmail(m.email, subject, buildEmailHtml(m), text, `social-kit-bulk-${m.id}`);
      console.log(`  ✓ ${m.shop_name} (${m.email})`);
      sent++;
      await new Promise(r => setTimeout(r, 600));
    } catch (err) {
      console.log(`  ✗ ${m.shop_name} (${m.email}): ${err.message}`);
      failed++;
    }
  }

  console.log(`\n=== Done: ${sent} sent, ${failed} failed ===`);
}

function buildEmailHtml(m) {
  const tier2Section = m.tier2_enabled && m.tier2_reward_description && m.tier2_stamps_required
    ? `<div style="background:rgba(255,255,255,0.8);border-radius:12px;padding:16px;margin-top:8px;text-align:center">
        <p style="color:#7C3AED;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0">Palier 2</p>
        <p style="color:#1a1a2e;font-size:16px;font-weight:800;margin:0 0 4px 0">${m.tier2_reward_description}</p>
        <p style="color:#7C3AED;font-size:12px;font-weight:700;margin:0">Après ${m.tier2_stamps_required} passage${m.tier2_stamps_required > 1 ? 's' : ''}</p>
      </div>` : '';

  const tier2Caption = m.tier2_enabled && m.tier2_reward_description
    ? ` Et ce n'est pas tout : après ${m.tier2_stamps_required} passages, recevez ${m.tier2_reward_description} !` : '';

  const captions = [
    { label: 'Option 1 — Simple et efficace', text: `Votre fidélité mérite d'être récompensée ! 🎁 Après ${m.stamps_required} passages chez ${m.shop_name}, recevez ${m.reward_description}.${tier2Caption} Demandez à scanner le QR code lors de votre prochain rendez-vous ! #fidélité #${m.shop_name.replace(/\s+/g, '')}` },
    { label: 'Option 2 — Engageante', text: `NOUVEAU chez ${m.shop_name} ! ✨ On lance notre carte de fidélité digitale. Pas d'application, pas de carte à perdre — juste un scan rapide à chaque visite. Votre récompense ? ${m.reward_description} !${tier2Caption} À bientôt 💜` },
    { label: 'Option 3 — Story Instagram', text: `La fidélité, ça se récompense ! 💅 Demandez à scanner le QR code en caisse. ${m.reward_description} après ${m.stamps_required} passages.${tier2Caption} C'est cadeau !` },
  ];

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif">
<div style="max-width:600px;margin:0 auto;padding:24px"><div style="background:#fff;border-radius:16px;padding:40px 32px;border:1px solid #e5e7eb">
<h1 style="color:#1a1a1a;font-size:24px;font-weight:700;line-height:1.3;margin:0 0 24px 0">Votre programme est prêt, faites-le savoir !</h1>
<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px 0">Bonjour <strong>${m.shop_name}</strong>,</p>
<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px 0">Votre programme de fidélité est configuré. Il ne reste plus qu'une chose : <strong>informer vos clients</strong>. On vous a préparé un visuel prêt à poster sur vos réseaux sociaux.</p>
<div style="background:linear-gradient(135deg,#654EDA 0%,#9D8FE8 100%);border-radius:16px;padding:32px 24px;margin:24px 0;text-align:center">
${m.logo_url ? `<img src="${m.logo_url}" alt="${m.shop_name}" width="56" height="56" style="border-radius:50%;border:3px solid rgba(255,255,255,0.3);margin:0 auto 12px auto;object-fit:cover;display:block">` : ''}
<p style="color:#fff;font-size:20px;font-weight:800;margin:0 0 4px 0">${m.shop_name}</p>
<p style="color:rgba(255,255,255,0.7);font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin:0 0 16px 0">Programme de fidélité</p>
<div style="background:rgba(255,255,255,0.95);border-radius:12px;padding:16px;text-align:center">
<p style="color:#654EDA;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0">Votre récompense</p>
<p style="color:#1a1a2e;font-size:18px;font-weight:800;margin:0 0 4px 0">${m.reward_description}</p>
<p style="color:${m.primary_color || '#654EDA'};font-size:12px;font-weight:700;margin:0">Après ${m.stamps_required} passage${m.stamps_required > 1 ? 's' : ''}</p>
</div>${tier2Section}</div>
<div style="text-align:center;margin:24px 0"><a href="https://getqarte.com/dashboard/social-kit" style="background:#654EDA;border-radius:8px;color:#fff;font-size:16px;font-weight:600;text-decoration:none;padding:14px 32px;display:inline-block">Télécharger mon visuel HD</a></div>
<hr style="border:none;border-top:1px solid #e8e8e8;margin:28px 0">
<h2 style="color:#1a1a1a;font-size:18px;font-weight:600;margin:0 0 16px 0">Légendes prêtes à copier-coller</h2>
<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px 0">Choisissez celle qui vous ressemble et postez-la avec votre visuel :</p>
${captions.map(c => `<div style="background:#f8f9fa;border-radius:12px;padding:16px 20px;margin:0 0 12px 0"><p style="color:#654EDA;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 8px 0">${c.label}</p><p style="color:#4a5568;font-size:14px;line-height:1.6;margin:0">${c.text}</p></div>`).join('')}
<hr style="border:none;border-top:1px solid #e8e8e8;margin:28px 0">
<h2 style="color:#1a1a1a;font-size:18px;font-weight:600;margin:0 0 16px 0">Conseils pour maximiser l'impact</h2>
<div style="background:#f0edfc;border-radius:12px;padding:20px 24px;margin:0 0 8px 0">
<p style="color:#4a5568;font-size:15px;line-height:2;margin:0"><strong>1.</strong> Postez en story ET en publication</p>
<p style="color:#4a5568;font-size:15px;line-height:2;margin:0"><strong>2.</strong> Épinglez la publication en haut de votre profil</p>
<p style="color:#4a5568;font-size:15px;line-height:2;margin:0"><strong>3.</strong> Parlez-en à chaque client(e) en caisse</p>
<p style="color:#4a5568;font-size:15px;line-height:2;margin:0"><strong>4.</strong> Ajoutez le lien QR code dans votre bio Instagram</p>
</div>
<div style="text-align:center;margin:24px 0"><a href="https://getqarte.com/dashboard/social-kit" style="background:#1a1a1a;border-radius:8px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;display:inline-block">Voir mon kit complet</a></div>
<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:0 0 16px 0">Besoin d'aide pour poster ? Répondez à cet email ou contactez-nous sur WhatsApp, on vous guide !</p>
<div style="text-align:center;margin:24px 0"><a href="https://wa.me/33607447420?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20pour%20poster%20sur%20mes%20r%C3%A9seaux" style="background:#25D366;border-radius:8px;color:#fff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 28px;display:inline-block">Nous contacter sur WhatsApp</a></div>
<p style="color:#4a5568;font-size:16px;line-height:1.6;margin:24px 0 0 0">L'équipe Qarte</p>
</div></div></body></html>`;
}

main().catch(err => { console.error(err); process.exit(1); });
