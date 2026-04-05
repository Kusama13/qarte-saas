'use client';

import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
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
    <div className={`flex flex-col ${reverse ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-6 md:gap-10 lg:gap-24`}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.7, delay, ease: EASE }}
        className="flex-1 text-center lg:text-left"
      >
        <h3 className="text-2xl md:text-5xl font-bold text-white leading-tight mb-3 md:mb-5">
          {title}{' '}
          <span className="font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400 font-extrabold">
            {titleBold}
          </span>
        </h3>
        <p className="text-base md:text-xl text-gray-400 leading-relaxed max-w-md mx-auto lg:mx-0">
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
    <div className="flex items-center justify-center gap-3 py-2">
      <div className="w-12 h-px bg-white/10" />
      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400/40" />
      <div className="w-12 h-px bg-white/10" />
    </div>
  );
}

/* ── Visuals (dark) ── */

function SeoVisual({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative w-full max-w-[380px] mx-auto">
      <div className="bg-white/[0.06] backdrop-blur-sm rounded-3xl shadow-xl shadow-black/20 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center">
            <span className="text-white text-[9px] font-bold">G</span>
          </div>
          <span className="text-[10px] text-white/40">getqarte.com/p/latelier</span>
        </div>
        <p className="text-base font-semibold text-blue-400 mb-1">L&apos;Atelier — Onglerie Paris 11e</p>
        <p className="text-xs text-white/50 leading-relaxed">{t('seoMockupDesc')}</p>
        <div className="flex items-center gap-1 mt-2">
          {[...Array(5)].map((_, i) => (
            <span key={i} className="text-sm">{'\u2B50'}</span>
          ))}
          <span className="text-[11px] text-white/40 ml-1">{t('seoMockupReviews')}</span>
        </div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-blue-500 rounded-full px-3 py-1.5 shadow-lg shadow-blue-500/30 animate-float-subtle">
        <span className="text-sm">{'\uD83D\uDD0D'}</span>
        <span className="text-xs font-bold text-white">{t('seoBadge')}</span>
      </div>
    </div>
  );
}

function PlanningVisual({ t, locale }: { t: (key: string) => string; locale: string }) {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-white/[0.06] backdrop-blur-sm rounded-3xl shadow-xl shadow-black/20 border border-white/10 p-5">
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
              <span className="text-xs font-bold text-white/50 w-14 shrink-0">{d.day}</span>
              <div className="flex gap-1.5 flex-wrap">
                {d.slots.map((s) => (
                  s.booked ? (
                    <span key={s.time} className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-400/30 rounded-lg px-2.5 py-1 shadow-sm">
                      {formatTime(s.time, locale)} — {s.client}
                    </span>
                  ) : (
                    <span key={s.time} className="text-[10px] font-bold text-indigo-300 bg-white/[0.08] border border-white/10 rounded-lg px-2.5 py-1 shadow-sm">{formatTime(s.time, locale)}</span>
                  )
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-emerald-500 rounded-full px-3 py-1.5 shadow-lg shadow-emerald-500/30 animate-float-subtle">
        <span className="text-sm">{'\u2705'}</span>
        <span className="text-xs font-bold text-white">{t('planningBadge')}</span>
      </div>
    </div>
  );
}

function PrestationsVisual({ t, locale }: { t: (key: string) => string; locale: string }) {
  return (
    <div className="relative w-full max-w-[340px] mx-auto">
      <div className="bg-white/[0.06] backdrop-blur-sm rounded-3xl shadow-xl shadow-black/20 border border-white/10 p-5 space-y-2.5">
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
            className="flex items-center justify-between py-2.5 px-3.5 bg-white/[0.06] rounded-xl hover:bg-white/[0.1] transition-colors"
          >
            <div>
              <p className="text-sm font-semibold text-white/80">{s.name}</p>
              <p className="text-[10px] text-white/30">{s.dur}</p>
            </div>
            <span className="text-sm font-bold text-white">{s.price}</span>
          </motion.div>
        ))}
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-rose-500 rounded-full px-3 py-1.5 shadow-lg shadow-rose-500/30 animate-float-subtle">
        <span className="text-sm">{'\u2702\uFE0F'}</span>
        <span className="text-xs font-bold text-white">{t('servicesBadge')}</span>
      </div>
    </div>
  );
}

function WelcomeOfferVisual({ t }: { t: (key: string) => string }) {
  return (
    <div className="relative w-full max-w-[320px] mx-auto">
      <div className="bg-white/[0.06] backdrop-blur-sm rounded-3xl shadow-xl shadow-black/20 border border-white/10 p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-base">{'\u2728'}</span>
          <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">{t('welcomeBadgeLabel')}</span>
        </div>
        <p className="text-lg font-bold text-white mb-4">{t('welcomeOffer')}</p>
        <div className="bg-gradient-to-r from-indigo-500 to-violet-500 rounded-xl px-4 py-2.5 text-center shadow-lg shadow-indigo-500/30">
          <span className="text-sm font-bold text-white">{t('welcomeCta')}</span>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3, ease: EASE }}
          className="flex items-center gap-2 mt-4 bg-emerald-500/15 rounded-xl px-3 py-2.5"
        >
          <span className="text-base">{'\uD83D\uDC64'}</span>
          <span className="text-xs font-bold text-emerald-400">{t('welcomeNewClient')}</span>
        </motion.div>
      </div>

      <div className="absolute -top-3 -right-3 flex items-center gap-1.5 bg-violet-500 rounded-full px-3 py-1.5 shadow-lg shadow-violet-500/30 animate-float-subtle">
        <span className="text-sm">{'\u2728'}</span>
        <span className="text-xs font-bold text-white">{t('welcomeBadge')}</span>
      </div>
    </div>
  );
}

/* ── Section ── */

export function PageProSection() {
  const t = useTranslations('pagePro');
  const locale = useLocale();

  return (
    <section className="relative py-20 md:py-28 bg-gray-950 overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: 'radial-gradient(circle, #818cf8 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-14 md:mb-16"
        >
          {t('badge') && <p className="text-sm font-bold text-indigo-400 uppercase tracking-wider mb-4">
            {t('badge')}
          </p>}
          <h2 className="text-4xl md:text-5xl font-bold text-white">
            {t('title')}{' '}
            <span className="font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              {t('titleBold')}
            </span>
          </h2>
          <p className="mt-3 text-gray-400 text-lg">
            {t('subtitle')}
          </p>
        </motion.div>

        <div className="flex flex-col gap-6 md:gap-10 lg:gap-12">
          <FeatureBlock
            title={t('planningTitle')}
            titleBold={t('planningTitleBold')}
            description={t('planningDesc')}
            visual={<PlanningVisual t={t} locale={locale} />}
            delay={0.05}
          />

          <Separator />

          <FeatureBlock
            title={t('seoTitle')}
            titleBold={t('seoTitleBold')}
            description={t('seoDesc')}
            visual={<SeoVisual t={t} />}
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
            className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-gray-900 font-bold rounded-xl shadow-lg shadow-white/10 hover:shadow-white/20 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
          >
            {t('cta')}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
          <p className="mt-3 text-sm text-gray-500">{t('ctaSub')}</p>
        </motion.div>
      </div>
    </section>
  );
}
