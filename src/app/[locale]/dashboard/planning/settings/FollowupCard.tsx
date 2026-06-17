'use client';

import { CalendarHeart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ToggleRow, SettingCard } from '@/components/ui';

interface FollowupCardProps {
  enabled: boolean;
  onEnabledChange: (next: boolean) => void;
}

export function FollowupCard({ enabled, onEnabledChange }: FollowupCardProps) {
  const t = useTranslations('planning');

  return (
    <SettingCard icon={CalendarHeart} title={t('followupTitle')} tone="emerald" className="sm:col-span-2">
      <ToggleRow
        title={t('followupToggle')}
        hint={t('followupToggleDesc')}
        checked={enabled}
        onChange={onEnabledChange}
        tone="emerald"
      />
    </SettingCard>
  );
}
