export const maxDuration = 300;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendBlogDigestEmail } from '@/lib/email';
import { verifyCronAuth, batchGetUserEmails, canEmail, rateLimitDelay } from '@/lib/cron-helpers';
import { BLOG_ARTICLES } from '@/data/blog-articles';
import type { EmailLocale } from '@/emails/translations';
import logger from '@/lib/logger';

const MIN_DAYS_BETWEEN_DISPATCHES = 3;
const SITE_ORIGIN = 'https://getqarte.com';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function GET(request: NextRequest) {
  if (!verifyCronAuth(request.headers.get('authorization'))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Check si on a le droit d'envoyer (>= 3j depuis le dernier dispatch)
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

  // 2. Pick le prochain article : publie, non-dispatche, plus ancien en premier
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

  // 3. Fetch les merchants eligibles (actifs + canEmail)
  const { data: allMerchants } = await supabase
    .from('merchants')
    .select('id, shop_name, user_id, locale, subscription_status, no_contact, email_bounced_at, email_unsubscribed_at');

  const eligible = (allMerchants ?? []).filter(
    (m) => ['trial', 'active', 'canceling', 'past_due'].includes(m.subscription_status ?? '') && canEmail(m),
  );

  if (eligible.length === 0) {
    return NextResponse.json({ article_slug: nextArticle.slug, sent: 0, skipped: 'no_eligible_merchants' });
  }

  const emailMap = await batchGetUserEmails(supabase, [...new Set(eligible.map((m) => m.user_id))]);

  // 4. Send + track
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
  for (const merchant of eligible) {
    const email = emailMap.get(merchant.user_id);
    if (!email) continue;
    try {
      const result = await sendBlogDigestEmail(
        email,
        merchant.shop_name || 'Ton salon',
        articlePayload,
        merchant.id,
        (merchant.locale as EmailLocale) || 'fr',
      );
      if (result.success) {
        sent++;
      } else {
        errors++;
      }
    } catch (err) {
      errors++;
      logger.error('blog-digest send error', { merchantId: merchant.id, err });
    }
    await rateLimitDelay();
  }

  // 5. Record le dispatch (une seule ligne par article)
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
    eligible: eligible.length,
    sent,
    errors,
  });
}
