'use client';

import Image from 'next/image';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

export function PricingSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('pricing');

  return (
    <section id="pricing" className="relative py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div ref={ref} className="relative max-w-6xl mx-auto px-6">
        <div className={`text-center mb-12 md:mb-16 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            {t('title')} <span className="relative font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">{t('titleHighlight')}<span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" /></span>
          </h2>
        </div>

        {/* Banner: image left + price right on desktop, stacked on mobile */}
        <div className={`relative group transition-all duration-500 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>
          {/* Glow */}
          <div className="absolute -inset-4 bg-gradient-to-br from-indigo-200/40 via-violet-200/30 to-pink-200/40 rounded-[3rem] blur-2xl opacity-60 group-hover:opacity-80 transition-opacity duration-500" />

          <div className="relative bg-white/70 backdrop-blur-xl border border-white/80 rounded-3xl md:rounded-[2.5rem] shadow-xl shadow-indigo-100/30 overflow-hidden">
            <div className="flex flex-col md:flex-row">
              {/* Image */}
              <div className="relative h-64 md:h-auto md:w-1/2 overflow-hidden">
                <Image
                  src="/images/price section.jpg"
                  alt="Pro de la beauté"
                  fill
                  className="object-cover object-top"
                  sizes="(max-width: 768px) 100vw, 50vw"
                />
                {/* Mobile: gradient bottom / Desktop: gradient right */}
                <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent md:hidden" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/30 hidden md:block" />
              </div>

              {/* Price content */}
              <div className="flex flex-col items-center justify-center px-8 py-10 md:w-1/2 md:px-12 md:py-14 -mt-8 md:mt-0 relative">
                {/* Trial Badge */}
                <div className="mb-5">
                  <div className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-500/20 tracking-[0.1em] uppercase">
                    {t('trialBadge')}
                  </div>
                </div>

                {/* Price */}
                <div className="text-center mb-2">
                  <div className="inline-flex items-baseline justify-center gap-1.5">
                    <span className="text-7xl md:text-8xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">
                      {t('price')}
                    </span>
                    <span className="text-xl font-semibold text-gray-400">{t('perMonth')}</span>
                  </div>
                </div>

                <p className="text-xs font-medium text-indigo-600 mb-3">{t('dailyPrice')}</p>

                {/* Annual option */}
                <p className="text-sm text-gray-500 mb-6">
                  {t('annualOr')} <span className="font-semibold text-indigo-600">{t('annualPrice')}</span> {t('annualLabel')}
                </p>

                {/* Feature list */}
                <ul className="w-full max-w-sm space-y-2.5 mb-8 text-left">
                  {([1,3,2,9,4,5,6,7,8] as const).map((i, idx) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      <span className={idx < 4 ? 'text-base font-semibold text-gray-900' : 'text-sm text-gray-700'}>{t(`feature${i}`)}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/auth/merchant/signup"
                  onClick={() => { trackCtaClick('pricing_cta_2', 'pricing_section_2'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
                  className="block w-full max-w-xs py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center uppercase tracking-wider text-sm shadow-md shadow-indigo-500/15"
                >
                  {t('ctaButton')}
                </Link>

                <div className="text-center mt-5 space-y-1">
                  <p className="text-gray-900 text-sm font-semibold">{t('noCommitment')}</p>
                  <p className="text-gray-400 text-sm">{t('freeTrial')}</p>
                </div>

                {/* Trust badges */}
                <div className="flex items-center justify-center gap-4 mt-5">
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                    {t('badgeNoCB')}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                    <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" /></svg>
                    {t('badgeSupport')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
