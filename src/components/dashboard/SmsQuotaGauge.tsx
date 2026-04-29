'use client';

import { useTranslations } from 'next-intl';

interface Props {
  sent: number;
  quota: number;
  packBalance: number;
}

/**
 * Jauge quota SMS + bascule sur pack quand le quota est épuisé.
 * Trois états : OK (vert) / quota épuisé avec pack (ambre) / quota épuisé sans pack (rouge).
 * Partagé entre dashboard accueil (SmsRecent expanded) et planning settings.
 */
export default function SmsQuotaGauge({ sent, quota, packBalance }: Props) {
  const t = useTranslations('planning');
  const quotaExhausted = sent >= quota;
  const hasPack = packBalance > 0;
  const blocked = quotaExhausted && !hasPack;
  const barColor = blocked ? 'bg-red-500' : quotaExhausted ? 'bg-amber-500' : 'bg-emerald-500';
  const percent = Math.min(100, Math.round((sent / Math.max(1, quota)) * 100));

  return (
    <div>
      <div className="flex items-center justify-between text-[11px] mb-1">
        <span className="text-gray-500">{t('smsQuotaLabel')}</span>
        <span className="font-bold text-gray-700">{sent} {t('smsQuotaOf')} {quota}</span>
      </div>
      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${percent}%` }} />
      </div>
      {quotaExhausted && hasPack && (
        <p className="mt-1.5 text-[11px] font-semibold text-amber-700">
          {t('smsPackRemaining', { count: packBalance })}
        </p>
      )}
      {blocked && (
        <p className="mt-1.5 text-[11px] font-semibold text-red-600">
          {t('smsQuotaBlocked')}
        </p>
      )}
      {!quotaExhausted && (
        <p className="text-[10px] text-gray-400 mt-1">{t('smsOverageInfo')}</p>
      )}
    </div>
  );
}
