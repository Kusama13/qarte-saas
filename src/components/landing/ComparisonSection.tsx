'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Heart, Flower2, Gift, CalendarDays, MessageCircle, Star, Globe, Send } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const COL_A_ITEMS = [
  { key: 'colA1', icon: Heart, color: 'text-pink-500', bg: 'bg-pink-50' },
  { key: 'colA2', icon: Flower2, color: 'text-amber-500', bg: 'bg-amber-50' },
  { key: 'colA3', icon: Globe, color: 'text-blue-500', bg: 'bg-blue-50' },
  { key: 'colA4', icon: Gift, color: 'text-violet-500', bg: 'bg-violet-50' },
] as const;

const COL_B_ITEMS = [
  { key: 'colB1', icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-50' },
  { key: 'colB2', icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-50' },
  { key: 'colB3', icon: CalendarDays, color: 'text-cyan-500', bg: 'bg-cyan-50' },
  { key: 'colB4', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
] as const;

export function ComparisonSection() {
  const t = useTranslations('comparison');

  const handleCta = () => {
    trackCtaClick('comparison_cta', 'comparison_section');
    fbEvents.lead();
    ttEvents.clickButton('comparison_cta');
  };

  return (
    <section className="relative py-20 md:py-32 overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-indigo-100/40 rounded-full blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 bg-violet-100/40 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-6xl px-5">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, ease: EASE }}
          className="text-center mb-12 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
            {t('title')} <span className="bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent">{t('titleBold')}</span>
          </h2>
          <p className="text-base md:text-lg text-gray-500 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </motion.div>

        {/* Two columns */}
        <div className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10 md:mb-14">

          {/* Column A: Already on a platform */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.1, ease: EASE }}
            className="relative bg-white/70 backdrop-blur-sm rounded-3xl border border-white/60 shadow-xl shadow-indigo-100/30 overflow-hidden"
          >
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-indigo-500 to-blue-500 px-6 py-5 md:px-8 md:py-6">
              <p className="text-indigo-200 text-xs font-semibold uppercase tracking-wider mb-1">{t('colABadge')}</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">{t('colATitle')}</h3>
            </div>
            {/* Items */}
            <div className="p-5 md:p-7 space-y-3">
              {COL_A_ITEMS.map(({ key, icon: Icon, color, bg }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: EASE }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/80 border border-gray-100/50"
                >
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-base md:text-lg text-gray-600 leading-relaxed pt-1">{t(key)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Column B: Solo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.7, delay: 0.2, ease: EASE }}
            className="relative bg-white/70 backdrop-blur-sm rounded-3xl border border-white/60 shadow-xl shadow-violet-100/30 overflow-hidden"
          >
            {/* Gradient header */}
            <div className="bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-5 md:px-8 md:py-6">
              <p className="text-violet-200 text-xs font-semibold uppercase tracking-wider mb-1">{t('colBBadge')}</p>
              <h3 className="text-xl md:text-2xl font-bold text-white">{t('colBTitle')}</h3>
            </div>
            {/* Items */}
            <div className="p-5 md:p-7 space-y-3">
              {COL_B_ITEMS.map(({ key, icon: Icon, color, bg }, i) => (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, x: 10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.2 + i * 0.08, ease: EASE }}
                  className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50/80 border border-gray-100/50"
                >
                  <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center shrink-0`}>
                    <Icon className={`w-5 h-5 ${color}`} />
                  </div>
                  <p className="text-base md:text-lg text-gray-600 leading-relaxed pt-1">{t(key)}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Philosophy callout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.7, delay: 0.3, ease: EASE }}
          className="relative bg-gradient-to-br from-indigo-50/80 to-violet-50/80 backdrop-blur-sm rounded-3xl border border-indigo-100/50 p-6 md:p-8 mb-10 md:mb-12 overflow-hidden"
        >
          <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-indigo-100/30 rounded-full blur-2xl" />
          <div className="relative flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center shrink-0">
              <Send className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-base md:text-lg font-bold text-gray-900 mb-2">{t('philoTitle')}</h3>
              <p className="text-sm md:text-base text-gray-600 leading-relaxed">{t('philoText')}</p>
            </div>
          </div>
        </motion.div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/auth/merchant/signup"
            onClick={handleCta}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-0.5 text-sm md:text-base"
          >
            {t('cta')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400 mt-3">{t('ctaSub')}</p>
        </div>
      </div>
    </section>
  );
}
