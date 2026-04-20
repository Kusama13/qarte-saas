'use client';

import { X, Loader2, CalendarPlus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { PlanningSlot } from '@/types';
import { formatTime } from '@/lib/utils';
import { QUICK_TIMES, formatDateLong } from './utils';
import PlanningModal, { ModalHeader, ModalFooter } from './PlanningModal';

interface AddSlotsModalProps {
  addSlotsDay: string;
  selectedTimes: string[];
  setSelectedTimes: React.Dispatch<React.SetStateAction<string[]>>;
  customTime: string;
  setCustomTime: React.Dispatch<React.SetStateAction<string>>;
  slotsByDate: Map<string, PlanningSlot[]>;
  saving: boolean;
  onSave: () => void;
  onClose: () => void;
}

export default function AddSlotsModal({
  addSlotsDay,
  selectedTimes,
  setSelectedTimes,
  customTime,
  setCustomTime,
  slotsByDate,
  saving,
  onSave,
  onClose,
}: AddSlotsModalProps) {
  const locale = useLocale();
  const t = useTranslations('planning');
  const MAX_SLOTS_PER_BATCH = 20;
  const atLimit = selectedTimes.length >= MAX_SLOTS_PER_BATCH;

  const dateLabel = formatDateLong(new Date(addSlotsDay + 'T00:00:00'), locale);

  const toggleTime = (time: string) => {
    setSelectedTimes(prev => {
      if (prev.includes(time)) return prev.filter(t => t !== time);
      if (prev.length >= MAX_SLOTS_PER_BATCH) return prev;
      return [...prev, time];
    });
  };

  const addCustomTime = () => {
    if (!customTime) return;
    setSelectedTimes(prev => {
      if (prev.includes(customTime) || prev.length >= MAX_SLOTS_PER_BATCH) return prev;
      return [...prev, customTime];
    });
    setCustomTime('');
  };

  return (
    <PlanningModal onClose={onClose} size="md">
      <ModalHeader
        title={t('addSlotsTitle')}
        subtitle={dateLabel}
        icon={<CalendarPlus className="w-4 h-4" />}
        iconTint="indigo"
        badge={(
          <span className={`shrink-0 text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-md ${atLimit ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
            {selectedTimes.length}/{MAX_SLOTS_PER_BATCH}
          </span>
        )}
        onClose={onClose}
      />

      <div className="p-4 space-y-3">
        <div className="grid grid-cols-4 gap-2">
          {QUICK_TIMES.map(time => {
            const selected = selectedTimes.includes(time);
            const exists = (slotsByDate.get(addSlotsDay) || []).some(s => s.start_time === time);
            const disabled = exists || (atLimit && !selected);
            return (
              <button
                key={time}
                onClick={() => { if (!disabled) toggleTime(time); }}
                disabled={disabled}
                className={`py-2 rounded-xl text-xs font-semibold border transition-all ${disabled && !selected ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed' : selected ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-200' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
              >
                {formatTime(time, locale)}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2">
          <input
            type="time"
            value={customTime}
            onChange={(e) => setCustomTime(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
            disabled={atLimit}
          />
          <button
            onClick={addCustomTime}
            disabled={!customTime || atLimit}
            className="px-3 py-2 text-xs font-bold bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            {t('addCustomTime')}
          </button>
        </div>

        {atLimit && (
          <p className="text-xs text-amber-600">{t('maxSlotsReached', { max: MAX_SLOTS_PER_BATCH })}</p>
        )}

        {selectedTimes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedTimes.sort().map(time => (
              <span key={time} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium rounded-full">
                {formatTime(time, locale)}
                <button onClick={() => setSelectedTimes(prev => prev.filter(t => t !== time))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}
      </div>

      <ModalFooter>
        <button
          onClick={onClose}
          className="w-full sm:flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors"
        >
          {t('blockSlotCancel')}
        </button>
        <button
          onClick={onSave}
          disabled={saving || selectedTimes.length === 0}
          className="w-full sm:flex-[2] py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (selectedTimes.length > 1 ? t('createSlotsPlural', { count: selectedTimes.length }) : t('createSlots', { count: selectedTimes.length }))}
        </button>
      </ModalFooter>
    </PlanningModal>
  );
}
