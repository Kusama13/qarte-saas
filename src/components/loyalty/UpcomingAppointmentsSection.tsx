'use client';

import { useState } from 'react';
import { CalendarDays, Hourglass, Check, Clock, X, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, getTodayForCountry } from '@/lib/utils';
import type { MerchantCountry } from '@/types';

interface AppointmentSlot {
  id: string;
  slot_date: string;
  start_time: string;
  deposit_confirmed?: boolean | null;
  booked_online?: boolean;
  planning_slot_services: Array<{
    service_id: string;
    service: { name: string } | null;
  }>;
}

interface UpcomingAppointmentsSectionProps {
  appointments: AppointmentSlot[];
  merchantColor: string;
  merchantId: string;
  shopName: string;
  merchantCountry?: MerchantCountry;
  allowCancel?: boolean;
  allowReschedule?: boolean;
  cancelDeadlineDays?: number;
  rescheduleDeadlineDays?: number;
  onCancelled?: (slotId: string) => void;
}

export default function UpcomingAppointmentsSection({
  appointments,
  merchantColor,
  merchantId,
  shopName,
  merchantCountry,
  allowCancel = false,
  allowReschedule = false,
  cancelDeadlineDays = 1,
  rescheduleDeadlineDays = 1,
  onCancelled,
}: UpcomingAppointmentsSectionProps) {
  const t = useTranslations('customerCard');
  const locale = useLocale();

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelSlot, setConfirmCancelSlot] = useState<AppointmentSlot | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (appointments.length === 0) return null;

  const dateFormatter = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formatLongDate = (dateStr: string) => dateFormatter.format(new Date(dateStr + 'T00:00:00'));

  const today = getTodayForCountry(merchantCountry);
  const todayMs = new Date(today + 'T00:00:00').getTime();
  const getDaysUntil = (dateStr: string) => {
    return Math.floor((new Date(dateStr + 'T00:00:00').getTime() - todayMs) / (1000 * 60 * 60 * 24));
  };

  const canCancelAppointment = (appt: AppointmentSlot) => {
    return getDaysUntil(appt.slot_date) >= cancelDeadlineDays;
  };

  const canRescheduleAppointment = (appt: AppointmentSlot) => {
    return getDaysUntil(appt.slot_date) >= rescheduleDeadlineDays;
  };

  const handleCancel = async (slotId: string) => {
    setCancellingId(slotId);
    setError(null);
    try {
      const res = await fetch('/api/planning/customer-edit', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slotId, merchant_id: merchantId }),
      });
      if (res.ok) {
        setConfirmCancelSlot(null);
        onCancelled?.(slotId);
      } else {
        const data = await res.json();
        setError(data.error || t('cancelError'));
      }
    } catch {
      setError(t('cancelError'));
    }
    setCancellingId(null);
  };

  const showFooterContact = !allowCancel && !allowReschedule;
  const modalServices = confirmCancelSlot
    ? confirmCancelSlot.planning_slot_services.map(s => s.service?.name).filter((n): n is string => !!n)
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="mb-4"
    >
      <div
        className="bg-white rounded-2xl p-3.5"
        style={{
          border: `2px solid ${merchantColor}`,
          boxShadow: `0 4px 16px -4px ${merchantColor}30`,
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 mb-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${merchantColor}15` }}
          >
            <CalendarDays className="w-3.5 h-3.5" style={{ color: merchantColor }} />
          </div>
          <h3 className="text-[13px] font-bold text-gray-900">{t('upcomingAppointments')}</h3>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Appointments list */}
        <div className="space-y-2 mb-2.5">
          <AnimatePresence mode="popLayout">
            {appointments.map((appt) => {
              const serviceNames = appt.planning_slot_services
                .map(s => s.service?.name)
                .filter((n): n is string => !!n);
              const showCancel = allowCancel && canCancelAppointment(appt);
              const showReschedule = allowReschedule && canRescheduleAppointment(appt);
              const deadlinePassed = (allowCancel || allowReschedule) && !showCancel && !showReschedule;

              return (
                <motion.div
                  key={appt.id}
                  layout
                  initial={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -80, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div
                    className="rounded-lg px-3 py-2"
                    style={{ backgroundColor: `${merchantColor}08`, border: `1px solid ${merchantColor}1a` }}
                  >
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-baseline gap-1.5 flex-wrap min-w-0">
                        <p className="text-[13px] font-black text-gray-900 capitalize leading-tight tracking-tight">
                          {formatLongDate(appt.slot_date)}
                        </p>
                        <span className="inline-flex items-center gap-0.5 text-[12px] font-bold" style={{ color: merchantColor }}>
                          <Clock className="w-3 h-3" />
                          {formatTime(appt.start_time, locale)}
                        </span>
                      </div>
                      {appt.deposit_confirmed === false && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 shrink-0">
                          <Hourglass className="w-2.5 h-2.5 text-amber-700" />
                          <span className="text-[10px] font-bold text-amber-800">{t('depositPending')}</span>
                        </span>
                      )}
                      {appt.deposit_confirmed === true && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 border border-emerald-200 shrink-0">
                          <Check className="w-2.5 h-2.5 text-emerald-700" />
                          <span className="text-[10px] font-bold text-emerald-800">{t('depositOk')}</span>
                        </span>
                      )}
                    </div>
                    {serviceNames.length > 0 && (
                      <ul className="mt-1.5 space-y-0.5">
                        {serviceNames.map((name, i) => (
                          <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-600">
                            <span
                              className="mt-[5px] w-1 h-1 rounded-full shrink-0"
                              style={{ backgroundColor: merchantColor }}
                            />
                            <span className="truncate">{name}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Action buttons */}
                    {showCancel && (
                      <div className="mt-2 pt-2 border-t flex gap-2" style={{ borderColor: `${merchantColor}15` }}>
                        <motion.button
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setConfirmCancelSlot(appt)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                          aria-label={t('cancelBooking')}
                        >
                          <X className="w-3.5 h-3.5" />
                          {t('cancelBooking')}
                        </motion.button>
                      </div>
                    )}

                    {/* Deadline passed hint */}
                    {deadlinePassed && (
                      <div className="mt-2 pt-2 border-t" style={{ borderColor: `${merchantColor}15` }}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100">
                          <Clock className="w-2.5 h-2.5 text-gray-400" />
                          <span className="text-[10px] text-gray-400">{t('editDeadlinePassed')}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Footer message — only when no edit is allowed */}
        {showFooterContact && (
          <p className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100">
            {t('contactToModify', { shop: shopName })}
          </p>
        )}
      </div>

      <AnimatePresence>
        {confirmCancelSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50"
            onClick={() => { if (!cancellingId) setConfirmCancelSlot(null); }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-white rounded-t-[2rem] sm:rounded-[2rem] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Red icon */}
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <X className="w-7 h-7 text-red-500" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-base font-bold text-gray-900 text-center mb-2">
                {t('cancelConfirmTitle')}
              </h3>

              <p className="text-sm text-gray-500 text-center mb-1">
                {formatLongDate(confirmCancelSlot.slot_date)} — {formatTime(confirmCancelSlot.start_time, locale)}
              </p>
              {modalServices.length > 0 && (
                <p className="text-xs text-gray-400 text-center">{modalServices.join(', ')}</p>
              )}

              {error && (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-4 text-center">
                  {error}
                </p>
              )}

              <div className="mt-5 space-y-2">
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => handleCancel(confirmCancelSlot.id)}
                  disabled={cancellingId === confirmCancelSlot.id}
                  className="w-full py-3 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancellingId === confirmCancelSlot.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <X className="w-4 h-4" />
                  )}
                  {t('cancelConfirmButton')}
                </motion.button>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setConfirmCancelSlot(null); setError(null); }}
                  disabled={!!cancellingId}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-50"
                >
                  {t('cancelKeep')}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
