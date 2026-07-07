'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Clock, ChevronRight, ChevronLeft, ChevronDown, Loader2, Gift, CreditCard, CalendarDays, Hourglass, Info, Crown } from 'lucide-react';
import ImageLightbox from '@/components/shared/ImageLightbox';
import ServiceThumbnail from '@/components/shared/ServiceThumbnail';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { formatTime, toBCP47, formatCurrency, validateEmail, getTimezoneForCountry } from '@/lib/utils';
import { formatInTimeZone } from 'date-fns-tz';
import { getMinutesSinceMidnightForCountry } from '@/lib/booking-window';
import type { Merchant, MerchantCountry } from '@/types';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { AddressAutocomplete, type AddressSuggestion } from '@/components/ui/AddressAutocomplete';
import { Callout } from '@/components/ui';
import { detectPaymentProvider } from '@/lib/payment-providers';
import { computeBookingPrice } from '@/lib/booking-pricing';
import FollowupScheduler from './FollowupScheduler';
import { computeDepositInfo } from '@/lib/deposit';
import { normalizeBookingHorizon, isSlotBeforeLeadTime, normalizeBookingMinLead, leadCutoffDate } from '@/lib/booking-window';
import type { BookingLoyaltyPreview } from '@/lib/booking-loyalty';
import { haversineKm } from '@/lib/geo';

type Service = { id: string; name: string; price: number; position: number; category_id: string | null; duration: number | null; description: string | null; price_from: boolean; image_url: string | null };
type ServiceCategory = { id: string; name: string; position: number };
type PlanningSlotPublic = { slot_date: string; start_time: string };
type PromoOffer = { id: string; title: string; description: string; expires_at: string | null; discount_percent: number | null; target_service_ids: string[] | null };

type MerchantBooking = Pick<
  Merchant,
  'id' | 'shop_name' | 'primary_color' | 'secondary_color' | 'country' | 'booking_message' |
  'auto_booking_enabled' | 'deposit_link' | 'deposit_percent' | 'deposit_amount' | 'deposit_only_for_new_customers' |
  'welcome_offer_enabled' | 'welcome_offer_description' | 'welcome_offer_discount_percent' | 'subscription_status' | 'booking_mode' |
  'allow_customer_cancel' | 'cancel_deadline_days' | 'allow_customer_reschedule' | 'reschedule_deadline_days' |
  'home_service_enabled' | 'home_service_radius_km' | 'shop_lat' | 'shop_lng' | 'booking_horizon_days' |
  'booking_min_lead_hours' | 'recurring_followup_enabled'
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

type Step = 'services' | 'address' | 'datetime' | 'info' | 'confirm';

interface MemberLookupResponse {
  memberCard: {
    first_name: string;
    discount_percent: number | null;
    skip_deposit: boolean;
    benefit_label: string;
    program_name: string;
  } | null;
  giftCards: { count: number; total_amount: number; has_services: boolean; has_amount: boolean } | null;
  profile: { first_name: string; last_name: string; email: string | null } | null;
}

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

const CATEGORY_COLORS = ['#F59E0B', '#EC4899', '#10B981', '#8B5CF6', '#06B6D4', '#F97316'];

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
  const isHomeService = isFreeMod && merchant.home_service_enabled === true;
  const [step, setStep] = useState<Step>('services');
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(new Set());
  // Home service: customer address (only used when isHomeService === true)
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCoords, setCustomerCoords] = useState<{ lat: number; lng: number } | null>(null);
  // Hors zone : check Haversine (vol d'oiseau) entre adresse pro + adresse cliente.
  // null si pas de coords cliente OU pas de rayon configuré OU pas de coords pro.
  const outOfZoneKm = useMemo(() => {
    if (!isHomeService || !customerCoords || !merchant.home_service_radius_km) return null;
    if (merchant.shop_lat == null || merchant.shop_lng == null) return null;
    const dist = haversineKm(
      { lat: merchant.shop_lat, lng: merchant.shop_lng },
      customerCoords,
    );
    return dist > merchant.home_service_radius_km ? Math.round(dist) : null;
  }, [isHomeService, customerCoords, merchant.home_service_radius_km, merchant.shop_lat, merchant.shop_lng]);
  // Mode libre: date/time selection
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  // Mode créneaux: heure retenue. Part du créneau cliqué sur la vitrine (prop slotTime)
  // mais devient modifiable si la prestation choisie ne tient pas dans ce créneau.
  const [pickedTime, setPickedTime] = useState<string | null>(slotTime);
  const [freeSlots, setFreeSlots] = useState<PlanningSlotPublic[]>([]);
  // Bumpé quand le serveur renvoie `slot_in_past` : force /free-slots à re-fetch
  // (le cache contenait le slot qui vient d'expirer — sans bump la cliente
  // re-clique le même slot en boucle).
  const [freeSlotsBump, setFreeSlotsBump] = useState(0);
  const [loadingFreeSlots, setLoadingFreeSlots] = useState(false);
  const [freeSlotsError, setFreeSlotsError] = useState(false);
  const [calMonth, setCalMonth] = useState<Date>(() => { const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d; });
  const [firstAvailableDate, setFirstAvailableDate] = useState<string | null>(null);
  // Map dateStr -> bool : true = au moins 1 creneau libre, false = aucun. Mode libre uniquement.
  // Permet d'afficher un dot vert/rouge sur chaque jour du calendrier pour eviter
  // que la cliente clique a l'aveugle sur des jours blindes.
  const [availabilityByDate, setAvailabilityByDate] = useState<Record<string, boolean>>({});
  const [phone, setPhone] = useState('');
  const [phoneCountry, setPhoneCountry] = useState<MerchantCountry>(country);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [customerMessage, setCustomerMessage] = useState('');
  const [serviceLightbox, setServiceLightbox] = useState<{ src: string; alt: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<{
    date: string; time: string; services: { name: string; price: number; duration: number }[];
    total_price: number; total_duration: number; is_new_customer?: boolean;
    loyalty?: BookingLoyaltyPreview | null;
  } | null>(null);
  const [depositResult, setDepositResult] = useState<{
    link: string;
    links?: Array<{ label: string | null; url: string }>;
    percent: number | null;
    amount: number | null;
    message: string | null;
    deadline_hours: number | null;
  } | null>(null);

  const [memberBenefit, setMemberBenefit] = useState<{
    first_name: string;
    discount_percent: number | null;
    skip_deposit: boolean;
    benefit_label: string;
    program_name: string;
  } | null>(null);
  const [giftCardBenefit, setGiftCardBenefit] = useState<{
    count: number;
    total_amount: number;
    has_services: boolean;
    has_amount: boolean;
  } | null>(null);
  // Customer recognition state machine — drives the welcome banner, the
  // prefill badges et la copy de l email hint. Phone-first flow : on demande
  // le numero AVANT le nom/prenom et on auto-fill si le client est reconnu.
  type RecognitionState =
    | { kind: 'idle' }
    | { kind: 'loading' }
    | { kind: 'unknown' }
    | { kind: 'known'; firstName: string; lastInitial: string; hasEmail: boolean };
  const [recognition, setRecognition] = useState<RecognitionState>({ kind: 'idle' });
  // Track which fields were auto-filled (vs user-typed) so on "Modifier le
  // numero" on les clear sans risquer d effacer la saisie volontaire.
  const [prefilledFromLookup, setPrefilledFromLookup] = useState<{ firstName: boolean; lastName: boolean; email: boolean }>({ firstName: false, lastName: false, email: false });
  const memberLookupRef = useRef<ReturnType<typeof setTimeout>>();
  const memberAbortRef = useRef<AbortController>();

  // Prefill phone from signed cookie on mount (returning customer in same browser).
  // Cookie is HttpOnly → must be read via /api/customers/me-phone.
  // Le flag phoneCookieChecked evite un flash du teaser welcome : sans lui, le
  // teaser apparait pendant ~300ms puis disparait pour les clientes connues
  // (cookie present → setPhone → lookup → recognition='known' → teaser cache).
  const [phoneCookieChecked, setPhoneCookieChecked] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch('/api/customers/me-phone')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled) return;
        if (data?.phone && !phone) setPhone(String(data.phone));
        setPhoneCookieChecked(true);
      })
      .catch(() => {
        if (!cancelled) setPhoneCookieChecked(true);
      });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    clearTimeout(memberLookupRef.current);
    memberAbortRef.current?.abort();
    if (phone.length >= 10) {
      setRecognition({ kind: 'loading' });
      memberLookupRef.current = setTimeout(async () => {
        const ctrl = new AbortController();
        memberAbortRef.current = ctrl;
        try {
          const res = await fetch(`/api/member-cards/lookup?phone=${encodeURIComponent(phone)}&merchant_id=${merchant.id}&country=${phoneCountry}`, { signal: ctrl.signal });
          if (res.ok) {
            const data = await res.json() as MemberLookupResponse;
            setMemberBenefit(data.memberCard || null);
            setGiftCardBenefit(data.giftCards || null);
            const profile = data.profile;
            if (profile) {
              const lastInitial = (profile.last_name || '').trim().charAt(0).toUpperCase();
              setRecognition({
                kind: 'known',
                firstName: profile.first_name || '',
                lastInitial: lastInitial ? `${lastInitial}.` : '',
                hasEmail: !!profile.email,
              });
              // Auto-fill : only when empty (never overwrite user typing).
              // Track ce qui a ete auto-rempli pour pouvoir clear sur "Modifier le numero".
              setFirstName(prev => {
                if (prev.trim()) return prev;
                if (profile.first_name) { setPrefilledFromLookup(p => ({ ...p, firstName: true })); return profile.first_name; }
                return prev;
              });
              setLastName(prev => {
                if (prev.trim()) return prev;
                if (profile.last_name) { setPrefilledFromLookup(p => ({ ...p, lastName: true })); return profile.last_name; }
                return prev;
              });
              setEmail(prev => {
                if (prev.trim()) return prev;
                if (profile.email) { setPrefilledFromLookup(p => ({ ...p, email: true })); return profile.email; }
                return prev;
              });
            } else {
              setRecognition({ kind: 'unknown' });
            }
          } else {
            setRecognition({ kind: 'unknown' });
          }
        } catch { /* aborted or network error */ }
      }, 500);
    } else {
      setMemberBenefit(null);
      setGiftCardBenefit(null);
      setRecognition({ kind: 'idle' });
    }
    return () => { clearTimeout(memberLookupRef.current); memberAbortRef.current?.abort(); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone, phoneCountry, merchant.id]);

  // Handler "Ce n est pas vous ? Modifier le numero" : clear le phone +
  // les champs auto-remplis (sans toucher a ce que l user a tape lui-meme).
  const handleChangeNumber = () => {
    setPhone('');
    if (prefilledFromLookup.firstName) setFirstName('');
    if (prefilledFromLookup.lastName) setLastName('');
    if (prefilledFromLookup.email) setEmail('');
    setPrefilledFromLookup({ firstName: false, lastName: false, email: false });
    setRecognition({ kind: 'idle' });
  };

  // Mig 165 : skip si toggle merchant ON et cliente reconnue (recognition='known' = profil customer existe deja).
  const skipDepositReturning = merchant.deposit_only_for_new_customers && recognition.kind === 'known';
  const skipDeposit = Boolean(memberBenefit?.skip_deposit) || Boolean(giftCardBenefit && giftCardBenefit.count > 0) || skipDepositReturning;

  // Compute totals
  const selectedServices = useMemo(
    () => services.filter(s => selectedServiceIds.has(s.id)),
    [services, selectedServiceIds]
  );

  const totalPrice = useMemo(
    () => selectedServices.reduce((sum, s) => sum + Number(s.price || 0), 0),
    [selectedServices]
  );

  // Welcome n'est appliqué qu'une fois la cliente confirmée nouvelle (lookup OK).
  // Avant la saisie du numéro (idle/loading) on affiche un teaser sans réduire le
  // prix → pas de bait-and-switch quand une cliente connue tape son numéro et
  // voit le total "remonter". Le serveur revérifie strictement (loyalty_card)
  // à la création de la résa.
  const welcomeConfiguredPercent = (
    merchant.welcome_offer_enabled && merchant.welcome_offer_discount_percent
  ) ? merchant.welcome_offer_discount_percent : null;
  const welcomeApplicablePercent = recognition.kind === 'unknown' ? welcomeConfiguredPercent : null;
  // Le banner welcome devient un message de CONFIRMATION : visible uniquement
  // quand la cliente est confirmee nouvelle (kind='unknown'). Plus de transition
  // visible -> cache (cas cliente connue avec cookie prefill qui declenchait
  // banner ~300ms puis disparaissait). Cote nouvelle : nothing -> banner reste
  // affiche durablement avec line-through sur le prix. Stable, zero flash.
  const showWelcomeTeaser = !!welcomeConfiguredPercent && recognition.kind === 'unknown';
  const promoApplicablePercent = promoOffer?.discount_percent ?? null;
  const promoTargetServiceIds = promoOffer?.target_service_ids ?? null;
  const promoIsTargeted = !!promoTargetServiceIds && promoTargetServiceIds.length > 0;
  const promoTargetSet = useMemo(
    () => promoIsTargeted ? new Set(promoTargetServiceIds!) : null,
    [promoIsTargeted, promoTargetServiceIds],
  );

  const serviceLinesForPricing = useMemo(
    () => selectedServices.map((s) => ({ id: s.id, price: Number(s.price || 0) })),
    [selectedServices],
  );

  const priceResult = useMemo(() => computeBookingPrice({
    serviceLines: serviceLinesForPricing,
    memberPercent: memberBenefit?.discount_percent,
    welcomePercent: welcomeApplicablePercent,
    promoPercent: promoApplicablePercent,
    promoTargetServiceIds,
  }), [serviceLinesForPricing, memberBenefit?.discount_percent, welcomeApplicablePercent, promoApplicablePercent, promoTargetServiceIds]);
  const displayPrice = priceResult.finalPrice;

  const totalDuration = useMemo(
    () => selectedServices.reduce((sum, s) => sum + (s.duration || 30), 0),
    [selectedServices]
  );

  const hasDurationEstimate = useMemo(
    () => selectedServices.some(s => !s.duration),
    [selectedServices]
  );

  // Un créneau de départ tient la durée si aucun RDV booké ne tombe dans son intervalle.
  const slotFitsDuration = (startTime: string): boolean => {
    const startMins = timeToMinutes(startTime);
    const endMins = startMins + totalDuration;
    return !bookedSlots.some(s => {
      if (s.slot_date !== slotDate) return false;
      const m = timeToMinutes(s.start_time);
      return m > startMins && m < endMins;
    });
  };

  // Check if consecutive slots are available (mode créneaux only)
  const durationAvailable = useMemo(() => {
    if (selectedServiceIds.size === 0) return true;
    if (isFreeMod) return true; // mode libre: server validates
    if (!pickedTime || !slotDate || totalDuration === 0) return true;
    return slotFitsDuration(pickedTime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceIds, slotDate, pickedTime, bookedSlots, totalDuration, isFreeMod]);

  // Mode créneaux : si le créneau cliqué est trop court, on propose les autres
  // horaires libres du même jour qui, eux, tiennent la durée de la prestation.
  // On calcule today + now dans le fuseau merchant : sinon une cliente avec
  // horloge décalée verrait des créneaux que le serveur rejette (`slot_in_past`).
  const minLeadHours = normalizeBookingMinLead(merchant.booking_min_lead_hours);
  const validDaySlots = useMemo(() => {
    if (isFreeMod || !slotDate || totalDuration === 0) return [];
    const tz = getTimezoneForCountry(merchant.country);
    const todayStr = formatInTimeZone(new Date(), tz, 'yyyy-MM-dd');
    const nowMins = getMinutesSinceMidnightForCountry(merchant.country);
    return planningSlots
      .filter(s => s.slot_date === slotDate)
      .filter(s => slotDate !== todayStr || timeToMinutes(s.start_time) >= nowMins)
      // Délai minimum de réservation (mig 181, peut couvrir plusieurs jours)
      .filter(s => !isSlotBeforeLeadTime(s.slot_date, s.start_time, minLeadHours, merchant.country))
      .filter(s => slotFitsDuration(s.start_time))
      .map(s => s.start_time)
      .sort((a, b) => timeToMinutes(a) - timeToMinutes(b));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFreeMod, slotDate, totalDuration, planningSlots, bookedSlots, merchant.country, minLeadHours]);

  const effectiveDate = isFreeMod ? selectedDate : (slotDate || '');
  const effectiveTime = isFreeMod ? selectedTime : (pickedTime || '');

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
    if (isHomeService && !customerCoords) return; // address required first
    if (outOfZoneKm !== null) return; // hors zone : inutile d'appeler l'API, l'UI bloque deja
    setFreeSlots([]);
    setSelectedTime('');
    setFreeSlotsError(false);
    setLoadingFreeSlots(true);
    const params = new URLSearchParams({
      merchantId: merchant.id,
      date: selectedDate,
      totalDuration: String(totalDuration),
    });
    if (isHomeService && customerCoords) {
      params.set('customerLat', String(customerCoords.lat));
      params.set('customerLng', String(customerCoords.lng));
    }
    fetch(`/api/planning/free-slots?${params.toString()}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setFreeSlots(data.slots || []))
      .catch(() => setFreeSlotsError(true))
      .finally(() => setLoadingFreeSlots(false));
  }, [isFreeMod, isHomeService, customerCoords, outOfZoneKm, selectedDate, totalDuration, merchant.id, freeSlotsBump]);

  // Pre-fetch les dispos du mois affiche pour montrer dots vert/rouge sur chaque jour.
  // Skip si home_service (pas calculable sans coords cliente) ou pas de service selectionne.
  useEffect(() => {
    if (!isFreeMod || isHomeService || totalDuration === 0) return;
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    const controller = new AbortController();
    const params = new URLSearchParams({
      merchantId: merchant.id,
      from,
      to,
      duration: String(totalDuration),
    });
    fetch(`/api/planning/free-availability?${params.toString()}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { availability?: Record<string, boolean> }) => {
        if (data.availability) setAvailabilityByDate(prev => ({ ...prev, ...data.availability! }));
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isFreeMod, isHomeService, calMonth, totalDuration, merchant.id]);

  // Independant du mois affiche : la cliente voit la 1ere dispo sans naviguer.
  useEffect(() => {
    if (!isFreeMod || isHomeService || totalDuration === 0) {
      setFirstAvailableDate(null);
      return;
    }
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().split('T')[0];
    const horizon = new Date(today); horizon.setDate(today.getDate() + 30);
    const horizonStr = horizon.toISOString().split('T')[0];
    const controller = new AbortController();
    const params = new URLSearchParams({
      merchantId: merchant.id,
      from: todayStr,
      to: horizonStr,
      duration: String(totalDuration),
    });
    fetch(`/api/planning/free-availability?${params.toString()}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((data: { availability?: Record<string, boolean> }) => {
        if (!data.availability) { setFirstAvailableDate(null); return; }
        const first = Object.keys(data.availability).sort().find(d => data.availability![d]);
        setFirstAvailableDate(first || null);
      })
      .catch(() => {});
    return () => controller.abort();
  }, [isFreeMod, isHomeService, totalDuration, merchant.id]);

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

    const trimmedEmail = email.trim();
    if (trimmedEmail && !validateEmail(trimmedEmail)) {
      setError(t('emailInvalid'));
      return;
    }

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
          ...(trimmedEmail && { customer_email: trimmedEmail }),
          ...(customerMessage.trim() && { customer_message: customerMessage.trim() }),
          service_ids: Array.from(selectedServiceIds),
          ...(isFreeMod && { booking_mode: 'free' }),
          ...(isHomeService && customerCoords && {
            customer_address: customerAddress,
            customer_lat: customerCoords.lat,
            customer_lng: customerCoords.lng,
          }),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        // `slot_in_past` = la cliente a cliqué sur un créneau pile au moment où
        // il devenait périmé (race UI ↔ NOW serveur). Message dédié + reset
        // pour qu'elle puisse re-piocher dans la liste fraîchement filtrée.
        if (data.error === 'slot_in_past' || data.error === 'slot_before_lead_time') {
          setError(data.error === 'slot_before_lead_time' ? t('slotTooSoon') : t('slotInPast'));
          if (isFreeMod) {
            setSelectedTime('');
            setFreeSlotsBump(n => n + 1); // re-fetch /free-slots, le cache contient encore le slot expiré
          } else {
            setPickedTime(null);
          }
        } else {
          setError(data.error || t('bookingError'));
        }
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

  const useAccordion = categorizedServices.length >= 2;
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => new Set());
  const toggleCategory = (key: string) => {
    setOpenCategories(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // Group free slots by period (morning/afternoon/evening)
  const groupedFreeSlots = useMemo(() => {
    const morning: PlanningSlotPublic[] = [];
    const afternoon: PlanningSlotPublic[] = [];
    const evening: PlanningSlotPublic[] = [];
    for (const s of freeSlots) {
      const h = parseInt(s.start_time.split(':')[0], 10);
      if (h < 12) morning.push(s);
      else if (h < 17) afternoon.push(s);
      else evening.push(s);
    }
    return { morning, afternoon, evening };
  }, [freeSlots]);

  // Step indicator
  const indicatorSteps: Step[] = isHomeService
    ? ['services', 'address', 'datetime', 'info']
    : isFreeMod
      ? ['services', 'datetime', 'info']
      : ['services', 'info'];
  const currentStepIdx = indicatorSteps.indexOf(step);

  // Sticky bar deposit info — calculé sur displayPrice (pas totalPrice) pour
  // refléter les réductions appliquées (member/welcome/promo). Sinon le merchant
  // perd la cohérence : la cliente verrait un acompte 50% sur 35€ alors qu'elle
  // paie 28€ après réductions.
  const depositInfo = useMemo(() => {
    if (!merchant.deposit_link || skipDeposit) return null;
    return computeDepositInfo(displayPrice, merchant.deposit_amount, merchant.deposit_percent);
  }, [merchant.deposit_link, merchant.deposit_percent, merchant.deposit_amount, displayPrice, skipDeposit]);
  const stickyDeposit = depositInfo;

  return (
    <>
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-md shadow-2xl flex flex-col max-h-[90dvh]"
      >
        {/* Header */}
        <div className="shrink-0 bg-white rounded-t-3xl border-b border-gray-100 px-5 py-4 flex items-center justify-between">
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
          <button onClick={onClose} aria-label={t('close')} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {/* Step indicator */}
        {step !== 'confirm' && (
          <div className="shrink-0 px-5 pt-3 pb-1 flex gap-1.5">
            {indicatorSteps.map((_, i) => (
              <div
                key={i}
                className="h-1 flex-1 rounded-full transition-colors"
                style={{ backgroundColor: i <= currentStepIdx ? p : '#e5e7eb' }}
              />
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto min-h-0 p-5">
          <AnimatePresence mode="wait">
            {/* ── STEP 1: Services ── */}
            {step === 'services' && (
              <motion.div key="services" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('selectServices')}</p>

                {(() => {
                  const renderServiceBtn = (svc: Service) => {
                    const selected = selectedServiceIds.has(svc.id);
                    // Conteneur = div (porte le style sélectionné) avec 2 boutons distincts :
                    // vignette → agrandit sans cocher, reste → coche. Pas d'imbrication de <button>.
                    return (
                      <div
                        key={svc.id}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                          selected
                            ? 'bg-opacity-10 border-2'
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                        style={selected ? { backgroundColor: `${p}10`, borderColor: p } : undefined}
                      >
                        {svc.image_url && (
                          <ServiceThumbnail
                            src={svc.image_url}
                            alt={svc.name}
                            label={t('enlargePhotoAria', { name: svc.name })}
                            onEnlarge={() => setServiceLightbox({ src: svc.image_url!, alt: svc.name })}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => toggleService(svc.id)}
                          className="flex-1 min-w-0 flex items-center gap-3 text-left"
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
                      </div>
                    );
                  };

                  if (useAccordion) {
                    return (
                      <div className="space-y-2 mb-4">
                        {categorizedServices.map(({ category, services: catServices }, idx) => {
                          const catKey = category?.id || '__uncategorized__';
                          const isOpen = openCategories.has(catKey);
                          const catName = category?.name || t('otherServices');
                          const selectedInCat = catServices.filter(s => selectedServiceIds.has(s.id)).length;
                          const dotColor = category
                            ? CATEGORY_COLORS[idx % CATEGORY_COLORS.length]
                            : '#9CA3AF';
                          return (
                            <div key={catKey} className="rounded-xl border border-gray-100 overflow-hidden bg-white">
                              <button
                                type="button"
                                onClick={() => toggleCategory(catKey)}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                              >
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: dotColor }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-bold text-gray-900 truncate">{catName}</p>
                                    {selectedInCat > 0 && (
                                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: p }}>
                                        {selectedInCat}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[11px] text-gray-500 mt-0.5">
                                    {t('categoryServicesCount', { count: catServices.length })}
                                  </p>
                                </div>
                                <ChevronDown
                                  className="w-4 h-4 text-gray-500 shrink-0 transition-transform"
                                  style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                                />
                              </button>
                              <AnimatePresence initial={false}>
                                {isOpen && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <div className="p-2 pt-0 space-y-1.5 border-t border-gray-100">
                                      <div className="pt-2" />
                                      {catServices.map(renderServiceBtn)}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  // Flat fallback (single category or uncategorized only)
                  return (
                    <div className="space-y-4 mb-4">
                      {categorizedServices.map(({ category, services: catServices }) => (
                        <div key={category?.id || 'uncategorized'}>
                          {category && (
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.14em] mb-2">{category.name}</p>
                          )}
                          <div className="space-y-1.5">
                            {catServices.map(renderServiceBtn)}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Promo offer banner : 2 lignes typo + chiffre %. Bg amber tinted
                    pour distinguer du blanc du modal. Le chiffre porte l'urgence
                    visuelle, colorise primary_color merchant. */}
                {promoOffer && (() => {
                  const targetedNames = promoIsTargeted
                    ? services.filter((s) => promoTargetSet!.has(s.id)).map((s) => s.name)
                    : null;
                  const isTargeted = targetedNames && targetedNames.length > 0 && promoOffer.discount_percent;
                  return (
                    <div className="rounded-xl border border-amber-200/80 bg-amber-50 px-3 py-2.5 flex items-center gap-3 mb-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-bold text-gray-900 leading-snug tracking-tight line-clamp-2">
                          {promoOffer.title}
                        </p>
                        <p className="text-[11px] text-gray-700 leading-snug line-clamp-2 mt-0.5">
                          {isTargeted ? (
                            <>
                              {t('promoTargetedLead', { percent: promoOffer.discount_percent! })}{' '}
                              <span className="text-amber-800 font-semibold">{targetedNames!.join(', ')}</span>
                            </>
                          ) : (
                            promoOffer.description
                          )}
                        </p>
                      </div>
                      {promoOffer.discount_percent ? (
                        <div
                          className="shrink-0 leading-none tabular-nums text-2xl font-extrabold tracking-tight"
                          style={{ color: merchant.primary_color || '#4b0082' }}
                        >
                          -{promoOffer.discount_percent}%
                        </div>
                      ) : null}
                    </div>
                  );
                })()}

                {/* Welcome teaser : meme langage visuel que le promo banner (2 lignes
                    typo + chiffre %), bg rose pour distinguer du promo amber. Disparait
                    des que le lookup tranche : si nouvelle, la reduction passe dans le
                    recap prix (line-through) ; si connue, plus rien (faux espoir). */}
                {showWelcomeTeaser && (
                  <>
                  <div className="rounded-xl border border-rose-200/80 bg-rose-50 px-3 py-2.5 flex items-center gap-3 mb-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-[14px] font-bold text-gray-900 leading-snug tracking-tight">
                        {t('welcomeTeaserTitle')}
                      </p>
                      <p className="text-[11px] text-gray-700 leading-snug mt-0.5">
                        {t('welcomeTeaserSubtitle')}
                      </p>
                    </div>
                    <div
                      className="shrink-0 leading-none tabular-nums text-2xl font-extrabold tracking-tight"
                      style={{ color: merchant.primary_color || '#4b0082' }}
                    >
                      -{welcomeConfiguredPercent}%
                    </div>
                  </div>
                  {/* Hint pas de cumul : visible si les 2 banners coexistent (welcome + promo
                      tous deux configures et applicables a cette cliente nouvelle). */}
                  {promoOffer && (
                    <p className="text-[11px] text-gray-500 mb-3 px-1 leading-snug italic">
                      {t('offersBestOnlyHint')}
                    </p>
                  )}
                  </>
                )}

                {/* Totals */}
                {selectedServiceIds.size > 0 && (
                  <div className="rounded-xl bg-gray-50 px-4 py-3 mb-4 space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">{hasDurationEstimate ? t('totalDurationEstimate') : t('totalDuration')}</span>
                      <span className="font-bold text-gray-900">{hasDurationEstimate ? '~' : ''}{formatDuration(totalDuration, locale)}</span>
                    </div>
                    <div className="flex justify-between text-sm items-start">
                      <span className="text-gray-500">{t('totalPrice')}</span>
                      <div className="flex flex-col items-end">
                        <span className="flex items-center gap-1.5">
                          {totalPrice !== displayPrice && (
                            <span className="text-xs text-gray-500 line-through">{formatCurrency(totalPrice, country, locale)}</span>
                          )}
                          <span className="font-bold text-gray-900">{formatCurrency(displayPrice, country, locale)}</span>
                        </span>
                        {priceResult.hasDiscount && (
                          <span className="text-[11px] text-emerald-600 mt-1 leading-tight flex flex-col items-end gap-0.5">
                            {priceResult.appliedDiscounts.memberAmount && (
                              <span>{t('discountMemberAmount', { amount: formatCurrency(priceResult.appliedDiscounts.memberAmount, country, locale) })}</span>
                            )}
                            {priceResult.appliedDiscounts.welcomeAmount && (
                              <span>{t('discountWelcomeAmount', { amount: formatCurrency(priceResult.appliedDiscounts.welcomeAmount, country, locale) })}</span>
                            )}
                            {priceResult.appliedDiscounts.promoAmount && (
                              <span>{t('discountPromoAmount', { amount: formatCurrency(priceResult.appliedDiscounts.promoAmount, country, locale) })}</span>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Mention pour offre descriptive (pas de discount calculé) — évite que la cliente arrive en boutique sans en parler */}
                    {promoOffer && !promoOffer.discount_percent && (
                      <p className="text-[11px] text-amber-700 italic text-right leading-snug pt-0.5">
                        {t('promoApplyInShop', { title: promoOffer.title })}
                      </p>
                    )}
                    {/* Promo ciblée configurée mais aucune prestation éligible sélectionnée :
                        on explique pourquoi la réduction n'apparaît pas (sinon promo "fantôme"). */}
                    {promoOffer && promoIsTargeted && promoOffer.discount_percent && !priceResult.appliedDiscounts.promoAmount && (() => {
                      const names = services.filter((s) => promoTargetSet!.has(s.id)).map((s) => s.name);
                      if (names.length === 0) return null;
                      return (
                        <p className="text-[11px] text-amber-700 italic text-right leading-snug pt-0.5">
                          {t('promoTargetedNotApplied', { percent: promoOffer.discount_percent, names: names.join(', ') })}
                        </p>
                      );
                    })()}
                    {depositInfo && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">
                            {depositInfo.fixedExceedsTotal
                              ? t('depositFullAmountRequired')
                              : depositInfo.isFullPayment
                                ? t('depositFullPayment')
                                : depositInfo.isFixedDeposit
                                  ? t('depositFixedLabel')
                                  : t('depositLabel', { percent: merchant.deposit_percent || 0 })}
                          </span>
                          <span className="font-bold" style={{ color: p }}>
                            {formatCurrency(depositInfo.amount, country, locale)}
                          </span>
                        </div>
                        {!depositInfo.isFullPayment && depositInfo.remaining > 0 && (
                          <>
                            <div className="border-t border-gray-200/70 my-1" />
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-500">{t('depositRemaining')}</span>
                              <span className="font-semibold text-gray-700">
                                {formatCurrency(depositInfo.remaining, country, locale)}
                              </span>
                            </div>
                          </>
                        )}
                        {depositInfo.fixedExceedsTotal && (
                          <p className="text-[11px] text-gray-500 italic leading-snug">
                            {t('depositFullAmountHint')}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                )}

                {selectedServiceIds.size > 0 && <PolicyNotice merchant={merchant} t={t} />}

                {!durationAvailable && selectedServiceIds.size > 0 && (
                  <div className="mb-3 rounded-xl border border-red-200 bg-red-50/70 p-3">
                    <p className="text-xs text-red-600 font-semibold">{t('durationTooLong')}</p>
                    {validDaySlots.length > 0 ? (
                      <>
                        <p className="text-[11px] text-gray-600 mt-1.5 mb-2">{t('durationPickAnother')}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {validDaySlots.map(time => (
                            <button
                              key={time}
                              type="button"
                              onClick={() => setPickedTime(time)}
                              className="px-3 py-2 rounded-lg text-[12px] font-semibold transition-transform active:scale-95"
                              style={{ backgroundColor: `${p}12`, color: p }}
                            >
                              {formatTime(time, locale)}
                            </button>
                          ))}
                        </div>
                      </>
                    ) : (
                      <p className="text-[11px] text-gray-600 mt-1.5">{t('durationNoneThatDay')}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 1.5: Adresse cliente (mode service à domicile) ── */}
            {step === 'address' && (
              <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <div className="mb-4 p-3 bg-amber-50 border border-amber-100 rounded-xl">
                  <p className="text-xs text-amber-800 leading-relaxed">{t('addressIntro', { shopName: merchant.shop_name })}</p>
                </div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">{t('addressLabel')}</label>
                <AddressAutocomplete
                  value={customerAddress}
                  onChange={(value: string, suggestion?: AddressSuggestion) => {
                    setCustomerAddress(value);
                    if (suggestion) {
                      setCustomerCoords({ lat: suggestion.lat, lng: suggestion.lng });
                    } else {
                      setCustomerCoords(null);
                    }
                  }}
                  placeholder={t('addressPlaceholder')}
                  className="h-11 text-sm"
                />
                {customerAddress && !customerCoords && (
                  <p className="mt-2 text-[11px] text-gray-500">{t('addressNeedSelect')}</p>
                )}
                {outOfZoneKm !== null && (
                  <div className="mt-3">
                    <Callout variant="danger" title={t('addressOutOfZoneTitle')}>
                      {t('addressOutOfZoneBody', { radius: merchant.home_service_radius_km ?? 0, distance: outOfZoneKm })}
                    </Callout>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 1b: Date/Time (mode libre) ── */}
            {step === 'datetime' && (
              <motion.div key="datetime" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm font-semibold text-gray-700 mb-1">{t('chooseDate')}</p>
                <div className="mb-3 min-h-[18px]">
                  {firstAvailableDate && firstAvailableDate !== selectedDate && (() => {
                    const target = new Date(firstAvailableDate + 'T12:00:00');
                    return (
                      <button
                        type="button"
                        onClick={() => {
                          setCalMonth(new Date(target.getFullYear(), target.getMonth(), 1));
                          setSelectedDate(firstAvailableDate);
                          setSelectedTime('');
                        }}
                        className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 hover:text-emerald-800 transition-colors"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {t('firstAvailability', { date: target.toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long' }) })}
                      </button>
                    );
                  })()}
                </div>

                {/* Month calendar */}
                {(() => {
                  const bcp47 = toBCP47(locale);
                  const today = new Date(); today.setHours(0, 0, 0, 0);
                  const todayStr = today.toISOString().split('T')[0];
                  // Borne basse : le délai minimum de réservation avance le 1er jour
                  // sélectionnable (mig 181). Jours entièrement dans la fenêtre désactivés ;
                  // le jour-frontière garde ses créneaux tardifs (filtrés par validDaySlots).
                  const minDateStr = minLeadHours > 0 ? leadCutoffDate(minLeadHours, merchant.country) : todayStr;
                  const maxDate = new Date(today); maxDate.setDate(today.getDate() + normalizeBookingHorizon(merchant.booking_horizon_days));
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
                      <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((day, idx) => {
                          if (day === null) return <span key={`e-${idx}`} />;
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                          const isPast = dateStr < minDateStr;
                          const isFuture = dateStr > maxDateStr;
                          const isSelected = dateStr === selectedDate;
                          const isToday = dateStr === todayStr;
                          // Dot dispo : uniquement mode libre, sans home_service, range valide.
                          // undefined = pas encore fetch ou pas applicable -> on n'affiche rien.
                          const dispo = !isPast && !isFuture && isFreeMod && !isHomeService
                            ? availabilityByDate[dateStr]
                            : undefined;
                          return (
                            <button
                              key={dateStr}
                              type="button"
                              disabled={isPast || isFuture}
                              onClick={() => { setSelectedDate(dateStr); if (selectedTime) setSelectedTime(''); }}
                              className={`relative mx-auto w-10 h-10 flex items-center justify-center rounded-full text-sm transition-all
                                ${isSelected ? 'font-bold text-white' : ''}
                                ${!isSelected && isToday ? 'font-bold' : ''}
                                ${isPast || isFuture ? 'text-gray-300 cursor-not-allowed' : !isSelected ? 'text-gray-700 hover:bg-gray-100' : ''}`}
                              style={isSelected ? { backgroundColor: p } : isToday && !isSelected ? { color: p } : undefined}
                            >
                              {day}
                              {dispo !== undefined && (
                                <span
                                  aria-hidden
                                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full ${
                                    isSelected
                                      ? 'bg-white'
                                      : dispo
                                        ? 'bg-emerald-500'
                                        : 'bg-red-400'
                                  }`}
                                />
                              )}
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
                      <div className="space-y-3">
                        {(['morning', 'afternoon', 'evening'] as const).map(period => {
                          const slots = groupedFreeSlots[period];
                          if (slots.length === 0) return null;
                          return (
                            <div key={period}>
                              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-[0.14em] mb-2">
                                {t(`period.${period}`)}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {slots.map(slot => {
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
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

              </motion.div>
            )}

            {/* ── STEP 2: Info ── */}
            {step === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                <p className="text-sm font-semibold text-gray-700 mb-3">{t('yourInfo')}</p>

                <div className="space-y-3 mb-4">
                  {/* Phone d'abord — pivot pour reconnaissance */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{t('phone')} *</label>
                    <PhoneInput
                      value={phone}
                      onChange={setPhone}
                      country={phoneCountry}
                      onCountryChange={setPhoneCountry}
                      countries={['FR', 'BE', 'CH']}
                      autoFocus
                      hidePrefix
                      className="px-4 py-2.5 text-sm border-transparent bg-gray-50 rounded-r-xl"
                    />
                  </div>

                  {/* Bandeau reconnaissance */}
                  {recognition.kind === 'loading' && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-50 text-xs text-gray-500">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('lookingUp')}</span>
                    </div>
                  )}
                  {recognition.kind === 'known' && (
                    <div
                      className="px-3 py-2.5 rounded-xl flex items-start gap-2.5"
                      style={{ backgroundColor: `${p}10`, border: `1px solid ${p}30` }}
                    >
                      <span className="text-base leading-none mt-0.5">👋</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-gray-900">
                          {t('welcomeBack', { name: recognition.firstName + (recognition.lastInitial ? ` ${recognition.lastInitial}` : '') })}
                        </p>
                        <button
                          type="button"
                          onClick={handleChangeNumber}
                          className="text-[11px] text-gray-500 hover:text-gray-700 underline mt-0.5"
                        >
                          {t('notYouChangeNumber')}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Prenom (auto-rempli si reconnu) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
                      {t('firstName')} *
                      {prefilledFromLookup.firstName && firstName.trim() && (
                        <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> {t('prefilledFromPhone')}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => { setFirstName(e.target.value); if (prefilledFromLookup.firstName) setPrefilledFromLookup(p => ({ ...p, firstName: false })); }}
                      placeholder={t('firstNamePlaceholder')}
                      autoComplete="given-name"
                      className={`w-full px-4 py-2.5 border border-transparent rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:bg-white ${prefilledFromLookup.firstName ? 'bg-emerald-50/50' : 'bg-gray-50'}`}
                      style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                      maxLength={100}
                    />
                  </div>

                  {/* Nom (auto-rempli si reconnu) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
                      {t('lastName')}
                      {prefilledFromLookup.lastName && lastName.trim() && (
                        <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> {t('prefilledFromPhone')}
                        </span>
                      )}
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => { setLastName(e.target.value); if (prefilledFromLookup.lastName) setPrefilledFromLookup(p => ({ ...p, lastName: false })); }}
                      placeholder={t('lastNamePlaceholder')}
                      autoComplete="family-name"
                      className={`w-full px-4 py-2.5 border border-transparent rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:bg-white ${prefilledFromLookup.lastName ? 'bg-emerald-50/50' : 'bg-gray-50'}`}
                      style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                      maxLength={100}
                    />
                  </div>

                  {/* Email (auto-rempli si reconnu) */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1.5">
                      {t('email')}
                      {prefilledFromLookup.email && email.trim() && (
                        <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> {t('prefilledFromPhone')}
                        </span>
                      )}
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => { setEmail(e.target.value); if (prefilledFromLookup.email) setPrefilledFromLookup(p => ({ ...p, email: false })); }}
                      placeholder={t('emailPlaceholder')}
                      autoComplete="email"
                      className={`w-full px-4 py-2.5 border border-transparent rounded-xl text-sm transition-colors focus:outline-none focus:ring-2 focus:bg-white ${prefilledFromLookup.email ? 'bg-emerald-50/50' : 'bg-gray-50'}`}
                      style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                      maxLength={254}
                    />
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">
                      {recognition.kind === 'known' && !recognition.hasEmail
                        ? t('emailHintRecognized')
                        : stickyDeposit
                          ? t('emailHintWithDeposit')
                          : t('emailHint')}
                    </p>
                  </div>

                  {/* Message libre pour le salon */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">
                      {t('messageLabel')}
                    </label>
                    <textarea
                      value={customerMessage}
                      onChange={e => setCustomerMessage(e.target.value)}
                      placeholder={t('messagePlaceholder')}
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-2.5 bg-gray-50 border border-transparent rounded-xl text-sm leading-relaxed resize-none transition-colors focus:outline-none focus:ring-2 focus:bg-white"
                      style={{ '--tw-ring-color': `${p}40` } as React.CSSProperties}
                    />
                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">{t('messageHint')}</p>
                  </div>
                </div>

                {/* Member benefit banner */}
                {memberBenefit && (
                  <div
                    className="p-3 rounded-xl mb-4"
                    style={{ backgroundColor: `${p}12`, border: `1px solid ${p}30` }}
                  >
                    <div className="flex items-start gap-2.5">
                      <Crown className="w-4 h-4 shrink-0 mt-0.5" style={{ color: p }} />
                      <div className="text-[12px] text-gray-800 leading-relaxed">
                        <p className="font-semibold text-gray-900">{t('memberDetected', { name: memberBenefit.first_name })}</p>
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

                {giftCardBenefit && giftCardBenefit.count > 0 && (() => {
                  const isMulti = giftCardBenefit.count > 1;
                  const useAmountCopy = isMulti || giftCardBenefit.has_amount;
                  let titleKey: string;
                  if (isMulti) titleKey = 'giftCardDetectedMulti';
                  else if (giftCardBenefit.has_amount) titleKey = 'giftCardDetectedAmount';
                  else titleKey = 'giftCardDetectedServices';
                  return (
                  <div className="p-3 rounded-xl mb-4 bg-emerald-50 border border-emerald-200">
                    <div className="flex items-start gap-2.5">
                      <Gift className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
                      <div className="text-[12px] text-emerald-900 leading-relaxed">
                        <p className="font-semibold">
                          {t(titleKey, {
                            count: giftCardBenefit.count,
                            amount: formatCurrency(giftCardBenefit.total_amount, country, locale, 0),
                            shop: merchant.shop_name,
                          })}
                        </p>
                        <p className="mt-1 text-emerald-800">
                          {useAmountCopy ? t('giftCardSkipDepositHintAmount') : t('giftCardSkipDepositHintServices')}
                        </p>
                        <p className="mt-1.5 text-emerald-700/80 text-[11px]">
                          {t('giftCardSingleUseHint')}
                        </p>
                      </div>
                    </div>
                  </div>
                  );
                })()}

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
              </motion.div>
            )}

            {/* ── STEP 3: Confirmation ── */}
            {step === 'confirm' && bookingResult && (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                {/* Success icon */}
                <div className="flex justify-center mb-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                  >
                    {depositResult?.link ? (
                      <Hourglass className="w-6 h-6 text-white" />
                    ) : (
                      <CalendarDays className="w-6 h-6 text-white" />
                    )}
                  </div>
                </div>

                <h3 className="text-center text-lg font-bold text-gray-900 mb-0.5">
                  {depositResult?.link ? t('bookingPending') : t('bookingConfirmed')}
                </h3>
                <p className="text-center text-xs text-gray-500 mb-3">{merchant.shop_name}</p>
                {depositResult?.link ? (
                  <>
                    <p className="text-center text-[13px] text-gray-600 mb-1.5 px-2">
                      {t('depositPendingMessage')}
                    </p>
                    <p className="text-center text-[13px] text-gray-600 mb-1.5 px-2">
                      {merchant.subscription_status !== 'trial' ? t('smsAfterDeposit') : t('depositPendingHintTrial')}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-center text-[13px] text-gray-600 mb-2 px-2">
                      {t('bookingConfirmedHint')}
                    </p>
                    {bookingResult.is_new_customer && (
                      <div className="mx-auto mb-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[12px] font-semibold">
                        <Crown className="w-3.5 h-3.5" strokeWidth={2.5} />
                        <span>{t('loyaltyCardReady', { shop: merchant.shop_name })}</span>
                      </div>
                    )}
                  </>
                )}
                <p className="text-center text-[11px] text-gray-500 mb-3 px-2">
                  {t('checkStatusHint')}
                </p>

                {/* Booking summary */}
                <div className="rounded-xl bg-gray-50 px-4 py-2.5 mb-3 space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('date')}</span>
                    <span className="font-semibold text-gray-900 capitalize">{formattedDate}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('time')}</span>
                    <span className="font-semibold text-gray-900">{formatTime(bookingResult.time, locale)}</span>
                  </div>
                  {isHomeService && customerAddress && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 shrink-0 mr-2">{t('addressLabel')}</span>
                      <span className="font-semibold text-gray-900 text-right line-clamp-2">{customerAddress}</span>
                    </div>
                  )}
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

                {/* Fidélité : ce que la venue rapportera (résa en ligne honorée = 1 point / +montant). */}
                {bookingResult.loyalty && (() => {
                  const L = bookingResult.loyalty;
                  if (L.mode === 'cagnotte') {
                    return (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-3 flex items-start gap-2">
                        <Gift className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-[13px] text-emerald-800 leading-snug">
                          {t('loyaltyCagnotteLine', { amount: formatCurrency(L.addedAmount, country, locale) })}
                        </p>
                      </div>
                    );
                  }
                  const projected = L.projectedStamps;
                  const isReady = L.state === 'reward_ready';
                  return (
                    <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 mb-3">
                      <div className="flex items-start gap-2">
                        <Gift className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <p className="text-[13px] font-semibold text-emerald-800 leading-snug">
                          {isReady
                            ? (L.rewardDescription ? t('loyaltyRewardReady', { reward: L.rewardDescription }) : t('loyaltyRewardReadyNoDesc'))
                            : L.state === 'first_point'
                              ? t('loyaltyFirstPoint')
                              : t('loyaltyEarnLine')}
                        </p>
                      </div>
                      {!isReady && L.stampsRequired > 0 && (
                        <div className="mt-2 pl-6">
                          <div className="h-1.5 rounded-full bg-emerald-100 overflow-hidden">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.round((projected / L.stampsRequired) * 100)}%` }} />
                          </div>
                          <p className="text-[12px] text-emerald-700 mt-1.5">
                            {L.remaining > 0 && L.rewardDescription
                              ? t('loyaltyRemaining', { n: L.remaining, reward: L.rewardDescription })
                              : t('loyaltyProgress', { current: projected, target: L.stampsRequired })}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <PolicyNotice merchant={merchant} t={t} className="mb-4" />

                {/* Deposit section */}
                {depositResult && depositResult.link && (() => {
                  const depositLinks = depositResult.links && depositResult.links.length > 0
                    ? depositResult.links
                    : [{ label: null, url: depositResult.link }];
                  return (
                  <div
                    className="rounded-xl p-3.5 mb-3"
                    style={{ backgroundColor: `${p}0D`, border: `1px solid ${p}26` }}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{ backgroundColor: `${p}1A` }}
                      >
                        <CreditCard className="w-4 h-4" style={{ color: p }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-gray-500">
                          {depositResult.percent
                            ? t('depositRequired', { percent: depositResult.percent })
                            : t('depositFixedLabel')}
                        </p>
                        {depositResult.amount && (
                          <p className="text-lg font-black text-gray-900 leading-tight">
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

                {/* RDV de suivi récurrents (+3/+6 sem.) — proposés à la fin de la résa si activé (mig 177) */}
                {merchant.recurring_followup_enabled && (
                  <FollowupScheduler
                    merchantId={merchant.id}
                    primaryColor={p}
                    secondaryColor={merchant.secondary_color}
                    bookingMode={isFreeMod ? 'free' : 'slots'}
                    isHomeService={isHomeService}
                    customerCoords={customerCoords}
                    customerAddress={customerAddress}
                    serviceIds={Array.from(selectedServiceIds)}
                    totalDuration={totalDuration}
                    phone={phone}
                    phoneCountry={phoneCountry}
                    firstName={firstName}
                    lastName={lastName}
                    email={email}
                    primaryDate={bookingResult.date}
                    hasDeposit={!!depositResult?.link}
                  />
                )}

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

        {/* Footer commun — hors AnimatePresence pour rester collé en bas (sticky cassé par les transforms motion). */}
        {step !== 'confirm' && (
          <div className="shrink-0 px-5 py-3 bg-white border-t border-gray-100 rounded-b-3xl pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
            {step === 'services' && (
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  {selectedServiceIds.size === 0 ? (
                    <p className="text-[12px] text-gray-500">{t('selectAtLeastOne')}</p>
                  ) : (
                    <p className="text-sm font-semibold text-gray-700 leading-tight">
                      {t('categoryServicesCount', { count: selectedServiceIds.size })} · {hasDurationEstimate ? '~' : ''}{formatDuration(totalDuration, locale)}
                    </p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setStep(isHomeService ? 'address' : isFreeMod ? 'datetime' : 'info')}
                  disabled={selectedServiceIds.size === 0 || !durationAvailable}
                  className="shrink-0 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                >
                  {t('next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {step === 'address' && (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setStep('services')}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {t('back')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('datetime')}
                  disabled={!customerCoords || outOfZoneKm !== null}
                  className="ml-auto shrink-0 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-40 flex items-center gap-2"
                  style={{ background: `linear-gradient(135deg, ${p}, ${merchant.secondary_color || p})` }}
                >
                  {t('next')}
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
            {step === 'datetime' && (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep(isHomeService ? 'address' : 'services')}
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
            )}
            {step === 'info' && (
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
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
    <ImageLightbox
      src={serviceLightbox?.src ?? null}
      alt={serviceLightbox?.alt ?? ''}
      onClose={() => setServiceLightbox(null)}
      closeLabel={t('closeLightbox')}
    />
    </>
  );
}
