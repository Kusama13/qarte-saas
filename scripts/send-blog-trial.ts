/**
 * Envoi one-off du nouvel article de blog aux ESSAIS NON CONVERTIS (statut 'trial')
 * inscrits dans les N derniers mois. Réutilise le rendu/subject/désinscription du cron
 * blog-digest (template BlogDigestEmail on-brand) et le dédup par article.
 *
 * IMPORTANT : on n'écrit QUE dans `blog_email_recipients` (dédup par destinataire).
 * On ne touche PAS `blog_email_dispatches`, sinon le cron considérerait l'article comme
 * déjà diffusé et ne l'enverrait pas aux abonnés payants.
 *
 * Dry-run (compte + échantillon, aucun envoi) :
 *   npx dotenv -e .env.local -- npx tsx scripts/send-blog-trial.ts --dry-run
 * ou : node --env-file=.env.local node_modules/.bin/tsx scripts/send-blog-trial.ts --dry-run
 *
 * Envoi réel :
 *   ... scripts/send-blog-trial.ts --send
 */

import { existsSync } from 'fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

import { createClient } from '@supabase/supabase-js';
import { sendBlogDigestEmail } from '../src/lib/email';
import { batchGetUserEmails, canEmail } from '../src/lib/cron-helpers';
import { BLOG_ARTICLES } from '../src/data/blog-articles';
import type { EmailLocale } from '../src/emails/translations';

const SITE_ORIGIN = 'https://getqarte.com';
// Resend limite à 5 req/s : 4 envois concurrents espacés de 1,1 s ≈ 3,6/s (marge de sécurité).
const SEND_BATCH_SIZE = 4;
const BATCH_DELAY_MS = 1100;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const slugArg = process.argv.find((a) => a.startsWith('--slug='));
const ARTICLE_SLUG = slugArg ? slugArg.split('=')[1] : 'faire-revenir-clientes-prochain-rdv-salon';
const monthsArg = process.argv.find((a) => a.startsWith('--months='));
const MONTHS = monthsArg ? Number(monthsArg.split('=')[1]) : 3;
const DO_SEND = process.argv.includes('--send');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  const article = BLOG_ARTICLES.find((a) => a.slug === ARTICLE_SLUG);
  if (!article) {
    console.error(`Article introuvable: ${ARTICLE_SLUG}`);
    process.exit(1);
  }

  const articlePayload = {
    title: article.title,
    description: article.description,
    category: article.category,
    readTime: article.readTime,
    imageUrl: `${SITE_ORIGIN}${article.image}`,
    url: `${SITE_ORIGIN}/blog/${article.slug}`,
  };

  // Mode test : un seul envoi vers l'adresse fournie, aucune écriture en base.
  const testArg = process.argv.find((a) => a.startsWith('--test='));
  if (testArg) {
    const testEmail = testArg.split('=')[1];
    console.log(`\n[TEST] Envoi unique à ${testEmail} (aucun enregistrement en base)…`);
    const res = await sendBlogDigestEmail(testEmail, 'Ton salon', articlePayload, '00000000-0000-0000-0000-000000000000', 'fr');
    console.log(res.success ? 'OK — mail de test envoyé.' : 'ÉCHEC envoi test.');
    process.exit(res.success ? 0 : 1);
  }

  const cutoffIso = new Date(Date.now() - MONTHS * 30 * 86_400_000).toISOString();

  // Audience : essais non convertis (trial), non supprimés, inscrits dans la fenêtre.
  const { data: merchants, error } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, locale, no_contact, email_bounced_at, email_unsubscribed_at, created_at')
    .eq('subscription_status', 'trial')
    .is('deleted_at', null)
    .gte('created_at', cutoffIso);

  if (error) {
    console.error('Erreur DB:', error.message);
    process.exit(1);
  }

  const emailable = (merchants ?? []).filter(canEmail);

  // Dédup par article : retire ceux qui l'ont déjà reçu (cron ou run précédent).
  const { data: already } = await supabase
    .from('blog_email_recipients')
    .select('merchant_id')
    .eq('article_slug', ARTICLE_SLUG);
  const alreadyIds = new Set((already ?? []).map((r) => r.merchant_id as string));
  const eligible = emailable.filter((m) => !alreadyIds.has(m.id));

  console.log(`\nArticle   : ${article.title}`);
  console.log(`Audience  : essais non convertis (trial), inscrits depuis le ${cutoffIso.slice(0, 10)}`);
  console.log(`Trials    : ${merchants?.length ?? 0} | emailables : ${emailable.length} | déjà reçu : ${alreadyIds.size} | éligibles : ${eligible.length}`);

  const emailMap = await batchGetUserEmails(supabase, [...new Set(eligible.map((m) => m.user_id))]);
  const withEmail = eligible.filter((m) => emailMap.get(m.user_id));
  console.log(`Avec email valide : ${withEmail.length} (sans email : ${eligible.length - withEmail.length})`);

  if (!DO_SEND) {
    console.log('\n[DRY-RUN] Aucun email envoyé. Échantillon (5 premiers) :');
    for (const m of withEmail.slice(0, 5)) console.log(`  - ${m.shop_name} <${emailMap.get(m.user_id)}>`);
    console.log(`\nPour envoyer réellement : relance avec --send\n`);
    process.exit(0);
  }

  let sent = 0;
  let errors = 0;
  const successfulRecipients: { article_slug: string; merchant_id: string }[] = [];

  for (let i = 0; i < withEmail.length; i += SEND_BATCH_SIZE) {
    const batch = withEmail.slice(i, i + SEND_BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (m) => {
        const email = emailMap.get(m.user_id)!;
        const res = await sendBlogDigestEmail(
          email,
          m.shop_name || 'Ton salon',
          articlePayload,
          m.id,
          (m.locale as EmailLocale) || 'fr',
        );
        return { m, ok: res.success };
      }),
    );
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.ok) {
        sent++;
        successfulRecipients.push({ article_slug: ARTICLE_SLUG, merchant_id: r.value.m.id });
      } else {
        errors++;
        if (r.status === 'rejected') console.error('  FAIL', r.reason);
      }
    }
    console.log(`  ... ${Math.min(i + SEND_BATCH_SIZE, withEmail.length)}/${withEmail.length}`);
    if (i + SEND_BATCH_SIZE < withEmail.length) await sleep(BATCH_DELAY_MS);
  }

  // Dédup : on enregistre les destinataires (PAS de blog_email_dispatches).
  if (successfulRecipients.length > 0) {
    const { error: recErr } = await supabase
      .from('blog_email_recipients')
      .upsert(successfulRecipients, { onConflict: 'article_slug,merchant_id', ignoreDuplicates: true });
    if (recErr) console.error('Enregistrement recipients échoué:', recErr.message);
  }

  console.log(`\nTerminé : ${sent} envoyés, ${errors} erreurs (sur ${withEmail.length}).\n`);
  process.exit(errors > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
