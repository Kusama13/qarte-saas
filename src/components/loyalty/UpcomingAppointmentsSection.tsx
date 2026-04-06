'use client';

import { useState } from 'react';
import { CalendarDays, Hourglass, Check, Clock, X, CalendarClock, Loader2 } from 'lucide-react';
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
  onRefresh?: () => void;
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
  onRefresh,
}: UpcomingAppointmentsSectionProps) {
  const t = useTranslations('customerCard');
  const locale = useLocale();

  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelId, setConfirmCancelId] = useState<string | null>(null);
  const [cancelSuccess, setCancelSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (appointments.length === 0) return null;

  const formatLongDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
  };

  const getDaysUntil = (dateStr: string) => {
    const today = getTodayForCountry(merchantCountry);
    const todayDate = new Date(today + 'T00:00:00');
    const slotDate = new Date(dateStr + 'T00:00:00');
    return Math.floor((slotDate.getTime() - todayDate.getTime()) / (1000 * 60 * 60 * 24));
  };

  const canCancelAppointment = (appt: AppointmentSlot) => {
    if (!appt.booked_online) return false;
    return getDaysUntil(appt.slot_date) >= cancelDeadlineDays;
  };

  const canRescheduleAppointment = (appt: AppointmentSlot) => {
    if (!appt.booked_online) return false;
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
        setCancelSuccess(slotId);
        setConfirmCancelId(null);
        setTimeout(() => { onRefresh?.(); }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || t('cancelError'));
      }
    } catch {
      setError(t('cancelError'));
    }
    setCancellingId(null);
  };

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
          {appointments.map((appt) => {
            const serviceNames = appt.planning_slot_services
              .map(s => s.service?.name)
              .filter((n): n is string => !!n);
            const showCancel = allowCancel && canCancelAppointment(appt);
            const showReschedule = false; // TODO: enable when reschedule modal is built (allowReschedule && canRescheduleAppointment(appt))
            const isCancelled = cancelSuccess === appt.id;

            if (isCancelled) {
              return (
                <motion.div
                  key={appt.id}
                  initial={{ opacity: 1 }}
                  animate={{ opacity: 0.5 }}
                  className="rounded-lg px-3 py-2 bg-gray-50 border border-gray-200 text-center"
                >
                  <p className="text-xs font-semibold text-gray-500">{t('bookingCancelled')}</p>
                </motion.div>
              );
            }

            return (
              <div key={appt.id}>
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
                    {/* Cancel icon button */}
                    {showCancel && confirmCancelId !== appt.id && (
                      <button
                        onClick={() => setConfirmCancelId(appt.id)}
                        className="w-6 h-6 rounded-full bg-red-50 hover:bg-red-100 flex items-center justify-center shrink-0 transition-colors"
                        title={t('cancelBooking')}
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    )}
                    {/* Deadline passed hint */}
                    {(allowCancel || allowReschedule) && !showCancel && !showReschedule && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100 shrink-0">
                        <Clock className="w-2.5 h-2.5 text-gray-400" />
                        <span className="text-[10px] text-gray-400">{t('editDeadlinePassed')}</span>
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

                  {/* Cancel confirmation inline */}
                  <AnimatePresence>
                    {confirmCancelId === appt.id && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 pt-2 border-t space-y-2"
                        style={{ borderColor: `${merchantColor}15` }}
                      >
                        <p className="text-[11px] text-gray-600 text-center">
                          {t('cancelConfirmMessage', { date: formatLongDate(appt.slot_date), time: formatTime(appt.start_time, locale), shop: shopName })}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setConfirmCancelId(null)}
                            className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
                          >
                            {locale === 'fr' ? 'Non' : 'No'}
                          </button>
                          <button
                            onClick={() => handleCancel(appt.id)}
                            disabled={cancellingId === appt.id}
                            className="flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                          >
                            {cancellingId === appt.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
                            {t('cancelConfirmButton')}
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer message */}
        <p className="text-[10px] text-gray-400 text-center pt-2 border-t border-gray-100">
          {t('contactToModify', { shop: shopName })}
        </p>
      </div>
    </motion.div>
  );
}
