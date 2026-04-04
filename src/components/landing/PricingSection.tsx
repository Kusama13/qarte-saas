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
    <section id="pricing" className="relative py-24 md:py-32 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
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
              <div className="flex flex-col items-center justify-center px-8 py-10 md:w-1/2 md:px-12 md:py-16 -mt-8 md:mt-0 relative">
                {/* Trial Badge */}
                <div className="mb-6">
                  <div className="px-6 py-2 bg-gradient-to-r from-indigo-500 to-violet-500 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-500/20 tracking-[0.1em] uppercase">
                    {t('trialBadge')}
                  </div>
                </div>

                <div className="text-center mb-8">
                  <div className="inline-flex items-baseline justify-center gap-1.5">
                    <span className="text-7xl md:text-8xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-gray-900 to-gray-600">
                      {t('price')}
                    </span>
                    <span className="text-xl font-semibold text-gray-400">{t('perMonth')}</span>
                  </div>
                </div>

                <Link
                  href="/auth/merchant/signup"
                  onClick={() => { trackCtaClick('pricing_cta_2', 'pricing_section_2'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
                  className="block w-full max-w-xs py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-300 text-center uppercase tracking-wider text-sm shadow-md shadow-indigo-500/15"
                >
                  {t('ctaButton')}
                </Link>

                <div className="text-center mt-6 space-y-1">
                  <p className="text-gray-900 text-sm font-semibold">{t('noCommitment')}</p>
                  <p className="text-gray-400 text-sm">{t('freeTrial')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
