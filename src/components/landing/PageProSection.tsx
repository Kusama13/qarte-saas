'use client';

import { motion } from 'framer-motion';
import { Star, Search, CalendarDays, Scissors, Sparkles, UserPlus, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useLocale, useTranslations } from 'next-intl';
import { formatTime } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ── FeatureBlock (light variant) ── */

function FeatureBlock({
  title,
  titleBold,
  description,
  visual,
  reverse = false,
  delay = 0,
}: {
  title: string;
  titleBold: string;
  description: string;
  visual: React.ReactNode;
  reverse?: boolean;
  delay?: number;
}) {
  return (
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-6 md:gap-10 lg:gap-24`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay, ease: EASE }}
        className="flex-1 text-center lg:text-left"
      >
        <h3 className="text-2xl md:text-5xl font-bold text-gray-900 leading-tight mb-3 md:mb-5">
          {title}{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 font-extrabold">
            {titleBold}
          </span>
        </h3>
        <p className="text-base md:text-xl text-gray-500 leading-relaxed max-w-md mx-auto lg:mx-0">
          {description}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay: delay + 0.12, ease: EASE }}
        className="flex-1 flex justify-center"
      >
        {visual}
      </motion.div>
    </div>
  );
}

function Separator() {
  return <div className="w-24 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent mx-auto" />;
}

/* ── Visuals ── */

function SeoVisual({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative w-full max-w-[380px] mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">G</span>
          </div>
          <span className="text-[10px] text-gray-400">getqarte.com/p/latelier</span>
        </div>
        <p className="text-base font-semibold text-blue-700 mb-1">L&apos;Atelier — Onglerie Paris 11e</p>
        <p className="text-xs text-gray-500 leading-relaxed">{t('seoMockupDesc')}</p>
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
          ))}
          <span className="text-[11px] text-gray-400 ml-1">{t('seoMockupReviews')}</span>
        </div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-blue-100 animate-float-subtle">
        <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
          <Search className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800">{t('seoBadge')}</span>
      </div>
    </div>
  );
}

function PlanningVisual({ t, locale }: { t: (key: string) => string; locale: string }) {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-gradient-to-br from-indigo-50 to-violet-50 rounded-3xl shadow-xl shadow-indigo-100/30 border border-indigo-100 p-5">
        <div className="space-y-3">
          {[
            { day: locale === 'en' ? 'Mon 17' : 'Lun 17', slots: ['10:00', '14:00', '16:30'] },
            { day: locale === 'en' ? 'Tue 18' : 'Mar 18', slots: ['09:30', '11:00'] },
            { day: locale === 'en' ? 'Wed 19' : 'Mer 19', slots: ['14:00', '15:30', '17:00'] },
          ].map((d) => (
            <motion.div
              key={d.day}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex items-center gap-3"
            >
              <span className="text-xs font-bold text-gray-500 w-14 shrink-0">{d.day}</span>
              <div className="flex gap-1.5 flex-wrap">
                {d.slots.map((s) => (
                  <span key={s} className="text-[10px] font-bold text-indigo-600 bg-white border border-indigo-100 rounded-lg px-2.5 py-1 shadow-sm">{formatTime(s, locale)}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-indigo-100 animate-float-subtle">
        <div className="w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center">
          <CalendarDays className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800">{t('planningBadge')}</span>
      </div>
    </div>
  );
}

function PrestationsVisual({ t, locale }: { t: (key: string) => string; locale: string }) {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-5 space-y-2.5">
        {[
          { name: locale === 'en' ? 'Full gel set' : 'Pose complete gel', price: locale === 'en' ? '$45' : '45 \u20ac', dur: locale === 'en' ? '1h15m' : '1h15' },
          { name: 'Semi-permanent', price: locale === 'en' ? '$30' : '30 \u20ac', dur: '45min' },
          { name: locale === 'en' ? 'Nail art (per nail)' : 'Nail art (par ongle)', price: locale === 'en' ? '$5' : '5 \u20ac', dur: '10min' },
        ].map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 + i * 0.08, ease: EASE }}
            className="flex items-center justify-between py-2.5 px-3.5 bg-gray-50 rounded-xl hover:bg-gray-100/80 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-gray-700">{s.name}</p>
              <p className="text-[10px] text-gray-400">{s.dur}</p>
            </div>
            <span className="text-sm font-bold text-gray-900">{s.price}</span>
          </motion.div>
        ))}
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-rose-100 animate-float-subtle">
        <div className="w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center">
          <Scissors className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800">{t('servicesBadge')}</span>
      </div>
    </div>
  );
}

function WelcomeOfferVisual({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="bg-gradient-to-br from-violet-50 to-pink-50 rounded-3xl shadow-xl shadow-violet-100/30 border border-violet-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-500" />
          <span className="text-[10px] font-bold text-violet-500 uppercase tracking-wider">{t('welcomeBadgeLabel')}</span>
        </div>
        <p className="text-lg font-bold text-gray-800 mb-4">{t('welcomeOffer')}</p>
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl px-4 py-2.5 text-center shadow-lg shadow-indigo-200/40">
          <span className="text-sm font-bold text-white">{t('welcomeCta')}</span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
          className="flex items-center gap-2 mt-4 bg-emerald-50 rounded-xl px-3 py-2.5"
        >
          <UserPlus className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-bold text-emerald-700">{t('welcomeNewClient')}</span>
        </motion.div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-white rounded-full px-3 py-1.5 shadow-lg shadow-gray-200/40 border border-violet-100 animate-float-subtle">
        <div className="w-5 h-5 bg-violet-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-xs font-bold text-gray-800">{t('welcomeBadge')}</span>
      </div>
    </div>
  );
}

/* ── Section ── */

export function PageProSection() {
  const t = useTranslations('pagePro');
  const locale = useLocale();

  return (
    <section className="relative py-20 md:py-28 bg-white overflow-hidden">
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-14 md:mb-16"
        >
          {t('badge') && <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider mb-4">
            {t('badge')}
          </p>}
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
            {t('title')}{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleBold')}
            </span>
          </h2>
          <p className="mt-3 text-gray-500 text-lg">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-col gap-6 md:gap-10 lg:gap-12">
          <FeatureBlock
            title={t('seoTitle')}
            titleBold={t('seoTitleBold')}
            description={t('seoDesc')}
            visual={<SeoVisual t={t} />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title={t('planningTitle')}
            titleBold={t('planningTitleBold')}
            description={t('planningDesc')}
            visual={<PlanningVisual t={t} locale={locale} />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title={t('welcomeTitle')}
            titleBold={t('welcomeTitleBold')}
            description={t('welcomeDesc')}
            visual={<WelcomeOfferVisual t={t} />}
            delay={0.05}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-20 text-center"
        >
          <Link
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('page_pro_cta', 'page_pro_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            {t('cta')}
            <ArrowRight className="w-5 h-5" />
          </Link>
          <p className="mt-3 text-sm text-gray-400">{t('ctaSub')}</p>
        </motion.div>
      </div>
    </section>
  );
}
