'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

export function FeaturesGridSection() {
  const t = useTranslations('featuresGrid');

  const features = [
    { emoji: '\u{1F4C5}', titleKey: 'bookingTitle', descKey: 'bookingDesc' },
    { emoji: '\u{1F514}', titleKey: 'remindersTitle', descKey: 'remindersDesc' },
    { emoji: '\u{1F4F1}', titleKey: 'dashboardTitle', descKey: 'dashboardDesc' },
    { emoji: '\u{1F3A8}', titleKey: 'profileTitle', descKey: 'profileDesc' },
    { emoji: '\u{1F451}', titleKey: 'policyTitle', descKey: 'policyDesc' },
    { emoji: '\u{1F49C}', titleKey: 'loyaltyTitle', descKey: 'loyaltyDesc' },
    { emoji: '\u{1F3C6}', titleKey: 'contestTitle', descKey: 'contestDesc' },
    { emoji: '\u{1F680}', titleKey: 'automationTitle', descKey: 'automationDesc' },
    { emoji: '\u2B50', titleKey: 'reviewsTitle', descKey: 'reviewsDesc' },
  ] as const;

  return (
    <section className="relative py-20 md:py-28 bg-white overflow-hidden">
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
          className="text-center mb-14 md:mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}{' '}
            <span className="relative font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleHighlight')}
            </span>
          </h2>
          <p className="text-lg text-gray-500">{t('subtitle')}</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {features.map(({ emoji, titleKey, descKey }, i) => (
            <motion.div
              key={titleKey}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.5, delay: 0.05 + i * 0.04, ease: EASE }}
              className="bg-white backdrop-blur-sm rounded-2xl p-6 sm:p-7 shadow-lg shadow-gray-200/40 border border-gray-100 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex items-start gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0 mt-0.5 text-2xl">
                {emoji}
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-[22px] font-semibold text-gray-900 mb-1 sm:mb-1.5 leading-snug line-clamp-1">
                  {t(titleKey)}
                </h3>
                <p className="text-sm sm:text-[18px] text-gray-500 leading-relaxed line-clamp-2">
                  {t(descKey)}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
