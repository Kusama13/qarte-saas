'use client';

import { useState } from 'react';
import { useInView } from '@/hooks/useInView';
import { trackCtaClick } from '@/lib/analytics';
import { fbEvents } from '@/components/analytics/FacebookPixel';
import { ttEvents } from '@/components/analytics/TikTokPixel';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Check, Sparkles, Star } from 'lucide-react';

type Billing = 'monthly' | 'annual';

interface Feature {
  key: string;
  highlighted?: boolean;
}

const PLANS = {
  fidelity: {
    monthly: 19,
    annual: 190,
    monthlyEquiv: 16,
    features: [
      { key: 'fidelityFeature1', highlighted: true },
      { key: 'fidelityFeature2', highlighted: true },
      { key: 'fidelityFeature3' },
      { key: 'fidelityFeature4' },
      { key: 'fidelityFeature5' },
      { key: 'fidelityFeature6' },
    ] as Feature[],
  },
  all_in: {
    monthly: 24,
    annual: 240,
    monthlyEquiv: 20,
    features: [
      { key: 'allInFeature1', highlighted: true },
      { key: 'allInFeature2', highlighted: true },
      { key: 'allInFeature3' },
      { key: 'allInFeature4' },
      { key: 'allInFeature5' },
      { key: 'allInFeature6' },
    ] as Feature[],
  },
} as const;

export function PricingSection() {
  const { ref, isInView } = useInView();
  const t = useTranslations('pricing');
  const [billing, setBilling] = useState<Billing>('monthly');

  const fidelityPrice = billing === 'monthly' ? PLANS.fidelity.monthly : PLANS.fidelity.monthlyEquiv;
  const allInPrice = billing === 'monthly' ? PLANS.all_in.monthly : PLANS.all_in.monthlyEquiv;

  const renderFeatures = (features: Feature[], accentClass: string) => (
    <ul className="space-y-2 mb-8 flex-1">
      {features.map((f) => (
        <li
          key={f.key}
          className={`flex items-start gap-2.5 rounded-lg ${
            f.highlighted ? 'px-2.5 py-2 -mx-2.5 bg-indigo-50/60 border border-indigo-100/60' : 'px-2.5 py-1 -mx-2.5'
          }`}
        >
          {f.highlighted ? (
            <Sparkles className={`w-4 h-4 ${accentClass} shrink-0 mt-0.5 fill-current`} />
          ) : (
            <Check className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
          )}
          <span className={`text-sm leading-snug ${f.highlighted ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
            {t(f.key)}
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <section id="pricing" className="relative py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      <div ref={ref} className="relative max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className={`text-center mb-10 md:mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`}>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            {t('title')}{' '}
            <span className="relative font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
              {t('titleHighlight')}
              <span className="absolute -bottom-1 left-0 right-0 h-3 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
            </span>
          </h2>
          <p className="text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Billing toggle */}
        <div className={`flex items-center justify-center gap-3 mb-10 md:mb-12 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.1s' }}>
          <div className="inline-flex items-center bg-gray-100 rounded-full p-1 relative">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`relative z-10 px-5 py-2 text-sm font-semibold rounded-full transition-colors ${billing === 'monthly' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('billingMonthly')}
            </button>
            <button
              type="button"
              onClick={() => setBilling('annual')}
              className={`relative z-10 px-5 py-2 text-sm font-semibold rounded-full transition-colors ${billing === 'annual' ? 'text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {t('billingAnnual')}
            </button>
            <span
              className={`absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 transition-transform duration-300 ${billing === 'monthly' ? 'translate-x-0' : 'translate-x-full'}`}
              aria-hidden
            />
          </div>
        </div>

        {/* 2 pricing cards */}
        <div className={`grid md:grid-cols-2 gap-5 md:gap-6 max-w-5xl mx-auto ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.2s' }}>

          {/* ── Fidélité card ── */}
          <div className="relative bg-white border border-gray-200 rounded-3xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 md:p-10 flex flex-col">
            <div className="mb-5">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('fidelityName')}</h3>
              <p className="text-[15px] text-gray-600 leading-snug">
                {t.rich('fidelityTagline', {
                  em: (chunks) => <em className="font-[family-name:var(--font-playfair)] italic text-gray-900">{chunks}</em>,
                })}
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl md:text-6xl font-extrabold tracking-tighter text-gray-900">{fidelityPrice}€</span>
                <span className="text-base font-semibold text-gray-400">{t('perMonth')}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {billing === 'annual' ? t('monthlyEquivAnnual', { amount: PLANS.fidelity.monthlyEquiv }) : t('perDayFidelity')}
              </p>
              {billing === 'annual' && (
                <span className="inline-block mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  {t('annualSavingFidelity')}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-5 leading-relaxed border-l-2 border-gray-200 pl-3">
              {t('fidelityFor')}
            </p>

            {renderFeatures(PLANS.fidelity.features, 'text-indigo-500')}

            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('pricing_fidelity', 'pricing_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="block w-full py-4 border-2 border-gray-900 text-gray-900 font-bold rounded-2xl hover:bg-gray-900 hover:text-white transition-colors duration-300 text-center text-sm uppercase tracking-wider"
            >
              {t('ctaTrialFidelity')}
            </Link>
            <p className="text-[11px] text-center text-gray-400 mt-3">{t('trustLine')}</p>
          </div>

          {/* ── Tout-en-un card (Recommended) ── */}
          <div className="relative bg-white border-2 border-indigo-500 rounded-3xl shadow-xl shadow-indigo-200/40 p-8 md:p-10 flex flex-col">
            <div className="absolute -top-4 left-1/2 -translate-x-1/2">
              <div className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white text-xs font-bold rounded-full shadow-lg shadow-indigo-500/30 uppercase tracking-wider">
                <Star className="w-3 h-3 fill-current" />
                {t('popularBadge')}
              </div>
            </div>

            <div className="mb-5">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{t('allInName')}</h3>
              <p className="text-[15px] text-gray-600 leading-snug">
                {t.rich('allInTagline', {
                  em: (chunks) => <em className="font-[family-name:var(--font-playfair)] italic text-indigo-600">{chunks}</em>,
                })}
              </p>
            </div>

            <div className="mb-5">
              <div className="flex items-baseline gap-1.5">
                <span className="text-5xl md:text-6xl font-extrabold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-indigo-600 to-violet-600">{allInPrice}€</span>
                <span className="text-base font-semibold text-gray-400">{t('perMonth')}</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {billing === 'annual' ? t('monthlyEquivAnnual', { amount: PLANS.all_in.monthlyEquiv }) : t('perDayAllIn')}
              </p>
              <p className="text-[11px] text-gray-400 mt-0.5">{t('vsBooksy')}</p>
              {billing === 'annual' && (
                <span className="inline-block mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
                  {t('annualSavingAllIn')}
                </span>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-5 leading-relaxed border-l-2 border-indigo-200 pl-3">
              {t('allInFor')}
            </p>

            <p className="text-[11px] font-bold text-indigo-600 mb-3 uppercase tracking-widest flex items-center gap-1.5">
              <span className="h-px w-4 bg-indigo-300" />
              {t('allInIncludesPrefix')}
            </p>
            {renderFeatures(PLANS.all_in.features, 'text-violet-500')}

            <Link
              href="/auth/merchant/signup"
              onClick={() => { trackCtaClick('pricing_all_in', 'pricing_section'); fbEvents.initiateCheckout(); ttEvents.clickButton(); }}
              className="block w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all duration-300 text-center text-sm uppercase tracking-wider shadow-md shadow-indigo-500/20"
            >
              {t('ctaTrialAllIn')}
            </Link>
            <p className="text-[11px] text-center text-gray-400 mt-3">{t('trustLine')}</p>
          </div>
        </div>

        {/* Comparison vs competitors */}
        <div className={`mt-16 md:mt-20 ${isInView ? 'animate-fade-in-up' : 'opacity-0'}`} style={{ animationDelay: '0.3s' }}>
          <div className="text-center mb-8">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              {t('compareTitle')}{' '}
              <span className="relative font-[family-name:var(--font-playfair)] italic text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500">
                {t('compareTitleHighlight')}
                <span className="absolute -bottom-1 left-0 right-0 h-2.5 bg-indigo-100/60 -skew-x-3 rounded-sm -z-10" />
              </span>
            </h3>
            <p className="text-sm md:text-base text-gray-500 max-w-2xl mx-auto">{t('compareSubtitle')}</p>
          </div>

          <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden max-w-4xl mx-auto">
            <div className="grid grid-cols-4 border-b border-gray-100 bg-gray-50/80 text-xs md:text-sm font-semibold">
              <div className="px-3 py-3 md:px-5 md:py-4 text-gray-500" />
              <div className="px-3 py-3 md:px-5 md:py-4 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">{t('compareColUs')}</div>
              <div className="px-3 py-3 md:px-5 md:py-4 text-center text-gray-500">{t('compareColPlanity')}</div>
              <div className="px-3 py-3 md:px-5 md:py-4 text-center text-gray-500">{t('compareColBooksy')}</div>
            </div>

            {[
              { row: 'Price', us: 'compareRowPriceUs', planity: 'compareRowPricePlanity', booksy: 'compareRowPriceBooksy', label: 'compareRowPrice' },
              { row: 'Commission', us: 'compareRowCommissionUs', planity: 'compareRowCommissionPlanity', booksy: 'compareRowCommissionBooksy', label: 'compareRowCommission', highlightUs: true },
              { row: 'SMS', us: 'compareRowSmsUs', planity: 'compareRowSmsPlanity', booksy: 'compareRowSmsBooksy', label: 'compareRowSms' },
              { row: 'Loyalty', us: 'compareRowLoyaltyUs', planity: 'compareRowLoyaltyPlanity', booksy: 'compareRowLoyaltyBooksy', label: 'compareRowLoyalty' },
              { row: 'AnnualCost', us: 'compareRowAnnualCostUs', planity: 'compareRowAnnualCostPlanity', booksy: 'compareRowAnnualCostBooksy', label: 'compareRowAnnualCost', highlightUs: true, emphasis: true },
            ].map((r) => (
              <div key={r.row} className={`grid grid-cols-4 border-b border-gray-50 last:border-b-0 text-xs md:text-sm ${r.emphasis ? 'bg-indigo-50/30' : ''}`}>
                <div className={`px-3 py-3 md:px-5 md:py-4 text-gray-700 ${r.emphasis ? 'font-bold' : 'font-medium'}`}>{t(r.label)}</div>
                <div className={`px-3 py-3 md:px-5 md:py-4 text-center font-semibold ${r.highlightUs ? 'text-emerald-600' : 'text-indigo-600'}`}>{t(r.us)}</div>
                <div className="px-3 py-3 md:px-5 md:py-4 text-center text-gray-500">{t(r.planity)}</div>
                <div className="px-3 py-3 md:px-5 md:py-4 text-center text-gray-500">{t(r.booksy)}</div>
              </div>
            ))}
          </div>

          <p className="text-xs text-center text-gray-400 mt-4">{t('compareDisclaimer')}</p>
        </div>
      </div>
    </section>
  );
}
