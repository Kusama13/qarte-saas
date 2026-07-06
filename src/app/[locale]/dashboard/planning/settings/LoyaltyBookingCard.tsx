'use client';

import { useState } from 'react';
import { Stamp, HelpCircle, CalendarCheck, UserX, Wallet, Info } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ToggleRow, SettingCard, Modal } from '@/components/ui';

interface LoyaltyBookingCardProps {
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
}

export function LoyaltyBookingCard({ enabled, onEnabledChange }: LoyaltyBookingCardProps) {
  const t = useTranslations('planning');
  const [helpOpen, setHelpOpen] = useState(false);

  const steps = [
    { icon: CalendarCheck, title: t('bookingLoyaltyHelpStep1Title'), desc: t('bookingLoyaltyHelpStep1Desc') },
    { icon: Stamp, title: t('bookingLoyaltyHelpStep2Title'), desc: t('bookingLoyaltyHelpStep2Desc') },
    { icon: UserX, title: t('bookingLoyaltyHelpStep3Title'), desc: t('bookingLoyaltyHelpStep3Desc') },
    { icon: Wallet, title: t('bookingLoyaltyHelpStep4Title'), desc: t('bookingLoyaltyHelpStep4Desc') },
  ];

  return (
    <>
      <SettingCard
        icon={Stamp}
        title={t('bookingLoyaltyTitle')}
        tone="emerald"
        className="sm:col-span-2"
        headerRight={
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            aria-label={t('bookingLoyaltyHelpTitle')}
            className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 rounded-full px-2 py-1 hover:bg-emerald-50 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            {t('bookingLoyaltyHelpButton')}
          </button>
        }
      >
        <ToggleRow
          title={t('bookingLoyaltyToggle')}
          hint={t('bookingLoyaltyDesc')}
          checked={enabled}
          onChange={onEnabledChange}
          tone="emerald"
        />
      </SettingCard>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t('bookingLoyaltyHelpTitle')} size="lg">
        <div className="space-y-5">
          <p className="text-sm text-gray-600 leading-relaxed">{t('bookingLoyaltyHelpIntro')}</p>

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
            <p className="text-[13px] text-gray-600 leading-snug">{t('bookingLoyaltyHelpDedup')}</p>
          </div>

          <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-100">
            <CalendarCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[13px] text-blue-700 leading-snug">{t('bookingLoyaltyHelpOnline')}</p>
          </div>
        </div>
      </Modal>
    </>
  );
}
