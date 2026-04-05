'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface ConfirmDeleteSlotsModalProps {
  scope: 'day' | 'week';
  label: string;
  emptyCount: number;
  bookedCount: number;
  saving: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function ConfirmDeleteSlotsModal({
  scope,
  label,
  emptyCount,
  bookedCount,
  saving,
  onConfirm,
  onClose,
}: ConfirmDeleteSlotsModalProps) {
  const t = useTranslations('planning');

  const title = scope === 'day' ? t('deleteDayTitle', { day: label }) : t('deleteWeekTitle');
  const canDelete = emptyCount > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 10 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 10 }}
        className="bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5">
          <div className="flex items-start gap-3 mb-4">
            <div className="shrink-0 w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-500" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-900 capitalize">{title}</h3>
            </div>
            <button
              onClick={onClose}
              className="shrink-0 p-1 rounded-lg hover:bg-gray-100 text-gray-400"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mb-5">
            {emptyCount > 0 ? (
              <p className="text-sm text-gray-700">
                {emptyCount > 1
                  ? t('deleteCountEmptyPlural', { count: emptyCount })
                  : t('deleteCountEmpty', { count: emptyCount })}
              </p>
            ) : (
              <p className="text-sm text-gray-500">{t('deleteNoEmpty')}</p>
            )}
            {bookedCount > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                {bookedCount > 1
                  ? t('deleteCountBookedPlural', { count: bookedCount })
                  : t('deleteCountBooked', { count: bookedCount })}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {t('cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={saving || !canDelete}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('deleting')}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {t('deleteConfirm')}
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
