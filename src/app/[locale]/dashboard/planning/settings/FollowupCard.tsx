'use client';

import { CalendarHeart, Info, AlertTriangle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ToggleRow, SettingCard } from '@/components/ui';

interface FollowupCardProps {
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
  bookingMode: 'slots' | 'free';
  bookingHorizonDays: number;
}

// 6 semaines = 42 j : un RDV de suivi à +6 sem. doit tenir dans l'horizon.
const FOLLOWUP_MIN_HORIZON_DAYS = 42;

export function FollowupCard({ enabled, onEnabledChange, bookingMode, bookingHorizonDays }: FollowupCardProps) {
  const t = useTranslations('planning');
  const isSlots = bookingMode === 'slots';
  const horizonTooShort = bookingHorizonDays < FOLLOWUP_MIN_HORIZON_DAYS;

  return (
    <SettingCard icon={CalendarHeart} title={t('followupTitle')} tone="emerald" className="sm:col-span-2">
      <ToggleRow
        title={t('followupToggle')}
        hint={t('followupToggleDesc')}
        checked={enabled}
        onChange={onEnabledChange}
        tone="emerald"
      />

      {/* Mode créneaux : les RDV de suivi (+3/+6 sem.) ne sont réservables que si la grille
          est ouverte assez loin ET que l'horizon couvre 6 semaines. */}
      {enabled && isSlots && (
        <div className="mt-3 space-y-2">
          {horizonTooShort && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700">{t('followupHorizonWarning', { days: bookingHorizonDays })}</p>
            </div>
          )}
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
            <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[11px] text-blue-700">{t('followupSlotsHint')}</p>
          </div>
        </div>
      )}
    </SettingCard>
  );
}
