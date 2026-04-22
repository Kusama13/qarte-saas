'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, ChevronRight, ChevronLeft, Loader2, Gift, CreditCard, CalendarDays, Hourglass, Info, Crown } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { formatTime, toBCP47, formatCurrency } from '@/lib/utils';
import type { Merchant, MerchantCountry } from '@/types';
import { PhoneInput } from '@/components/ui/PhoneInput';

type Service = { id: string; name: string; price: number; position: number; category_id: string | null; duration: number | null; description: string | null; price_from: boolean };
type ServiceCategory = { id: string; name: string; position: number };
type PlanningSlotPublic = { slot_date: string; start_time: string };
type PromoOffer = { id: string; title: string; description: string; expires_at: string | null };

type MerchantBooking = Pick<
  Merchant,
  'id' | 'shop_name' | 'primary_color' | 'secondary_color' | 'country' | 'booking_message' |
  'auto_booking_enabled' | 'deposit_link' | 'deposit_percent' | 'deposit_amount' |
  'welcome_offer_enabled' | 'welcome_offer_description' | 'subscription_status' | 'booking_mode' |
  'allow_customer_cancel' | 'cancel_deadline_days' | 'allow_customer_reschedule' | 'reschedule_deadline_days'
>;

interface BookingModalProps {
  merchant: MerchantBooking;
  services: Service[];
  serviceCategories: ServiceCategory[];
  slotDate: string | null;
  slotTime: string | null;
  planningSlots: PlanningSlotPublic[];
  bookedSlots: PlanningSlotPublic[];
  promoOffer: PromoOffer | null;
  onClose: () => void;
}

type Step = 'services' | 'datetime' | 'info' | 'confirm';

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function formatDuration(mins: number, locale: string): string {
  if (mins < 60) return `${mins}min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (locale === 'en') return m > 0 ? `${h}h ${m}min` : `${h}h`;
  return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
}

const PAYMENT_PROVIDER_RULES: Array<[RegExp, string]> = [
  [/revolut\.(me|com)/, 'Revolut'],
  [/paypal\.(com|me)/, 'PayPal'],
  [/(lydia-app\.com|lydia\.me)/, 'Lydia'],
  [/pumpkin-app\.com/, 'Pumpkin'],
  [/wise\.com/, 'Wise'],
  [/(stripe\.com|buy\.stripe\.com)/, 'Stripe'],
  [/sumup\.(link|com)/, 'SumUp'],
  [/buymeacoffee\.com/, 'Buy Me a Coffee'],
  [/venmo\.com/, 'Venmo'],
  [/cash\.app/, 'Cash App'],
  [/zelle\.com/, 'Zelle'],
  [/payconiq\.com/, 'Payconiq'],
  [/twint/, 'Twint'],
  [/monzo\.me/, 'Monzo'],
];

function detectPaymentProvider(url: string): string | null {
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
    for (const [pattern, label] of PAYMENT_PROVIDER_RULES) {
      if (pattern.test(host)) return label;
    }
    return null;
  } catch {
    return null;
  }
}

function PolicyNotice({ merchant, t, className = 'mb-3' }: { merchant: MerchantBooking; t: ReturnType<typeof import('next-intl').useTranslations>; className?: string }) {
  if (!merchant.allow_customer_cancel && !merchant.allow_customer_reschedule) return null;
  return (
    <div className={`flex items-start gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100 ${className}`}>
      <Info className="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
      <div className="text-[11px] text-blue-700 space-y-0.5">
        {merchant.allow_customer_cancel && (
          <p>{t('cancelPolicy', { days: merchant.cancel_deadline_days ?? 1 })}</p>
        )}
        {merchant.allow_customer_reschedule && (
          <p>{t('reschedulePolicy', { days: merchant.reschedule_deadline_days ?? 1 })}</p>
        )}
      </div>
    </div>
  );
}

export default function BookingModal({
  merchant,
  services,
  serviceCategories,
  slotDate,
  slotTime,
  planningSlots,
  bookedSlots,
  promoOffer,
  onClose,
}: BookingModalProps) {
  const t = useTranslations('booking');
  const locale = useLocale();
  const router = useRouter();
  const p = merchant.primary_color;
  const country = (merchant.country || 'FR') as MerchantCountry;

  const isFreeMod = merchant.booking_mode === 'free';
  const [step, setStep] = useState<Step>('services');
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  // Mode libre: date/time selection
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [freeSlots, setFreeSlots] = useState<PlanningSlotPublic[]>([]);
  const [loadingFreeSlots, setLoadingFreeSlots] = useState(false);
  const [freeSlotsError, setFreeSlotsError] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<MerchantCountry>(country);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    date: string; time: string; services: { name: string; price: number; duration: number }[];
    total_price: number; total_duration: number;
  } | null>(null);
  const [depositResult, setDepositResult] = useState<{
    link: string;
    links?: Array<{ label: string | null; url: string }>;
    percent: number | null;
    amount: number | null;
    message: string | null;
    deadline_hours: number | null;
  } | null>(null);

  // Member benefit detection
  const [memberBenefit, setMemberBenefit] = useState<{
    first_name: string;
    discount_percent: number | null;
    skip_deposit: boolean;
    benefit_label: string;
    program_name: string;
  } | null>(null);
  const memberLookupRef = useRef<ReturnType<typeof setTimeout>>();
  const memberAbortRef = useRef<AbortController>();

  useEffect(() => {
    clearTimeout(memberLookupRef.current);
    memberAbortRef.current?.abort();
    if (phone.length >= 10) {
      memberLookupRef.current = setTimeout(async () => {
        const ctrl = new AbortController();
        memberAbortRef.current = ctrl;
        try {
          const res = await fetch(`/api/member-cards/lookup?phone=${encodeURIComponent(phone)}&merchant_id=${merchant.id}&country=${phoneCountry}`, { signal: ctrl.signal });
          if (res.ok) {
            const data = await res.json();
            setMemberBenefit(data.memberCard || null);
          }
        } catch { /* aborted or network error */ }
      }, 500);
    } else {
      setMemberBenefit(null);
    }
    return () => { clearTimeout(memberLookupRef.current); memberAbortRef.current?.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, phoneCountry, merchant.id]);

  // Compute totals
  const selectedServices = useMemo(
    () => services.filter(s => selectedServiceIds.has(s.id)),
    [services, selectedServiceIds]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0),
    [selectedServices]
  );
  const displayPrice = memberBenefit?.discount_percent
    ? Math.round(totalPrice * (1 - memberBenefit.discount_percent / 100))
    : totalPrice;

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0),
    [selectedServices]
  );

  const hasDurationEstimate = useMemo(
    () => selectedServices.some(s => !s.duration),
    [selectedServices]
  );

  // Check if consecutive slots are available (mode créneaux only)
  const durationAvailable = useMemo(() => {
    if (selectedServiceIds.size === 0) return true;
    if (isFreeMod) return true; // mode libre: server validates
    if (!slotTime || !slotDate || totalDuration === 0) return true;
    const startMins = timeToMinutes(slotTime);
    const endMins = startMins + totalDuration;
    // A booked slot strictly inside (startMins, endMins) blocks the booking
    return !bookedSlots.some(s => {
      if (s.slot_date !== slotDate) return false;
      const m = timeToMinutes(s.start_time);
      return m > startMins && m < endMins;
    });
  }, [selectedServiceIds, slotDate, slotTime, bookedSlots, totalDuration, isFreeMod]);

  const effectiveDate = isFreeMod ? selectedDate : (slotDate || '');
  const effectiveTime = isFreeMod ? selectedTime : (slotTime || '');

  const formattedDate = useMemo(() => {
    if (!effectiveDate) return '';
    return new Date(effectiveDate + 'T12:00:00').toLocaleDateString(
      toBCP47(locale),
      { weekday: 'long', day: 'numeric', month: 'long' }
    );
  }, [effectiveDate, locale]);

  // Fetch free slots when date selected in mode libre
  useEffect(() => {
    if (!isFreeMod || !selectedDate || totalDuration === 0) return;
    setFreeSlots([]);
    setSelectedTime('');
    setFreeSlotsError(false);
    setLoadingFreeSlots(true);
    fetch(`/api/planning/free-slots?merchantId=${merchant.id}&date=${selectedDate}&totalDuration=${totalDuration}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setFreeSlots(data.slots || []))
      .catch(() => setFreeSlotsError(true))
      .finally(() => setLoadingFreeSlots(false));
  }, [isFreeMod, selectedDate, totalDuration, merchant.id]);

  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !phone.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/planning/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: merchant.id,
          slot_date: effectiveDate,
          slot_time: effectiveTime,
          phone_number: phone.trim(),
          phone_country: phoneCountry,
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          service_ids: Array.from(selectedServiceIds),
          ...(isFreeMod && { booking_mode: 'free' }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || t('bookingError'));
        setSubmitting(false);
        return;
      }

      setBookingResult(data.booking);
      setDepositResult(data.deposit);
      setStep('confirm');
    } catch {
      setError(t('bookingError'));
    } finally {
      setSubmitting(false);
    }
  };

  // Group services by category
  const categorizedServices = useMemo(() => {
    const catMap = new Map(serviceCategories.map(c => [c.id, c]));
    const grouped: { category: ServiceCategory | null; services: Service[] }[] = [];
    const withCat = services.filter(s => s.category_id && catMap.has(s.category_id));
    const withoutCat = services.filter(s => !s.category_id || !catMap.has(s.category_id));

    const catIds = [...new Set(withCat.map(s => s.category_id!))];
    for (const catId of catIds) {
      const cat = catMap.get(catId)!;
      grouped.push({ category: cat, services: withCat.filter(s => s.category_id === catId).sort((a, b) => a.position - b.position) });
    }
    grouped.sort((a, b) => (a.category?.position || 0) - (b.category?.position || 0));

    if (withoutCat.length > 0) {
      grouped.push({ category: null, services: withoutCat.sort((a, b) => a.position - b.position) });
    }

    return grouped;
  }, [services, serviceCategories]);

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-white rounded-t-3xl border-b border-gray-100 px-5 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-gray-900">
              {step === 'confirm'
                ? (depositResult?.link ? t('bookingPending') : t('bookingConfirmed'))
                : isFreeMod ? t('bookAppointment') : t('bookSlot')}
            </h3>
            {effectiveDate && effectiveTime ? (
              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                {formattedDate} {t('at')} {formatTime(effectiveTime, locale)}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-0.5">{t('chooseDateTime')}</p>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Services ── */}
            {step === 'services' && (
              <motion.div key="services" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('selectServices')}</p>

                <div className="space-y-4 mb-4">
                  {categorizedServices.map(({ category, services: catServices }) => (
                    <div key={category?.id || 'uncategorized'}>
                      {category && (
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">{category.name}</p>
                      )}
                      <div className="space-y-1.5">
                        {catServices.map(svc => {
                          const selected = selectedServiceIds.has(svc.id);
                          return (
                            <button
                              key={svc.id}
                              type="button"
                              onClick={() => toggleService(svc.id)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                                selected
                                  ? 'bg-opacity-10 border-2'
                                  : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                              }`}
                              style={selected ? { backgroundColor: `${p}10`, borderColor: p } : undefined}
                            >
                              <div
                                className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  selected ? 'border-transparent' : 'border-gray-300'
                                }`}
                                style={selected ? { backgroundColor: p } : undefined}
                              >
                                {selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                                {svc.duration && (
                                  <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(svc.duration, locale)}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm font-bold text-gray-700 shrink-0">
                                {svc.price_from && <span className="text-[10px] font-normal text-gray-500">{t('from')} </span>}
                                {formatCurrency(Number(svc.price), country, locale)}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Promo offer banner */}
                {promoOffer && (
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 mb-3">
                    <Gift className="w-4 h-4 text-amber-500 shrink-0" />
                    <p className="text-xs text-amber-700 font-medium">{promoOffer.title} — {promoOffer.description}</p>
                  </div>
                )}


                {/* Totals */}
                {selectedServiceIds.size > 0 && (
                  <div className="rounded-xl bg-gray-50 px-4 py-3 mb-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{hasDurationEstimate ? t('totalDurationEstimate') : t('totalDuration')}</span>
                      <span className="font-bold text-gray-900">{hasDurationEstimate ? '~' : ''}{formatDuration(totalDuration, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('totalPrice')}</span>
                      <span className="flex items-center gap-1.5">
                        {memberBenefit?.discount_percent && totalPrice !== displayPrice && (
                          <span className="text-xs text-gray-500 line-through">{formatCurrency(totalPrice, country, locale)}</span>
                        )}
                        <span className="font-bold text-gray-900">{formatCurrency(displayPrice, country, locale)}</span>
                      </span>
                    </div>
                    {merchant.deposit_link && (merchant.deposit_percent || merchant.deposit_amount) && totalPrice > 0 && !memberBenefit?.skip_deposit && (() => {
                      const rawDeposit = merchant.deposit_amount
                        ? Number(merchant.deposit_amount)
                        : Math.round(totalPrice * (merchant.deposit_percent || 0) / 100);
                      const isFullPayment = rawDeposit >= totalPrice;
                      const cappedDeposit = Math.min(rawDeposit, totalPrice);
                      return (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {isFullPayment
                              ? t('depositFullPayment')
                              : merchant.deposit_amount
                                ? t('depositFixedLabel')
                                : t('depositLabel', { percent: merchant.deposit_percent || 0 })}
                          </span>
                          <span className="font-bold" style={{ color: p }}>
                            {formatCurrency(cappedDeposit, country, locale)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {selectedServiceIds.size > 0 && <PolicyNotice merchant={merchant} t={t} />}

                {!durationAvailable && selectedServiceIds.size > 0 && (
                  <p className="text-xs text-red-500 font-medium mb-3">{t('durationTooLong')}</p>
                )}

                <button
                  type="button"
                  onClick={() => setStep(isFreeMod ? 'datetime' : 'info')}
                  disabled={selectedServiceIds.size === 0 || !durationAvailable}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                >
                  {t('next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}

            {/* ── STEP 1b: Date/Time (mode libre) ── */}
            {step === 'datetime' && (
              <motion.div key="datetime" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('chooseDate')}</p>

                {/* Month calendar */}
                {(() => {
                  const bcp47 = toBCP47(locale);
                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  const todayStr = today.toISOString().split('T')[0];
                  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, 0); // last day of today+3 months
                  const maxDateStr = maxDate.toISOString().split('T')[0];

                  const year = calMonth.getFullYear();
                  const month = calMonth.getMonth();
                  const daysInMonth = new Date(year, month + 1, 0).getDate();
                  // Week starts Monday (offset: 0=Mon…6=Sun)
                  const firstDow = (new Date(year, month, 1).getDay() + 6) % 7;

                  const canGoPrev = calMonth > new Date(today.getFullYear(), today.getMonth(), 1);
                  const canGoNext = new Date(year, month + 1, 1) <= new Date(today.getFullYear(), today.getMonth() + 3, 1);

                  // Mon-indexed short day labels
                  const dayLabels = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date(2024, 0, 1 + i); // 2024-01-01 = Monday
                    return d.toLocaleDateString(bcp47, { weekday: 'narrow' });
                  });

                  const monthLabel = calMonth.toLocaleDateString(bcp47, { month: 'long', year: 'numeric' });

                  const cells: (number | null)[] = [
                    ...Array(firstDow).fill(null),
                    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
                  ];
                  // Pad to full rows
                  while (cells.length % 7 !== 0) cells.push(null);

                  return (
                    <div className="mb-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <button
                          type="button"
                          disabled={!canGoPrev}
                          onClick={() => setCalMonth(new Date(year, month - 1, 1))}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-semibold text-gray-700 capitalize">{monthLabel}</span>
                        <button
                          type="button"
                          disabled={!canGoNext}
                          onClick={() => setCalMonth(new Date(year, month + 1, 1))}
                          className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                      {/* Day headers */}
                      <div className="grid grid-cols-7 mb-1">
                        {dayLabels.map((l, i) => (
                          <span key={i} className="text-center text-[10px] font-semibold text-gray-500 py-1">{l}</span>
                        ))}
                      </div>
                      {/* Day cells */}
                      <div className="grid grid-cols-7 gap-y-0.5">
                        {cells.map((day, idx) => {
                          if (day === null) return <span key={`e-${idx}`} />;
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isPast = dateStr < todayStr;
                          const isFuture = dateStr > maxDateStr;
                          const isSelected = dateStr === selectedDate;
                          const isToday = dateStr === todayStr;
                          return (
                            <button
                              key={dateStr}
                              type="button"
                              disabled={isPast || isFuture}
                              onClick={() => { setSelectedDate(dateStr); if (selectedTime) setSelectedTime(''); }}
                              className={`mx-auto w-8 h-8 flex items-center justify-center rounded-full text-xs transition-all
                                ${isSelected ? 'font-bold text-white' : ''}
                                ${!isSelected && isToday ? 'font-bold' : ''}
                                ${isPast || isFuture ? 'text-gray-300 cursor-not-allowed' : !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}`}
                              style={isSelected ? { backgroundColor: p } : isToday && !isSelected ? { color: p } : undefined}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()}

                {/* Time slots */}
                {selectedDate && (
                  <div className="mb-4">
                    <p className="text-sm font-semibold text-gray-700 mb-2">{t('chooseTime')}</p>
                    {loadingFreeSlots ? (
                      <div className="flex justify-center py-4">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                      </div>
                    ) : freeSlotsError ? (
                      <p className="text-xs text-red-500">{t('freeSlotsError')}</p>
                    ) : freeSlots.length === 0 ? (
                      <p className="text-xs text-gray-500">{t('noFreeSlotsThisDay')}</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {freeSlots.map(slot => {
                          const isSelected = slot.start_time === selectedTime;
                          return (
                            <button
                              key={slot.start_time}
                              type="button"
                              onClick={() => setSelectedTime(slot.start_time)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${isSelected ? 'text-white border-transparent' : 'text-gray-700 border-gray-200 hover:border-opacity-60'}`}
                              style={isSelected ? { backgroundColor: p, borderColor: p } : { borderColor: `${p}40` }}
                            >
                              {formatTime(slot.start_time, locale)}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setStep('services')}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all"
                  >
                    {t('back')}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep('info')}
                    disabled={!selectedDate || !selectedTime}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                  >
                    {t('next')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 2: Info ── */}
            {step === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('yourInfo')}</p>

                <div className="space-y-3 mb-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t('firstName')} *</label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => setFirstName(e.target.value)}
                      placeholder={t('firstNamePlaceholder')}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:bg-white"
                      style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t('lastName')}</label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => setLastName(e.target.value)}
                      placeholder={t('lastNamePlaceholder')}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:bg-white"
                      style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                      maxLength={100}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t('phone')} *</label>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      country={phoneCountry}
                      onCountryChange={setPhoneCountry}
                      countries={['FR', 'BE', 'CH']}
                      className="px-4 py-2.5 text-sm border-transparent bg-gray-50 rounded-r-xl"
                    />
                  </div>
                </div>

                {/* Member benefit banner */}
                {memberBenefit && (
                  <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100 mb-4">
                    <div className="flex items-start gap-2.5">
                      <Crown className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                      <div className="text-[12px] text-indigo-800 leading-relaxed">
                        <p className="font-semibold">{t('memberDetected', { name: memberBenefit.first_name })}</p>
                        <ul className="mt-1 space-y-0.5">
                          {memberBenefit.discount_percent && (
                            <li>→ {t('memberDiscount', { percent: memberBenefit.discount_percent })}</li>
                          )}
                          {memberBenefit.skip_deposit && (
                            <li>→ {t('memberSkipDeposit')}</li>
                          )}
                          {memberBenefit.benefit_label && (
                            <li>→ {memberBenefit.benefit_label}</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Booking conditions */}
                {merchant.booking_message && (
                  <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 mb-4">
                    <p className="text-[11px] text-gray-500 leading-relaxed">{merchant.booking_message}</p>
                  </div>
                )}

                {/* Cancel / reschedule policy contextual message */}
                {merchant.allow_customer_cancel || merchant.allow_customer_reschedule ? (
                  <div className="text-[11px] text-gray-500 text-center mb-3 space-y-0.5">
                    {merchant.allow_customer_cancel && (
                      <p>{t('cancelPolicy', { days: merchant.cancel_deadline_days ?? 1 })}</p>
                    )}
                    {merchant.allow_customer_reschedule && (
                      <p>{t('reschedulePolicy', { days: merchant.reschedule_deadline_days ?? 1 })}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-500 text-center mb-3">{t('noModify')}</p>
                )}

                {error && (
                  <p className="text-xs text-red-500 font-medium mb-3">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep(isFreeMod ? 'datetime' : 'services'); setError(null); }}
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                  >
                    {t('back')}
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitting || !firstName.trim() || !phone.trim()}
                    className="flex-[2] py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        {t('confirmBooking')}
                        <Check className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* ── STEP 3: Confirmation ── */}
            {step === 'confirm' && bookingResult && (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                {/* Success icon */}
                <div className="flex justify-center mb-4">
                  <div
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                  >
                    {depositResult?.link ? (
                      <Hourglass className="w-8 h-8 text-white" />
                    ) : (
                      <CalendarDays className="w-8 h-8 text-white" />
                    )}
                  </div>
                </div>

                <h3 className="text-center text-lg font-bold text-gray-900 mb-1">
                  {depositResult?.link ? t('bookingPending') : t('bookingConfirmed')}
                </h3>
                <p className="text-center text-xs text-gray-500 mb-4">{merchant.shop_name}</p>
                {depositResult?.link ? (
                  <>
                    <p className="text-center text-[13px] text-gray-600 mb-2 px-2">
                      {t('depositPendingMessage')}
                    </p>
                    <p className="text-center text-[13px] text-gray-600 mb-2 px-2">
                      {merchant.subscription_status !== 'trial' ? t('smsAfterDeposit') : t('depositPendingHintTrial')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-center text-[13px] text-gray-600 mb-2 px-2">
                      {t('bookingConfirmedHint')}
                    </p>
                    <div className="mx-auto mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-semibold">
                      <Crown className="w-3.5 h-3.5" strokeWidth={2.5} />
                      <span>{t('loyaltyCardReady', { shop: merchant.shop_name })}</span>
                    </div>
                  </>
                )}
                <p className="text-center text-[11px] text-gray-500 mb-4 px-2">
                  {t('checkStatusHint')}
                </p>

                {/* Booking summary */}
                <div className="rounded-xl bg-gray-50 px-4 py-3 mb-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('date')}</span>
                    <span className="font-semibold text-gray-900 capitalize">{formattedDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('time')}</span>
                    <span className="font-semibold text-gray-900">{formatTime(bookingResult.time, locale)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('services')}</span>
                    <span className="font-semibold text-gray-900 text-right max-w-[60%] line-clamp-2">
                      {bookingResult.services.map(s => s.name).join(', ')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('duration')}</span>
                    <span className="font-semibold text-gray-900">{formatDuration(bookingResult.total_duration, locale)}</span>
                  </div>
                  <div className="border-t border-gray-200 pt-2 flex justify-between text-sm">
                    <span className="font-semibold text-gray-700">{t('totalPrice')}</span>
                    <span className="font-bold text-gray-900">{formatCurrency(bookingResult.total_price, country, locale)}</span>
                  </div>
                </div>

                <PolicyNotice merchant={merchant} t={t} className="mb-4" />

                {/* Deposit section */}
                {depositResult && depositResult.link && (() => {
                  const depositLinks = depositResult.links && depositResult.links.length > 0
                    ? depositResult.links
                    : [{ label: null, url: depositResult.link }];
                  return (
                  <div
                    className="rounded-2xl p-4 mb-4"
                    style={{ backgroundColor: `${p}0D`, border: `1px solid ${p}26` }}
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${p}1A` }}
                      >
                        <CreditCard className="w-5 h-5" style={{ color: p }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-500">
                          {depositResult.percent
                            ? t('depositRequired', { percent: depositResult.percent })
                            : t('depositFixedLabel')}
                        </p>
                        {depositResult.amount && (
                          <p className="text-xl font-black text-gray-900 leading-tight">
                            {formatCurrency(depositResult.amount, country, locale)}
                          </p>
                        )}
                      </div>
                    </div>
                    {depositResult.deadline_hours && (
                      <p className="text-[11px] text-gray-500 mb-2">
                        <Clock className="w-3 h-3 inline-block mr-1 -mt-0.5" />
                        {t('depositDeadlineInfo', { hours: depositResult.deadline_hours })}
                      </p>
                    )}
                    {depositLinks.length > 1 && (
                      <p className="text-[11px] font-semibold text-gray-500 mb-2">{t('depositChooseMethod')}</p>
                    )}
                    <div className="space-y-2">
                      {depositLinks.map((link, i) => {
                        const label = link.label || detectPaymentProvider(link.url) || t('payDeposit');
                        return (
                          <a
                            key={i}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-between gap-2 shadow-sm hover:shadow-md"
                            style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                          >
                            <span>{label}</span>
                            <ChevronRight className="w-4 h-4" />
                          </a>
                        );
                      })}
                    </div>
                  </div>
                  );
                })()}

                {depositResult?.link ? (
                  <>
                    <p className="text-center text-[11px] text-gray-500 mb-2 px-2">
                      {t('loyaltyCardAfterDeposit')}
                    </p>
                    <button
                      type="button"
                      onClick={() => router.push(`/customer/card/${merchant.id}`)}
                      className="w-full py-2 text-xs text-gray-500 hover:text-gray-600 transition-colors text-center"
                    >
                      {t('viewBookingsAndCard')}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => router.push(`/customer/card/${merchant.id}`)}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                  >
                    {t('viewBookingsAndCard')}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
