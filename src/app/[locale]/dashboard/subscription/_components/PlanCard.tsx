'use client';

import type { ReactNode } from 'react';
import { Check, Gem, CreditCard } from 'lucide-react';
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
  features: ReactNode[];
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
    <div className={`relative flex flex-col rounded-2xl p-6 transition-colors ${
      isRecommended
        ? 'bg-white border-2 border-[#4b0082] shadow-sm'
        : 'bg-white border border-slate-200 shadow-sm'
    }`}>
      {isRecommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center gap-1 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white rounded-full bg-[#4b0082]">
            <Gem className="w-3 h-3" strokeWidth={2.25} />
            {t('recommended')}
          </span>
        </div>
      )}

      <div className="mb-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          {tier === 'fidelity' ? t('tierFidelityName') : t('tierAllInName')}
        </p>
        <p className="text-[13px] text-slate-500 mt-1 leading-snug">{persona}</p>
      </div>

      <div className="mb-5 pb-5 border-b border-slate-100">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900 tabular-nums tracking-tight">{intPart}</span>
          <span className="text-xl font-bold text-slate-900 tabular-nums">{priceSep}{decPart}</span>
          <span className="text-sm text-slate-400 ml-1">{t('perMonth')}</span>
        </div>
        <div className="mt-1.5 flex items-center gap-2 flex-wrap text-xs">
          {interval === 'annual' && annualOriginal && (
            <span className="text-slate-400">
              <span className="line-through tabular-nums">{annualOriginal}</span>{' '}
              <span className="font-bold text-slate-700 tabular-nums">→ {totalLabel}</span>
            </span>
          )}
          {interval === 'monthly' && (
            <span className="text-slate-400 tabular-nums">{totalLabel}</span>
          )}
        </div>
      </div>

      <ul className="space-y-2.5 mb-6 flex-1">
        {inheritsFromFidelity && (
          <li className="flex items-start gap-2.5 pb-2 mb-1 border-b border-slate-100">
            <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
              isRecommended ? 'bg-[#4b0082]' : 'bg-emerald-500'
            }`}>
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
            </div>
            <span className="text-[13px] font-bold text-slate-900">{t('planIncludesAllFidelity')}</span>
          </li>
        )}
        {features.map((feature, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <div className={`shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5 ${
              isRecommended ? 'bg-[#4b0082]' : 'bg-emerald-500'
            }`}>
              <Check className="w-2.5 h-2.5 text-white" strokeWidth={3.5} />
            </div>
            <span className="text-[13px] text-slate-700 leading-snug">{feature}</span>
          </li>
        ))}
        {nfcIncluded && interval === 'annual' && (
          <li>
            <button
              type="button"
              onClick={onClickNfc}
              className="w-full flex items-center gap-2 mt-2 px-3 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 active:scale-[0.99] touch-manipulation transition-all text-left"
            >
              <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" strokeWidth={2.25} />
              <span className="text-[12px] font-bold text-indigo-700 flex-1">{t('nfcIncluded')}</span>
              <span className="text-[10px] text-indigo-400">i</span>
            </button>
          </li>
        )}
      </ul>

      <button
        type="button"
        onClick={onSelect}
        disabled={disabled || loading}
        className={`w-full h-12 rounded-xl font-bold text-sm transition-colors active:scale-[0.98] touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${
          isRecommended
            ? 'bg-[#4b0082] text-white hover:bg-[#4b0082]/90'
            : 'bg-white text-slate-900 border-2 border-slate-200 hover:border-[#4b0082] hover:text-[#4b0082]'
        }`}
      >
        {loading ? (
          <span className="inline-block w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin align-middle" />
        ) : ctaLabel}
      </button>
    </div>
  );
}
