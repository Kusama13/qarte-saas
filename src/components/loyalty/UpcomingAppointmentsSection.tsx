'use client';

import { useState, useRef, useMemo } from 'react';
import { CalendarDays, Hourglass, Check, Clock, X, Loader2, CalendarClock, CreditCard, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { formatTime, getTodayForCountry, customServiceDisplayName } from '@/lib/utils';
import { detectPaymentProvider, buildDepositLinks } from '@/lib/payment-providers';
import type { MerchantCountry } from '@/types';

interface AppointmentSlot {
  id: string;
  slot_date: string;
  start_time: string;
  total_duration_minutes?: number | null;
  deposit_confirmed?: boolean | null;
  booked_online?: boolean;
  custom_service_name?: string | null;
  custom_service_duration?: number | null;
  planning_slot_services: Array<{
    service_id: string;
    service: { name: string; duration?: number | null } | null;
  }>;
}

interface UpcomingAppointmentsSectionProps {
  appointments: AppointmentSlot[];
  merchantColor: string;
  merchantId: string;
  shopName: string;
  merchantCountry?: MerchantCountry;
  bookingMode?: 'slots' | 'free';
  allowCancel?: boolean;
  allowReschedule?: boolean;
  cancelDeadlineDays?: number;
  rescheduleDeadlineDays?: number;
  depositLink?: string | null;
  depositLinkLabel?: string | null;
  depositLink2?: string | null;
  depositLink2Label?: string | null;
  onCancelled?: (slotId: string) => void;
  onRescheduled?: (oldSlotId: string, newSlotId: string) => void;
}

type AvailableSlot = { slot_date: string; start_time: string };

export default function UpcomingAppointmentsSection({
  appointments,
  merchantColor,
  merchantId,
  shopName,
  merchantCountry,
  bookingMode = 'slots',
  allowCancel = false,
  allowReschedule = false,
  cancelDeadlineDays = 1,
  rescheduleDeadlineDays = 1,
  depositLink,
  depositLinkLabel,
  depositLink2,
  depositLink2Label,
  onCancelled,
  onRescheduled,
}: UpcomingAppointmentsSectionProps) {
  const t = useTranslations('customerCard');
  const locale = useLocale();

  // Cancel state
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [confirmCancelSlot, setConfirmCancelSlot] = useState<AppointmentSlot | null>(null);

  // Reschedule state
  const [rescheduleSlot, setRescheduleSlot] = useState<AppointmentSlot | null>(null);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState(false);
  const [rescheduleSuccess, setRescheduleSuccess] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const [error, setError] = useState<string | null>(null);

  const depositLinks = useMemo(
    () => buildDepositLinks(depositLink, depositLinkLabel, depositLink2, depositLink2Label),
    [depositLink, depositLinkLabel, depositLink2, depositLink2Label],
  );

  if (appointments.length === 0) return null;

  const dateFormatter = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  const formatLongDate = (dateStr: string) => dateFormatter.format(new Date(dateStr + 'T00:00:00'));

  const shortDateFormatter = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const formatShortDate = (dateStr: string) => shortDateFormatter.format(new Date(dateStr + 'T00:00:00'));

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

  // Free mode: fetch slots per date (dynamic computation)
  const fetchFreeSlotsForDate = async (date: string, duration: number, signal: AbortSignal) => {
    const res = await fetch(`/api/planning/free-slots?merchantId=${merchantId}&date=${date}&totalDuration=${duration}`, { signal });
    if (res.ok) {
      const data = await res.json();
      return (data.slots || []) as AvailableSlot[];
    }
    return [];
  };

  const fetchAvailableSlots = async (appt?: AppointmentSlot) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadingSlots(true);
    setError(null);
    try {
      if (bookingMode === 'free' && appt) {
        // Compute duration: prefer total_duration_minutes from slot, fallback to sum of services
        const totalDuration = appt.total_duration_minutes
          ?? (appt.planning_slot_services.reduce((sum, s) => sum + (s.service?.duration || 30), 0) || 60);
        // Fetch next 14 days in parallel (batch of 7 + 7)
        const today = getTodayForCountry(merchantCountry);
        const dates = Array.from({ length: 14 }, (_, i) => {
          const d = new Date(today + 'T12:00:00');
          d.setDate(d.getDate() + i);
          return d.toISOString().split('T')[0];
        });
        const batch1 = await Promise.all(dates.slice(0, 7).map(date => fetchFreeSlotsForDate(date, totalDuration, controller.signal)));
        let allSlots = batch1.flat();
        if (allSlots.length < 30) {
          const batch2 = await Promise.all(dates.slice(7).map(date => fetchFreeSlotsForDate(date, totalDuration, controller.signal)));
          allSlots = allSlots.concat(batch2.flat());
        }
        setAvailableSlots(allSlots);
        if (allSlots.length > 0) setSelectedDate(allSlots[0].slot_date);
      } else {
        const res = await fetch(`/api/planning?public=true&merchantId=${merchantId}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          setAvailableSlots(data.slots || []);
          if (data.slots?.length > 0) setSelectedDate(data.slots[0].slot_date);
        } else {
          setError(t('rescheduleError'));
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(t('rescheduleError'));
    }
    setLoadingSlots(false);
  };

  const openRescheduleModal = (appt: AppointmentSlot) => {
    setRescheduleSlot(appt);
    setSelectedDate(null);
    setSelectedTime(null);
    setError(null);
    fetchAvailableSlots(appt);
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

  const handleReschedule = async () => {
    if (!rescheduleSlot || !selectedDate || !selectedTime) return;
    setRescheduling(true);
    setError(null);
    try {
      const res = await fetch('/api/planning/customer-edit', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slot_id: rescheduleSlot.id,
          merchant_id: merchantId,
          new_date: selectedDate,
          new_time: selectedTime,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRescheduleSuccess(true);
        setTimeout(() => {
          setRescheduleSlot(null);
          setRescheduleSuccess(false);
          onRescheduled?.(rescheduleSlot.id, data.new_slot_id);
        }, 1500);
      } else {
        const data = await res.json();
        setError(data.error || t('rescheduleError'));
      }
    } catch {
      setError(t('rescheduleError'));
    }
    setRescheduling(false);
  };

  const showFooterContact = !allowCancel && !allowReschedule;
  const modalServices = confirmCancelSlot
    ? [
        ...confirmCancelSlot.planning_slot_services.map(s => s.service?.name).filter((n): n is string => !!n),
        ...(confirmCancelSlot.custom_service_duration ? [customServiceDisplayName(confirmCancelSlot)] : []),
      ]
    : [];

  // Reschedule: available dates and times for selected date
  const availableDates = [...new Set(availableSlots.map(s => s.slot_date))];
  const timesForDate = selectedDate
    ? availableSlots.filter(s => s.slot_date === selectedDate).map(s => s.start_time)
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

        {/* Appointments list */}
        <div className="space-y-2 mb-2.5">
          <AnimatePresence mode="popLayout">
            {appointments.map((appt) => {
              const serviceNames = [
                ...appt.planning_slot_services.map(s => s.service?.name).filter((n): n is string => !!n),
                ...(appt.custom_service_duration ? [customServiceDisplayName(appt)] : []),
              ];
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

                    {/* Deposit payment block */}
                    {appt.deposit_confirmed === false && depositLinks.length > 0 && (
                      <div className="mt-2.5 pt-2.5 border-t" style={{ borderColor: `${merchantColor}15` }}>
                        {depositLinks.length > 1 && (
                          <p className="text-[10px] font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                            {t('depositChooseMethod')}
                          </p>
                        )}
                        <div className="space-y-1.5">
                          {depositLinks.map((link, i) => {
                            const label = link.label || detectPaymentProvider(link.url) || t('payDepositGeneric');
                            return (
                              <a
                                key={i}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full inline-flex items-center justify-between gap-2 h-11 px-4 rounded-xl text-sm font-bold text-white shadow-sm hover:shadow-md active:scale-[0.98] transition-all touch-manipulation"
                                style={{
                                  background: `linear-gradient(135deg, ${merchantColor}, ${merchantColor}dd)`,
                                  boxShadow: `0 2px 8px ${merchantColor}30`,
                                }}
                              >
                                <span className="inline-flex items-center gap-2 min-w-0">
                                  <CreditCard className="w-4 h-4 shrink-0" strokeWidth={2.25} />
                                  <span className="truncate">
                                    {depositLinks.length > 1 ? label : t('payMyDeposit')}
                                  </span>
                                </span>
                                <ChevronRight className="w-4 h-4 shrink-0 opacity-80" />
                              </a>
                            );
                          })}
                        </div>
                        <p className="mt-1.5 text-[10px] text-gray-500 text-center leading-snug">
                          {t('depositValidationHint', { shop: shopName })}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    {(showCancel || showReschedule) && (
                      <div className="mt-2 pt-2 border-t flex gap-2" style={{ borderColor: `${merchantColor}15` }}>
                        {showReschedule && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openRescheduleModal(appt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors"
                            style={{
                              backgroundColor: `${merchantColor}10`,
                              color: merchantColor,
                              border: `1px solid ${merchantColor}25`,
                            }}
                            aria-label={t('rescheduleBooking')}
                          >
                            <CalendarClock className="w-3.5 h-3.5" />
                            {t('rescheduleBooking')}
                          </motion.button>
                        )}
                        {showCancel && (
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setConfirmCancelSlot(appt)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors"
                            aria-label={t('cancelBooking')}
                          >
                            <X className="w-3.5 h-3.5" />
                            {t('cancelBooking')}
                          </motion.button>
                        )}
                      </div>
                    )}

                    {/* Deadline passed hint */}
                    {deadlinePassed && (
                      <div className="mt-2 pt-2 border-t" style={{ borderColor: `${merchantColor}15` }}>
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gray-100">
                          <Clock className="w-2.5 h-2.5 text-gray-500" />
                          <span className="text-[10px] text-gray-500">{t('editDeadlinePassed')}</span>
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
          <p className="text-[10px] text-gray-500 text-center pt-2 border-t border-gray-100">
            {t('contactToModify', { shop: shopName })}
          </p>
        )}
      </div>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {confirmCancelSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => { if (!cancellingId) setConfirmCancelSlot(null); }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-white rounded-[2rem] p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
                  <X className="w-7 h-7 text-red-500" />
                </div>
              </div>

              <h3 className="text-base font-bold text-gray-900 text-center mb-2">
                {t('cancelConfirmTitle')}
              </h3>

              <p className="text-sm text-gray-500 text-center mb-1">
                {formatLongDate(confirmCancelSlot.slot_date)} — {formatTime(confirmCancelSlot.start_time, locale)}
              </p>
              {modalServices.length > 0 && (
                <p className="text-xs text-gray-500 text-center">{modalServices.join(', ')}</p>
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

      {/* Reschedule modal */}
      <AnimatePresence>
        {rescheduleSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => { if (!rescheduling && !rescheduleSuccess) { setRescheduleSlot(null); setError(null); } }}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="w-full max-w-sm bg-white rounded-[2rem] px-5 pt-5 pb-6 shadow-xl max-h-[80vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              {rescheduleSuccess ? (
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="py-6 text-center"
                >
                  <div
                    className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ backgroundColor: `${merchantColor}15` }}
                  >
                    <Check className="w-7 h-7" style={{ color: merchantColor }} />
                  </div>
                  <p className="text-sm font-bold text-gray-900 mb-1">{t('bookingRescheduled')}</p>
                  {selectedDate && selectedTime && (
                    <p className="text-xs text-gray-500">
                      {formatLongDate(selectedDate)} — {formatTime(selectedTime, locale)}
                    </p>
                  )}
                </motion.div>
              ) : (
              <>
              {/* Header compact */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${merchantColor}15` }}
                >
                  <CalendarClock className="w-5 h-5" style={{ color: merchantColor }} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">
                    {t('rescheduleTitle')}
                  </h3>
                  <p className="text-[11px] text-gray-500 truncate">
                    {formatLongDate(rescheduleSlot.slot_date)} — {formatTime(rescheduleSlot.start_time, locale)}
                  </p>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Loading */}
                {loadingSlots && (
                  <div className="flex justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-gray-500" />
                  </div>
                )}

                {/* No slots */}
                {!loadingSlots && availableDates.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-6">{t('noSlotsAvailable')}</p>
                )}

                {/* Date + time picker */}
                {!loadingSlots && availableDates.length > 0 && (
                  <>
                    <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-2">{t('reschedulePickSlot')}</p>

                    {/* Horizontal scrollable dates with fade edges */}
                    <div className="relative mb-3">
                      <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                        {availableDates.map((date) => {
                          const isSelected = selectedDate === date;
                          return (
                            <motion.button
                              key={date}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                              className={`shrink-0 px-3 py-2 rounded-xl text-[11px] font-bold capitalize transition-all ${
                                isSelected
                                  ? 'text-white'
                                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                              }`}
                              style={isSelected ? {
                                backgroundColor: merchantColor,
                                boxShadow: `0 2px 8px ${merchantColor}40`,
                              } : undefined}
                            >
                              {formatShortDate(date)}
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time slots grid */}
                    {selectedDate && timesForDate.length > 0 && (
                      <div className="grid grid-cols-4 gap-1.5 mb-3">
                        {timesForDate.map((time) => {
                          const isSelected = selectedTime === time;
                          const isSameSlot = selectedDate === rescheduleSlot.slot_date && time === rescheduleSlot.start_time;
                          return (
                            <motion.button
                              key={time}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setSelectedTime(isSameSlot ? null : time)}
                              disabled={isSameSlot}
                              className={`py-2 rounded-lg text-xs font-semibold transition-all ${
                                isSameSlot
                                  ? 'bg-gray-50 text-gray-300 cursor-not-allowed line-through'
                                  : isSelected
                                    ? 'text-white'
                                    : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-100'
                              }`}
                              style={isSelected ? {
                                backgroundColor: merchantColor,
                                boxShadow: `0 2px 8px ${merchantColor}40`,
                              } : undefined}
                            >
                              {formatTime(time, locale)}
                            </motion.button>
                          );
                        })}
                      </div>
                    )}

                    {/* Confirmation text */}
                    {selectedDate && selectedTime && (
                      <motion.div
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-xl px-3 py-2.5 mb-2 text-center"
                        style={{ backgroundColor: `${merchantColor}08`, border: `1px solid ${merchantColor}15` }}
                      >
                        <p className="text-xs font-semibold text-gray-700">
                          {t('rescheduleConfirm', { date: formatLongDate(selectedDate), time: formatTime(selectedTime, locale) })}
                        </p>
                      </motion.div>
                    )}
                  </>
                )}

                {/* Error */}
                {error && (
                  <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2 text-center">
                    {error}
                  </p>
                )}
              </div>

              {/* Sticky buttons */}
              <div className="mt-3 space-y-2 shrink-0">
                {selectedDate && selectedTime && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleReschedule}
                    disabled={rescheduling}
                    className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{
                      backgroundColor: merchantColor,
                      boxShadow: `0 2px 8px ${merchantColor}30`,
                    }}
                  >
                    {rescheduling ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <CalendarClock className="w-4 h-4" />
                    )}
                    {t('rescheduleButton')}
                  </motion.button>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setRescheduleSlot(null); setError(null); }}
                  disabled={rescheduling}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-50"
                >
                  {t('cancelKeep')}
                </motion.button>
              </div>
              </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
