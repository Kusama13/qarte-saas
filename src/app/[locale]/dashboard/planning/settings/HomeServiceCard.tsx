'use client';

import { Home, Info, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Switch, SettingCard } from '@/components/ui';

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
    <SettingCard
      icon={Home}
      title={t('homeServiceTitle')}
      tone="emerald"
      className="sm:col-span-2"
      headerRight={
        <>
          <button
            type="button"
            onClick={onHelpToggle}
            aria-label={t('homeServiceHelpAria')}
            className="text-gray-400 hover:text-emerald-500 transition-colors"
          >
            <Info className="w-4 h-4" />
          </button>
          <Switch checked={enabled} onChange={() => onToggle()} tone="emerald" size="md" ariaLabel={t('homeServiceTitle')} />
        </>
      }
    >
      <p className="text-[11px] text-gray-500 leading-relaxed">{t('homeServiceHint')}</p>

      {helpOpen && (
        <div className="mt-3 p-3 bg-emerald-50/60 border border-emerald-100 rounded-lg">
          <p className="text-[11px] text-emerald-900 leading-relaxed whitespace-pre-line">{t('homeServiceHelpBody')}</p>
        </div>
      )}

      {enabled && (
        <div className="mt-3 p-3 bg-gray-50 border border-gray-100 rounded-lg flex items-start gap-3">
          <Switch checked={hideAddress} onChange={onHideAddressChange} tone="emerald" size="sm" ariaLabel={t('homeServiceHideAddressLabel')} />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-gray-700">{t('homeServiceHideAddressLabel')}</p>
            <p className="text-[11px] text-gray-500 mt-0.5">{t('homeServiceHideAddressHint')}</p>
          </div>
        </div>
      )}

      {enabled && (
        <div className="mt-3 flex items-start gap-2">
          <Clock className="w-3.5 h-3.5 text-gray-500 shrink-0 mt-0.5" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            {bufferMinutes > 0
              ? t('homeServiceAleaSet', { minutes: bufferMinutes })
              : t('homeServiceAleaUnset')}
          </p>
        </div>
      )}
    </SettingCard>
  );
}
