'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import PlanningModal, { ModalHeader, ModalFooter } from './PlanningModal';

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
    <PlanningModal onClose={onClose} size="sm">
      <ModalHeader
        title={title}
        icon={<AlertTriangle className="w-4 h-4" />}
        iconTint="red"
        onClose={onClose}
      />
      <div className="p-4 space-y-2">
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
      <ModalFooter>
        <button
          onClick={onClose}
          disabled={saving}
          className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
        >
          {t('cancel')}
        </button>
        <button
          onClick={onConfirm}
          disabled={saving || !canDelete}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </ModalFooter>
    </PlanningModal>
  );
}
