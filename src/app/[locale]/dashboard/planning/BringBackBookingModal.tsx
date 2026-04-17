'use client';

import { useMemo, useState } from 'react';
import { Undo2, CheckCircle2, Link2, MessageSquare } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { BookingDepositFailure } from '@/types';
import { formatTime, formatPhoneLabel, formatCurrency } from '@/lib/utils';
import { formatDateLong } from './utils';
import type { ServiceWithDuration } from './usePlanningState';
import PlanningModal, { ModalHeader } from './PlanningModal';

interface Props {
  failure: BookingDepositFailure;
  services: ServiceWithDuration[];
  merchantCountry: string;
  locale: string;
  saving: boolean;
  onBringBack: (failureId: string, opts: { markDepositConfirmed: boolean; sendSms: boolean }) => Promise<{ success: boolean; error?: string }>;
  onClose: () => void;
}

export default function BringBackBookingModal({ failure, services, merchantCountry, locale, saving, onBringBack, onClose }: Props) {
  const t = useTranslations('planning');
  const [markDepositConfirmed, setMarkDepositConfirmed] = useState(false);
  const [sendSms, setSendSms] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const serviceMap = useMemo(() => new Map(services.map(s => [s.id, s])), [services]);
  const svcNames = failure.service_ids
    .map(id => serviceMap.get(id)?.name)
    .filter(Boolean) as string[];

  const slotDate = new Date(failure.original_slot_date + 'T12:00:00');
  const startTime = failure.original_start_time.slice(0, 5);

  const handleConfirm = async () => {
    setError(null);
    const res = await onBringBack(failure.id, { markDepositConfirmed, sendSms });
    if (!res.success) {
      setError(res.error || t('errorGeneric'));
      return;
    }
    onClose();
  };

  return (
    <PlanningModal onClose={onClose} size="md">
        <ModalHeader
          title={t('bringBackTitle')}
          subtitle={t('bringBackSubtitle')}
          icon={<Undo2 className="w-4 h-4" />}
          iconTint="violet"
          onClose={onClose}
        />

        <div className="p-4 space-y-4">
          {/* Résumé client + créneau */}
          <div className="bg-gray-50 rounded-2xl p-3 space-y-1">
            <p className="text-sm font-bold text-gray-900">{failure.client_name}</p>
            {failure.client_phone && (
              <p className="text-xs text-gray-500 tabular-nums">{formatPhoneLabel(failure.client_phone)}</p>
            )}
            <p className="text-xs text-gray-700 capitalize mt-1">
              {formatDateLong(slotDate, locale)} · {formatTime(startTime, locale)}
            </p>
            {svcNames.length > 0 && (
              <p className="text-xs text-gray-500">{svcNames.join(', ')}</p>
            )}
            {failure.deposit_amount != null && failure.deposit_amount > 0 && (
              <p className="text-xs text-amber-700 mt-1">
                {t('depositExpected')} : <strong>{formatCurrency(failure.deposit_amount, merchantCountry, locale)}</strong>
              </p>
            )}
          </div>

          {/* Choix acompte */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500">{t('bringBackDepositSection')}</p>
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${!markDepositConfirmed ? 'border-indigo-300 bg-indigo-50/40' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <input
                type="radio"
                checked={!markDepositConfirmed}
                onChange={() => setMarkDepositConfirmed(false)}
                className="mt-0.5 accent-indigo-600"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-indigo-600" />
                  <span className="text-sm font-semibold text-gray-800">{t('bringBackRequestDeposit')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{t('bringBackRequestDepositHint')}</p>
              </div>
            </label>
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${markDepositConfirmed ? 'border-emerald-300 bg-emerald-50/40' : 'border-gray-200 bg-white hover:bg-gray-50'}`}>
              <input
                type="radio"
                checked={markDepositConfirmed}
                onChange={() => setMarkDepositConfirmed(true)}
                className="mt-0.5 accent-emerald-600"
              />
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-800">{t('bringBackMarkConfirmed')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{t('bringBackMarkConfirmedHint')}</p>
              </div>
            </label>
          </div>

          {/* SMS */}
          {failure.client_phone && (
            <label className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="checkbox"
                checked={sendSms}
                onChange={e => setSendSms(e.target.checked)}
                className="accent-indigo-600"
              />
              <div className="flex items-center gap-1.5 min-w-0">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                <span className="text-sm text-gray-800">{t('bringBackSendSms')}</span>
              </div>
            </label>
          )}

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 p-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold bg-[#4b0082] hover:bg-violet-800 text-white transition-colors disabled:opacity-50"
          >
            <Undo2 className="w-4 h-4" />
            {saving ? t('saving') : t('bringBackConfirm')}
          </button>
        </div>
    </PlanningModal>
  );
}
