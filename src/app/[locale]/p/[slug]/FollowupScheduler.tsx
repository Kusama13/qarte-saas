'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Plus, CalendarHeart } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { formatTime } from '@/lib/utils';
import type { MerchantCountry } from '@/types';

type AvailableSlot = { slot_date: string; start_time: string };

interface FollowupSchedulerProps {
  merchantId: string;
  primaryColor: string;
  secondaryColor?: string | null;
  bookingMode: 'slots' | 'free';
  isHomeService: boolean;
  customerCoords: { lat: number; lng: number } | null;
  customerAddress: string;
  serviceIds: string[];
  totalDuration: number;
  phone: string;
  phoneCountry: MerchantCountry;
  firstName: string;
  lastName: string;
  email: string;
  /** Date du RDV principal (ancre des suivis : +3 puis +6 semaines). */
  primaryDate: string;
  /** True si un acompte s'applique → on annonce le rappel J-7. */
  hasDeposit: boolean;
}

const MAX_FOLLOWUPS = 2;
const WEEK_OFFSETS = [3, 6]; // semaines après le RDV principal

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function FollowupScheduler(props: FollowupSchedulerProps) {
  const {
    merchantId, primaryColor: p, secondaryColor, bookingMode, isHomeService,
    customerCoords, customerAddress, serviceIds, totalDuration, phone, phoneCountry, firstName, lastName, email,
    primaryDate, hasDeposit,
  } = props;
  const t = useTranslations('booking');
  const locale = useLocale();

  const [booked, setBooked] = useState<(AvailableSlot & { slot_id?: string })[]>([]);
  const [finished, setFinished] = useState(false);
  const recapSentRef = useRef(false);
  const [activeOpen, setActiveOpen] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const longDate = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long' });
  const shortDate = new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  const fmtLong = (d: string) => longDate.format(new Date(d + 'T00:00:00'));
  const fmtShort = (d: string) => shortDate.format(new Date(d + 'T00:00:00'));

  const nextIndex = booked.length; // 0 = +3 sem, 1 = +6 sem
  const anchorStart = addDays(primaryDate, WEEK_OFFSETS[Math.min(nextIndex, WEEK_OFFSETS.length - 1)] * 7);

  const fetchSlots = async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setLoadingSlots(true);
    setError(null);
    setSelectedDate(null);
    setSelectedTime(null);
    try {
      if (bookingMode === 'free') {
        // 14 jours à partir de l'ancre (+3 / +6 sem.), créneaux calculés dynamiquement.
        const dates = Array.from({ length: 14 }, (_, i) => addDays(anchorStart, i));
        const coordsQs = isHomeService && customerCoords
          ? `&customerLat=${customerCoords.lat}&customerLng=${customerCoords.lng}`
          : '';
        const fetchOne = async (date: string) => {
          const res = await fetch(
            `/api/planning/free-slots?merchantId=${merchantId}&date=${date}&totalDuration=${totalDuration}${coordsQs}`,
            { signal: controller.signal },
          );
          if (!res.ok) return [] as AvailableSlot[];
          const data = await res.json();
          return (data.slots || []) as AvailableSlot[];
        };
        const batch1 = await Promise.all(dates.slice(0, 7).map(fetchOne));
        let all = batch1.flat();
        if (all.length < 20) {
          const batch2 = await Promise.all(dates.slice(7).map(fetchOne));
          all = all.concat(batch2.flat());
        }
        setAvailableSlots(all);
        if (all.length > 0) setSelectedDate(all[0].slot_date);
      } else {
        // Mode créneaux : créneaux pré-générés disponibles, filtrés à partir de l'ancre.
        const res = await fetch(`/api/planning?public=true&merchantId=${merchantId}`, { signal: controller.signal });
        if (res.ok) {
          const data = await res.json();
          const slots = ((data.slots || []) as AvailableSlot[]).filter(s => s.slot_date >= anchorStart);
          setAvailableSlots(slots);
          if (slots.length > 0) setSelectedDate(slots[0].slot_date);
        } else {
          setError(t('followupError'));
        }
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') setError(t('followupError'));
    }
    setLoadingSlots(false);
  };

  const openScheduler = () => {
    setActiveOpen(true);
    fetchSlots();
  };

  const confirmFollowup = async () => {
    if (!selectedDate || !selectedTime) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/planning/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchantId,
          slot_date: selectedDate,
          slot_time: selectedTime,
          phone_number: phone.trim(),
          phone_country: phoneCountry,
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          ...(email.trim() && { customer_email: email.trim() }),
          service_ids: serviceIds,
          followup: true,
          ...(bookingMode === 'free' && { booking_mode: 'free' }),
          ...(isHomeService && customerCoords && {
            customer_address: customerAddress,
            customer_lat: customerCoords.lat,
            customer_lng: customerCoords.lng,
          }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || t('followupError'));
        setSubmitting(false);
        return;
      }
      const newBooked = [...booked, { slot_date: selectedDate, start_time: selectedTime, slot_id: data.booking?.slot_id as string | undefined }];
      setBooked(newBooked);
      setActiveOpen(false);
      setAvailableSlots([]);
      // Dernier RDV de suivi atteint → envoi du récap (un seul email).
      if (newBooked.length >= MAX_FOLLOWUPS) sendRecap(newBooked);
    } catch {
      setError(t('followupError'));
    }
    setSubmitting(false);
  };

  const sendRecap = (entries: (AvailableSlot & { slot_id?: string })[]) => {
    const ids = entries.map(e => e.slot_id).filter((id): id is string => !!id);
    if (recapSentRef.current || ids.length === 0) return;
    recapSentRef.current = true;
    fetch('/api/planning/followup-recap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ merchant_id: merchantId, slot_ids: ids }),
    }).catch(() => {});
  };

  const finish = () => {
    sendRecap(booked);
    setFinished(true);
  };

  if (dismissed && booked.length === 0) return null;

  const availableDates = [...new Set(availableSlots.map(s => s.slot_date))];
  const timesForDate = selectedDate ? availableSlots.filter(s => s.slot_date === selectedDate).map(s => s.start_time) : [];
  const allDone = booked.length >= MAX_FOLLOWUPS || finished;

  return (
    <div className="rounded-xl p-3.5 mb-3" style={{ backgroundColor: `${p}0D`, border: `1px solid ${p}26` }}>
      <div className="flex items-center gap-2.5 mb-2">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${p}1A` }}>
          <CalendarHeart className="w-4 h-4" style={{ color: p }} />
        </div>
        <div className="min-w-0">
          <p className="text-[13px] font-bold text-gray-900 leading-tight">{t('followupTitle')}</p>
          <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
            {hasDeposit ? t('followupSubtitleDeposit') : t('followupSubtitle')}
          </p>
        </div>
      </div>

      {/* RDV de suivi déjà réservés */}
      {booked.length > 0 && (
        <div className="space-y-1.5 mb-2.5">
          {booked.map((b, i) => (
            <div key={i} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: `${p}10` }}>
              <Check className="w-3.5 h-3.5 shrink-0" style={{ color: p }} strokeWidth={2.5} />
              <span className="text-[12px] font-semibold text-gray-800 capitalize">
                {fmtLong(b.slot_date)} — {formatTime(b.start_time, locale)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Scheduler ouvert */}
      <AnimatePresence>
        {activeOpen && !allDone && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            {loadingSlots && (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
            )}

            {!loadingSlots && availableDates.length === 0 && (
              <div className="text-center py-3 px-1">
                <p className="text-[12px] font-semibold text-gray-700">
                  {bookingMode === 'free' ? t('followupNoSlotsFree') : t('followupNoSlotsSlots')}
                </p>
                <p className="text-[11px] text-gray-500 mt-1">{t('followupNoSlotsReassure')}</p>
              </div>
            )}

            {!loadingSlots && availableDates.length > 0 && (
              <>
                <div className="flex gap-1.5 overflow-x-auto pb-1.5 mb-2 scrollbar-none">
                  {availableDates.map((date) => {
                    const isSel = selectedDate === date;
                    return (
                      <motion.button
                        key={date}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => { setSelectedDate(date); setSelectedTime(null); }}
                        className={`shrink-0 px-3 py-2.5 rounded-xl text-[11px] font-bold capitalize transition-all ${
                          isSel ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                        }`}
                        style={isSel ? { backgroundColor: p, boxShadow: `0 2px 8px ${p}40` } : undefined}
                      >
                        {fmtShort(date)}
                      </motion.button>
                    );
                  })}
                </div>

                {selectedDate && timesForDate.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {timesForDate.map((time) => {
                      const isSel = selectedTime === time;
                      return (
                        <motion.button
                          key={time}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2.5 rounded-xl text-[11px] font-semibold transition-all ${
                            isSel ? 'text-white' : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
                          }`}
                          style={isSel ? { backgroundColor: p, boxShadow: `0 2px 8px ${p}40` } : undefined}
                        >
                          {formatTime(time, locale)}
                        </motion.button>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {error && <p className="text-[11px] text-red-600 bg-red-50 rounded-lg px-3 py-2 mb-2 text-center">{error}</p>}

            {selectedDate && selectedTime && (
              <motion.button
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                whileTap={{ scale: 0.97 }}
                onClick={confirmFollowup}
                disabled={submitting}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ background: `linear-gradient(135deg, ${p}, ${secondaryColor || p})` }}
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                {t('followupConfirm')}
              </motion.button>
            )}

            {/* Échappatoire : referme le planificateur sans réserver (jamais de cul-de-sac, surtout si aucun créneau). */}
            {!loadingSlots && !submitting && (
              <button
                type="button"
                onClick={() => { setActiveOpen(false); setSelectedTime(null); setError(null); }}
                className="w-full mt-1.5 py-2 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
              >
                {availableDates.length === 0 ? t('followupBack') : t('followupCancel')}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bouton ajouter / état terminé */}
      {!activeOpen && !allDone && (
        <div className="flex items-center gap-2">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={openScheduler}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-bold transition-all flex items-center justify-center gap-1.5"
            style={{ backgroundColor: `${p}14`, color: p, border: `1px solid ${p}2a` }}
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            {booked.length === 0 ? t('followupAddFirst') : t('followupAddSecond')}
          </motion.button>
          <button
            type="button"
            onClick={() => (booked.length === 0 ? setDismissed(true) : finish())}
            className="px-3 py-2.5 text-[12px] text-gray-400 hover:text-gray-600 transition-colors"
          >
            {booked.length === 0 ? t('followupSkip') : t('followupDone')}
          </button>
        </div>
      )}

      {allDone && (
        <p className="text-[12px] text-center font-semibold text-gray-600 pt-1">{t('followupAllSet')}</p>
      )}
    </div>
  );
}
