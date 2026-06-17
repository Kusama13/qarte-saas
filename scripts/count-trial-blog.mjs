/**
 * Comptage (lecture seule) de l'audience "essais non convertis" pour l'envoi
 * one-off du nouvel article de blog. Aucun email envoyé.
 *
 * Usage : node --env-file=.env.local scripts/count-trial-blog.mjs [--months=3] [--slug=...]
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Manque NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY (lance avec --env-file=.env.local)');
  process.exit(1);
}

const monthsArg = process.argv.find((a) => a.startsWith('--months='));
const MONTHS = monthsArg ? Number(monthsArg.split('=')[1]) : 3;
const slugArg = process.argv.find((a) => a.startsWith('--slug='));
const ARTICLE_SLUG = slugArg ? slugArg.split('=')[1] : 'faire-revenir-clientes-prochain-rdv-salon';

const headers = {
  apikey: SUPABASE_KEY,
  Authorization: `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
};

async function sget(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, { headers });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  return res.json();
}

const cutoff = new Date(Date.now() - MONTHS * 30 * 86_400_000);
const cutoffIso = cutoff.toISOString();
const cutoff21 = new Date(Date.now() - 21 * 86_400_000);

const canEmail = (m) => !m.no_contact && !m.email_bounced_at && !m.email_unsubscribed_at;

// Essais non convertis : statut 'trial', non supprimés, inscrits dans la fenêtre.
const merchants = await sget(
  `merchants?select=id,created_at,no_contact,email_bounced_at,email_unsubscribed_at` +
    `&subscription_status=eq.trial&deleted_at=is.null&created_at=gte.${cutoffIso}`,
);

// Dédup : ceux qui ont déjà reçu cet article (cron ou envoi précédent).
const already = await sget(`blog_email_recipients?select=merchant_id&article_slug=eq.${ARTICLE_SLUG}`);
const alreadyIds = new Set(already.map((r) => r.merchant_id));

const emailable = merchants.filter(canEmail);
const net = emailable.filter((m) => !alreadyIds.has(m.id));
const recent21 = net.filter((m) => new Date(m.created_at) >= cutoff21); // déjà couverts par le cron blog-digest
const netExclRecent = net.filter((m) => new Date(m.created_at) < cutoff21);

const excludedGuard = merchants.length - emailable.length;
const excludedDedup = emailable.length - net.length;

console.log('\n=== Essais non convertis (statut trial) ===');
console.log(`Fenêtre              : ${MONTHS} mois (inscrits depuis le ${cutoffIso.slice(0, 10)})`);
console.log(`Article              : ${ARTICLE_SLUG}`);
console.log('-------------------------------------------');
console.log(`Trials dans fenêtre  : ${merchants.length}`);
console.log(`  - exclus (désinscrits / bounce / no_contact) : ${excludedGuard}`);
console.log(`  - exclus (ont déjà reçu cet article)         : ${excludedDedup}`);
console.log(`= Audience nette     : ${net.length}`);
console.log('-------------------------------------------');
console.log(`  dont inscrits < 21 j (déjà ciblés par le cron auto) : ${recent21.length}`);
console.log(`  => nouveaux destinataires si on exclut ces 21 j     : ${netExclRecent.length}`);
console.log('\n(lecture seule — aucun email envoyé)\n');
