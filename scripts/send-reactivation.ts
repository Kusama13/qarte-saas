/**
 * One-off : campagne de réactivation des NON-abonnés, segmentée par ancienneté du compte.
 *
 * 3 mails (cf. src/emails/Reactivation*.tsx) :
 *   - recent  : essai expiré depuis < 45 jours        → check-in chaleureux
 *   - tiede   : essai expiré entre 45 jours et 4 mois → conseil de pro à pro (value-first)
 *   - ancien  : essai expiré depuis > 4 mois OU canceled → reconquête ("what's new")
 *
 * Cibles : merchants trial expiré OU canceled (jamais les `active`). Admins exclus.
 *
 * Usage :
 *   SUPABASE_SERVICE_ROLE_KEY=... RESEND_API_KEY=... NEXT_PUBLIC_SUPABASE_URL=... \
 *     npx tsx scripts/send-reactivation.ts --dry-run                 # aperçu segmentation, aucun envoi
 *     npx tsx scripts/send-reactivation.ts --segment=recent --dry-run
 *     npx tsx scripts/send-reactivation.ts --segment=recent          # envoie le segment "recent"
 *     npx tsx scripts/send-reactivation.ts                           # envoie les 3 segments
 *
 * Idempotence : script one-shot. Lance un segment à la fois et garde la sortie comme trace.
 */

import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';
import { render } from '@react-email/render';
import {
  ReactivationRecentEmail,
  ReactivationTiedeEmail,
  ReactivationAncienEmail,
} from '../src/emails/index';
import { getEmailT, type EmailLocale } from '../src/emails/translations';

const resend = new Resend(process.env.RESEND_API_KEY!);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const isDryRun = process.argv.includes('--dry-run');
const segmentArg = process.argv.find(a => a.startsWith('--segment='))?.split('=')[1] as Segment | undefined;

type Segment = 'recent' | 'tiede' | 'ancien';

const DAY = 24 * 60 * 60 * 1000;

const SEGMENTS: Record<Segment, {
  subjectKey: string;
  Component: (props: { shopName: string; locale?: EmailLocale }) => React.JSX.Element;
}> = {
  recent: { subjectKey: 'subjects.reactivationRecent', Component: ReactivationRecentEmail },
  tiede: { subjectKey: 'subjects.reactivationTiede', Component: ReactivationTiedeEmail },
  ancien: { subjectKey: 'subjects.reactivationAncien', Component: ReactivationAncienEmail },
};

/**
 * Détecte les shop_name "suspects" : comptes de test / abandonnés à l'inscription
 * (charabia clavier, adresse email comme nom, placeholders). On ne leur écrit pas.
 */
function isSuspiciousName(name: string): boolean {
  const n = name.trim();
  if (n.length < 2) return true;
  if (/@/.test(n)) return true;                       // une adresse email en guise de nom
  if (/^https?:\/\//i.test(n)) return true;
  // Suites clavier (azerty/qwerty) ou charabia : 6+ lettres sans voyelle, ou motifs clavier
  const lower = n.toLowerCase();
  if (/(azer|qwer|wxcv|asdf|zxcv|qsdf|hjkl|uiop)/.test(lower)) return true;
  const longTokenNoVowel = lower.split(/\s+/).some(tok => tok.length >= 6 && !/[aeiouyàâäéèêëîïôöùûü]/.test(tok));
  if (longTokenNoVowel) return true;
  // Placeholders évidents
  if (/^(test|essai|demo|aaa+|xxx+|abc+|nouveau wok)$/i.test(lower)) return true;
  return false;
}

/** Classe un merchant non-abonné dans un segment, ou null s'il n'est pas éligible. */
function classify(m: { subscription_status: string; trial_ends_at: string | null }): Segment | null {
  // Canceled = churn explicite → on ne le relance pas dans cette campagne
  if (m.subscription_status === 'canceled') return null;
  if (m.subscription_status !== 'trial' || !m.trial_ends_at) return null;

  const expiredMs = Date.now() - new Date(m.trial_ends_at).getTime();
  if (expiredMs <= 0) return null;       // essai encore en cours
  if (expiredMs < 45 * DAY) return 'recent';
  if (expiredMs < 120 * DAY) return 'tiede';
  // > 4 mois : trop ancien, exclu de cette campagne (volume négligeable)
  return null;
}

async function main() {
  const { data: admins } = await supabase.from('super_admins').select('user_id');
  const adminIds = new Set((admins ?? []).map(a => a.user_id));

  const { data: merchants, error } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, locale, subscription_status, trial_ends_at, email_bounced_at, email_unsubscribed_at')
    .in('subscription_status', ['trial', 'canceled'])
    .not('shop_name', 'is', null)
    .is('deleted_at', null);

  if (error) { console.error('DB error:', error.message); process.exit(1); }
  if (!merchants?.length) { console.log('Aucun merchant.'); process.exit(0); }

  // Segmenter + exclure admins / bounced / désinscrits / noms suspects
  const buckets: Record<Segment, typeof merchants> = { recent: [], tiede: [], ancien: [] };
  let suspicious = 0;
  for (const m of merchants) {
    if (adminIds.has(m.user_id)) continue;
    if (m.email_bounced_at || m.email_unsubscribed_at) continue;
    if (isSuspiciousName(m.shop_name)) { suspicious++; continue; }
    const seg = classify(m);
    if (seg) buckets[seg].push(m);
  }
  console.log(`(${suspicious} comptes au nom suspect ignorés)\n`);

  const targetSegments: Segment[] = segmentArg ? [segmentArg] : ['recent', 'tiede'];

  console.log('Segmentation des non-abonnés :');
  for (const seg of ['recent', 'tiede', 'ancien'] as Segment[]) {
    console.log(`  ${seg.padEnd(7)} : ${buckets[seg].length}`);
  }
  console.log('');

  // Emails depuis auth (batch de 10)
  const emailMap = new Map<string, string>();
  const userIds = [...new Set(targetSegments.flatMap(s => buckets[s].map(m => m.user_id)))];
  for (let i = 0; i < userIds.length; i += 10) {
    const batch = userIds.slice(i, i + 10);
    await Promise.allSettled(batch.map(async (uid) => {
      const { data } = await supabase.auth.admin.getUserById(uid);
      if (data?.user?.email) emailMap.set(uid, data.user.email);
    }));
  }

  let sent = 0, failed = 0, skipped = 0;

  for (const seg of targetSegments) {
    const { subjectKey, Component } = SEGMENTS[seg];
    console.log(`\n=== Segment "${seg}" (${buckets[seg].length}) ===`);

    for (const m of buckets[seg]) {
      const email = emailMap.get(m.user_id);
      if (!email) { console.log(`  SKIP ${m.shop_name} — pas d'email`); skipped++; continue; }

      const locale: EmailLocale = (m.locale === 'en' ? 'en' : 'fr');
      const t = getEmailT(locale);
      const subject = t(subjectKey, { shopName: m.shop_name });

      if (isDryRun) { console.log(`  DRY  ${m.shop_name} <${email}> [${locale}] — ${subject}`); continue; }

      try {
        const props = { shopName: m.shop_name, locale };
        const [html, text] = await Promise.all([
          render(Component(props)),
          render(Component(props), { plainText: true }),
        ]);
        const { error: sendErr } = await resend.emails.send({
          from: 'Qarte <notifications@getqarte.com>',
          to: email,
          replyTo: 'support@getqarte.com',
          subject,
          html,
          text,
          headers: { 'List-Unsubscribe': '<mailto:contact@getqarte.com?subject=Desinscription>' },
          tags: [{ name: 'category', value: `reactivation_${seg}` }],
        });
        if (sendErr) { console.error(`  FAIL ${m.shop_name}: ${sendErr.message}`); failed++; }
        else { console.log(`  OK   ${m.shop_name} <${email}>`); sent++; }
      } catch (e) {
        console.error(`  ERR  ${m.shop_name}:`, e instanceof Error ? e.message : e);
        failed++;
      }
      await new Promise(r => setTimeout(r, 600)); // Resend 2 req/s
    }
  }

  console.log(`\n${isDryRun ? '[DRY RUN] ' : ''}Terminé : ${sent} envoyés, ${skipped} ignorés, ${failed} échecs.`);
  process.exit(failed > 0 && !isDryRun ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });
