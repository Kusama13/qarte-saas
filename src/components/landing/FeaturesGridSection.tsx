'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ShieldCheck, Heart, MessageSquare } from 'lucide-react';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function FeaturesGridSection() {
  const t = useTranslations('featuresGrid');

  const features = [
    { Icon: MessageSquare, titleKey: 'policyTitle',    descKey: 'policyDesc',    competitorKey: 'policyCompetitor',    bg: 'bg-sky-50',     border: 'border-sky-100',     text: 'text-sky-600'     },
    { Icon: ShieldCheck,   titleKey: 'remindersTitle', descKey: 'remindersDesc', competitorKey: 'remindersCompetitor', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-600' },
    { Icon: Heart,         titleKey: 'dashboardTitle', descKey: 'dashboardDesc', competitorKey: 'dashboardCompetitor', bg: 'bg-rose-50',    border: 'border-rose-100',    text: 'text-rose-500'    },
  ] as const;

  return (
    <section className="relative py-12 md:py-16 bg-white overflow-hidden">
      {/* Ambient glow — same as FideliteSection */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-100/40 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-violet-100/30 rounded-full blur-[120px] pointer-events-none" />
      {/* Subtle grain */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\' stitchTiles=\'stitch\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")' }} />

      <div className="relative max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-center mb-10 md:mb-16"
        >
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-3 md:mb-4">
            {t('title')}{' '}
            <span className="relative font-[family-name:var(--font-display)] italic text-indigo-600">
              {t('titleHighlight')}
            </span>
          </h2>
          <p className="text-base md:text-lg text-gray-500 leading-relaxed max-w-xl mx-auto">{t('subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-5">
          {features.map(({ Icon, titleKey, descKey, competitorKey, bg, border, text }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.04, ease: EASE }}
              className="bg-white backdrop-blur-sm rounded-2xl p-4 sm:p-7 shadow-md md:shadow-lg shadow-gray-200/40 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row items-start gap-2.5 sm:gap-4"
            >
              <div className={`w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0 mt-0.5`}>
                <Icon className={`w-4 h-4 sm:w-5 sm:h-5 ${text}`} strokeWidth={2} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base sm:text-[22px] font-semibold text-gray-900 mb-1 sm:mb-1.5 leading-snug">
                  {t(titleKey)}
                </h3>
                <p className="text-[13px] sm:text-[17px] text-gray-500 leading-snug sm:leading-relaxed">
                  {t(descKey)}
                </p>
                <p className="mt-2 text-[11px] sm:text-xs text-gray-400 italic leading-snug">
                  {t(competitorKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
