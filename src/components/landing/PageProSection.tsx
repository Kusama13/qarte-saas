'use client';

import { motion } from 'framer-motion';
import { ArrowRight, CreditCard } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useLocale, useTranslations } from 'next-intl';
import { formatTime } from '@/lib/utils';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/* ── FeatureBlock (dark variant) ── */

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
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-6 md:gap-10 lg:gap-16`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay, ease: EASE }}
        className="flex-1 text-center lg:text-left"
      >
        <h3 className="text-2xl md:text-5xl font-bold text-gray-900 leading-tight mb-3 md:mb-5">
          {title}{' '}
          <span className="font-[family-name:var(--font-display)] italic text-indigo-600 font-extrabold">
            {titleBold}
          </span>
        </h3>
        <p className="text-base md:text-xl text-gray-600 leading-relaxed max-w-md mx-auto lg:mx-0">
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
  return (
    <div className="hidden md:flex items-center justify-center gap-3 py-2">
      <div className="w-12 h-px bg-gray-200" />
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
      <div className="w-12 h-px bg-gray-200" />
    </div>
  );
}

/* ── Visuals (dark) ── */

function PlanningVisual({ t, locale }: { t: (key: string) => string; locale: string }) {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-5">
        <div className="space-y-3">
          {[
            { day: locale === 'en' ? 'Mon 17' : 'Lun 17', slots: [{ time: '10:00' }, { time: '14:00', booked: true, client: 'Marie L.' }, { time: '16:30' }] },
            { day: locale === 'en' ? 'Tue 18' : 'Mar 18', slots: [{ time: '09:30' }, { time: '11:00' }] },
            { day: locale === 'en' ? 'Wed 19' : 'Mer 19', slots: [{ time: '14:00' }, { time: '15:30', booked: true, client: 'Sophie D.' }, { time: '17:00' }] },
          ].map((d) => (
            <motion.div
              key={d.day}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, ease: EASE }}
              className="flex items-center gap-3"
            >
              <span className="text-xs font-bold text-gray-400 w-14 shrink-0">{d.day}</span>
              <div className="flex gap-1.5 flex-wrap">
                {d.slots.map((s) => (
                  s.booked ? (
                    <span key={s.time} className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1">
                      {formatTime(s.time, locale)} · {s.client}
                    </span>
                  ) : (
                    <span key={s.time} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-2.5 py-1">{formatTime(s.time, locale)}</span>
                  )
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-emerald-500 rounded-full px-3 py-1.5 shadow-lg shadow-emerald-500/30 motion-safe:animate-float-subtle">
        <span className="text-sm">{'\u2705'}</span>
        <span className="text-xs font-bold text-white">{t('planningBadge')}</span>
      </div>
    </div>
  );
}

function PrestationsVisual({ t, locale }: { t: (key: string) => string; locale: string }) {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-5 space-y-2.5">
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
            className="flex items-center justify-between py-2.5 px-3.5 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-gray-700">{s.name}</p>
              <p className="text-[10px] text-gray-400">{s.dur}</p>
            </div>
            <span className="text-sm font-bold text-gray-900">{s.price}</span>
          </motion.div>
        ))}
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-rose-500 rounded-full px-3 py-1.5 shadow-lg shadow-rose-500/30 motion-safe:animate-float-subtle">
        <span className="text-sm">{'\u2702\uFE0F'}</span>
        <span className="text-xs font-bold text-white">{t('servicesBadge')}</span>
      </div>
    </div>
  );
}

function AcompteVisual({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/60 border border-gray-100 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-white" />
          </div>
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">{t('acompteBadgeLabel')}</span>
        </div>
        <p className="text-lg font-bold text-gray-900 mb-4">{t('acompteLinkValue')}</p>
        <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl px-4 py-2.5 text-center shadow-lg shadow-emerald-500/30">
          <span className="text-sm font-bold text-white">{t('acompteCta')}</span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
          className="flex items-center gap-2 mt-4 bg-emerald-50 rounded-xl px-3 py-2.5"
        >
          <span className="text-base">{'\u2705'}</span>
          <span className="text-xs font-bold text-emerald-700">{t('acompteDirect')}</span>
        </motion.div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-emerald-500 rounded-full px-3 py-1.5 shadow-lg shadow-emerald-500/30 motion-safe:animate-float-subtle">
        <span className="text-sm">{'\uD83D\uDCB8'}</span>
        <span className="text-xs font-bold text-white">{t('acompteBadge')}</span>
      </div>
    </div>
  );
}

/* ── Section ── */

export function PageProSection() {
  const t = useTranslations('pagePro');
  const locale = useLocale();

  return (
    <section className="relative py-16 md:py-28 bg-gradient-to-b from-white to-stone-50 overflow-hidden">
      {/* Ambient glow — soft */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-10 md:mb-16"
        >
          {t('badge') && <p className="text-xs md:text-sm font-bold text-indigo-600 uppercase tracking-wider mb-2 md:mb-4">
            {t('badge')}
          </p>}
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900">
            {t('title')}{' '}
            <span className="font-[family-name:var(--font-display)] italic text-indigo-600">
              {t('titleBold')}
            </span>
          </h2>
          <p className="mt-3 md:mt-3 text-gray-600 text-base md:text-lg leading-relaxed max-w-xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-col gap-10 md:gap-10 lg:gap-12">
          <FeatureBlock
            title={t('planningTitle')}
            titleBold={t('planningTitleBold')}
            description={t('planningDesc')}
            visual={<PlanningVisual t={t} locale={locale} />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title={t('servicesTitle')}
            titleBold={t('servicesTitleBold')}
            description={t('servicesDesc')}
            visual={<PrestationsVisual t={t} locale={locale} />}
            reverse
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title={t('acompteTitle')}
            titleBold={t('acompteTitleBold')}
            description={t('acompteDesc')}
            visual={<AcompteVisual t={t} />}
            delay={0.05}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-14 md:mt-20 text-center"
        >
          <Link
            href="/auth/merchant/signup"
            onClick={() => { trackCtaClick('page_pro_cta', 'page_pro_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
            className="group inline-flex items-center gap-2 px-6 md:px-8 py-3 md:py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 text-sm md:text-base"
          >
            {t('cta')}
            <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-2 md:mt-3 text-xs md:text-sm text-gray-500">{t('ctaSub')}</p>
        </motion.div>
      </div>
    </section>
  );
}
