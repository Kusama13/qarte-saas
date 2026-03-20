'use client';

import { motion } from 'framer-motion';
import {
  Globe, Heart, CalendarDays, Gift, Bell, Star, Sparkles, ArrowRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

const FEATURES = [
  { key: 'vitrine', icon: Globe, color: 'from-indigo-500 to-blue-500', iconColor: 'text-indigo-600', iconBg: 'bg-indigo-50', big: true },
  { key: 'fidelite', icon: Heart, color: 'from-pink-500 to-rose-500', iconColor: 'text-pink-600', iconBg: 'bg-pink-50', big: true },
  { key: 'planning', icon: CalendarDays, color: 'from-cyan-500 to-blue-500', iconColor: 'text-cyan-600', iconBg: 'bg-cyan-50', big: false },
  { key: 'bienvenue', icon: Gift, color: 'from-violet-500 to-purple-500', iconColor: 'text-violet-600', iconBg: 'bg-violet-50', big: false },
  { key: 'relances', icon: Bell, color: 'from-amber-500 to-orange-500', iconColor: 'text-amber-600', iconBg: 'bg-amber-50', big: false },
  { key: 'avis', icon: Star, color: 'from-emerald-500 to-teal-500', iconColor: 'text-emerald-600', iconBg: 'bg-emerald-50', big: false },
] as const;

export function BentoSection() {
  const t = useTranslations('features');

  const handleCta = () => {
    trackCtaClick('bento_cta', 'bento_section');
    fbEvents.lead();
    ttEvents.clickButton('bento_cta');
  };

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
      {/* Decorative */}
      <div className="absolute top-20 -left-32 w-96 h-96 bg-indigo-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 bg-pink-100/30 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-5">
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

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
          {FEATURES.map(({ key, icon: Icon, color, iconColor, iconBg, big }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: i * 0.07, ease: EASE }}
              className={`group relative bg-white/70 backdrop-blur-sm rounded-3xl border border-white/60 shadow-lg shadow-gray-100/50 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                big ? 'md:col-span-1 lg:col-span-1 lg:row-span-2' : ''
              }`}
            >
              {/* Top gradient accent */}
              <div className={`h-1 bg-gradient-to-r ${color}`} />

              <div className={`p-6 md:p-7 ${big ? 'lg:p-8' : ''}`}>
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
                  <Icon className={`w-6 h-6 ${iconColor}`} />
                </div>

                {/* Title */}
                <h3 className={`font-bold text-gray-900 mb-2 ${big ? 'text-xl md:text-2xl' : 'text-lg'}`}>
                  {t(`${key}Title`)}
                </h3>

                {/* Description */}
                <p className={`text-gray-500 leading-relaxed ${big ? 'text-base md:text-lg' : 'text-sm md:text-base'}`}>
                  {t(`${key}Desc`)}
                </p>

                {/* Big cards: extra highlight */}
                {big && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {[1, 2, 3].map((n) => (
                      <span key={n} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 border border-gray-100 text-xs font-medium text-gray-600">
                        <Sparkles className="w-3 h-3 text-gray-400" />
                        {t(`${key}Tag${n}`)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3, ease: EASE }}
          className="mt-12 md:mt-16 text-center"
        >
          <Link
            href="/auth/merchant/signup"
            onClick={handleCta}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transition-all duration-300 hover:-translate-y-0.5 text-sm md:text-base"
          >
            {t('cta')}
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-gray-400 mt-3">{t('ctaSub')}</p>
        </motion.div>
      </div>
    </section>
  );
}
