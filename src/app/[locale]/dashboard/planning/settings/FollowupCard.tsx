'use client';

import { useState } from 'react';
import { CalendarHeart, Info, AlertTriangle, HelpCircle, Wallet, BellRing, Timer, CalendarClock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ToggleRow, SettingCard, Modal } from '@/components/ui';

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
  const [helpOpen, setHelpOpen] = useState(false);
  const isSlots = bookingMode === 'slots';
  const horizonTooShort = bookingHorizonDays < FOLLOWUP_MIN_HORIZON_DAYS;

  const steps = [
    { icon: Wallet, title: t('followupHelpStep1Title'), desc: t('followupHelpStep1Desc') },
    { icon: BellRing, title: t('followupHelpStep2Title'), desc: t('followupHelpStep2Desc') },
    { icon: Timer, title: t('followupHelpStep3Title'), desc: t('followupHelpStep3Desc') },
    { icon: CalendarClock, title: t('followupHelpStep4Title'), desc: t('followupHelpStep4Desc') },
  ];

  return (
    <>
      <SettingCard
        icon={CalendarHeart}
        title={t('followupTitle')}
        tone="emerald"
        className="sm:col-span-2"
        headerRight={
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label={t('followupHelpTitle')}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 rounded-full px-2 py-1 hover:bg-emerald-50 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {t('followupHelpButton')}
          </button>
        }
      >
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

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t('followupHelpTitle')} size="lg">
        <div className="space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">{t('followupHelpIntro')}</p>

          <ul className="space-y-3">
            {steps.map((s, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="shrink-0 w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center">
                  <s.icon className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">{s.title}</p>
                  <p className="text-[13px] text-gray-600 leading-snug">{s.desc}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
            <Info className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
            <p className="text-[13px] text-gray-600 leading-snug">{t('followupHelpNoDeposit')}</p>
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <CalendarClock className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[13px] text-blue-700 leading-snug">{t('followupHelpSlots')}</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
