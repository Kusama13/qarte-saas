'use client';

import { Stamp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ToggleRow, SettingCard } from '@/components/ui';

interface LoyaltyBookingCardProps {
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
}

export function LoyaltyBookingCard({ enabled, onEnabledChange }: LoyaltyBookingCardProps) {
  const t = useTranslations('planning');

  return (
    <SettingCard icon={Stamp} title={t('bookingLoyaltyTitle')} tone="emerald" className="sm:col-span-2">
      <ToggleRow
        title={t('bookingLoyaltyToggle')}
        hint={t('bookingLoyaltyDesc')}
        checked={enabled}
        onChange={onEnabledChange}
        tone="emerald"
      />
    </SettingCard>
  );
}
