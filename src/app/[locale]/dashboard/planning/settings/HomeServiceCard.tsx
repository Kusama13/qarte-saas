'use client';

import { Home, Info, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Switch } from '@/components/ui';

interface HomeServiceCardProps {
  enabled: boolean;
  onToggle: () => void;
  helpOpen: boolean;
  onHelpToggle: () => void;
  hideAddress: boolean;
  onHideAddressChange: (next: boolean) => void;
  bufferMinutes: number;
}

export function HomeServiceCard({
  enabled,
  onToggle,
  helpOpen,
  onHelpToggle,
  hideAddress,
  onHideAddressChange,
  bufferMinutes,
}: HomeServiceCardProps) {
  const t = useTranslations('planning');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:col-span-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-amber-50 flex items-center justify-center shrink-0">
            <Home className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-gray-800">{t('homeServiceTitle')}</h2>
              <button
                type="button"
                onClick={onHelpToggle}
                aria-label={t('homeServiceHelpAria')}
                className="text-gray-400 hover:text-amber-500 transition-colors"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">{t('homeServiceHint')}</p>
          </div>
        </div>
        <Switch checked={enabled} onChange={() => onToggle()} tone="amber" size="md" />
      </div>

      {helpOpen && (
        <div className="mt-3 ml-9 p-3 bg-amber-50/60 border border-amber-100 rounded-lg">
          <p className="text-[11px] text-amber-900 leading-relaxed whitespace-pre-line">{t('homeServiceHelpBody')}</p>
        </div>
      )}

      {enabled && (
        <div className="mt-3 ml-9 p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-3">
          <Switch checked={hideAddress} onChange={onHideAddressChange} tone="amber" size="sm" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700">{t('homeServiceHideAddressLabel')}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{t('homeServiceHideAddressHint')}</p>
          </div>
        </div>
      )}

      {enabled && (
        <div className="mt-3 ml-9 flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {bufferMinutes > 0
              ? t('homeServiceAleaSet', { minutes: bufferMinutes })
              : t('homeServiceAleaUnset')}
          </p>
        </div>
      )}
    </div>
  );
}
