export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBlogDigestEmail } from '@/lib/email';
import { verifyCronAuth, batchGetUserEmails, canEmail, rateLimitDelay } from '@/lib/cron-helpers';
import { PAID_STATUSES } from '@/lib/sms';
import { BLOG_ARTICLES } from '@/data/blog-articles';
import type { EmailLocale } from '@/emails/translations';
import logger from '@/lib/logger';

const MIN_DAYS_BETWEEN_DISPATCHES = 3;
const RECENT_TRIAL_SIGNUP_DAYS = 21;
const SEND_BATCH_SIZE = 10;
const SITE_ORIGIN = 'https://getqarte.com';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Throttle global : >= 3 jours depuis le dernier dispatch tous articles confondus
  const { data: recent } = await supabase
    .from('blog_email_dispatches')
    .select('sent_at, article_slug')
    .order('sent_at', { ascending: false })
    .limit(1);

  const lastSentAt = recent?.[0]?.sent_at as string | undefined;
  if (lastSentAt) {
    const daysSince = (Date.now() - new Date(lastSentAt).getTime()) / 86_400_000;
    if (daysSince < MIN_DAYS_BETWEEN_DISPATCHES) {
      return NextResponse.json({
        skipped: 'last_dispatch_too_recent',
        last_article: recent?.[0]?.article_slug,
        days_since: Math.round(daysSince * 10) / 10,
      });
    }
  }

  // 2. Pick le prochain article : publie, non-dispatche globalement, plus ancien en premier
  const { data: dispatched } = await supabase
    .from('blog_email_dispatches')
    .select('article_slug');
  const dispatchedSlugs = new Set((dispatched ?? []).map((d) => d.article_slug));
  const today = new Date().toISOString().slice(0, 10);

  const nextArticle = BLOG_ARTICLES
    .filter((a) => a.date <= today && !dispatchedSlugs.has(a.slug))
    .sort((a, b) => a.date.localeCompare(b.date))[0];

  if (!nextArticle) {
    return NextResponse.json({ skipped: 'no_unsent_articles' });
  }

  // 3. Audience cible :
  //    - Tous les abonnes payants (active/canceling/past_due) — y compris signups anciens (fevrier+)
  //    - Trials uniquement si inscrits depuis < 21 jours (onboarding educatif)
  const recentTrialCutoff = new Date(Date.now() - RECENT_TRIAL_SIGNUP_DAYS * 86_400_000);
  const { data: allMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, locale, subscription_status, no_contact, email_bounced_at, email_unsubscribed_at, created_at')
    .in('subscription_status', ['trial', ...PAID_STATUSES]);

  const candidates = (allMerchants ?? []).filter((m) => {
    if (!canEmail(m)) return false;
    if (m.subscription_status === 'trial') {
      return m.created_at && new Date(m.created_at) >= recentTrialCutoff;
    }
    return true;
  });

  // 4. Dedup per-article : on retire ceux qui ont deja recu ce slug (mig 126).
  // Garde-fou contre retry/crash mid-loop ou run manuel duplique.
  const { data: alreadyRecipients } = await supabase
    .from('blog_email_recipients')
    .select('merchant_id')
    .eq('article_slug', nextArticle.slug);
  const alreadyIds = new Set((alreadyRecipients ?? []).map((r) => r.merchant_id as string));
  const eligible = candidates.filter((m) => !alreadyIds.has(m.id));

  if (eligible.length === 0) {
    return NextResponse.json({
      article_slug: nextArticle.slug,
      sent: 0,
      skipped: 'no_eligible_merchants_or_all_received',
      candidates: candidates.length,
      already_received: alreadyIds.size,
    });
  }

  const emailMap = await batchGetUserEmails(supabase, [...new Set(eligible.map((m) => m.user_id))]);

  // 5. Send + record per-recipient (idempotent via upsert)
  const articlePayload = {
    title: nextArticle.title,
    description: nextArticle.description,
    category: nextArticle.category,
    readTime: nextArticle.readTime,
    imageUrl: `${SITE_ORIGIN}${nextArticle.image}`,
    url: `${SITE_ORIGIN}/blog/${nextArticle.slug}`,
  };

  let sent = 0;
  let errors = 0;
  const successfulRecipients: { article_slug: string; merchant_id: string }[] = [];

  // Batch parallele : N envois concurrents, delai inter-batch pour le rate limit Resend
  for (let i = 0; i < eligible.length; i += SEND_BATCH_SIZE) {
    const batch = eligible.slice(i, i + SEND_BATCH_SIZE);
    const results = await Promise.allSettled(batch.map(async (merchant) => {
      const email = emailMap.get(merchant.user_id);
      if (!email) return { merchant, sent: false };
      const result = await sendBlogDigestEmail(
        email,
        merchant.shop_name || 'Ton salon',
        articlePayload,
        merchant.id,
        (merchant.locale as EmailLocale) || 'fr',
      );
      return { merchant, sent: result.success };
    }));
    for (const r of results) {
      if (r.status === 'fulfilled' && r.value.sent) {
        sent++;
        successfulRecipients.push({ article_slug: nextArticle.slug, merchant_id: r.value.merchant.id });
      } else {
        errors++;
        if (r.status === 'rejected') {
          logger.error('blog-digest send error', r.reason);
        }
      }
    }
    if (i + SEND_BATCH_SIZE < eligible.length) await rateLimitDelay();
  }

  // 6. Bulk upsert des recipients (ON CONFLICT DO NOTHING via ignoreDuplicates)
  if (successfulRecipients.length > 0) {
    const { error: recipError } = await supabase
      .from('blog_email_recipients')
      .upsert(successfulRecipients, {
        onConflict: 'article_slug,merchant_id',
        ignoreDuplicates: true,
      });
    if (recipError) {
      logger.error('blog-digest recipients record failed', recipError);
    }
  }

  // 7. Record le dispatch global (throttle inter-articles)
  const { error: insertError } = await supabase.from('blog_email_dispatches').insert({
    article_slug: nextArticle.slug,
    sent_at: new Date().toISOString(),
    recipient_count: sent,
  });
  if (insertError) {
    logger.error('blog-digest dispatch record failed', insertError);
  }

  return NextResponse.json({
    article_slug: nextArticle.slug,
    article_title: nextArticle.title,
    audience: 'paid_subscribers + trials_within_21_days',
    candidates: candidates.length,
    already_received: alreadyIds.size,
    eligible: eligible.length,
    sent,
    errors,
  });
}
