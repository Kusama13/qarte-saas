/**
 * Dry-run du cron blog-drip sur la vraie base (lecture seule, aucun envoi).
 * Réutilise les helpers de sélection du cron pour un test fidèle.
 *
 *   npx tsx --env-file=.env.local scripts/dry-blog-drip.ts
 */
import { existsSync } from 'fs';
if (existsSync('.env.local')) process.loadEnvFile('.env.local');

import { createClient } from '@supabase/supabase-js';
import { BLOG_ARTICLES } from '../src/data/blog-articles';
import { DRIP_WINDOW_DAYS, isDueForDrip, pickNextDripArticle } from '../src/lib/blog-drip';

const canEmail = (m: { no_contact?: boolean | null; email_bounced_at?: string | null; email_unsubscribed_at?: string | null }) =>
  !m.no_contact && !m.email_bounced_at && !m.email_unsubscribed_at;

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function main() {
const now = new Date();
const today = now.toISOString().slice(0, 10);
const windowCutoff = new Date(now.getTime() - DRIP_WINDOW_DAYS * 86_400_000).toISOString();

const { data: raw } = await supabase
  .from('merchants')
  .select('id, shop_name, created_at, no_contact, email_bounced_at, email_unsubscribed_at')
  .eq('subscription_status', 'trial')
  .is('deleted_at', null)
  .gte('created_at', windowCutoff);

const candidates = (raw ?? []).filter(canEmail);

// Historique (paginé)
const bySlug = new Map<string, Set<string>>();
const lastSent = new Map<string, string>();
const ids = candidates.map((m) => m.id);
const PAGE = 1000;
for (let off = 0; ids.length > 0; off += PAGE) {
  const { data } = await supabase
    .from('blog_email_recipients')
    .select('merchant_id, article_slug, sent_at')
    .in('merchant_id', ids)
    .range(off, off + PAGE - 1);
  if (!data || data.length === 0) break;
  for (const r of data) {
    const mid = r.merchant_id as string;
    if (!bySlug.has(mid)) bySlug.set(mid, new Set());
    bySlug.get(mid)!.add(r.article_slug as string);
    const prev = lastSent.get(mid);
    if (!prev || (r.sent_at as string) > prev) lastSent.set(mid, r.sent_at as string);
  }
  if (data.length < PAGE) break;
}

let due = 0, notDue = 0, exhausted = 0;
const perArticle = new Map<string, number>();
for (const m of candidates) {
  if (!isDueForDrip(lastSent.get(m.id) ?? null, m.created_at, now)) { notDue++; continue; }
  const art = pickNextDripArticle(BLOG_ARTICLES, bySlug.get(m.id) ?? new Set(), today);
  if (!art) { exhausted++; continue; }
  due++;
  perArticle.set(art.slug, (perArticle.get(art.slug) ?? 0) + 1);
}

console.log('\n=== DRY-RUN blog-drip (lecture seule) ===');
console.log(`Date              : ${today}  (fenêtre ${DRIP_WINDOW_DAYS} j → depuis ${windowCutoff.slice(0, 10)})`);
console.log(`Essais éligibles  : ${candidates.length}`);
console.log(`  - pas dus (espacement 2 j / âge < 24 h) : ${notDue}`);
console.log(`  - épuisés (ont déjà les 14)             : ${exhausted}`);
console.log(`= partiraient AUJOURD'HUI : ${due}`);
console.log('\nRépartition par article (ce 1er run) :');
for (const [slug, n] of [...perArticle.entries()].sort((a, b) => b[1] - a[1])) console.log(`  ${n.toString().padStart(4)}  ${slug}`);
console.log('\n(aucun email envoyé)\n');
}

main().catch((err) => { console.error(err); process.exit(1); });
