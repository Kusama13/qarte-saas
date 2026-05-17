'use client';

import { CalendarX2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ToggleRow, ChipGroup, SettingCard } from '@/components/ui';

interface CustomerEditCardProps {
  cancelEnabled: boolean;
  onCancelEnabledChange: (next: boolean) => void;
  cancelDeadlineDays: string;
  onCancelDeadlineDaysChange: (next: string) => void;
  rescheduleEnabled: boolean;
  onRescheduleEnabledChange: (next: boolean) => void;
  rescheduleDeadlineDays: string;
  onRescheduleDeadlineDaysChange: (next: string) => void;
}

export function CustomerEditCard({
  cancelEnabled,
  onCancelEnabledChange,
  cancelDeadlineDays,
  onCancelDeadlineDaysChange,
  rescheduleEnabled,
  onRescheduleEnabledChange,
  rescheduleDeadlineDays,
  onRescheduleDeadlineDaysChange,
}: CustomerEditCardProps) {
  const t = useTranslations('planning');
  const deadlineOptions = [
    { value: '1', label: t('deadlineDay1') },
    { value: '2', label: t('deadlineDay2') },
    { value: '3', label: t('deadlineDay3') },
    { value: '7', label: t('deadlineDay7') },
  ];

  return (
    <SettingCard icon={CalendarX2} title={t('customerEditTitle')} tone="emerald" className="sm:col-span-2">
      <div className="space-y-3">
        <ToggleRow
          title={t('allowCustomerCancel')}
          hint={t('allowCustomerCancelDesc')}
          checked={cancelEnabled}
          onChange={onCancelEnabledChange}
          tone="emerald"
        >
          <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('editDeadlineDays')}</label>
          <ChipGroup options={deadlineOptions} value={cancelDeadlineDays} onChange={onCancelDeadlineDaysChange} fill />
        </ToggleRow>
        <div className="border-t border-gray-100" />
        <ToggleRow
          title={t('allowCustomerReschedule')}
          hint={t('allowCustomerRescheduleDesc')}
          checked={rescheduleEnabled}
          onChange={onRescheduleEnabledChange}
          tone="emerald"
        >
          <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('editDeadlineDays')}</label>
          <ChipGroup options={deadlineOptions} value={rescheduleDeadlineDays} onChange={onRescheduleDeadlineDaysChange} fill />
        </ToggleRow>
      </div>
    </SettingCard>
  );
}
