export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBlogDigestEmail } from '@/lib/email';
import { verifyCronAuth, batchGetUserEmails, canEmail, sendPaced } from '@/lib/cron-helpers';
import { BLOG_ARTICLES } from '@/data/blog-articles';
import { DRIP_WINDOW_DAYS, isDueForDrip, pickNextDripArticle } from '@/lib/blog-drip';
import type { EmailLocale } from '@/emails/translations';
import logger from '@/lib/logger';

const SITE_ORIGIN = 'https://getqarte.com';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

type TrialMerchant = {
  id: string;
  shop_name: string | null;
  user_id: string;
  locale: string | null;
  no_contact: boolean | null;
  email_bounced_at: string | null;
  email_unsubscribed_at: string | null;
  created_at: string;
};

// Charge tous les destinataires blog des salons candidats (paginé : un salon peut
// cumuler jusqu'à 14 lignes, donc > 1000 rows possibles au global).
async function loadRecipientHistory(merchantIds: string[]) {
  const bySlug = new Map<string, Set<string>>(); // merchant_id -> slugs reçus
  const lastSent = new Map<string, string>(); // merchant_id -> max(sent_at)
  if (merchantIds.length === 0) return { bySlug, lastSent };

  const PAGE = 1000;
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase
      .from('blog_email_recipients')
      .select('merchant_id, article_slug, sent_at')
      .in('merchant_id', merchantIds)
      .range(offset, offset + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const r of data) {
      const mid = r.merchant_id as string;
      let set = bySlug.get(mid);
      if (!set) { set = new Set(); bySlug.set(mid, set); }
      set.add(r.article_slug as string);
      const prev = lastSent.get(mid);
      if (!prev || (r.sent_at as string) > prev) lastSent.set(mid, r.sent_at as string);
    }
    if (data.length < PAGE) break;
  }
  return { bySlug, lastSent };
}

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Coupe-circuit : envois blog en pause (quota Resend gratuit).
  // Réactiver en posant BLOG_EMAILS_ENABLED=true côté env (sans redéploiement de code).
  if (process.env.BLOG_EMAILS_ENABLED !== 'true') {
    return NextResponse.json({ disabled: 'blog_emails_off' });
  }

  const dry = request.nextUrl.searchParams.get('dry') === '1';
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const windowCutoff = new Date(now.getTime() - DRIP_WINDOW_DAYS * 86_400_000).toISOString();

  // 1. Audience : essais (trial) inscrits dans la fenêtre, non supprimés, emailables.
  const { data: rawMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, locale, no_contact, email_bounced_at, email_unsubscribed_at, created_at')
    .eq('subscription_status', 'trial')
    .is('deleted_at', null)
    .gte('created_at', windowCutoff);

  const candidates = (rawMerchants ?? []).filter(canEmail) as TrialMerchant[];
  if (candidates.length === 0) {
    return NextResponse.json({ dry, candidates: 0, due: 0, sent: 0 });
  }

  // 2. Historique d'envois → slugs reçus + dernier envoi par salon.
  const { bySlug, lastSent } = await loadRecipientHistory(candidates.map((m) => m.id));

  // 3. Salons dus (espacement 2 j / âge 24 h) avec un article restant (newest-first).
  const queue: { merchant: TrialMerchant; article: (typeof BLOG_ARTICLES)[number] }[] = [];
  let exhausted = 0;
  let notDue = 0;
  for (const m of candidates) {
    if (!isDueForDrip(lastSent.get(m.id) ?? null, m.created_at, now)) { notDue++; continue; }
    const article = pickNextDripArticle(BLOG_ARTICLES, bySlug.get(m.id) ?? new Set(), today);
    if (!article) { exhausted++; continue; }
    queue.push({ merchant: m, article });
  }

  if (queue.length === 0) {
    return NextResponse.json({ dry, candidates: candidates.length, not_due: notDue, exhausted, due: 0, sent: 0 });
  }

  // 4. Emails + envoi cadencé (≤ 5/s).
  const emailMap = await batchGetUserEmails(supabase, [...new Set(queue.map((q) => q.merchant.user_id))]);
  const sendable = queue.filter((q) => emailMap.get(q.merchant.user_id));

  if (dry) {
    return NextResponse.json({
      dry: true,
      candidates: candidates.length,
      not_due: notDue,
      exhausted,
      due: queue.length,
      sendable: sendable.length,
      no_email: queue.length - sendable.length,
      sample: sendable.slice(0, 5).map((q) => ({ shop: q.merchant.shop_name, article: q.article.slug })),
    });
  }

  const { sent, errors, ok } = await sendPaced(sendable, async (q) => {
    const email = emailMap.get(q.merchant.user_id)!;
    const res = await sendBlogDigestEmail(
      email,
      q.merchant.shop_name || 'Ton salon',
      {
        title: q.article.title,
        description: q.article.description,
        category: q.article.category,
        readTime: q.article.readTime,
        imageUrl: `${SITE_ORIGIN}${q.article.image}`,
        url: `${SITE_ORIGIN}/blog/${q.article.slug}`,
      },
      q.merchant.id,
      (q.merchant.locale as EmailLocale) || 'fr',
    );
    return res.success;
  });

  // 5. Tracking : on n'écrit QUE dans blog_email_recipients (jamais blog_email_dispatches,
  // sinon le cron blog-digest considérerait l'article comme diffusé).
  if (ok.length > 0) {
    const { error: recErr } = await supabase
      .from('blog_email_recipients')
      .upsert(
        ok.map((q) => ({ article_slug: q.article.slug, merchant_id: q.merchant.id })),
        { onConflict: 'article_slug,merchant_id', ignoreDuplicates: true },
      );
    if (recErr) logger.error('blog-drip recipients record failed', recErr);
  }

  return NextResponse.json({
    dry: false,
    candidates: candidates.length,
    not_due: notDue,
    exhausted,
    due: queue.length,
    sent,
    errors,
  });
}
