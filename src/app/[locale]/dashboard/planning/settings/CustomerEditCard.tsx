'use client';

import { CalendarX2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ToggleRow, ChipGroup } from '@/components/ui';

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
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible sm:col-span-2">
      <div className="px-4 sm:px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2">
        <CalendarX2 className="w-4 h-4 text-gray-500 shrink-0" />
        <h2 className="text-sm font-bold text-gray-800">{t('customerEditTitle')}</h2>
      </div>
      <div className="p-4 sm:p-5 space-y-3">
        <ToggleRow
          title={t('allowCustomerCancel')}
          hint={t('allowCustomerCancelDesc')}
          checked={cancelEnabled}
          onChange={onCancelEnabledChange}
        >
          <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('editDeadlineDays')}</label>
          <ChipGroup options={deadlineOptions} value={cancelDeadlineDays} onChange={onCancelDeadlineDaysChange} />
        </ToggleRow>
        <div className="border-t border-gray-100" />
        <ToggleRow
          title={t('allowCustomerReschedule')}
          hint={t('allowCustomerRescheduleDesc')}
          checked={rescheduleEnabled}
          onChange={onRescheduleEnabledChange}
        >
          <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('editDeadlineDays')}</label>
          <ChipGroup options={deadlineOptions} value={rescheduleDeadlineDays} onChange={onRescheduleDeadlineDaysChange} />
        </ToggleRow>
      </div>
    </div>
  );
}
