'use client';

import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Star, ArrowRight, Check } from 'lucide-react';

/**
 * Condensed pricing section for the landing page.
 * Typography aligned with bento sections (FideliteSection / PageProSection):
 *  - h2 title with Playfair italic accent
 *  - Card titles use the same scale as bento h3 (text-2xl md:text-3xl)
 *  - Body text matches bento content (text-base md:text-lg)
 */
export function PricingSectionCondensed() {
  const { ref, isInView } = useInView();
  const t = useTranslations('pricing');

  return (
    <section id="pricing" className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div ref={ref} className="relative max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')}{' '}
            <span className="relative font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleHighlight')}
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
            </span>
          </h2>
          <p className="text-base md:text-xl text-gray-500 max-w-2xl mx-auto">
            {t('condensedSubtitle')}
          </p>
        </div>

        {/* 2 cards */}
        <div className={`grid sm:grid-cols-2 gap-4 md:gap-5 max-w-3xl mx-auto mb-8 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>

          {/* Fidélité card */}
          <div className="relative bg-white border border-gray-200 rounded-3xl p-6 md:p-7 flex flex-col shadow-sm">
            <div className="mb-3">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">
                <span className="font-[family-name:var(--font-playfair)] italic font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                  {t('fidelityName')}
                </span>
              </h3>
              <p className="text-sm text-gray-500 leading-snug">{t('condensedFidelityHint')}</p>
            </div>

            <div className="mb-1 flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-extrabold tracking-tighter text-gray-900 tabular-nums">19€</span>
              <span className="text-sm font-semibold text-gray-400">{t('perMonth')}</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">{t('condensedFidelityAnnual')}</p>

            <ul className="space-y-2.5 mb-6 flex-1">
              {(['condensedFidelityF1', 'condensedFidelityF2', 'condensedFidelityF3'] as const).map(k => (
                <li key={k} className="flex items-start gap-2.5">
                  <div className="shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-500 flex items-center justify-center mt-0.5 md:mt-1">
                    <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" strokeWidth={3.5} />
                  </div>
                  <span className="text-sm md:text-base text-gray-600 leading-relaxed">{t(k)}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('pricing_fidelity_condensed', 'pricing_section_condensed'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="block w-full py-3.5 bg-gray-900 text-white text-sm font-bold rounded-2xl hover:bg-black transition-colors text-center whitespace-nowrap shadow-md shadow-gray-900/15"
            >
              {t('ctaTrialFidelity')}
            </Link>
          </div>

          {/* Tout-en-un card (recommended) */}
          <div className="relative bg-white border-2 border-indigo-500 rounded-3xl p-6 md:p-7 flex flex-col shadow-xl shadow-indigo-200/40">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-[11px] font-bold rounded-full shadow-lg shadow-indigo-500/30 uppercase tracking-wider">
                <Star className="w-2.5 h-2.5 fill-current" />
                {t('popularBadge')}
              </span>
            </div>

            <div className="mb-3">
              <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-0.5">
                <span className="font-[family-name:var(--font-playfair)] italic font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                  {t('allInName')}
                </span>
              </h3>
              <p className="text-sm text-gray-500 leading-snug">{t('condensedAllInHint')}</p>
            </div>

            <div className="mb-1 flex items-baseline gap-1">
              <span className="text-4xl md:text-5xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-indigo-600 to-violet-600 tabular-nums">24€</span>
              <span className="text-sm font-semibold text-gray-400">{t('perMonth')}</span>
            </div>
            <p className="text-xs text-gray-400 mb-5">{t('condensedAllInAnnual')}</p>

            <ul className="space-y-2.5 mb-6 flex-1">
              <li className="flex items-start gap-2.5 pb-2 mb-1 border-b border-gray-100">
                <div className="shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mt-0.5 md:mt-1">
                  <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" strokeWidth={3.5} />
                </div>
                <span className="text-sm md:text-base font-bold text-gray-900 leading-relaxed">{t('allInIncludesPrefix')}</span>
              </li>
              {(['condensedAllInF1', 'condensedAllInF2', 'condensedAllInF3'] as const).map(k => (
                <li key={k} className="flex items-start gap-2.5">
                  <div className="shrink-0 w-4 h-4 md:w-5 md:h-5 rounded-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center mt-0.5 md:mt-1">
                    <Check className="w-2.5 h-2.5 md:w-3 md:h-3 text-white" strokeWidth={3.5} />
                  </div>
                  <span className="text-sm md:text-base text-gray-600 leading-relaxed">{t(k)}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('pricing_all_in_condensed', 'pricing_section_condensed'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="block w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-sm font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/40 transition-all text-center whitespace-nowrap shadow-md shadow-indigo-500/20"
            >
              {t('ctaTrialAllIn')}
            </Link>
          </div>
        </div>

        {/* Trust line */}
        <p className={`text-xs md:text-sm text-center text-gray-400 mb-5 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {t('trustLine')}
        </p>

        {/* Link to full pricing */}
        <div className={`text-center ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-sm md:text-base font-semibold text-indigo-600 hover:text-indigo-700 transition-colors group"
          >
            {t('condensedCompareLink')}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
