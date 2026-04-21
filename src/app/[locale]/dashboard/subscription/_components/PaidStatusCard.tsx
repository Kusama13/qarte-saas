'use client';

import { Check, ArrowUpDown, Zap } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PaidStatusCardProps {
  tierDisplayName: string;
  intervalDisplayName: string;
  priceLabel: string;
  statusLabel: string;
  statusTone: 'active' | 'canceling' | 'past_due';
  nextBillingDate?: string | null;
  includedFeatures: string[];
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
    active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    canceling: 'bg-orange-50 text-orange-700 border-orange-200',
    past_due: 'bg-red-50 text-red-700 border-red-200',
  }[statusTone];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3 mb-5">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="shrink-0 w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 shadow-lg shadow-indigo-200 flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-lg md:text-xl font-bold text-gray-900 truncate">
              Qarte {tierDisplayName}
            </p>
            <p className="text-xs text-gray-500 font-medium">{intervalDisplayName}</p>
          </div>
        </div>
        <span className={`shrink-0 px-3 py-1 text-[11px] font-bold uppercase tracking-wide rounded-full border ${toneClasses}`}>
          {statusLabel}
        </span>
      </div>

      {/* Price + next billing */}
      <div className="pb-5 mb-5 border-b border-gray-100">
        <p className="text-3xl font-bold text-gray-900 tabular-nums tracking-tight">
          {priceLabel}
        </p>
        {nextBillingDate && statusTone === 'active' && (
          <p className="text-xs text-gray-500 mt-1">{t('nextBillingDate', { date: nextBillingDate })}</p>
        )}
        {isLegacy && (
          <span className="inline-block mt-2 text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            {t('legacyBadge')}
          </span>
        )}
      </div>

      {/* Included features */}
      <div className="mb-5">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{t('planSummaryTitle')}</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {includedFeatures.map((feature, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[13px] text-gray-600">
              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" strokeWidth={3} />
              <span>{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Change plan CTA */}
      {canChangeTier && (
        <button
          type="button"
          onClick={onChangeTier}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl font-bold text-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors"
        >
          <ArrowUpDown className="w-4 h-4" />
          {t('changeTierCta')}
        </button>
      )}
    </div>
  );
}
