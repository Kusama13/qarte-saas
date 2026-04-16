'use client';

import { X, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import type { PlanningSlot } from '@/types';
import { formatTime, toBCP47 } from '@/lib/utils';
import { QUICK_TIMES } from './utils';

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
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full sm:max-w-md p-5 shadow-xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900">{t('addSlotsTitle')}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-gray-400 capitalize">
            {new Date(addSlotsDay + 'T00:00:00').toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <span className={`text-[11px] font-semibold tabular-nums ${atLimit ? 'text-amber-600' : 'text-gray-400'}`}>
            {selectedTimes.length}/{MAX_SLOTS_PER_BATCH}
          </span>
        </div>

        <div className="grid grid-cols-4 gap-2 mb-4">
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

        <div className="flex gap-2 mb-2">
          <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30" disabled={atLimit} />
          <button
            onClick={addCustomTime}
            disabled={!customTime || atLimit}
            className="px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            {t('addCustomTime')}
          </button>
        </div>

        {atLimit && (
          <p className="text-[11px] text-amber-600 mb-3">{t('maxSlotsReached', { max: MAX_SLOTS_PER_BATCH })}</p>
        )}

        {selectedTimes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {selectedTimes.sort().map(time => (
              <span key={time} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-medium rounded-full">
                {formatTime(time, locale)}
                <button onClick={() => setSelectedTimes(prev => prev.filter(t => t !== time))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}

        <button
          onClick={onSave}
          disabled={saving || selectedTimes.length === 0}
          className="mx-auto block px-8 py-2.5 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : (selectedTimes.length > 1 ? t('createSlotsPlural', { count: selectedTimes.length }) : t('createSlots', { count: selectedTimes.length }))}
        </button>
      </motion.div>
    </motion.div>
  );
}
