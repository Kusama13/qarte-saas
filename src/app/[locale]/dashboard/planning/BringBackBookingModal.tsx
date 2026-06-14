'use client';

import { useMemo, useState } from 'react';
import { Undo2, CheckCircle2, Link2, CalendarClock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { BookingDepositFailure } from '@/types';
import { formatTime, formatPhoneLabel, formatCurrency } from '@/lib/utils';
import { useMerchant } from '@/contexts/MerchantContext';
import { isPaidMerchant } from '@/lib/subscription-status';
import { formatDateLong } from './utils';
import type { ServiceWithDuration, CustomServiceDraft } from './usePlanningState';
import PlanningModal, { ModalHeader } from './PlanningModal';
import CustomServicePicker from './CustomServicePicker';
import SmsToggle from './SmsToggle';

interface Props {
  failure: BookingDepositFailure;
  services: ServiceWithDuration[];
  merchantCountry: string;
  locale: string;
  saving: boolean;
  onBringBack: (failureId: string, opts: { markDepositConfirmed: boolean; sendSms: boolean; customService: CustomServiceDraft | null; customOverridden: boolean }) => Promise<{ success: boolean; error?: string; conflict?: boolean }>;
  // Optionnel : si fourni, un bouton "Choisir un autre créneau" s'affiche en cas de conflit.
  // Absent en mode créneaux (pas de manual booking modal — le merchant doit cliquer un slot vide).
  onPickAnotherSlot?: () => void;
  onClose: () => void;
}

export default function BringBackBookingModal({ failure, services, merchantCountry, locale, saving, onBringBack, onPickAnotherSlot, onClose }: Props) {
  const t = useTranslations('planning');
  const { merchant } = useMerchant();
  const isPaid = isPaidMerchant(merchant);
  const [markDepositConfirmed, setMarkDepositConfirmed] = useState(false);
  const [sendSms, setSendSms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasConflict, setHasConflict] = useState(false);

  // Hydrate la prestation custom depuis l'archive failure (si presente)
  const initialCustom: CustomServiceDraft | null = failure.custom_service_duration
    ? {
        name: failure.custom_service_name || '',
        duration: failure.custom_service_duration,
        price: failure.custom_service_price || 0,
        color: failure.custom_service_color || '#4f46e5',
      }
    : null;
  const [customService, setCustomService] = useState<CustomServiceDraft | null>(initialCustom);
  const [customDirty, setCustomDirty] = useState(false);

  const serviceMap = useMemo(() => new Map(services.map(s => [s.id, s])), [services]);
  const svcNames = failure.service_ids
    .map(id => serviceMap.get(id)?.name)
    .filter(Boolean) as string[];

  const slotDate = new Date(failure.original_slot_date + 'T12:00:00');
  const startTime = failure.original_start_time.slice(0, 5);

  const handleConfirm = async () => {
    setError(null);
    setHasConflict(false);
    const res = await onBringBack(failure.id, { markDepositConfirmed, sendSms: sendSms && isPaid, customService, customOverridden: customDirty });
    if (!res.success) {
      setError(res.error || t('errorGeneric'));
      setHasConflict(!!res.conflict);
      return;
    }
    onClose();
  };

  const handleCustomChange = (next: CustomServiceDraft | null) => {
    setCustomService(next);
    setCustomDirty(true);
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
            <div className="mt-2">
              <CustomServicePicker
                value={customService}
                onChange={handleCustomChange}
                country={merchantCountry}
                locale={locale}
                hasSiblings={svcNames.length > 0}
              />
            </div>
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
                  <Link2 className={`w-3.5 h-3.5 ${!markDepositConfirmed ? 'text-indigo-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-semibold ${!markDepositConfirmed ? 'text-gray-900' : 'text-gray-500'}`}>{t('bringBackRequestDeposit')}</span>
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
                  <CheckCircle2 className={`w-3.5 h-3.5 ${markDepositConfirmed ? 'text-emerald-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-semibold ${markDepositConfirmed ? 'text-gray-900' : 'text-gray-500'}`}>{t('bringBackMarkConfirmed')}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{t('bringBackMarkConfirmedHint')}</p>
              </div>
            </label>
          </div>

          {/* SMS — libellé dynamique selon le choix : confirmation simple OU lien de paiement.
              Gaté isPaid via SmsToggle (verrou "Pro"), cohérent avec le reste du planning. */}
          {failure.client_phone && (
            <SmsToggle
              checked={sendSms && isPaid}
              onToggle={() => setSendSms(s => !s)}
              label={markDepositConfirmed ? t('bringBackSendSms') : t('bringBackSendDepositSms')}
              hint={t('sendSmsTrialHint')}
              isPaid={isPaid}
              proLabel="Pro"
              tint="indigo"
            />
          )}

          {error && (
            <div className="space-y-2">
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </p>
              {hasConflict && onPickAnotherSlot && (
                <button
                  type="button"
                  onClick={onPickAnotherSlot}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-sm font-bold bg-violet-50 hover:bg-violet-100 text-violet-700 border border-violet-200 transition-colors"
                >
                  <CalendarClock className="w-4 h-4" />
                  {t('bringBackPickAnotherSlot')}
                </button>
              )}
              {hasConflict && !onPickAnotherSlot && (
                <p className="text-xs text-gray-500 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg">
                  {t('bringBackConflictSlotsHint')}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 bg-white">
          <button
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto sm:flex-initial py-3 sm:py-2.5 px-4 rounded-xl text-sm font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {t('cancel')}
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 py-3 sm:py-2.5 px-4 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white transition-colors disabled:opacity-50 shadow-sm"
          >
            <Undo2 className="w-4 h-4" />
            {saving ? t('saving') : t('bringBackConfirm')}
          </button>
        </div>
    </PlanningModal>
  );
}
