'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function FeaturesGridSection() {
  const t = useTranslations('featuresGrid');

  const features = [
    { number: '100', titleKey: 'policyTitle',    descKey: 'policyDesc',    competitorKey: 'policyCompetitor',    bg: 'bg-sky-50',     border: 'border-sky-100',     text: 'text-sky-600'     },
    { number: '0%',  titleKey: 'remindersTitle', descKey: 'remindersDesc', competitorKey: 'remindersCompetitor', bg: 'bg-emerald-50', border: 'border-emerald-100', text: 'text-emerald-700' },
    { number: '0€', titleKey: 'dashboardTitle', descKey: 'dashboardDesc', competitorKey: 'dashboardCompetitor', bg: 'bg-rose-50',    border: 'border-rose-100',    text: 'text-rose-600'    },
  ] as const;

  return (
    <section className="relative py-16 md:py-20 bg-white overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-emerald-100/30 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-rose-100/30 rounded-full blur-[120px] pointer-events-none" />
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-5">
          {features.map(({ number, titleKey, descKey, competitorKey, bg, border, text }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.04, ease: EASE }}
              className="bg-white backdrop-blur-sm rounded-2xl p-4 md:p-7 shadow-md md:shadow-lg shadow-gray-200/40 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col gap-2.5 md:gap-3"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className={`min-w-[3.5rem] md:min-w-[4.5rem] px-3 py-2 rounded-xl ${bg} border ${border} flex items-center justify-center shrink-0`}>
                  <span className={`text-2xl md:text-3xl font-extrabold tabular-nums tracking-tighter ${text}`}>{number}</span>
                </div>
                <h3 className="min-w-0 flex-1 text-lg md:text-xl font-semibold text-gray-900 leading-snug">
                  {t(titleKey)}
                </h3>
              </div>
              <p className="text-sm md:text-base text-gray-500 leading-snug md:leading-relaxed">
                {t(descKey)}
              </p>
              <p className="text-xs text-gray-400 italic leading-snug">
                {t(competitorKey)}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
