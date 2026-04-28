'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];

/**
 * Transition vers le pricing : pose la question concrète
 * ("tu as déjà un outil de résa ou pas ?") qui justifie les 2 plans affichés juste après.
 * Les clés i18n sont sous le namespace `fidelite.planity*` (historique, peut être déplacé plus tard).
 */
export function PricingTransitionSection() {
  const t = useTranslations('fidelite');

  return (
    <section className="relative py-12 md:py-14 bg-white overflow-hidden">
      <div className="relative max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: EASE }}
        >
          <div className="bg-gradient-to-r from-stone-50 via-white to-stone-50 border border-stone-200 rounded-2xl md:rounded-3xl p-5 md:p-7">
            <div className="text-center mb-5 md:mb-6">
              <p className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{t('planityTitle')}</p>
              <p className="text-sm md:text-base text-gray-600 mt-2 max-w-2xl mx-auto">{t('planityDesc')}</p>
              <p className="text-xs md:text-sm text-emerald-700 font-semibold mt-3 inline-flex items-center gap-1.5">
                <span>✓</span> {t('planityMigrate')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-3 mb-5">
              <div className="relative bg-white rounded-xl p-4 border border-gray-200 flex flex-col">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-lg">{'\uD83E\uDD1D'}</span>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">
                    {t('planityOpt1Label')}
                  </span>
                </div>
                <h4 className="text-[15px] md:text-base font-bold text-gray-900 mb-1 leading-snug">
                  {t('planityOpt1Title')}
                </h4>
                <p className="text-[13px] text-gray-500 mb-3">{t('planityOpt1Desc')}</p>
                <ul className="space-y-1.5 mt-auto">
                  {(['planityOpt1Feat1', 'planityOpt1Feat2', 'planityOpt1Feat3', 'planityOpt1Feat4'] as const).map(k => (
                    <li key={k} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{t(k)}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="relative bg-gradient-to-br from-emerald-600 to-emerald-700 rounded-xl p-4 text-white shadow-lg shadow-emerald-200/50 flex flex-col">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{'\uD83D\uDE80'}</span>
                    <span className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider">
                      {t('planityOpt2Label')}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 uppercase tracking-wider">
                    {t('planityOpt2Badge')}
                  </span>
                </div>
                <h4 className="text-[15px] md:text-base font-bold mb-1 leading-snug">
                  {t('planityOpt2Title')}
                </h4>
                <p className="text-[13px] text-emerald-100 mb-3">{t('planityOpt2Desc')}</p>
                <ul className="space-y-1.5 mt-auto">
                  {(['planityOpt2Feat1', 'planityOpt2Feat2', 'planityOpt2Feat3', 'planityOpt2Feat4'] as const).map(k => (
                    <li key={k} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-300 shrink-0 mt-0.5" />
                      <span className="text-sm text-white/95">{t(k)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm pt-4 border-t border-stone-200">
              <span className="text-gray-500 font-medium">{t('planityCompareLabel')}</span>
              <Link
                href="/compare/planity"
                className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <span className="font-bold text-violet-600">Qarte</span>
                <span className="text-gray-400 font-normal">vs</span>
                <span className="font-bold text-gray-900">Planity</span>
              </Link>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-gray-400" aria-hidden="true" />
              <Link
                href="/compare/booksy"
                className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <span className="font-bold text-violet-600">Qarte</span>
                <span className="text-gray-400 font-normal">vs</span>
                <span className="font-bold text-sky-500">Booksy</span>
              </Link>
              <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-gray-400" aria-hidden="true" />
              <Link
                href="/compare/bookinbeautiful"
                className="inline-flex items-center gap-1.5 hover:opacity-70 transition-opacity"
              >
                <span className="font-bold text-violet-600">Qarte</span>
                <span className="text-gray-400 font-normal">vs</span>
                <span className="font-bold text-rose-500">Book in Beautiful</span>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
