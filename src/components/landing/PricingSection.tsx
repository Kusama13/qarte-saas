'use client';

import { Check, Headphones, CreditCard, Zap } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useTranslations } from 'next-intl';

export function PricingSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('pricing');

  const featureKeys = [
    'feature1', 'feature2', 'feature3', 'feature4', 'feature5',
    'feature6', 'feature7', 'feature8', 'feature9', 'feature10',
    'feature11', 'feature12', 'feature13', 'feature14',
  ] as const;

  return (
    <section id="pricing" className="relative py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* No floating icons outside - they're inside the card now */}

      <div ref={ref} className="relative max-w-6xl mx-auto px-6">
        <div className={`text-center mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">{t('titleHighlight')}</span>
          </h2>
          <p className="text-xl text-gray-600">{t('subtitle')}</p>
        </div>

        {/* Glassmorphism Pricing Card */}
        <div className="max-w-xl mx-auto">
          <div className={`relative group transition-all duration-500 hover:-translate-y-2 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
            {/* Trial Badge */}
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
              <div className="px-8 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full shadow-xl shadow-indigo-500/20 tracking-[0.1em] uppercase whitespace-nowrap">
                {t('trialBadge')}
              </div>
            </div>

            {/* Glow behind card */}
            <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-pink-200/40 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

            <div className="relative bg-white/70 backdrop-blur-xl border border-white/80 rounded-[2.5rem] p-10 shadow-xl shadow-indigo-100/30 overflow-hidden">
              {/* Subtle shimmer */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 via-transparent to-violet-50/50 pointer-events-none" />


              <div className="relative text-center pt-4 mb-10">
                <div className="inline-flex items-baseline justify-center gap-1.5">
                  <span className="text-7xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">
                    19&euro;
                  </span>
                  <span className="text-xl font-semibold text-gray-400">{t('perMonth')}</span>
                </div>
                <p className="text-gray-500 text-sm mt-2">{t('perDay')} <span className="font-semibold text-indigo-600">{t('perDayAmount')}</span> {t('perDayLabel')}</p>
                <p className="text-indigo-600 font-semibold text-sm mt-3 tracking-wide uppercase">{t('allInclusive')}</p>
                <p className="text-indigo-600 font-medium text-sm mt-2">{t('noCreditCard')}</p>
                <p className="text-gray-400 text-xs mt-2">{t('annualOr')} <span className="font-semibold text-gray-600">{t('annualPrice')}</span> {t('annualLabel')}</p>
              </div>

              <div className="h-px w-full bg-gradient-to-r from-transparent via-gray-200/60 to-transparent mb-10" />

              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-10 relative">
                {featureKeys.map((key, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <div className="w-5 h-5 bg-indigo-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-indigo-600" />
                    </div>
                    <span className="text-gray-600 text-sm font-medium">{t(key)}</span>
                  </li>
                ))}
              </ul>

              <a
                href="/auth/merchant/signup"
                onClick={() => { trackCtaClick('pricing_cta_2', 'pricing_section_2'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
                className="block w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center uppercase tracking-wider text-sm shadow-md shadow-indigo-500/15"
              >
                {t('ctaButton')}
              </a>

              <p className="text-center text-gray-400 text-[10px] font-bold mt-6 uppercase tracking-[0.2em]">
                {t('cancelAnytime')}
              </p>
            </div>
          </div>
        </div>

        {/* Guarantee Badges */}
        <div className={`grid grid-cols-2 gap-3 md:flex md:flex-nowrap md:justify-center md:gap-4 mt-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-indigo-100 shadow-sm md:px-4">
            <Headphones className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-indigo-700 whitespace-nowrap">{t('badgeSupport')}</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-indigo-100 shadow-sm md:px-4">
            <CreditCard className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-indigo-700 whitespace-nowrap">{t('badgeNoCB')}</span>
          </div>
          <div className="flex items-center justify-center gap-2 px-3 py-2 bg-white/70 backdrop-blur-sm rounded-full border border-indigo-100 shadow-sm md:px-4">
            <Zap className="w-4 h-4 text-indigo-600 flex-shrink-0" />
            <span className="text-xs md:text-sm font-medium text-indigo-700 whitespace-nowrap">{t('badgeInstant')}</span>
          </div>
        </div>
      </div>
    </section>
  );
}
