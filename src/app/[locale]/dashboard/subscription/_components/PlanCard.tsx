'use client';

import { Check, Sparkles, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';

type PlanTier = 'fidelity' | 'all_in';
type BillingInterval = 'monthly' | 'annual';

interface PlanCardProps {
  tier: PlanTier;
  interval: BillingInterval;
  priceDisplay: string;
  priceSep: string;
  totalLabel: string;
  annualOriginal?: string;
  persona: string;
  features: string[];
  inheritsFromFidelity?: boolean;
  recommended?: boolean;
  nfcIncluded?: boolean;
  onClickNfc?: () => void;
  ctaLabel: string;
  onSelect: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export default function PlanCard({
  tier,
  interval,
  priceDisplay,
  priceSep,
  totalLabel,
  annualOriginal,
  persona,
  features,
  inheritsFromFidelity,
  recommended,
  nfcIncluded,
  onClickNfc,
  ctaLabel,
  onSelect,
  loading,
  disabled,
}: PlanCardProps) {
  const t = useTranslations('subscription');
  const isRecommended = !!recommended;
  const [intPart, decPart] = priceDisplay.split(priceSep);

  return (
    <div className={`relative flex flex-col rounded-3xl p-6 md:p-7 transition-all ${
      isRecommended
        ? 'bg-gradient-to-b from-white via-white to-indigo-50/40 border-2 border-[#4b0082] shadow-xl shadow-[#4b0082]/10 md:-translate-y-2'
        : 'bg-white border border-gray-200 shadow-sm'
    }`}>
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 shadow-md shadow-[#4b0082]/20">
            <Sparkles className="w-3 h-3" />
            {t('recommended')}
          </span>
        </div>
      )}

      {/* Tier name */}
      <div className="mb-3">
        <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400">
          {tier === 'fidelity' ? t('tierFidelityName') : t('tierAllInName')}
        </p>
        <p className="text-[13px] text-gray-500 font-medium mt-1 leading-snug">{persona}</p>
      </div>

      {/* Price */}
      <div className="mb-5 pb-5 border-b border-gray-100">
        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-gray-900 tabular-nums tracking-tight">{intPart}</span>
          <span className="text-2xl font-black text-gray-900">{priceSep}{decPart}</span>
          <span className="text-sm text-gray-400 font-medium ml-1">{t('perMonth')}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
          {interval === 'annual' && annualOriginal && (
            <span className="text-gray-400">
              <span className="line-through">{annualOriginal}</span>{' '}
              <span className="font-bold text-gray-700">→ {totalLabel}</span>
            </span>
          )}
          {interval === 'monthly' && (
            <span className="text-gray-400 font-medium">{totalLabel}</span>
          )}
        </div>
      </div>

      {/* Features */}
      <ul className="space-y-2.5 mb-6 flex-1">
        {inheritsFromFidelity && (
          <li className="flex items-start gap-2.5 pb-2 mb-1 border-b border-gray-100">
            <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
              isRecommended ? 'bg-[#4b0082]' : 'bg-emerald-500'
            }`}>
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
            </div>
            <span className="text-[13px] font-bold text-gray-900">{t('planIncludesAllFidelity')}</span>
          </li>
        )}
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
              isRecommended ? 'bg-[#4b0082]' : 'bg-emerald-500'
            }`}>
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
            </div>
            <span className="text-[13px] text-gray-700 leading-snug">{feature}</span>
          </li>
        ))}
        {nfcIncluded && interval === 'annual' && (
          <li>
            <button
              type="button"
              onClick={onClickNfc}
              className="w-full flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 hover:from-indigo-100 hover:to-violet-100 transition-colors text-left group"
            >
              <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
              <span className="text-[12px] font-bold text-indigo-700 flex-1">{t('nfcIncluded')}</span>
              <span className="text-[10px] text-indigo-400 group-hover:text-indigo-600 transition-colors">i</span>
            </button>
          </li>
        )}
      </ul>

      {/* CTA */}
      <button
        type="button"
        onClick={onSelect}
        disabled={disabled || loading}
        className={`w-full h-12 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
          isRecommended
            ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg shadow-[#4b0082]/20 hover:shadow-xl hover:shadow-[#4b0082]/30 hover:from-indigo-700 hover:to-violet-700'
            : 'bg-white text-gray-900 border-2 border-gray-200 hover:border-[#4b0082] hover:text-[#4b0082]'
        }`}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin align-middle" />
        ) : ctaLabel}
      </button>
    </div>
  );
}
