'use client';

import { useLocale, useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { toBCP47 } from '@/lib/utils';
import { getWeekStart } from './utils';

interface CopyWeekModalProps {
  weekOffset: number;
  saving: boolean;
  onCopyWeek: (targetWeekOffset: number) => void;
  onClose: () => void;
}

export default function CopyWeekModal({ weekOffset, saving, onCopyWeek, onClose }: CopyWeekModalProps) {
  const locale = useLocale();
  const t = useTranslations('planning');
  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden mb-4">
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">{t('copyToWhichWeek')}</p>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4].map(offset => (
            <button
              key={offset}
              onClick={() => onCopyWeek(weekOffset + offset)}
              disabled={saving}
              className="px-3 py-1.5 text-xs font-bold bg-white border border-gray-200 text-gray-700 rounded-xl hover:border-indigo-300 hover:text-indigo-700 transition-colors disabled:opacity-50"
            >
              {getWeekStart(weekOffset + offset).toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' })}
            </button>
          ))}
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:text-gray-700">
            {t('cancel')}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
