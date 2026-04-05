'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, ChevronRight, Loader2, Gift, CreditCard, CalendarDays } from 'lucide-react';
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
  'welcome_offer_enabled' | 'welcome_offer_description'
>;

interface BookingModalProps {
  merchant: MerchantBooking;
  services: Service[];
  serviceCategories: ServiceCategory[];
  slotDate: string;
  slotTime: string;
  planningSlots: PlanningSlotPublic[];
  promoOffer: PromoOffer | null;
  onClose: () => void;
}

type Step = 'services' | 'info' | 'confirm';

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

export default function BookingModal({
  merchant,
  services,
  serviceCategories,
  slotDate,
  slotTime,
  planningSlots,
  promoOffer,
  onClose,
}: BookingModalProps) {
  const t = useTranslations('booking');
  const locale = useLocale();
  const router = useRouter();
  const p = merchant.primary_color;
  const country = (merchant.country || 'FR') as MerchantCountry;

  const [step, setStep] = useState<Step>('services');
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
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

  // Compute totals
  const selectedServices = useMemo(
    () => services.filter(s => selectedServiceIds.has(s.id)),
    [services, selectedServiceIds]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0),
    [selectedServices]
  );

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0),
    [selectedServices]
  );

  // Check if consecutive slots are available
  const durationAvailable = useMemo(() => {
    if (selectedServiceIds.size === 0) return true;
    const startMins = timeToMinutes(slotTime);
    const endMins = startMins + totalDuration;
    const daySlots = planningSlots.filter(s => s.slot_date === slotDate);
    const needed = daySlots.filter(s => {
      const m = timeToMinutes(s.start_time);
      return m >= startMins && m < endMins;
    });
    // We need at least as many slots as the duration requires
    // Simple check: the last needed slot should exist
    return needed.length > 0;
  }, [selectedServiceIds, slotDate, slotTime, planningSlots, totalDuration]);

  const formattedDate = useMemo(() => {
    return new Date(slotDate + 'T12:00:00').toLocaleDateString(
      toBCP47(locale),
      { weekday: 'long', day: 'numeric', month: 'long' }
    );
  }, [slotDate, locale]);

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
          slot_date: slotDate,
          slot_time: slotTime,
          phone_number: phone.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim() || undefined,
          service_ids: Array.from(selectedServiceIds),
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
                : t('bookSlot')}
            </h3>
            <p className="text-xs text-gray-500 mt-0.5 capitalize">
              {formattedDate} {t('at')} {formatTime(slotTime, locale)}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-400" />
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
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">{category.name}</p>
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
                                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                                  selected ? 'border-transparent' : 'border-gray-300'
                                }`}
                                style={selected ? { backgroundColor: p } : undefined}
                              >
                                {selected && <Check className="w-3 h-3 text-white" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900">{svc.name}</p>
                                {svc.duration && (
                                  <p className="text-[11px] text-gray-400 flex items-center gap-1 mt-0.5">
                                    <Clock className="w-3 h-3" />
                                    {formatDuration(svc.duration, locale)}
                                  </p>
                                )}
                              </div>
                              <p className="text-sm font-bold text-gray-700 shrink-0">
                                {svc.price_from && <span className="text-[10px] font-normal text-gray-400">{t('from')} </span>}
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
                      <span className="text-gray-500">{t('totalDuration')}</span>
                      <span className="font-bold text-gray-900">{formatDuration(totalDuration, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{t('totalPrice')}</span>
                      <span className="font-bold text-gray-900">{formatCurrency(totalPrice, country, locale)}</span>
                    </div>
                    {merchant.deposit_link && (merchant.deposit_percent || merchant.deposit_amount) && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">
                          {merchant.deposit_amount
                            ? t('depositFixedLabel')
                            : t('depositLabel', { percent: merchant.deposit_percent || 0 })}
                        </span>
                        <span className="font-bold" style={{ color: p }}>
                          {formatCurrency(
                            merchant.deposit_amount
                              ? Number(merchant.deposit_amount)
                              : Math.round(totalPrice * (merchant.deposit_percent || 0) / 100),
                            country, locale
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {!durationAvailable && selectedServiceIds.size > 0 && (
                  <p className="text-xs text-red-500 font-medium mb-3">{t('durationTooLong')}</p>
                )}

                <button
                  type="button"
                  onClick={() => setStep('info')}
                  disabled={selectedServiceIds.size === 0 || !durationAvailable}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                >
                  {t('next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
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
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
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
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-transparent"
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
                    />
                  </div>
                </div>

                {/* Booking conditions */}
                {merchant.booking_message && (
                  <div className="px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100 mb-4">
                    <p className="text-[11px] text-gray-500 leading-relaxed">{merchant.booking_message}</p>
                  </div>
                )}

                {/* No modify message */}
                <p className="text-[11px] text-gray-400 text-center mb-3">{t('noModify')}</p>

                {error && (
                  <p className="text-xs text-red-500 font-medium mb-3">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => { setStep('services'); setError(null); }}
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
                    <CalendarDays className="w-8 h-8 text-white" />
                  </div>
                </div>

                <h3 className="text-center text-lg font-bold text-gray-900 mb-1">
                  {depositResult?.link ? t('bookingPending') : t('bookingConfirmed')}
                </h3>
                <p className="text-center text-xs text-gray-500 mb-4">{merchant.shop_name}</p>
                {depositResult?.link && (
                  <p className="text-center text-[13px] text-gray-600 mb-4 px-2">
                    {t('depositPendingMessage')}
                  </p>
                )}

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
                    <span className="font-semibold text-gray-900 text-right max-w-[60%]">
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
                    {depositLinks.length > 1 && (
                      <p className="text-[11px] font-semibold text-gray-500 mb-2">{t('depositChooseMethod')}</p>
                    )}
                    <div className="space-y-2">
                      {depositLinks.map((link, i) => (
                        <a
                          key={i}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-between gap-2 shadow-sm hover:shadow-md"
                          style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                        >
                          <span>{link.label || t('payDeposit')}</span>
                          <ChevronRight className="w-4 h-4" />
                        </a>
                      ))}
                    </div>
                  </div>
                  );
                })()}

                <button
                  type="button"
                  onClick={() => router.push(`/customer/card/${merchant.id}`)}
                  className="w-full py-3 rounded-xl font-bold text-sm text-white transition-all flex items-center justify-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                >
                  {t('viewCard')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
