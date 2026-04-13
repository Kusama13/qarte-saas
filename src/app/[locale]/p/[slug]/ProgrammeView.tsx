'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Gift, Users, Zap, Trophy, CalendarDays, MapPin, Navigation, X, ChevronLeft, ChevronRight, ChevronDown, Clock, Phone, ClipboardList, GraduationCap, CreditCard } from 'lucide-react';
import SocialLinks from '@/components/loyalty/SocialLinks';
import BrandedQRCode from '@/components/shared/BrandedQRCode';
import SimulatedCard from './SimulatedCard';
import BookingModal from './BookingModal';
import { useInView } from '@/hooks/useInView';
import { formatDoubleDays, formatTime, toBCP47, getTimezoneForCountry, formatCurrency, detectBookingPlatform } from '@/lib/utils';
import { trackCtaClick } from '@/lib/analytics';
import { useLocale, useTranslations } from 'next-intl';
import type { Merchant } from '@/types';

type Photo = { id: string; url: string; position: number };
type ServiceCategory = { id: string; name: string; position: number };
type Service = { id: string; name: string; price: number; position: number; category_id: string | null; duration: number | null; description: string | null; price_from: boolean };
type PromoOffer = { id: string; title: string; description: string; expires_at: string | null };

type PlanningSlotPublic = { slot_date: string; start_time: string };

type MerchantPublic = Pick<
  Merchant,
  | 'id'
  | 'slug'
  | 'shop_name'
  | 'shop_type'
  | 'shop_address'
  | 'bio'
  | 'logo_url'
  | 'primary_color'
  | 'secondary_color'
  | 'stamps_required'
  | 'reward_description'
  | 'tier2_enabled'
  | 'tier2_stamps_required'
  | 'tier2_reward_description'
  | 'birthday_gift_enabled'
  | 'birthday_gift_description'
  | 'referral_program_enabled'
  | 'referral_reward_referrer'
  | 'referral_reward_referred'
  | 'welcome_offer_enabled'
  | 'welcome_offer_description'
  | 'welcome_referral_code'
  | 'scan_code'
  | 'duo_offer_enabled'
  | 'duo_offer_description'
  | 'student_offer_enabled'
  | 'student_offer_description'
  | 'contest_enabled'
  | 'contest_prize'
  | 'double_days_enabled'
  | 'double_days_of_week'
  | 'booking_url'
  | 'instagram_url'
  | 'facebook_url'
  | 'tiktok_url'
  | 'snapchat_url'
  | 'whatsapp_url'
  | 'loyalty_mode'
  | 'cagnotte_percent'
  | 'cagnotte_tier2_percent'
  | 'opening_hours'
  | 'planning_enabled'
  | 'planning_message'
  | 'planning_message_expires'
  | 'booking_message'
  | 'auto_booking_enabled'
  | 'deposit_link'
  | 'deposit_percent'
  | 'deposit_amount'
  | 'phone'
  | 'country'
  | 'subscription_status'
  | 'booking_mode'
  | 'buffer_minutes'
  | 'allow_customer_cancel'
  | 'cancel_deadline_days'
  | 'allow_customer_reschedule'
  | 'reschedule_deadline_days'
>;

export default function ProgrammeView({ merchant, photos = [], services = [], serviceCategories = [], planningSlots = [], bookedSlots = [], isDemo = false, demoOffer }: { merchant: MerchantPublic; photos?: Photo[]; services?: Service[]; serviceCategories?: ServiceCategory[]; planningSlots?: PlanningSlotPublic[]; bookedSlots?: PlanningSlotPublic[]; isDemo?: boolean; demoOffer?: PromoOffer | null }) {
  const t = useTranslations('programmeView');
  const locale = useLocale();

  // Read cookie client-side to avoid cookies() in server component (breaks ISR)
  const [hasPhoneCookie, setHasPhoneCookie] = useState(false);
  useEffect(() => {
    setHasPhoneCookie(document.cookie.includes('qarte_cust='));
  }, []);
  const p = merchant.primary_color;
  const s = merchant.secondary_color || merchant.primary_color;
  const isCagnotte = merchant.loyalty_mode === 'cagnotte';
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [servicesExpanded, setServicesExpanded] = useState(false);
  const [planningExpanded, setPlanningExpanded] = useState(false);
  const [promoOffer, setPromoOffer] = useState<PromoOffer | null>(null);
  // Online booking: mode créneaux needs pre-generated slots, mode libre needs at least one open day
  const isFreeMod = merchant.booking_mode === 'free';
  const canBookOnline = merchant.auto_booking_enabled && (
    isFreeMod
      ? Object.values(merchant.opening_hours ?? {}).some(h => h !== null)
      : planningSlots.length > 0
  );
  const [bookingSlot, setBookingSlot] = useState<{ date: string | null; time: string | null } | null>(null);

  // Opening hours
  const DAY_LABELS_SHORT = t('dayLabelsShort').split(',');
  const hours = merchant.opening_hours;
  const hasHours = hours && Object.values(hours).some(Boolean);
  // Use merchant's timezone for "today" highlight (opening hours are in merchant's local time)
  const merchantTz = getTimezoneForCountry(merchant.country);
  const merchantLocalDate = new Date(new Date().toLocaleString('en-US', { timeZone: merchantTz }));
  const todayIndex = merchantLocalDate.getDay(); // 0=dim, 1=lun...
  const todayKey = todayIndex === 0 ? '7' : String(todayIndex); // 1-7, 1=lundi

  // Fetch active promo offer (or use demo data)
  useEffect(() => {
    if (isDemo) {
      if (demoOffer) setPromoOffer(demoOffer);
      return;
    }
    fetch(`/api/merchant-offers?merchantId=${merchant.id}&public=true`)
      .then(r => r.json())
      .then(data => {
        if (data.offers?.length > 0) setPromoOffer(data.offers[0]);
      })
      .catch(() => {});
  }, [merchant.id, isDemo, demoOffer]);
  const glassCard = 'rounded-2xl overflow-hidden bg-white/70 backdrop-blur-sm border border-white/60 shadow-lg shadow-gray-200/40';

  // Keyboard navigation for lightbox
  const handleLightboxKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') setLightboxIndex(null);
    if (e.key === 'ArrowLeft') setLightboxIndex(prev => prev === null ? null : (prev - 1 + photos.length) % photos.length);
    if (e.key === 'ArrowRight') setLightboxIndex(prev => prev === null ? null : (prev + 1) % photos.length);
  }, [photos.length]);

  useEffect(() => {
    if (lightboxIndex !== null) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleLightboxKey);
      return () => {
        document.body.style.overflow = '';
        document.removeEventListener('keydown', handleLightboxKey);
      };
    }
  }, [lightboxIndex, handleLightboxKey]);

  const reward = merchant.reward_description || '';

  const hasAdvantages =
    (merchant.birthday_gift_enabled && !!merchant.birthday_gift_description) ||
    (merchant.referral_program_enabled && !!(merchant.referral_reward_referrer || merchant.referral_reward_referred)) ||
    (merchant.duo_offer_enabled && !!merchant.duo_offer_description) ||
    merchant.double_days_enabled ||
    (merchant.student_offer_enabled && !!merchant.student_offer_description) ||
    (merchant.contest_enabled && !!merchant.contest_prize);

  const safeBookingUrl = merchant.booking_url && /^https?:\/\//i.test(merchant.booking_url) ? merchant.booking_url : null;
  // Hide external booking CTA when Qarte online booking is active
  const hasBooking = !!safeBookingUrl && !merchant.auto_booking_enabled;
  const bookingPlatform = hasBooking ? detectBookingPlatform(safeBookingUrl) : null;
  const noOp = (e: React.MouseEvent) => { e.preventDefault(); };

  // Planning: group slots by month then by date
  const MONTH_NAMES = t('monthNames').split(',');
  const DAY_NAMES_FULL = t('dayNamesFull').split(',');
  const todayLocal = useMemo(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }, []);
  const nowTime = useMemo(() => { const d = new Date(); return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }, []);
  const planningByMonth = useMemo(() => {
    if (!merchant.planning_enabled || planningSlots.length === 0) return [];
    const grouped: { month: string; days: { label: string; dateStr: string; times: { raw: string; display: string }[] }[] }[] = [];
    let currentMonth = '';
    let currentDate = '';
    for (const slot of planningSlots) {
      // Skip past slots for today
      if (slot.slot_date === todayLocal && slot.start_time <= nowTime) continue;

      const d = new Date(slot.slot_date + 'T00:00:00');
      const monthKey = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
      const dayLabel = `${DAY_NAMES_FULL[d.getDay()]} ${d.getDate()}`;
      const timeStr = formatTime(slot.start_time, locale);

      if (monthKey !== currentMonth) {
        grouped.push({ month: monthKey, days: [] });
        currentMonth = monthKey;
        currentDate = '';
      }
      const monthGroup = grouped[grouped.length - 1];
      if (slot.slot_date !== currentDate) {
        monthGroup.days.push({ label: dayLabel, dateStr: slot.slot_date, times: [] });
        currentDate = slot.slot_date;
      }
      monthGroup.days[monthGroup.days.length - 1].times.push({ raw: slot.start_time, display: timeStr });
    }
    return grouped;
  }, [planningSlots, merchant.planning_enabled, todayLocal, nowTime]);
  const hasPlanning = merchant.planning_enabled && (isFreeMod ? canBookOnline : planningByMonth.length > 0);
  const messageExpired = merchant.planning_message_expires && merchant.planning_message_expires < todayLocal;
  const hasPublicMessage = !!merchant.planning_message && !messageExpired;
  const hasBookingMessage = !!merchant.booking_message;
  const showPlanningSection = hasPlanning || hasPublicMessage || hasBookingMessage;

  // Services: pre-compute outside JSX
  const hasCategories = serviceCategories.length > 0;
  const categoryIds = useMemo(() => new Set(serviceCategories.map(c => c.id)), [serviceCategories]);
  const uncategorized = useMemo(() => services.filter(svc => !svc.category_id || !categoryIds.has(svc.category_id)), [services, categoryIds]);

  const fmtDuration = (min: number) => {
    if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60);
    const m = min % 60;
    return m > 0 ? `${h}h${String(m).padStart(2, '0')}` : `${h}h`;
  };

  // Scroll-triggered refs
  const { ref: topCtaRef, isInView: topCtaVisible } = useInView({ once: false });
  const { ref: tier2Ref, isInView: tier2InView } = useInView();
  const { ref: advantagesRef, isInView: advantagesInView } = useInView();
  const { ref: socialRef, isInView: socialInView } = useInView();

  return (
    <div className="min-h-screen bg-[#f7f6fb] relative">

      {/* ── AMBIENT BACKGROUND BLOBS ── */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="animate-blob absolute -top-20 -left-20 w-72 h-72 rounded-full blur-3xl opacity-[0.12]"
          style={{ backgroundColor: p }}
        />
        <div
          className="animate-blob absolute -bottom-20 -right-20 w-72 h-72 rounded-full blur-3xl opacity-[0.08]"
          style={{ backgroundColor: s, animationDelay: '3s' }}
        />
      </div>

      {/* ── HERO ── */}
      <section className="lg:mx-auto lg:max-w-lg relative">
        <div className="flex flex-col items-center pt-12 pb-6 px-6 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.82, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            className="w-[100px] h-[100px] rounded-[1.75rem] bg-white flex items-center justify-center overflow-hidden mb-4"
            style={{ boxShadow: `0 0 0 3px ${p}25, 0 4px 24px ${p}20` }}
          >
            {merchant.logo_url ? (
              <img src={merchant.logo_url} alt={merchant.shop_name} className="w-full h-full object-cover rounded-[1.4rem]" />
            ) : (
              <div
                className="w-full h-full rounded-[1.4rem] flex items-center justify-center text-white text-4xl font-black"
                style={{ background: `linear-gradient(135deg, ${p}cc, ${s})` }}
              >
                {merchant.shop_name[0]}
              </div>
            )}
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="text-[28px] font-black tracking-tight leading-tight mb-2"
            style={{ background: `linear-gradient(135deg, ${p}, ${s})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
          >
            {merchant.shop_name}
          </motion.h1>

          {merchant.shop_address && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12, duration: 0.35 }}
              className="flex items-center gap-1 text-[12px] text-gray-400 font-medium mb-2"
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{merchant.shop_address}</span>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(merchant.shop_address)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold transition-colors"
                style={{ backgroundColor: `${p}15`, color: p }}
              >
                <Navigation className="w-2.5 h-2.5" />
                {t('goThere')}
              </a>
            </motion.div>
          )}


        </div>
      </section>

      {/* ── CONTENU ── */}
      <div className="mx-auto lg:max-w-lg px-4 pb-20 space-y-3 relative">

        {/* ── RETURNING VISITOR SHORTCUT ── */}
        {hasPhoneCookie && !isDemo && (
          <motion.a
            href={`/customer/card/${merchant.id}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.4 }}
            className="group relative block rounded-2xl overflow-hidden active:scale-[0.99] transition-transform"
            style={{
              background: `linear-gradient(135deg, ${p}, ${s})`,
              boxShadow: `0 8px 24px -6px ${p}55, inset 0 0 0 1px rgba(255,255,255,0.12)`,
            }}
          >
            {/* Shimmer sweep */}
            <motion.div
              animate={{ x: ['-150%', '200%'] }}
              transition={{ duration: 2.4, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
            />
            {/* Radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: 'radial-gradient(circle at 85% 50%, rgba(255,255,255,0.18), transparent 60%)' }}
            />
            {/* Watermark icon */}
            <CreditCard className="absolute -right-3 -bottom-3 w-24 h-24 text-white/10 pointer-events-none" strokeWidth={1.5} />

            <div className="relative flex items-center gap-3.5 px-4 py-3.5">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white/20 backdrop-blur-sm border border-white/30">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-[0.14em] mb-0.5">
                  {t('returningShortcutEyebrow')}
                </p>
                <p className="text-[15px] font-black text-white leading-tight tracking-tight">
                  {t('returningShortcutTitle')}
                </p>
                <p className="text-[11px] text-white/75 mt-0.5 font-medium truncate">
                  {t('returningShortcutSubtitle')}
                </p>
              </div>
              <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0 border border-white/30 group-hover:bg-white/30 transition-colors">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.a>
        )}

        {/* ── MINI BIO ── */}
        {merchant.bio && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.4 }}
            className={`${glassCard} px-5 py-4 text-center relative overflow-hidden`}
            style={{ borderColor: `${p}15` }}
          >
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ background: `linear-gradient(135deg, ${p}, ${s})` }} />
            <p className="relative text-[13px] text-gray-600 leading-relaxed font-medium italic">
              &ldquo;{merchant.bio}&rdquo;
            </p>
          </motion.div>
        )}

        {/* CTA principal */}
        {hasBooking && (
          <motion.div
            ref={topCtaRef as unknown as React.Ref<HTMLDivElement>}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4 }}
            className="flex flex-col items-center"
          >
            <a
              href={isDemo ? '#' : safeBookingUrl!}
              target={isDemo ? undefined : '_blank'}
              rel={isDemo ? undefined : 'noopener noreferrer'}
              onClick={isDemo ? noOp : undefined}
              className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl text-white font-bold text-[15px] transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                background: `linear-gradient(135deg, ${p}, ${s})`,
                boxShadow: `0 4px 20px ${p}40`,
              }}
            >
              <CalendarDays className="w-5 h-5" />
              {t('bookAppointment')}
            </a>
            {bookingPlatform && (
              <span className="mt-1.5 text-[11px] text-gray-400 font-medium">via {bookingPlatform}</span>
            )}
          </motion.div>
        )}

        {/* ── HORAIRES ── */}
        {hasHours && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.28, duration: 0.4 }}
            className={`${glassCard} p-4`}
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-2.5">
              {t('hours')}
            </p>
            <div className="grid grid-cols-7 gap-0.5">
              {DAY_LABELS_SHORT.map((label, i) => {
                const dayKey = String(i + 1);
                const slot = hours![dayKey];
                const isToday = dayKey === todayKey;
                return (
                  <div
                    key={dayKey}
                    className={`text-center rounded-lg py-1.5 px-0.5 overflow-hidden transition-colors ${
                      slot ? 'bg-gray-50' : 'bg-gray-50/50 opacity-50'
                    }`}
                    style={isToday ? { boxShadow: `0 0 0 1px ${p}`, backgroundColor: `${p}08` } : undefined}
                  >
                    <p className={`text-[10px] font-bold mb-0.5 ${isToday ? '' : 'text-gray-500'}`} style={isToday ? { color: p } : undefined}>
                      {label}
                    </p>
                    {slot ? (
                      slot.break_start && slot.break_end ? (
                        <>
                          <p className="text-[8px] text-gray-600 font-medium leading-tight">{slot.open} {slot.break_start}</p>
                          <p className="text-[8px] text-gray-400 font-medium leading-tight">–</p>
                          <p className="text-[8px] text-gray-600 font-medium leading-tight">{slot.break_end} {slot.close}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-[9px] text-gray-600 font-medium">{slot.open}</p>
                          <p className="text-[9px] text-gray-600 font-medium">{slot.close}</p>
                        </>
                      )
                    ) : (
                      <p className="text-[9px] text-gray-400 font-medium">{t('closed')}</p>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── MESSAGE PUBLIC (indépendant du planning) ── */}
        {hasPublicMessage && !hasPlanning && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`${glassCard} p-4`}
          >
            <div
              className="rounded-xl px-4 py-3 text-center"
              style={{ background: `linear-gradient(135deg, ${p}12, ${s}08)`, border: `1px solid ${p}20` }}
            >
              <p className="text-[13px] font-semibold text-gray-700">{merchant.planning_message}</p>
            </div>
            {hasBookingMessage && (
              <div className="rounded-lg px-3 py-2 mt-3 bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('conditions')}</p>
                <p className="text-[12px] text-gray-600 whitespace-pre-line">{merchant.booking_message}</p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── PLANNING DISPONIBILITÉS ── */}
        {hasPlanning && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className={`${glassCard} p-4`}
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-1">
              <CalendarDays className="w-3 h-3 inline-block mr-1 -mt-0.5" />
              {t('availability')}
            </p>
            {!merchant.auto_booking_enabled && (
              <p className="text-[11px] text-gray-400 mb-3">{t('planningManualHint')}</p>
            )}
            {merchant.auto_booking_enabled && !isFreeMod && (
              <p className="text-[11px] text-emerald-500 font-medium mb-3">{t('planningAutoHint')}</p>
            )}

            {/* Message libre */}
            {hasPublicMessage && (
              <div
                className="rounded-xl px-4 py-3 mb-3 text-center"
                style={{ background: `linear-gradient(135deg, ${p}12, ${s}08)`, border: `1px solid ${p}20` }}
              >
                <p className="text-[13px] font-semibold text-gray-700">{merchant.planning_message}</p>
              </div>
            )}

            {/* Conditions de réservation */}
            {hasBookingMessage && (
              <div className="rounded-lg px-3 py-2 mb-3 bg-gray-50 border border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-1">{t('conditions')}</p>
                <p className="text-[12px] text-gray-600 whitespace-pre-line">{merchant.booking_message}</p>
              </div>
            )}

            {/* Mode libre: single "Réserver" CTA */}
            {isFreeMod && canBookOnline && (
              <button
                type="button"
                onClick={isDemo ? noOp : () => setBookingSlot({ date: null, time: null })}
                className="w-full py-3 rounded-xl text-sm font-bold text-white flex items-center justify-center gap-2 mb-3"
                style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
              >
                <CalendarDays className="w-4 h-4" />
                {t('bookAppointment')}
              </button>
            )}

            {/* Slots by month — preview 4 days, expandable (mode créneaux only) */}
            {!isFreeMod && (() => {
              const PREVIEW_DAYS = 4;
              const allDays = planningByMonth.flatMap(mg => mg.days);
              const totalDays = allDays.length;
              const hasMoreDays = totalDays > PREVIEW_DAYS;
              const visibleDays = planningExpanded ? allDays : allDays.slice(0, PREVIEW_DAYS);

              // Regroup visible days by month
              const visibleByMonth: typeof planningByMonth = [];
              for (const day of visibleDays) {
                const d = new Date(day.dateStr + 'T00:00:00');
                const monthKey = `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`;
                const last = visibleByMonth[visibleByMonth.length - 1];
                if (last && last.month === monthKey) {
                  last.days.push(day);
                } else {
                  visibleByMonth.push({ month: monthKey, days: [day] });
                }
              }

              return (
                <>
                  {visibleByMonth.map(monthGroup => (
                    <div key={monthGroup.month} className="mb-3 last:mb-0">
                      <p className="text-[11px] font-bold uppercase tracking-wider mb-2 text-center" style={{ color: p }}>
                        {monthGroup.month}
                      </p>
                      <div className="space-y-2">
                        {monthGroup.days.map(day => {
                          const isToday = day.dateStr === todayLocal;
                          return (
                            <div
                              key={day.dateStr}
                              className={`flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 py-2 px-3 rounded-xl ${isToday ? 'bg-gray-50' : ''}`}
                              style={isToday ? { boxShadow: `inset 0 0 0 1px ${p}25` } : undefined}
                            >
                              <p className={`text-[12px] font-bold shrink-0 sm:w-28 ${isToday ? '' : 'text-gray-600'}`} style={isToday ? { color: p } : undefined}>
                                {day.label}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {day.times.map(({ raw, display }) => {
                                  if (merchant.auto_booking_enabled && !isDemo) {
                                    return (
                                      <button
                                        key={raw}
                                        type="button"
                                        onClick={() => setBookingSlot({ date: day.dateStr, time: raw })}
                                        className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                        style={{ backgroundColor: `${p}12`, color: p }}
                                      >
                                        {display}
                                      </button>
                                    );
                                  }
                                  return (
                                    <span
                                      key={raw}
                                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                                      style={{ backgroundColor: `${p}12`, color: p }}
                                    >
                                      {display}
                                    </span>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {hasMoreDays && !planningExpanded && (
                    <button
                      type="button"
                      onClick={() => setPlanningExpanded(true)}
                      className="w-full mt-2 py-2.5 rounded-xl text-[12px] font-bold transition-colors cursor-pointer"
                      style={{ color: p, backgroundColor: `${p}08` }}
                    >
                      {t('viewMoreSlots')}
                    </button>
                  )}

                  {planningExpanded && (
                    <button
                      type="button"
                      onClick={() => setPlanningExpanded(false)}
                      className="w-full mt-2 py-2.5 rounded-xl text-[12px] font-bold transition-colors cursor-pointer"
                      style={{ color: p, backgroundColor: `${p}08` }}
                    >
                      {t('collapseSlots')}
                    </button>
                  )}
                </>
              );
            })()}
          </motion.div>
        )}

        {/* ── PRESTATIONS ── */}
        {services.length > 0 && (() => {
          const PREVIEW_COUNT = 3;
          // Flatten services with category headers for preview slicing
          const flatItems: { type: 'cat'; name: string; id: string }[] | { type: 'svc'; svc: typeof services[0]; isLast: boolean }[] = [];
          const allFlat: Array<{ type: 'cat'; name: string; id: string } | { type: 'svc'; svc: typeof services[0]; isLast: boolean }> = [];
          if (hasCategories) {
            for (const cat of serviceCategories) {
              const catSvcs = services.filter(sv => sv.category_id === cat.id);
              if (catSvcs.length === 0) continue;
              allFlat.push({ type: 'cat', name: cat.name, id: cat.id });
              catSvcs.forEach((sv, i) => allFlat.push({ type: 'svc', svc: sv, isLast: i === catSvcs.length - 1 }));
            }
            const uncatSvcs = services.filter(sv => !serviceCategories.some(c => c.id === sv.category_id));
            uncatSvcs.forEach((sv, i) => allFlat.push({ type: 'svc', svc: sv, isLast: i === uncatSvcs.length - 1 }));
          } else {
            services.forEach((sv, i) => allFlat.push({ type: 'svc', svc: sv, isLast: i === services.length - 1 }));
          }

          // Count only service items for preview
          let svcCount = 0;
          let previewEndIdx = allFlat.length;
          for (let i = 0; i < allFlat.length; i++) {
            if (allFlat[i].type === 'svc') svcCount++;
            if (svcCount === PREVIEW_COUNT) { previewEndIdx = i + 1; break; }
          }
          const totalSvcCount = allFlat.filter(it => it.type === 'svc').length;
          const hasMore = totalSvcCount > PREVIEW_COUNT;
          const visibleItems = servicesExpanded ? allFlat : allFlat.slice(0, previewEndIdx);

          const renderItem = (item: typeof allFlat[number], idx: number) => {
            if (item.type === 'cat') {
              return (
                <p key={`cat-${item.id}`} className="text-[11px] font-bold uppercase tracking-wider mb-1 pt-2" style={{ color: p }}>
                  {item.name}
                </p>
              );
            }
            const { svc, isLast } = item;
            return (
              <div
                key={svc.id}
                className={`py-3 ${!isLast && !(idx === visibleItems.length - 1 && !servicesExpanded) ? 'border-b border-gray-100/80' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-medium text-gray-700">{svc.name}</p>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {svc.duration && (
                      <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {fmtDuration(svc.duration)}
                      </span>
                    )}
                    <p className="text-[13px] font-bold text-gray-900">
                      {svc.price_from && <span className="text-[11px] font-normal text-gray-400">{t('priceFrom')}</span>}
                      {formatCurrency(Number(svc.price), merchant.country, locale)}
                    </p>
                  </div>
                </div>
                {svc.description && (
                  <p className="text-[11px] text-gray-400 mt-0.5 leading-snug">{svc.description}</p>
                )}
              </div>
            );
          };

          return (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15, ease: 'easeOut' }}
              className="rounded-2xl overflow-hidden border shadow-lg shadow-gray-200/40"
              style={{ borderColor: `${p}20`, background: `linear-gradient(135deg, ${p}06, ${s}04)` }}
            >
              <div className="px-5 pt-5 pb-2 flex items-center gap-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center"
                  style={{ background: `linear-gradient(135deg, ${p}, ${s})`, boxShadow: `0 4px 12px ${p}30` }}
                >
                  <ClipboardList className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[15px] font-bold text-gray-900">{t('myServices')}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {totalSvcCount > 1 ? t('servicePlural', { count: totalSvcCount }) : t('serviceSingular', { count: totalSvcCount })}
                  </p>
                </div>
              </div>

              <div className="px-5 pb-4">
                {visibleItems.map((item, idx) => renderItem(item, idx))}

                {hasMore && !servicesExpanded && (
                  <button
                    type="button"
                    onClick={() => setServicesExpanded(true)}
                    className="w-full mt-2 py-2.5 rounded-xl text-[12px] font-bold transition-colors cursor-pointer"
                    style={{ color: p, backgroundColor: `${p}08` }}
                  >
                    {t('viewMoreServices', { count: totalSvcCount - PREVIEW_COUNT })}
                  </button>
                )}

                {servicesExpanded && (
                  <button
                    type="button"
                    onClick={() => setServicesExpanded(false)}
                    className="w-full mt-2 py-2.5 rounded-xl text-[12px] font-bold transition-colors cursor-pointer"
                    style={{ color: p, backgroundColor: `${p}08` }}
                  >
                    {t('collapseServices')}
                  </button>
                )}
              </div>
            </motion.div>
          );
        })()}

        {/* ── OFFRE NOUVEAUX CLIENTS ── */}
        {merchant.welcome_offer_enabled && merchant.welcome_offer_description && (canBookOnline || (merchant.welcome_referral_code && merchant.scan_code)) && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.28, ease: 'easeOut' }}
            className="rounded-2xl overflow-hidden border"
            style={{ borderColor: `${p}30`, background: `linear-gradient(135deg, ${p}10, ${p}05)` }}
          >
            <div className="px-4 py-4 flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `${p}18` }}
              >
                <Gift className="w-5 h-5" style={{ color: p }} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em]" style={{ color: p }}>
                  {t('welcomeOffer')}
                </p>
                <p className="text-[14px] font-bold text-gray-800 leading-snug mt-0.5">
                  {merchant.welcome_offer_description}
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
                  {canBookOnline ? t('signUpToEnjoyBooking') : t('signUpToEnjoy')}
                </p>
              </div>
              {!canBookOnline && merchant.scan_code && (
                <a
                  href={isDemo ? '#' : `/scan/${merchant.scan_code}?welcome=${merchant.welcome_referral_code}`}
                  onClick={isDemo ? noOp : undefined}
                  className="shrink-0 px-3 py-1.5 rounded-lg text-[12px] font-bold text-white"
                  style={{ background: p }}
                >
                  {t('enjoyNow')}
                </a>
              )}
            </div>
          </motion.div>
        )}

        {/* ── OFFRE PROMO (tout le monde) — style amber distinct ── */}
        {promoOffer && (canBookOnline || merchant.scan_code) && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.32, ease: 'easeOut' }}
            className="block rounded-2xl overflow-hidden border-2 shadow-lg"
            style={{ borderColor: '#f59e0b40', boxShadow: '0 4px 24px #f59e0b20' }}
          >
            <div
              className="px-5 py-5 flex items-center gap-4"
              style={{ background: 'linear-gradient(135deg, #f59e0b12, #f59e0b06)' }}
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-amber-100">
                <Gift className="w-6 h-6 text-amber-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] mb-0.5 text-amber-600">
                  {promoOffer.title}
                </p>
                <p className="text-[15px] font-bold text-gray-800 leading-tight">
                  {promoOffer.description}
                </p>
                <p className="text-[12px] text-gray-500 mt-1">
                  {t('promoOpenToAll')}
                </p>
              </div>
              {!canBookOnline && merchant.scan_code && (
                <a
                  href={`/scan/${merchant.scan_code}?offer=${promoOffer.id}`}
                  className="shrink-0 px-4 py-2 rounded-xl text-[13px] font-bold text-white bg-amber-500"
                >
                  {t('enjoyNow')}
                </a>
              )}
            </div>
            <div className="px-5 pb-4" style={{ background: 'linear-gradient(135deg, #f59e0b06, transparent)' }}>
              <p className="text-[12px] text-gray-500 leading-relaxed">
                {canBookOnline ? t('promoInstructionsBooking') : t('promoInstructions')}
                {promoOffer.expires_at && (
                  <span className="font-semibold text-amber-700"> {t('validUntil', { date: new Date(promoOffer.expires_at).toLocaleDateString(toBCP47(locale)) })}</span>
                )}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── JEU CONCOURS DU MOIS ── */}
        {merchant.contest_enabled && merchant.contest_prize && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.4, ease: 'easeOut' }}
            className="rounded-2xl overflow-hidden border border-amber-200/60"
            style={{ background: `linear-gradient(135deg, ${p}08, #fef3c720, ${p}06)` }}
          >
            <div className="px-4 py-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-amber-600">{t('contestBadge')}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{t('contestDesc')}</p>
                <p className="text-[14px] font-bold mt-0.5" style={{ color: p }}>{merchant.contest_prize}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Label carte simulée */}
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.35 }}
          className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 px-1 pt-2"
        >
          {t('loyaltyCard')}
        </motion.p>

        {/* SimulatedCard — LE centerpiece */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <SimulatedCard
            stampsRequired={merchant.stamps_required}
            rewardDescription={
              isCagnotte
                ? t('cagnotteReward', { percent: Number(merchant.cagnotte_percent || 0) })
                : (merchant.reward_description || t('defaultReward'))
            }
            primaryColor={p}
            secondaryColor={s}
          />
        </motion.div>

        {/* Note carte fidélité */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="text-center text-[11px] text-gray-400 font-medium -mt-1"
        >
          {t('loyaltyNote')}
        </motion.p>

        {/* Tier 2 */}
        {merchant.tier2_enabled && (merchant.tier2_reward_description || (isCagnotte && merchant.cagnotte_tier2_percent)) && (
          <motion.div
            ref={tier2Ref}
            initial={{ opacity: 0, y: 18 }}
            animate={tier2InView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl overflow-hidden"
            style={{
              background: `linear-gradient(135deg, #100c22, ${p}85)`,
              boxShadow: `0 4px 28px rgba(0,0,0,0.18), inset 0 0 0 1px ${p}30`,
            }}
          >
            <motion.div
              animate={{ x: ['-150%', '200%'] }}
              transition={{ duration: 2.2, repeat: Infinity, repeatDelay: 5, ease: 'easeInOut' }}
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none"
            />
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: `radial-gradient(circle at 75% 55%, ${p}30, transparent 65%)` }}
            />

            <span
              className="absolute right-3 -bottom-2 text-[96px] font-black leading-none pointer-events-none select-none"
              style={{ color: 'rgba(255,255,255,0.06)' }}
            >
              {merchant.tier2_stamps_required}
            </span>

            <div className="relative px-6 pt-6 pb-7">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="w-3.5 h-3.5 text-white/40" />
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  {t('afterVisits', { count: Number(merchant.tier2_stamps_required || 0) })}
                </p>
              </div>
              <p className="text-[22px] font-black text-white leading-snug max-w-[72%] tracking-tight">
                {isCagnotte
                  ? t('cagnotteReward', { percent: Number(merchant.cagnotte_tier2_percent || 0) })
                  : merchant.tier2_reward_description}
              </p>
              <p className="text-[12px] text-white/50 mt-2 font-medium">
                {t('forMostLoyal')}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── AVANTAGES EXCLUSIFS ── */}
        {hasAdvantages && (
          <motion.div
            ref={advantagesRef}
            initial={{ opacity: 0, y: 16 }}
            animate={advantagesInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className={glassCard}
          >
            <div className="px-5 pt-4 pb-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em]">
                {t('exclusiveAdvantages')}
              </p>
            </div>

            <div className="divide-y divide-gray-100/80">
              {merchant.birthday_gift_enabled && merchant.birthday_gift_description && (
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p}18` }}>
                    <Gift className="w-4 h-4" style={{ color: p }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">{t('birthdayGift')}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                      {t('birthdayGiftDesc', { gift: merchant.birthday_gift_description.charAt(0).toLowerCase() + merchant.birthday_gift_description.slice(1) })}
                    </p>
                  </div>
                </div>
              )}

              {merchant.referral_program_enabled && (merchant.referral_reward_referrer || merchant.referral_reward_referred) && (
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: `${p}18` }}>
                    <Users className="w-4 h-4" style={{ color: p }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">{t('shareBeRewarded')}</p>
                    {merchant.referral_reward_referrer && (
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                        {t('referrerReward', { reward: merchant.referral_reward_referrer })}
                      </p>
                    )}
                    {merchant.referral_reward_referred && (
                      <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                        {t('referredReward', { reward: merchant.referral_reward_referred })}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {merchant.duo_offer_enabled && merchant.duo_offer_description && (
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-violet-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">{t('duoOffer')}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">{t('duoOfferDesc')}</p>
                    <p className="text-[12px] font-semibold mt-1 leading-snug" style={{ color: merchant.primary_color }}>{merchant.duo_offer_description}</p>
                  </div>
                </div>
              )}

              {merchant.student_offer_enabled && merchant.student_offer_description && (
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">{t('studentOfferTitle')}</p>
                    <p className="text-[12px] font-semibold text-blue-600 mt-0.5 leading-snug">{merchant.student_offer_description}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{t('studentOfferHint')}</p>
                  </div>
                </div>
              )}


              {merchant.double_days_enabled && (
                <div className="px-5 py-4 flex items-center gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                    <Zap className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[13px] font-bold text-gray-800 leading-tight">{t('bonusDays')}</p>
                    <p className="text-[12px] text-gray-500 mt-0.5 leading-snug">
                      {t('bonusDaysDesc', { days: formatDoubleDays(merchant.double_days_of_week, locale) })}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ── GALERIE PHOTOS ── */}
        {photos.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.4 }}
            className={`${glassCard} p-4`}
          >
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.18em] mb-3">
              {t('ourWork')}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {photos.map((photo, idx) => (
                <button
                  key={photo.id}
                  type="button"
                  onClick={() => setLightboxIndex(idx)}
                  className="aspect-square rounded-xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-offset-2"
                  style={{ '--tw-ring-color': p } as React.CSSProperties}
                >
                  <img
                    src={photo.url}
                    alt={t('realisationAlt', { name: merchant.shop_name, position: photo.position })}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── RÉSEAUX SOCIAUX ── */}
        <motion.div
          ref={socialRef}
          initial={{ opacity: 0, y: 14 }}
          animate={socialInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 14 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="pt-1"
        >
          <SocialLinks merchant={merchant as Merchant} />
        </motion.div>

        {/* ── FOOTER LINKTREE-STYLE ── */}
        <motion.a
          href="https://getqarte.com/auth/merchant/signup?ref=vitrine-en-ligne"
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => { trackCtaClick('vitrine_footer_cta', 'vitrine_page'); }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="block rounded-2xl bg-white px-5 py-4 text-center group transition-all hover:-translate-y-0.5"
          style={{
            boxShadow: '0 1px 2px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.05), 0 12px 32px rgba(0,0,0,0.04)',
          }}
        >
          <p className="text-[13px] text-gray-500 group-hover:text-gray-600 transition-colors">
            {t('joinOnQarte')}{' '}
            <span className="font-bold text-[#4b0082] group-hover:text-[#654EDA] transition-colors">Qarte</span>
          </p>
        </motion.a>


      </div>

      {/* ── STICKY CTA BAR ── */}
      <AnimatePresence>
        {hasBooking && !topCtaVisible && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 backdrop-blur-xl border-t border-gray-100 shadow-[0_-4px_20px_rgba(0,0,0,0.06)]"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            <div className="flex items-center gap-3 px-4 py-3 max-w-lg mx-auto">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{merchant.shop_name}</p>
                {bookingPlatform && (
                  <p className="text-[11px] text-gray-400 font-medium">via {bookingPlatform}</p>
                )}
              </div>
              <a
                href={isDemo ? '/auth/merchant/signup' : safeBookingUrl!}
                target={isDemo ? undefined : '_blank'}
                rel={isDemo ? undefined : 'noopener noreferrer'}
                onClick={isDemo ? () => { trackCtaClick('demo_vitrine_sticky_cta', 'vitrine_page'); } : undefined}
                className={`shrink-0 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 ${isDemo ? 'bg-gradient-to-r from-indigo-600 to-violet-600 shadow-lg shadow-indigo-500/25' : ''}`}
                style={isDemo ? undefined : {
                  background: `linear-gradient(135deg, ${p}, ${s})`,
                  boxShadow: `0 4px 14px ${p}30`,
                }}
              >
                {isDemo ? t('createMyPage') : t('bookAppointment')}
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── LIGHTBOX ── */}
      <AnimatePresence>
        {lightboxIndex !== null && photos[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={() => setLightboxIndex(null)}
          >
            <button
              type="button"
              aria-label={t('closeLightbox')}
              className="absolute top-4 right-4 p-2 text-white/80 hover:text-white transition-colors z-10"
              onClick={() => setLightboxIndex(null)}
            >
              <X className="w-6 h-6" />
            </button>

            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label={t('prevPhoto')}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => prev === null ? null : (prev - 1 + photos.length) % photos.length);
                  }}
                >
                  <ChevronLeft className="w-8 h-8" />
                </button>
                <button
                  type="button"
                  aria-label={t('nextPhoto')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/60 hover:text-white transition-colors z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIndex(prev => prev === null ? null : (prev + 1) % photos.length);
                  }}
                >
                  <ChevronRight className="w-8 h-8" />
                </button>
              </>
            )}

            <motion.img
              key={lightboxIndex}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={{ duration: 0.2 }}
              src={photos[lightboxIndex].url}
              alt={t('realisationAlt', { name: merchant.shop_name, position: photos[lightboxIndex].position })}
              className="max-w-[90vw] max-h-[85vh] object-contain rounded-xl"
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Desktop QR code — scan to open on mobile ── */}
      <div className="hidden lg:flex fixed bottom-6 right-6 z-40 flex-col items-center gap-2 rounded-2xl bg-white/95 p-3 shadow-lg border border-gray-100">
        <BrandedQRCode
          data={`https://getqarte.com/p/${merchant.slug}`}
          size={100}
          primaryColor={p}
          secondaryColor={s}
        />
        <p className="text-[10px] text-gray-400 font-medium text-center leading-tight">
          {t('scanOnMobile')}
        </p>
      </div>

      {/* ── JSON-LD STRUCTURED DATA ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': (() => {
              const typeMap: Record<string, string> = {
                coiffeur: 'HairSalon',
                barbier: 'BarberShop',
                institut_beaute: 'BeautySalon',
                onglerie: 'NailSalon',
                spa: 'DaySpa',
                estheticienne: 'BeautySalon',
                tatouage: 'TattooParlor',
              };
              return typeMap[merchant.shop_type] || 'LocalBusiness';
            })(),
            name: merchant.shop_name,
            ...(merchant.shop_address && {
              address: {
                '@type': 'PostalAddress',
                streetAddress: merchant.shop_address,
              },
            }),
            ...(photos.length > 0 && {
              image: photos.map(ph => ph.url),
            }),
            ...(merchant.logo_url && { logo: merchant.logo_url }),
            url: `https://getqarte.com/p/${merchant.slug}`,
            ...(merchant.phone && { telephone: `+${merchant.phone}` }),
            priceRange: '€€',
            ...(hasHours && {
              openingHoursSpecification: (() => {
                const SCHEMA_DAYS: Record<string, string> = {
                  '1': 'Monday', '2': 'Tuesday', '3': 'Wednesday',
                  '4': 'Thursday', '5': 'Friday', '6': 'Saturday', '7': 'Sunday',
                };
                return Object.entries(hours!)
                  .filter(([, slot]) => slot)
                  .map(([key, slot]) => ({
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: SCHEMA_DAYS[key],
                    opens: slot!.open,
                    closes: slot!.close,
                  }));
              })(),
            }),
            ...(() => {
              const links = [merchant.instagram_url, merchant.facebook_url, merchant.tiktok_url].filter(Boolean);
              return links.length > 0 ? { sameAs: links } : {};
            })(),
            ...(services.length > 0 && {
              hasOfferCatalog: {
                '@type': 'OfferCatalog',
                name: t('jsonLdOffer'),
                itemListElement: services.slice(0, 20).map((s) => ({
                  '@type': 'Offer',
                  itemOffered: {
                    '@type': 'Service',
                    name: s.name,
                    ...(s.description && { description: s.description }),
                  },
                  ...(s.price > 0 && {
                    price: s.price,
                    priceCurrency: 'EUR',
                  }),
                })),
              },
            }),
            ...(merchant.auto_booking_enabled && {
              potentialAction: {
                '@type': 'ReserveAction',
                target: {
                  '@type': 'EntryPoint',
                  urlTemplate: `https://getqarte.com/p/${merchant.slug}`,
                  actionPlatform: ['http://schema.org/DesktopWebPlatform', 'http://schema.org/MobileWebPlatform'],
                },
                result: {
                  '@type': 'Reservation',
                  name: t('jsonLdOffer'),
                },
              },
            }),
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Qarte',
                item: 'https://getqarte.com',
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: merchant.shop_name,
                item: `https://getqarte.com/p/${merchant.slug}`,
              },
            ],
          }),
        }}
      />
      {/* ── BOOKING MODAL ── */}
      {bookingSlot && merchant.auto_booking_enabled && !isDemo && (
        <BookingModal
          merchant={merchant as any}
          services={services}
          serviceCategories={serviceCategories}
          slotDate={bookingSlot.date}
          slotTime={bookingSlot.time}
          planningSlots={planningSlots}
          bookedSlots={bookedSlots}
          promoOffer={promoOffer}
          onClose={() => setBookingSlot(null)}
        />
      )}
    </div>
  );
}
