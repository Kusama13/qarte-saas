'use client';

import { useTranslations } from 'next-intl';
import { Gift } from 'lucide-react';

type BillingInterval = 'monthly' | 'annual';

interface BillingToggleProps {
  value: BillingInterval;
  onChange: (v: BillingInterval) => void;
  annualSavingsPct: string;
}

export default function BillingToggle({ value, onChange, annualSavingsPct }: BillingToggleProps) {
  const t = useTranslations('subscription');
  return (
    <div className="flex justify-center">
      <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-white border border-gray-200 shadow-sm">
        <button
          type="button"
          onClick={() => onChange('monthly')}
          className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            value === 'monthly'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {t('monthly')}
        </button>
        <button
          type="button"
          onClick={() => onChange('annual')}
          className={`relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${
            value === 'annual'
              ? 'bg-gray-900 text-white shadow-sm'
              : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          {t('annual')}
          <span className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
            value === 'annual'
              ? 'bg-emerald-400/20 text-emerald-200'
              : 'bg-emerald-50 text-emerald-700'
          }`}>
            <Gift className="w-2.5 h-2.5" />
            {annualSavingsPct}
          </span>
        </button>
      </div>
    </div>
  );
}
