'use client';

import { X, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import type { PlanningSlot } from '@/types';
import { fmtTime, QUICK_TIMES } from './utils';

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
  locale?: string;
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
  locale = 'fr',
}: AddSlotsModalProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-2xl w-full sm:max-w-md p-5 shadow-xl max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-base font-bold text-gray-900">Ajouter des créneaux</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4 text-gray-400" /></button>
        </div>
        <p className="text-xs text-gray-400 mb-4 capitalize">
          {new Date(addSlotsDay + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>

        <div className="grid grid-cols-4 gap-2 mb-4">
          {QUICK_TIMES.map(time => {
            const selected = selectedTimes.includes(time);
            const exists = (slotsByDate.get(addSlotsDay) || []).some(s => s.start_time === time);
            return (
              <button
                key={time}
                onClick={() => { if (!exists) setSelectedTimes(prev => selected ? prev.filter(t => t !== time) : [...prev, time]); }}
                disabled={exists}
                className={`py-2 rounded-xl text-xs font-semibold transition-all ${exists ? 'bg-gray-100 text-gray-300 cursor-not-allowed' : selected ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
              >
                {fmtTime(time, locale)}
              </button>
            );
          })}
        </div>

        <div className="flex gap-2 mb-4">
          <input type="time" value={customTime} onChange={(e) => setCustomTime(e.target.value)} className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/30" />
          <button
            onClick={() => { if (customTime && !selectedTimes.includes(customTime)) { setSelectedTimes(prev => [...prev, customTime]); setCustomTime(''); } }}
            disabled={!customTime}
            className="px-3 py-2 text-xs font-semibold bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>

        {selectedTimes.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {selectedTimes.sort().map(time => (
              <span key={time} className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full">
                {fmtTime(time, locale)}
                <button onClick={() => setSelectedTimes(prev => prev.filter(t => t !== time))}><X className="w-3 h-3" /></button>
              </span>
            ))}
          </div>
        )}

        <button
          onClick={onSave}
          disabled={saving || selectedTimes.length === 0}
          className="w-full py-3 rounded-xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : `Créer ${selectedTimes.length} créneau${selectedTimes.length > 1 ? 'x' : ''}`}
        </button>
      </motion.div>
    </motion.div>
  );
}
