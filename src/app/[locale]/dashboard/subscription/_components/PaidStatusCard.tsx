'use client';

import type { ReactNode } from 'react';
import { Check, ArrowUpDown, Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaidStatusCardProps {
  tierDisplayName: string;
  intervalDisplayName: string;
  priceLabel: string;
  statusLabel: string;
  statusTone: 'active' | 'canceling' | 'past_due';
  nextBillingDate?: string | null;
  includedFeatures: ReactNode[];
  canChangeTier: boolean;
  isLegacy: boolean;
  onChangeTier: () => void;
}

export default function PaidStatusCard({
  tierDisplayName,
  intervalDisplayName,
  priceLabel,
  statusLabel,
  statusTone,
  nextBillingDate,
  includedFeatures,
  canChangeTier,
  isLegacy,
  onChangeTier,
}: PaidStatusCardProps) {
  const t = useTranslations('subscription');
  const toneClasses = {
    active: 'bg-emerald-50 text-emerald-700',
    canceling: 'bg-orange-50 text-orange-700',
    past_due: 'bg-red-50 text-red-700',
  }[statusTone];

  return (
    <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="shrink-0 w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center">
            <Flame className="w-5 h-5 text-indigo-600" strokeWidth={2.25} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-base md:text-lg font-bold text-slate-900 truncate">
              Qarte {tierDisplayName}
            </p>
            <p className="text-xs text-slate-500">{intervalDisplayName}</p>
          </div>
        </div>
        <span className={`shrink-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full ${toneClasses}`}>
          {statusLabel}
        </span>
      </div>

      <div className="pb-4 mb-4 border-b border-slate-100">
        <p className="text-2xl font-bold text-slate-900 tabular-nums tracking-tight">
          {priceLabel}
        </p>
        {nextBillingDate && statusTone === 'active' && (
          <p className="text-xs text-slate-500 mt-1">{t('nextBillingDate', { date: nextBillingDate })}</p>
        )}
        {isLegacy && (
          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
            {t('legacyBadge')}
          </span>
        )}
      </div>

      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">{t('planSummaryTitle')}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {includedFeatures.map((feature, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[13px] text-slate-600">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={3} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {canChangeTier && (
        <button
          type="button"
          onClick={onChangeTier}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-xl font-bold text-sm bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] touch-manipulation transition-all"
        >
          <ArrowUpDown className="w-4 h-4" strokeWidth={2.25} />
          {t('changeTierCta')}
        </button>
      )}
    </div>
  );
}
