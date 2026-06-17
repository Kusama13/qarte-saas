'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import { getSupabase } from '@/lib/supabase';
import { CalendarDays, CalendarCheck, CalendarRange, ChevronLeft, ChevronRight, Plus, Copy, Loader2, Check, Download, MessageSquare, Phone, LayoutGrid, Calendar, Globe, CreditCard, AlertTriangle, X, Trash2, Bell, Clock, Lock, Search, UserCheck, UserPlus, Instagram, Gift, ChevronDown, MoreVertical, Settings, Save, MapPin } from 'lucide-react';
import { DepositCard } from './settings/DepositCard';
import { CustomerEditCard } from './settings/CustomerEditCard';
import { FollowupCard } from './settings/FollowupCard';
import { HomeServiceCard } from './settings/HomeServiceCard';
import type { BookingMode, MerchantCountry, BookingDepositFailure } from '@/types';
import { useMerchantPushNotifications } from '@/hooks/useMerchantPushNotifications';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { AnimatePresence, motion } from 'framer-motion';
import type { PlanningSlot } from '@/types';
import { PHONE_CONFIG, toBCP47, formatCurrency, formatPhoneLabel } from '@/lib/utils';
import { detectPaymentProvider, normalizePaymentLink } from '@/lib/payment-providers';
import { formatDate, getServiceColorMap, colorBorderStyle, getWeekStart, timeToMinutes, minutesToTime, formatDuration, getISOWeekNumber } from './utils';
import type { CustomServiceDraft } from './usePlanningState';
import CustomServicePicker from './CustomServicePicker';
import { handleDownloadStory } from './StoryExport';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { SettingCard, Switch, Callout, ChipGroup } from '@/components/ui';
import { AddressAutocomplete, type AddressSuggestion } from '@/components/ui/AddressAutocomplete';
import { TikTokIcon, FacebookIcon } from '@/components/icons/SocialIcons';
import { usePlanningState } from './usePlanningState';
import AddSlotsModal from './AddSlotsModal';
import CopyWeekModal from './CopyWeekModal';
import ConfirmDeleteSlotsModal from './ConfirmDeleteSlotsModal';
import ClientSelectModal from './ClientSelectModal';
import BookingDetailsModal from './BookingDetailsModal';
import BringBackBookingModal from './BringBackBookingModal';
import ReservationsSection from './ReservationsSection';
import DayView from './DayView';
import WeekView from './WeekView';
import PlanningModal, { ModalHeader, ModalFooter } from './PlanningModal';
import PlanUpgradeCTA from '@/components/dashboard/PlanUpgradeCTA';
import SmsQuotaGauge from '@/components/dashboard/SmsQuotaGauge';
import { getPlanFeatures } from '@/lib/plan-tiers';
import { useToast } from '@/components/ui/Toast';
import { Link } from '@/i18n/navigation';
import { usePullToRefreshRegister } from '@/components/shared/PullToRefresh';
import { hasValidOpeningHours } from '@/lib/opening-hours';
import { BOOKING_HORIZON_OPTIONS, type BookingHorizonDays } from '@/lib/booking-window';

const VIEW_MODE_KEY = 'qarte_planning_view';
const VIEW_MODES = ['day', '2day', 'week'] as const;
type ViewMode = (typeof VIEW_MODES)[number];

export default function PlanningDashboard() {
  const t = useTranslations('planning');
  const locale = useLocale();
  const supabase = getSupabase();
  const { addToast } = useToast();

  const state = usePlanningState();
  const {
    merchant, merchantLoading, refetch,
    tab, setTab,
    selectedDay, setSelectedDay,
    weekOffset, setWeekOffset, weekStart, weekDays, weekEnd,
    slots, loadingSlots, slotsByDate, fetchSlots, invalidateUpcoming, upcomingSlots,
    depositFailures, deleteDepositFailure, bringBackDepositFailure,
    todayStr, freeSlots, isToday, isPast,
    message, setMessage, messageEnabled, setMessageEnabled,
    messageExpires, setMessageExpires, bookingMessage, setBookingMessage,
    autoBookingEnabled, setAutoBookingEnabled,
    allowCustomerCancel, setAllowCustomerCancel, allowCustomerReschedule, setAllowCustomerReschedule,
    recurringFollowupEnabled, setRecurringFollowupEnabled,
    cancelDeadlineDays, setCancelDeadlineDays, rescheduleDeadlineDays, setRescheduleDeadlineDays,
    depositLink, setDepositLink, depositLinkLabel, setDepositLinkLabel, depositLink2, setDepositLink2, depositLink2Label, setDepositLink2Label, depositPercent, setDepositPercent, depositAmount, setDepositAmount, depositDeadlineHours, setDepositDeadlineHours,
    bookingMode, setBookingMode, bufferMinutes, setBufferMinutes,
    bookingHorizonDays, setBookingHorizonDays,
    homeServiceEnabled, setHomeServiceEnabled,
    hideAddressOnPublicPage, setHideAddressOnPublicPage,
    homeServiceRadiusKm, setHomeServiceRadiusKm,
    services,
    modalState, setModalState, closeModal,
    selectedTimes, setSelectedTimes, customTime, setCustomTime,
    draft, updateDraft,
    customerResults, showCustomerSearch, setShowCustomerSearch,
    searchDone, creatingCustomer, createError,
    handleDraftNameChange, selectCustomer, handleCreateCustomer,
    saving, saved,
    handleTogglePlanning, handleAddSlots, handleUpdateSlot,
    handleDeleteSlot, handleBulkDeleteSlots, handleMoveSlot, handleCopyWeek,
    openEditSlot, openAddSlotsModal,
    proceedToBookingDetails, goBackToClientSelect,
    fetchClientHistory,
  } = state;

  const { saving: savingSettings, saved: savedSettings, save: saveSettings } = useDashboardSave(2000);

  // Sous-navigation de l'onglet Paramètres : n'affiche qu'une section à la fois
  // (l'état des réglages est partagé + le bouton Enregistrer est global, donc switcher
  // de vue ne perd rien). Persisté comme la préférence de vue agenda.
  const [settingsSection, setSettingsSection] = useState<'agenda' | 'booking' | 'comm'>(() => {
    if (typeof window === 'undefined') return 'agenda';
    const saved = window.localStorage.getItem('qarte_planning_settings_section');
    return saved === 'booking' || saved === 'comm' ? saved : 'agenda';
  });
  const selectSettingsSection = (s: 'agenda' | 'booking' | 'comm') => {
    setSettingsSection(s);
    try { window.localStorage.setItem('qarte_planning_settings_section', s); } catch { /* quota/SSR */ }
  };

  // Service color map
  const serviceColorMap = useMemo(() => getServiceColorMap(services), [services]);

  // Service lookup map for O(1) access
  const serviceMap = useMemo(() => {
    const map = new Map<string, typeof services[0]>();
    for (const s of services) map.set(s.id, s);
    return map;
  }, [services]);

  const openBlockModal = useCallback((date: string) => {
    setBlockDate(date); setBlockEndDate(''); setBlockAllDay(false); setBlockReason(''); setShowBlockModal(true);
  }, []);

  // Date picker dropdown (header)
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Kebab menu (week-scoped actions)
  const [showActionsMenu, setShowActionsMenu] = useState(false);

  // Deposit failure being brought back (modal)
  const [bringBackFailure, setBringBackFailure] = useState<BookingDepositFailure | null>(null);

  // Agenda view mode — stays on 'day' during SSR/initial render, then the effect
  // hydrates from localStorage (user pref) or viewport width (>=1024px → week).
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  useEffect(() => {
    const saved = localStorage.getItem(VIEW_MODE_KEY);
    if ((VIEW_MODES as readonly string[]).includes(saved ?? '')) { setViewMode(saved as ViewMode); return; }
    if (window.matchMedia('(min-width: 1024px)').matches) setViewMode('week');
  }, []);
  const handleSetViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    try { localStorage.setItem(VIEW_MODE_KEY, mode); } catch { /* storage disabled */ }
  };

  usePullToRefreshRegister(async () => {
    invalidateUpcoming();
    await fetchSlots({ silent: true });
  });

  // Handle ?slot= deep link from dashboard
  const searchParams = useSearchParams();
  const [deepLinkSlotId, setDeepLinkSlotId] = useState<string | null>(() => searchParams.get('slot'));
  useEffect(() => {
    if (!deepLinkSlotId) return;
    setTab('reservations');
  }, [deepLinkSlotId, setTab]);

  // Handle ?date=YYYY-MM-DD deep link (from push notifications)
  useEffect(() => {
    const dateParam = searchParams.get('date');
    if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) return;
    const target = new Date(dateParam + 'T12:00:00');
    const now = getWeekStart(0);
    const diffMs = target.getTime() - now.getTime();
    const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
    setWeekOffset(diffWeeks);
  }, [searchParams, setWeekOffset]);

  // Deposit toggle + validation error
  const [depositEnabled, setDepositEnabled] = useState(false);
  const [depositOnlyForNew, setDepositOnlyForNew] = useState(false);
  const [depositError, setDepositError] = useState<string | null>(null);

  // Sync deposit toggle when merchant loads
  useEffect(() => {
    if (merchant) {
      setDepositEnabled(!!(merchant.deposit_link || merchant.deposit_percent || merchant.deposit_amount));
      setDepositOnlyForNew(!!merchant.deposit_only_for_new_customers);
    }
  }, [merchant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [showModeChoice, setShowModeChoice] = useState(false);
  const [missingHoursBlock, setMissingHoursBlock] = useState(false);
  const [missingLoyaltyBlock, setMissingLoyaltyBlock] = useState(false);
  // Pré-sélection 'free' : recommandé par défaut. Si horaires manquent, guard plus bas bloque la confirmation.
  const [pendingMode, setPendingMode] = useState<BookingMode | null>('free');
  const [homeServiceHelpOpen, setHomeServiceHelpOpen] = useState(false);

  // Auto-dismiss mode choice if real slots already exist
  useEffect(() => {
    if (showModeChoice && !loadingSlots && slots.some(s => !s.client_name)) {
      setShowModeChoice(false);
    }
  }, [showModeChoice, loadingSlots, slots]);

  // Manual booking modal (free mode)
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  useBodyScrollLock(showManualBookingModal);
  // Si non-null, on est en mode "rebook depuis archive d'acompte échoué" : à la création
  // réussie, on supprime l'archive correspondante (la résa originale ne reviendra pas).
  const [manualSourceFailureId, setManualSourceFailureId] = useState<string | null>(null);
  const [manualDate, setManualDate] = useState('');
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualServiceIds, setManualServiceIds] = useState<string[]>([]);
  const [manualCustomService, setManualCustomService] = useState<CustomServiceDraft | null>(null);
  const [manualNotes, setManualNotes] = useState('');
  const [manualShowSocial, setManualShowSocial] = useState(false);
  const [manualShowAllServices, setManualShowAllServices] = useState(false);
  const [manualGrantWelcome, setManualGrantWelcome] = useState(false);
  const [manualActiveOffers, setManualActiveOffers] = useState<Array<{ id: string; title: string }>>([]);
  const [manualGrantOfferId, setManualGrantOfferId] = useState<string | null>(null);
  const [savingManual, setSavingManual] = useState(false);
  const [manualError, setManualError] = useState<string | null>(null);
  const [manualConflict, setManualConflict] = useState<{ client_name: string; start_time: string; end_time: string } | null>(null);
  const [manualSendSms, setManualSendSms] = useState(false);
  const [manualStep, setManualStep] = useState<1 | 2>(1);
  // Home service: customer address (only used when homeServiceEnabled)
  const [manualCustomerAddress, setManualCustomerAddress] = useState('');
  const [manualCustomerLat, setManualCustomerLat] = useState<number | null>(null);
  const [manualCustomerLng, setManualCustomerLng] = useState<number | null>(null);

  const manualDuration = useMemo(() => {
    const catalog = manualServiceIds.reduce((sum, id) => sum + (serviceMap.get(id)?.duration ?? 30), 0);
    const custom = manualCustomService?.duration ?? 0;
    return (catalog + custom) || 30;
  }, [manualServiceIds, manualCustomService, serviceMap]);

  const manualEndTime = useMemo(() => {
    if (!manualStartTime) return '';
    return minutesToTime(timeToMinutes(manualStartTime) + manualDuration);
  }, [manualStartTime, manualDuration]);

  const manualTotalPrice = useMemo(() => {
    const catalog = manualServiceIds.reduce((sum, id) => sum + (serviceMap.get(id)?.price || 0), 0);
    const custom = manualCustomService?.price ?? 0;
    return catalog + custom;
  }, [manualServiceIds, manualCustomService, serviceMap]);

  // Helper unique pour ouvrir le modal manual booking — soit fresh (openManualBookingModal),
  // soit pré-rempli depuis une archive d'acompte échoué (openManualBookingFromFailure).
  // Reset systématique des flags transients (step/error/conflict/grants/SMS) puis applique le prefill.
  const openManualBookingModalWith = (prefill: {
    sourceFailureId: string | null;
    date: string;
    startTime: string;
    serviceIds: string[];
    customService: CustomServiceDraft | null;
    notes: string;
    draft: { clientName: string; clientPhone: string; customerId: string | null };
  }) => {
    setManualSourceFailureId(prefill.sourceFailureId);
    setManualDate(prefill.date);
    setManualStartTime(prefill.startTime);
    setManualServiceIds(prefill.serviceIds);
    setManualCustomService(prefill.customService);
    setManualNotes(prefill.notes);
    setManualShowSocial(false);
    setManualShowAllServices(false);
    setManualGrantWelcome(false);
    setManualGrantOfferId(null);
    setManualError(null);
    setManualConflict(null);
    setManualSendSms(false);
    setManualStep(1);
    setManualCustomerAddress('');
    setManualCustomerLat(null);
    setManualCustomerLng(null);
    updateDraft({
      clientName: prefill.draft.clientName,
      clientPhone: prefill.draft.clientPhone,
      customerId: prefill.draft.customerId,
      phoneCountry: merchant?.country as MerchantCountry || 'FR',
      instagramHandle: '', tiktokHandle: '', facebookUrl: '',
    });
    if (merchant?.id) {
      fetch(`/api/merchant-offers?merchantId=${merchant.id}&public=true`)
        .then(r => r.ok ? r.json() : { offers: [] })
        .then(d => setManualActiveOffers(d.offers || []))
        .catch(() => {});
    }
    setShowManualBookingModal(true);
  };

  const openManualBookingModal = (date: string) => openManualBookingModalWith({
    sourceFailureId: null,
    date,
    startTime: '09:00',
    serviceIds: [],
    customService: null,
    notes: '',
    draft: { clientName: '', clientPhone: '', customerId: null },
  });

  // À la création réussie, l'archive d'acompte échoué est supprimée automatiquement
  // (cf. handleManualBookingSubmit success path → manualSourceFailureId).
  const openManualBookingFromFailure = (failure: BookingDepositFailure) => {
    setBringBackFailure(null);
    openManualBookingModalWith({
      sourceFailureId: failure.id,
      date: failure.original_slot_date,
      startTime: failure.original_start_time.slice(0, 5),
      serviceIds: failure.service_ids || [],
      customService: failure.custom_service_duration ? {
        name: failure.custom_service_name || '',
        duration: failure.custom_service_duration,
        price: failure.custom_service_price || 0,
        color: failure.custom_service_color || '#4f46e5',
      } : null,
      notes: failure.notes || '',
      draft: {
        clientName: failure.client_name || '',
        clientPhone: failure.client_phone || '',
        customerId: failure.customer_id || null,
      },
    });
  };

  const handleManualBookingSubmit = async (force = false) => {
    if (!merchant || !manualDate || !draft.clientName.trim()) return;
    setSavingManual(true);
    setManualError(null);
    if (force) setManualConflict(null);
    try {
      const res = await fetch('/api/planning/manual-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          date: manualDate,
          start_time: manualStartTime,
          total_duration_minutes: manualDuration,
          client_name: draft.clientName.trim(),
          client_phone: draft.clientPhone.trim() || undefined,
          ...(draft.phoneCountry && { phone_country: draft.phoneCountry }),
          ...(draft.customerId && { customer_id: draft.customerId }),
          service_ids: manualServiceIds.length ? manualServiceIds : undefined,
          ...(manualCustomService && {
            custom_service_name: manualCustomService.name.trim() || null,
            custom_service_duration: manualCustomService.duration,
            custom_service_price: manualCustomService.price,
            custom_service_color: manualCustomService.color,
          }),
          notes: manualNotes.trim() || undefined,
          ...(homeServiceEnabled && manualCustomerAddress.trim() && {
            customer_address: manualCustomerAddress.trim(),
            ...(manualCustomerLat != null && manualCustomerLng != null && {
              customer_lat: manualCustomerLat,
              customer_lng: manualCustomerLng,
            }),
          }),
          ...(force && { force: true }),
          ...(manualSendSms && { send_sms: true }),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 409 && data.conflict) {
          setManualConflict(data.conflict);
          setManualStep(1); // Conflit de créneau → retour à l'étape 1 pour ajuster l'horaire
        }
        setManualError(data.error || t('saveError'));
        setSavingManual(false);
        return;
      }
      const bookingData = await res.json().catch(() => ({}));
      // Fire-and-forget voucher grants for new clients
      if (!draft.customerId && bookingData.customer_id) {
        if (manualGrantWelcome) {
          fetch('/api/vouchers/grant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: bookingData.customer_id, merchant_id: merchant.id, type: 'welcome' }),
          }).catch(() => {});
        }
        if (manualGrantOfferId) {
          fetch('/api/vouchers/grant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ customer_id: bookingData.customer_id, merchant_id: merchant.id, type: 'offer', offer_id: manualGrantOfferId }),
          }).catch(() => {});
        }
      }
      // Si on rebookait depuis une archive d'acompte échoué, on la supprime maintenant
      // que la résa est recréée ailleurs (sans relancer d'acompte — le merchant a déjà
      // décidé du flow dans le modal bring-back avant d'arriver ici).
      if (manualSourceFailureId) {
        deleteDepositFailure(manualSourceFailureId);
        setManualSourceFailureId(null);
      }
      await fetchSlots();
      invalidateUpcoming();
      setShowManualBookingModal(false);
      setManualServiceIds([]);
      setManualNotes('');
      const firstName = draft.clientName.trim().split(/\s+/)[0];
      addToast(t('toastBookingCreated', { name: firstName }), 'success');
    } catch {
      setManualError(t('saveError'));
    }
    setSavingManual(false);
  };

  // Block slot/period modal (unified)
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockEndDate, setBlockEndDate] = useState('');
  const [blockAllDay, setBlockAllDay] = useState(false);
  const [blockStartTime, setBlockStartTime] = useState('09:00');
  const [blockEndTime, setBlockEndTime] = useState('10:00');
  const [blockReason, setBlockReason] = useState('');
  const [savingBlock, setSavingBlock] = useState(false);
  const [confirmDeleteBlock, setConfirmDeleteBlock] = useState<string | null>(null);

  // Mode switch confirmation
  const [modeSwitchTarget, setModeSwitchTarget] = useState<BookingMode | null>(null);
  const [modeSwitchCleanup, setModeSwitchCleanup] = useState(false);
  const handleBookingModeChange = (mode: BookingMode) => {
    if (mode === bookingMode) return;
    setModeSwitchTarget(mode);
  };
  const confirmModeSwitch = async () => {
    if (!modeSwitchTarget || !merchant) return;
    if (modeSwitchTarget === 'free' && !hasValidOpeningHours(merchant.opening_hours)) {
      setModeSwitchTarget(null);
      setMissingHoursBlock(true);
      return;
    }
    setModeSwitchCleanup(true);
    try {
      const res = await fetch('/api/planning/switch-mode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, targetMode: modeSwitchTarget }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        if (err?.error) console.error('[switch-mode]', err.error);
        addToast(t('errorGeneric'), 'error');
        return;
      }
      setBookingMode(modeSwitchTarget);
      if (modeSwitchTarget === 'free') setAutoBookingEnabled(true);
      await Promise.all([fetchSlots(), refetch().catch(() => {})]);
    } finally {
      setModeSwitchCleanup(false);
      setModeSwitchTarget(null);
    }
  };

  // SMS usage
  const [smsUsage, setSmsUsage] = useState<{ sent: number; remaining: number; quota: number; packBalance: number } | null>(null);
  useEffect(() => {
    if (!merchant || tab !== 'settings') return;
    fetch(`/api/sms/usage?merchantId=${merchant.id}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setSmsUsage(data); })
      .catch(() => {});
  }, [merchant, tab]);

  // Push notifications
  const {
    pushSupported,
    pushPermission,
    pushSubscribing,
    pushSubscribed,
    pushError,
    subscribe: subscribePush,
    isIOS,
    isStandalone,
  } = useMerchantPushNotifications();

  const handleConfirmDeposit = async (slot: PlanningSlot, sendSms = false) => {
    if (!merchant) return;
    try {
      const res = await fetch('/api/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.id,
          merchantId: merchant.id,
          client_name: slot.client_name,
          deposit_confirmed: true,
          ...(sendSms && { send_sms: true }),
        }),
      });
      if (!res.ok) { setDepositError(t('saveError')); return; }
    } catch {
      setDepositError(t('saveError')); return;
    }
    setDepositError(null);
    invalidateUpcoming();
    await fetchSlots();
    addToast(t('toastDepositConfirmed'), 'success');
  };

  const handleCancelDeposit = async (slot: PlanningSlot) => {
    if (!merchant) return;
    try {
      const res = await fetch('/api/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slot.id,
          merchantId: merchant.id,
          client_name: slot.client_name,
          deposit_confirmed: false,
        }),
      });
      if (!res.ok) { setDepositError(t('saveError')); return; }
    } catch {
      setDepositError(t('saveError')); return;
    }
    setDepositError(null);
    invalidateUpcoming();
    await fetchSlots();
  };

  const handleSaveSettings = async () => {
    if (!merchant) return;
    // Validate deposit config: if enabled, link + amount are both required
    if (autoBookingEnabled && depositEnabled) {
      const hasLink = !!depositLink.trim();
      const hasAmount = !!(depositPercent || depositAmount);
      if (hasAmount && !hasLink) { setDepositError(t('depositLinkRequired')); return; }
      if (hasLink && !hasAmount) { setDepositError(t('depositAmountRequired')); return; }
      if (depositPercent && parseInt(depositPercent) > 100) { setDepositError(t('depositPercentMax')); return; }
    }
    // Geocode shop address when home service mode is being enabled.
    // Required so we can compute travel from merchant home → 1st client of the day.
    let shopLat: number | null = merchant.shop_lat ?? null;
    let shopLng: number | null = merchant.shop_lng ?? null;
    if (homeServiceEnabled && (shopLat == null || shopLng == null)) {
      if (!merchant.shop_address) {
        addToast(t('homeServiceNeedsAddress'), 'error');
        return;
      }
      try {
        const res = await fetch(
          `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(merchant.shop_address)}&limit=1`
        );
        const data = await res.json();
        const feature = data.features?.[0];
        if (!feature) {
          addToast(t('homeServiceGeocodeFailed'), 'error');
          return;
        }
        shopLng = feature.geometry.coordinates[0];
        shopLat = feature.geometry.coordinates[1];
      } catch {
        addToast(t('homeServiceGeocodeFailed'), 'error');
        return;
      }
    }
    setDepositError(null);
    saveSettings(async () => {
      const { error } = await supabase.from('merchants').update({
        planning_message: messageEnabled && message.trim() ? message.trim() : null,
        planning_message_expires: messageEnabled && messageExpires ? messageExpires : null,
        booking_message: bookingMessage.trim() || null,
        auto_booking_enabled: autoBookingEnabled,
        deposit_link: autoBookingEnabled && depositEnabled ? normalizePaymentLink(depositLink) : null,
        // Label auto-détecté depuis l'URL (Revolut/PayPal/Stripe...). NULL si non reconnu → fallback "Payer" côté UI.
        deposit_link_label: autoBookingEnabled && depositEnabled
          ? detectPaymentProvider(normalizePaymentLink(depositLink) || '')
          : null,
        deposit_link_2: autoBookingEnabled && depositEnabled ? normalizePaymentLink(depositLink2) : null,
        deposit_link_2_label: autoBookingEnabled && depositEnabled
          ? detectPaymentProvider(normalizePaymentLink(depositLink2) || '')
          : null,
        deposit_percent: autoBookingEnabled && depositEnabled && depositPercent ? parseInt(depositPercent) : null,
        deposit_amount: autoBookingEnabled && depositEnabled && depositAmount ? parseFloat(depositAmount) : null,
        deposit_deadline_hours: autoBookingEnabled && depositEnabled && depositDeadlineHours ? parseInt(depositDeadlineHours) : null,
        deposit_only_for_new_customers: autoBookingEnabled && depositEnabled ? depositOnlyForNew : false,
        allow_customer_cancel: allowCustomerCancel,
        allow_customer_reschedule: allowCustomerReschedule,
        cancel_deadline_days: parseInt(cancelDeadlineDays) || 1,
        reschedule_deadline_days: parseInt(rescheduleDeadlineDays) || 1,
        recurring_followup_enabled: autoBookingEnabled && recurringFollowupEnabled,
        booking_mode: bookingMode,
        buffer_minutes: bufferMinutes,
        booking_horizon_days: bookingHorizonDays,
        home_service_enabled: homeServiceEnabled,
        home_service_radius_km: homeServiceEnabled ? homeServiceRadiusKm : null,
        shop_lat: shopLat,
        shop_lng: shopLng,
        hide_address_on_public_page: hideAddressOnPublicPage,
      }).eq('id', merchant.id);
      if (error) {
        console.error('Settings save error:', error);
        throw error;
      }
      refetch().catch(() => {});
      fetch('/api/dashboard/revalidate-merchant-page', { method: 'POST' }).catch(() => {});
    });
  };

  const onDownloadStory = useCallback(async () => {
    if (!merchant || slots.length === 0) return;
    await handleDownloadStory({ merchant, slots, slotsByDate, weekStart, weekEnd, locale });
  }, [merchant, slots, slotsByDate, weekStart, weekEnd, locale]);

  const handleGoToToday = () => setSelectedDay(new Date());

  // Selected day data
  const selectedDayStr = formatDate(selectedDay);
  const selectedDaySlots = slotsByDate.get(selectedDayStr) || [];
  const selectedDayIsPast = isPast(selectedDay);
  const selectedDayIsToday = isToday(selectedDay);
  const selectedDayFreeCount = selectedDaySlots.filter(s => !s.client_name).length;

  const twoDaysRange = useMemo(() => {
    const next = new Date(selectedDay);
    next.setDate(next.getDate() + 1);
    return [selectedDay, next];
  }, [selectedDay]);

  // Open bulk delete confirmation for a given day or the whole week
  const openBulkDelete = (scope: 'day' | 'week') => {
    const targetSlots = scope === 'day'
      ? selectedDaySlots
      : weekDays.flatMap(day => slotsByDate.get(formatDate(day)) || []);
    const emptySlots = targetSlots.filter(s => !s.client_name);
    const bookedCount = targetSlots.length - emptySlots.length;
    const label = scope === 'day'
      ? selectedDay.toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long' })
      : '';
    setModalState({
      type: 'bulk-delete',
      scope,
      slotIds: emptySlots.map(s => s.id),
      emptyCount: emptySlots.length,
      bookedCount,
      label,
    });
  };

  if (merchantLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  if (!getPlanFeatures(merchant).planning) {
    return (
      <div className="max-w-3xl mx-auto py-10">
        <PlanUpgradeCTA
          title={t('upgradeTitle')}
          description={t('upgradeDesc')}
        />
      </div>
    );
  }

  const planningEnabled = !!merchant?.planning_enabled;
  const isFreeMod = bookingMode === 'free';
  const phonePlaceholder = PHONE_CONFIG[merchant?.country || 'FR'].placeholder;
  const pendingFreeBlocked = pendingMode === 'free' && !hasValidOpeningHours(merchant?.opening_hours);

  const handleTogglePlanningWrapper = async (enabled: boolean) => {
    // Bloque l'activation si le programme de fidélité n'est pas configuré : sinon
    // les clientes qui réservent reçoivent une carte vide (récompense indéfinie).
    if (enabled && !merchant?.reward_description) {
      setMissingLoyaltyBlock(true);
      return;
    }
    // booking_mode a un DEFAULT 'slots' côté DB, donc on ne peut pas l'utiliser pour
    // détecter une première activation : on se base sur planningEnabled à la place.
    if (enabled && !planningEnabled && !slots.length) setShowModeChoice(true);
    await handleTogglePlanning(enabled);
  };

  const handleToggleHomeService = () => {
    if (homeServiceEnabled) {
      setHomeServiceEnabled(false);
      return;
    }
    if (!merchant?.shop_address) {
      addToast(t('homeServiceMissingAddressBlock'), 'error');
      return;
    }
    setHomeServiceEnabled(true);
    // Pré-remplit le rayon à 20 km à la 1ère activation (valeur médiane pour
    // une pro mobile urbaine/péri-urbaine). Si la merchant avait déjà un rayon
    // (réactivation), on respecte sa valeur précédente.
    if (homeServiceRadiusKm == null) {
      setHomeServiceRadiusKm(20);
    }
    // Privacy default: when activating home service, propose hiding the address
    // (it's likely the merchant's home). Merchant can untick the sub-toggle.
    if (!merchant.hide_address_on_public_page) {
      setHideAddressOnPublicPage(true);
    }
  };

  const handleModeChoice = async (mode: BookingMode) => {
    if (!merchant) return;
    if (mode === 'free' && !hasValidOpeningHours(merchant.opening_hours)) return;
    // Resa en ligne forcement activee a l'activation du planning. Le merchant peut
    // toujours la desactiver plus tard dans Parametres > Resa en ligne.
    setBookingMode(mode);
    setAutoBookingEnabled(true);
    await supabase
      .from('merchants')
      .update({ booking_mode: mode, auto_booking_enabled: true })
      .eq('id', merchant.id);
    await refetch();
    setShowModeChoice(false);
    setPendingMode(null);
  };

  const handleBlockSubmit = async () => {
    if (!merchant || !blockDate) return;
    if (!blockAllDay && (!blockStartTime || !blockEndTime || blockStartTime >= blockEndTime)) return;
    setSavingBlock(true);
    try {
      const res = blockAllDay
        ? await fetch('/api/planning/block-vacation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchantId: merchant.id,
              startDate: blockDate,
              endDate: blockEndDate || blockDate,
              reason: blockReason.trim() || undefined,
            }),
          })
        : await fetch('/api/planning/block-slot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              merchantId: merchant.id,
              date: blockDate,
              endDate: blockEndDate || undefined,
              start_time: blockStartTime,
              end_time: blockEndTime,
              reason: blockReason.trim() || undefined,
            }),
          });
      if (!res.ok) { setDepositError(t('saveError')); setSavingBlock(false); return; }
      await fetchSlots();
      setShowBlockModal(false);
      setBlockReason('');
      setBlockEndDate('');
    } catch { /* */ }
    setSavingBlock(false);
  };

  return (
    <div className="max-w-5xl md:max-w-none mx-auto">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
            <CalendarDays className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{t('title')}</h1>
            <p className="text-xs text-gray-400">
              {planningEnabled ? t('visiblePublic') : t('hiddenPublic')}
            </p>
          </div>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={planningEnabled}
          onClick={() => handleTogglePlanningWrapper(!planningEnabled)}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${planningEnabled ? 'bg-indigo-600' : 'bg-gray-200'} ${saving ? 'opacity-50' : ''}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${planningEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* ── TABS (3 tabs, only when planning enabled) — compact segmented control ── */}
      {planningEnabled && (() => {
        const TAB_META: Record<'slots' | 'reservations' | 'settings', { icon: typeof Clock; activeColor: string }> = {
          slots: { icon: Clock, activeColor: 'text-cyan-700' },
          reservations: { icon: CalendarDays, activeColor: 'text-indigo-700' },
          settings: { icon: Settings, activeColor: 'text-slate-700' },
        };
        return (
          <div className="sticky top-[calc(48px+env(safe-area-inset-top))] lg:static z-30 -mx-4 px-4 pt-2 pb-3 mb-3 bg-[#f8fafc]/95 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none lg:mx-0 lg:px-0 lg:py-0 lg:mb-5">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl lg:max-w-md">
            {(['slots', 'reservations', 'settings'] as const).map(tabKey => {
              const Icon = TAB_META[tabKey].icon;
              const active = tab === tabKey;
              const label = tabKey === 'slots' ? t('tabSlots') : tabKey === 'reservations' ? t('tabReservations') : t('tabSettings');
              return (
                <button
                  key={tabKey}
                  onClick={() => {
                    setTab(tabKey);
                    if (tabKey === 'reservations' && merchant?.planning_enabled) {
                      state.fetchReservations();
                    }
                  }}
                  className={`flex items-center justify-center gap-1.5 flex-1 py-2 px-2 rounded-lg text-[13px] font-semibold transition-all duration-150 touch-manipulation ${
                    active
                      ? `bg-white shadow-sm ${TAB_META[tabKey].activeColor}`
                      : 'text-gray-500 active:bg-white/50'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${active ? TAB_META[tabKey].activeColor : 'text-gray-400'}`} strokeWidth={2.25} />
                  {label}
                </button>
              );
            })}
          </div>
          </div>
        );
      })()}

      {/* Global error banner */}
      {depositError && (
        <div className="flex gap-2.5 rounded-xl bg-red-50 border border-red-200 px-3 sm:px-4 py-3 mb-4">
          <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <p className="text-xs text-red-600 font-medium">{depositError}</p>
          <button onClick={() => setDepositError(null)} className="ml-auto text-red-400 hover:text-red-600 shrink-0"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── PLANNING DISABLED: activation screen ── */}
      {!planningEnabled && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 max-w-md mx-auto">
          <div className="text-center mb-5">
            <CalendarDays className="w-10 h-10 text-indigo-500 mx-auto mb-3" />
            <p className="text-base font-bold text-gray-900 mb-1">{t('disabledTitle')}</p>
            <p className="text-xs text-gray-500">{t('disabledHint')}</p>
          </div>
          <ul className="space-y-3.5">
            {([
              { Icon: CalendarCheck, n: 1 as const },
              { Icon: LayoutGrid, n: 2 as const },
              { Icon: MapPin, n: 3 as const },
              { Icon: MessageSquare, n: 4 as const },
              { Icon: CreditCard, n: 5 as const },
            ]).map(({ Icon, n }) => (
              <li key={n} className="flex items-start gap-3">
                <span className="shrink-0 mt-0.5 w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-indigo-600" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 leading-tight">
                    {t(`disabledFeat${n}Title` as 'disabledFeat1Title')}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                    {n === 2
                      ? t.rich('disabledFeat2Desc', { b: (chunks) => <strong className="font-semibold text-gray-700">{chunks}</strong> })
                      : t(`disabledFeat${n}Desc` as 'disabledFeat1Desc')}
                  </p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-[11px] text-gray-400 italic text-center mt-5 pt-4 border-t border-gray-100">
            {t('disabledFooter')}
          </p>
        </div>
      )}

      {/* ── TAB: CRENEAUX ── */}
      {planningEnabled && tab === 'slots' && (
        <>
          {showModeChoice ? (
            /* ── MODE CHOICE SCREEN (first activation) — pick mode + online booking together ── */
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-1">{t('modeChoiceTitle')}</h2>
                <p className="text-xs text-gray-400">{t('modeChoiceSubtitle')}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                {(['slots', 'free'] as const).map(mode => {
                  const selected = pendingMode === mode;
                  return (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPendingMode(mode)}
                      className={`text-left bg-white rounded-2xl border-2 shadow-sm p-5 transition-all relative ${
                        selected
                          ? 'border-indigo-500 ring-2 ring-indigo-100 shadow-md'
                          : 'border-gray-100 hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      {selected && (
                        <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center">
                          <Check className="w-3 h-3 text-white" />
                        </span>
                      )}
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${selected ? 'bg-indigo-100' : 'bg-indigo-50'}`}>
                        {mode === 'slots' ? <LayoutGrid className="w-4.5 h-4.5 text-indigo-600" /> : <Clock className="w-4.5 h-4.5 text-indigo-600" />}
                      </div>
                      <p className="text-sm font-bold text-gray-900 mb-1.5">
                        {mode === 'slots' ? t('modeChoiceSlotTitle') : t('modeChoiceFreeTitle')}
                      </p>
                      <p className="text-[11px] text-gray-400 leading-relaxed">
                        {mode === 'slots' ? t('modeChoiceSlotDesc') : t('modeChoiceFreeDesc')}
                      </p>
                    </button>
                  );
                })}
              </div>

              {pendingFreeBlocked && (
                <div className="mb-4 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800">
                  {t('modeFreeMissingHours')}{' '}
                  <a href="/dashboard/public-page" className="font-semibold underline">{t('modeFreeMissingHoursLink')}</a>
                </div>
              )}
              <button
                type="button"
                disabled={!pendingMode || pendingFreeBlocked}
                onClick={() => pendingMode && handleModeChoice(pendingMode)}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {t('modeChoiceConfirm')}
              </button>
              <p className="text-center text-[11px] text-gray-400 mt-3">{t('modeChoiceEditableLater')}</p>
            </div>
          ) : (
            <>
              {/* ── Navigation + actions ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 mb-4">
                {/* Week range nav (flèches + range + date picker icon) */}
                <div className="flex items-center justify-center gap-3 mb-3 relative">
                  {/* Jump-to-date icon button (left) */}
                  <div className="relative">
                    <button
                      onClick={() => setShowDatePicker(v => !v)}
                      className="p-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
                      aria-label={t('backToToday')}
                    >
                      <Calendar className={`w-4 h-4 ${showDatePicker ? 'text-indigo-600' : 'text-gray-400'}`} />
                    </button>
                    {showDatePicker && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowDatePicker(false)} />
                        <div className="absolute left-0 top-full mt-2 z-20 bg-white rounded-xl shadow-xl border border-gray-200 p-3">
                          <input
                            type="date"
                            value={selectedDayStr}
                            onChange={(e) => {
                              if (!e.target.value) return;
                              setSelectedDay(new Date(e.target.value + 'T12:00:00'));
                              setShowDatePicker(false);
                            }}
                            className="px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                          />
                          {!selectedDayIsToday && (
                            <button
                              onClick={() => { handleGoToToday(); setShowDatePicker(false); }}
                              className="block w-full mt-2 px-3 py-2 rounded-lg text-xs font-semibold text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              {t('backToToday')}
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      // Shift selectedDay along with the week to keep it inside the new range
                      // (otherwise the sync effect bounces weekOffset back immediately)
                      const d = new Date(selectedDay);
                      d.setDate(d.getDate() - 7);
                      setSelectedDay(d);
                      setWeekOffset(o => o - 1);
                    }}
                    disabled={weekOffset <= -1}
                    className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label={t('previousWeek')}
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                  </button>
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-xs md:text-sm font-semibold text-gray-900">
                      {t('weekNumber', { n: getISOWeekNumber(weekStart) })}
                    </span>
                    <span className="text-[10px] md:text-xs text-gray-500 tabular-nums">
                      {weekStart.toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' })} — {weekEnd.toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      const d = new Date(selectedDay);
                      d.setDate(d.getDate() + 7);
                      setSelectedDay(d);
                      setWeekOffset(o => o + 1);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                    aria-label={t('nextWeek')}
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>
                  {/* View mode toggle — mobile: 1j / 2j | tablette+: jour / semaine */}
                  <div className="md:hidden inline-flex items-center bg-gray-100 p-0.5 rounded-lg ml-1">
                    <button
                      onClick={() => handleSetViewMode('day')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                    >
                      {t('viewDay')}
                    </button>
                    <button
                      onClick={() => handleSetViewMode('2day')}
                      className={`px-2 py-1 rounded-md text-[11px] font-semibold transition-colors ${viewMode === '2day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
                    >
                      {t('view2Day')}
                    </button>
                  </div>
                  <div className="hidden md:inline-flex items-center bg-gray-100 p-0.5 rounded-lg ml-1">
                    <button
                      onClick={() => handleSetViewMode('day')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${viewMode === 'day' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {t('viewDay')}
                    </button>
                    <button
                      onClick={() => handleSetViewMode('week')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${viewMode === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      {t('viewWeek')}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1.5 mb-3">
                  {weekDays.map(day => {
                    const dayStr = formatDate(day);
                    const past = isPast(day);
                    const today = isToday(day);
                    const isSelected = dayStr === selectedDayStr;
                    const daySlotsList = slotsByDate.get(dayStr) || [];
                    const bookingsCount = daySlotsList.filter(s => s.client_name && s.client_name !== '__blocked__').length;
                    return (
                      <button
                        key={dayStr}
                        onClick={() => setSelectedDay(day)}
                        className={`relative flex flex-col items-center justify-center py-2 px-0.5 rounded-xl border transition-all ${
                          isSelected
                            ? 'bg-slate-900 border-slate-900'
                            : today
                              ? 'bg-indigo-50 border-indigo-300 hover:bg-indigo-100'
                              : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`text-[10px] font-semibold capitalize leading-none mb-1 ${
                          isSelected ? 'text-white/90' : today ? 'text-indigo-600' : past ? 'text-gray-300' : 'text-gray-500'
                        }`}>
                          {day.toLocaleDateString(toBCP47(locale), { weekday: 'short' }).replace('.', '')}
                        </span>
                        <span className={`text-lg font-bold leading-none tabular-nums ${
                          isSelected ? 'text-white' : today ? 'text-indigo-700' : past ? 'text-gray-300' : 'text-gray-900'
                        }`}>
                          {day.getDate()}
                        </span>
                        {bookingsCount > 0 && (
                          <span className={`mt-1 min-w-[18px] h-[14px] px-1 inline-flex items-center justify-center rounded-full text-[9px] font-bold tabular-nums ${
                            isSelected
                              ? 'bg-white text-indigo-700'
                              : today
                                ? 'bg-indigo-600 text-white'
                                : past
                                  ? 'bg-gray-200 text-gray-400'
                                  : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {bookingsCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Actions row — 2/3 ajouter resa + 1/3 bloquer + kebab. */}
                {!selectedDayIsPast && (
                  <div className="flex gap-2 items-center">
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      {isFreeMod ? (
                        <button
                          onClick={() => openManualBookingModal(selectedDayStr)}
                          className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          {t('addManualBooking')}
                        </button>
                      ) : (
                        <button
                          onClick={() => openAddSlotsModal(selectedDayStr)}
                          className="col-span-2 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all"
                        >
                          <Plus className="w-3.5 h-3.5 shrink-0" />
                          {t('addSlotsTitle')}
                        </button>
                      )}
                      <button
                        onClick={() => openBlockModal(selectedDayStr)}
                        className="col-span-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-200 transition-all"
                        title={t('blockSlot')}
                      >
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        <span>{t('blockSlotShort')}</span>
                      </button>
                    </div>

                    {/* Kebab menu — week-scoped actions (hidden in mode libre if rien à supprimer) */}
                    {(!isFreeMod || selectedDayFreeCount > 0 || freeSlots > 0) && (
                    <div className="relative z-30">
                      <button
                        onClick={() => setShowActionsMenu(v => !v)}
                        className="flex items-center justify-center p-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-500 hover:bg-gray-100 transition-colors"
                        aria-label={t('moreActions')}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {showActionsMenu && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setShowActionsMenu(false)} />
                          <div className="absolute right-0 top-full mt-2 z-30 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-1.5">
                            {!isFreeMod && (
                              <button
                                onClick={() => { onDownloadStory(); setShowActionsMenu(false); }}
                                disabled={slots.length === 0}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                <Download className="w-4 h-4" />
                                <span className="font-medium">{t('downloadStoryWeek')}</span>
                              </button>
                            )}
                            {!isFreeMod && (
                              <button
                                onClick={() => { setModalState({ type: 'copy-week' }); setShowActionsMenu(false); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-700 transition-colors"
                              >
                                <Copy className="w-4 h-4" />
                                <span className="font-medium">{t('copyWeek')}</span>
                              </button>
                            )}
                            {selectedDayFreeCount > 0 && (
                              <button
                                onClick={() => { openBulkDelete('day'); setShowActionsMenu(false); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="font-medium">{t('deleteFreeDay')}</span>
                              </button>
                            )}
                            {freeSlots > 0 && (
                              <button
                                onClick={() => { openBulkDelete('week'); setShowActionsMenu(false); }}
                                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                <span className="font-medium">{t('deleteFreeWeek')}</span>
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                    )}
                  </div>
                )}
              </div>

              {/* Copy week picker */}
              <AnimatePresence mode="wait">
                {modalState.type === 'copy-week' && (
                  <CopyWeekModal
                    weekOffset={weekOffset}
                    saving={saving}
                    onCopyWeek={handleCopyWeek}
                    onClose={closeModal}
                  />
                )}
                {modalState.type === 'bulk-delete' && (
                  <ConfirmDeleteSlotsModal
                    scope={modalState.scope}
                    label={modalState.label}
                    emptyCount={modalState.emptyCount}
                    bookedCount={modalState.bookedCount}
                    saving={saving}
                    onConfirm={() => handleBulkDeleteSlots(modalState.type === 'bulk-delete' ? modalState.slotIds : [])}
                    onClose={closeModal}
                  />
                )}
              </AnimatePresence>

              {saved && (
                <div className="mb-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium text-center">
                  {t('weekCopied')}
                </div>
              )}

              {/* ── TIMELINE : DayView (par défaut) ou WeekView (tablette/desktop, ou override) ── */}
              {loadingSlots ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : viewMode === 'week' ? (
                <WeekView
                  weekDays={weekDays}
                  slotsByDate={slotsByDate}
                  services={services}
                  serviceColorMap={serviceColorMap}
                  locale={locale}
                  selectedDay={selectedDay}
                  isFreeMod={isFreeMod}
                  openingHours={merchant?.opening_hours || null}
                  country={merchant?.country || null}
                  depositPercent={merchant?.deposit_percent ?? null}
                  depositAmount={merchant?.deposit_amount ?? null}
                  onSlotClick={openEditSlot}
                  onBlockedSlotClick={setConfirmDeleteBlock}
                  onDayClick={setSelectedDay}
                  isToday={isToday}
                  isPast={isPast}
                />
              ) : viewMode === '2day' ? (
                <WeekView
                  weekDays={twoDaysRange}
                  slotsByDate={slotsByDate}
                  services={services}
                  serviceColorMap={serviceColorMap}
                  locale={locale}
                  selectedDay={selectedDay}
                  secondarySelectedStr={formatDate(twoDaysRange[1])}
                  isFreeMod={isFreeMod}
                  openingHours={merchant?.opening_hours || null}
                  country={merchant?.country || null}
                  depositPercent={merchant?.deposit_percent ?? null}
                  depositAmount={merchant?.deposit_amount ?? null}
                  onSlotClick={openEditSlot}
                  onBlockedSlotClick={setConfirmDeleteBlock}
                  onDayClick={setSelectedDay}
                  isToday={isToday}
                  isPast={isPast}
                />
              ) : (
                <DayView
                  day={selectedDay}
                  daySlots={selectedDaySlots}
                  services={services}
                  serviceColorMap={serviceColorMap}
                  locale={locale}
                  isPast={selectedDayIsPast}
                  isToday={selectedDayIsToday}
                  isFreeMod={isFreeMod}
                  openingHours={merchant?.opening_hours || null}
                  country={merchant?.country || null}
                  depositPercent={merchant?.deposit_percent ?? null}
                  depositAmount={merchant?.deposit_amount ?? null}
                  onSlotClick={openEditSlot}
                  onBlockedSlotClick={setConfirmDeleteBlock}
                  onAddSlots={openAddSlotsModal}
                />
              )}
            </>
          )}
        </>
      )}

      {/* ── TAB: RESERVATIONS ── */}
      {planningEnabled && tab === 'reservations' && (
        <ReservationsSection
          slots={upcomingSlots}
          services={services}
          serviceColorMap={serviceColorMap}
          locale={locale}
          merchantCountry={merchant?.country || 'FR'}
          merchantSlug={merchant?.slug || null}
          onEditSlot={openEditSlot}
          deepLinkSlotId={deepLinkSlotId}
          onDeepLinkHandled={() => setDeepLinkSlotId(null)}
          depositFailures={depositFailures}
          onBringBackFailure={setBringBackFailure}
          onDeleteFailure={deleteDepositFailure}
        />
      )}

      {/* (Online tab removed — toggle moved to header, config merged into Settings) */}

      {/* ── TAB: PARAMETRES ── */}
      {planningEnabled && tab === 'settings' && (
        <div className="space-y-6 pb-20 lg:pb-24">

          {/* Sous-navigation : une seule section affichée à la fois (allège le scroll mobile).
              Chaque section a sa couleur : la pilule active prend la couleur de sa section. */}
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl lg:max-w-md">
            {([
              ['agenda', t('settingsNavAgenda'), 'bg-indigo-600'],
              ['booking', t('settingsNavBooking'), 'bg-emerald-600'],
              ['comm', t('settingsNavComm'), 'bg-violet-600'],
            ] as const).map(([key, label, activeBg]) => {
              const active = settingsSection === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => selectSettingsSection(key)}
                  className={`flex-1 py-1.5 px-2 rounded-lg text-[12px] font-semibold transition-all duration-150 touch-manipulation ${
                    active ? `${activeBg} text-white shadow-sm` : 'text-gray-500 active:bg-white/50'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* ═══════ SECTION 1: MON AGENDA ═══════ */}
          {settingsSection === 'agenda' && (
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2 px-1">{t('sectionAgenda')}</h3>
            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">

              {/* Card: Mode de planning */}
              <SettingCard icon={Calendar} title={t('bookingModeTitle')} className="sm:col-span-2">
                <div className="grid grid-cols-2 gap-2">
                  {(['slots', 'free'] as const).map(mode => {
                    const isActive = bookingMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleBookingModeChange(mode)}
                        className={`text-left rounded-xl border p-3 transition-all ${isActive ? 'bg-slate-800 border-slate-800' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
                      >
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <p className={`text-xs font-bold ${isActive ? 'text-white' : 'text-gray-700'}`}>
                            {mode === 'slots' ? t('bookingModeSlots') : t('bookingModeFree')}
                          </p>
                          {isActive && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-white text-indigo-700 text-[9px] font-bold shrink-0">
                              <Check className="w-2.5 h-2.5" />
                            </span>
                          )}
                        </div>
                        <p className={`text-[11px] leading-relaxed ${isActive ? 'text-white/80' : 'text-gray-500'}`}>
                          {mode === 'slots' ? t('bookingModeSlotHint') : t('bookingModeFreeHint')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </SettingCard>

              {/* Card: Tampon entre les RDV (mode libre uniquement) */}
              {bookingMode === 'free' && (
                <SettingCard icon={Clock} title={t('bufferTitle')}>
                  <p className="text-[11px] text-gray-500 mb-3">{t('bufferHint')}</p>
                  <ChipGroup
                    fill
                    options={[0, 10, 15, 20].map(v => ({ value: String(v), label: v === 0 ? t('bufferNone') : `${v} min` }))}
                    value={String(bufferMinutes)}
                    onChange={(v) => setBufferMinutes(Number(v) as 0 | 10 | 15 | 20 | 30)}
                  />
                </SettingCard>
              )}

              {/* Hint: horaires depuis la vitrine (mode libre uniquement) */}
              {bookingMode === 'free' && (
                <Callout variant="indigo">
                  {t('bookingModeFreeHoursHint')}{' '}
                  <a href="/dashboard/public-page" className="font-semibold underline underline-offset-2 hover:text-indigo-900">
                    {t('bookingModeFreeHoursLink')}
                  </a>
                </Callout>
              )}

            </div>
          </section>
          )}

          {/* ═══════ SECTION 2: RÉSERVATION EN LIGNE ═══════ */}
          {settingsSection === 'booking' && (
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2 px-1">{t('sectionOnlineBooking')}</h3>
            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">

              {/* Card: Résa en ligne (toggle) — tête de section, toujours visible */}
              <SettingCard
                icon={Globe}
                title={t('autoBookingTitle')}
                tone="emerald"
                className="sm:col-span-2"
                headerRight={<Switch checked={autoBookingEnabled} onChange={setAutoBookingEnabled} tone="emerald" size="md" ariaLabel={t('autoBookingTitle')} />}
              >
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {autoBookingEnabled ? t('autoBookingHint', { days: bookingHorizonDays }) : t('autoBookingOffHint')}
                </p>
                {autoBookingEnabled && merchant?.booking_url && (
                  <Callout variant="warning" icon={AlertTriangle} className="mt-3">
                    {t('externalBookingWarning')}
                  </Callout>
                )}
              </SettingCard>

          {autoBookingEnabled && (
            <>
              {/* Card: Horizon de réservation (les 2 modes) */}
              <SettingCard icon={CalendarRange} title={t('horizonTitle')} tone="emerald" className="sm:col-span-2">
                <p className="text-[11px] text-gray-500 mb-3">{t('horizonHint')}</p>
                <ChipGroup
                  fill
                  options={BOOKING_HORIZON_OPTIONS.map(v => ({ value: String(v), label: t('horizonMonths', { n: v / 30 }) }))}
                  value={String(bookingHorizonDays)}
                  onChange={(v) => setBookingHorizonDays(Number(v) as BookingHorizonDays)}
                />
              </SettingCard>

              {/* Card: Conditions de reservation */}
              <SettingCard icon={Phone} title={t('bookingTitle')} tone="emerald" className="sm:col-span-2">
                <p className="text-[11px] text-gray-500 mb-3">{t('bookingHint')}</p>
                <textarea
                  value={bookingMessage}
                  onChange={(e) => setBookingMessage(e.target.value)}
                  placeholder={t('bookingPlaceholder')}
                  maxLength={500}
                  rows={4}
                  className="w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                />
                <p className="text-[10px] text-gray-400 text-right mt-1">{bookingMessage.length}/500</p>
              </SettingCard>

              <DepositCard
                enabled={depositEnabled}
                onEnabledChange={setDepositEnabled}
                link={depositLink}
                onLinkChange={setDepositLink}
                link2={depositLink2}
                onLink2Change={setDepositLink2}
                percent={depositPercent}
                onPercentChange={setDepositPercent}
                amount={depositAmount}
                onAmountChange={setDepositAmount}
                onlyForNew={depositOnlyForNew}
                onOnlyForNewChange={setDepositOnlyForNew}
                deadlineHours={depositDeadlineHours}
                onDeadlineHoursChange={setDepositDeadlineHours}
                country={merchant?.country}
              />
              <CustomerEditCard
                cancelEnabled={allowCustomerCancel}
                onCancelEnabledChange={setAllowCustomerCancel}
                cancelDeadlineDays={cancelDeadlineDays}
                onCancelDeadlineDaysChange={setCancelDeadlineDays}
                rescheduleEnabled={allowCustomerReschedule}
                onRescheduleEnabledChange={setAllowCustomerReschedule}
                rescheduleDeadlineDays={rescheduleDeadlineDays}
                onRescheduleDeadlineDaysChange={setRescheduleDeadlineDays}
              />
              {autoBookingEnabled && (
                <FollowupCard
                  enabled={recurringFollowupEnabled}
                  onEnabledChange={setRecurringFollowupEnabled}
                  bookingMode={bookingMode}
                  bookingHorizonDays={bookingHorizonDays}
                />
              )}
              {bookingMode === 'free' && (
                <HomeServiceCard
                  enabled={homeServiceEnabled}
                  onToggle={handleToggleHomeService}
                  helpOpen={homeServiceHelpOpen}
                  onHelpToggle={() => setHomeServiceHelpOpen(v => !v)}
                  hideAddress={hideAddressOnPublicPage}
                  onHideAddressChange={setHideAddressOnPublicPage}
                  bufferMinutes={bufferMinutes}
                  radiusKm={homeServiceRadiusKm}
                  onRadiusChange={setHomeServiceRadiusKm}
                />
              )}
            </>
          )}
            </div>
          </section>
          )}

          {/* ═══════ SECTION 3: COMMUNICATION ═══════ */}
          {settingsSection === 'comm' && (
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-2 px-1">{t('sectionCommunication')}</h3>
            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">

              {/* Card: Notifications push */}
              <SettingCard
                icon={Bell}
                title={t('pushNotifTitle')}
                tone="violet"
                className="sm:col-span-2"
                headerRight={
                  pushSubscribed ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                      <Check className="w-3 h-3" />
                      {t('pushNotifActive')}
                    </span>
                  ) : pushSupported ? (
                    <button
                      type="button"
                      onClick={subscribePush}
                      disabled={pushSubscribing || pushPermission === 'denied'}
                      className="px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50"
                    >
                      {pushSubscribing ? '...' : t('pushNotifEnable')}
                    </button>
                  ) : null
                }
              >
                <p className="text-[11px] text-gray-500 leading-relaxed">
                  {pushSubscribed
                    ? t('pushNotifActiveHint')
                    : !pushSupported
                      ? (isIOS && !isStandalone ? t('pushNotifIosPwa') : t('pushNotifUnsupported'))
                      : pushPermission === 'denied'
                        ? t('pushNotifDenied')
                        : t('pushNotifHint')}
                </p>
                {pushError && (
                  <p className="text-[11px] text-red-500 font-medium mt-1.5">{pushError}</p>
                )}
              </SettingCard>

              {/* Card: Message public */}
              <SettingCard
                icon={MessageSquare}
                title={t('publicMessageTitle')}
                tone="violet"
                headerRight={<Switch checked={messageEnabled} onChange={setMessageEnabled} tone="violet" size="md" ariaLabel={t('publicMessageTitle')} />}
              >
                <p className="text-[11px] text-gray-500 mb-3">{t('publicMessageHint')}</p>
                {messageEnabled && (
                  <div className="space-y-2.5">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('publicMessagePlaceholder')}
                      maxLength={200}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-[11px] text-gray-500 shrink-0">{t('expiresOn')}</label>
                      <input
                        type="date"
                        value={messageExpires}
                        onChange={(e) => setMessageExpires(e.target.value)}
                        min={formatDate(new Date())}
                        className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      {messageExpires ? (
                        <button onClick={() => setMessageExpires('')} className="text-[11px] text-red-500 hover:text-red-600 transition-colors">
                          {t('remove')}
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-400">{t('permanent')}</span>
                      )}
                    </div>
                  </div>
                )}
              </SettingCard>

              {/* Card: SMS Notifications */}
              <SettingCard icon={MessageSquare} title={t('smsTitle')} tone="violet">
                {merchant?.subscription_status === 'active' || merchant?.subscription_status === 'canceling' || merchant?.subscription_status === 'past_due' ? (
                  <div>
                    <p className="text-[11px] text-gray-500 leading-relaxed">{t('smsActiveInfo')}</p>
                    {smsUsage && (
                      <div className="mt-2">
                        <SmsQuotaGauge sent={smsUsage.sent} quota={smsUsage.quota} packBalance={smsUsage.packBalance} />
                      </div>
                    )}
                    <Link
                      href="/dashboard/marketing?tab=automations"
                      className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 text-[11px] font-bold border border-violet-100 hover:bg-violet-100 transition-colors"
                    >
                      <Settings className="w-3 h-3" />
                      {t('smsConfigureNotifications')}
                    </Link>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] text-gray-500">{t('smsTrialMessage')}</p>
                    <a href="/dashboard/subscription" className="shrink-0 px-3 py-1.5 rounded-lg bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold active:scale-[0.98] touch-manipulation transition-all">
                      {t('smsTrialCta')}
                    </a>
                  </div>
                )}
              </SettingCard>
            </div>
          </section>
          )}

          <div className="h-20 md:h-24" />
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className={`fixed left-1/2 -translate-x-1/2 z-30 inline-flex items-center justify-center gap-2.5 px-7 py-3.5 md:px-8 md:py-4 rounded-full text-sm md:text-base font-bold shadow-xl transition-all disabled:opacity-60 disabled:cursor-not-allowed bottom-[calc(60px+env(safe-area-inset-bottom)+12px)] md:bottom-6 ${
              savedSettings
                ? 'bg-emerald-500 text-white shadow-emerald-300/50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-400/40'
            }`}
          >
            {savingSettings ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {t('saving')}</>
            ) : savedSettings ? (
              <><Check className="w-5 h-5" /> {t('saved')}</>
            ) : (
              <><Save className="w-5 h-5" /> {t('save')}</>
            )}
          </button>
        </div>
      )}

      {/* ── MODAL: Add slots ── */}
      <AnimatePresence mode="wait">
        {modalState.type === 'add-slots' && (
          <AddSlotsModal
            addSlotsDay={modalState.day}
            selectedTimes={selectedTimes}
            setSelectedTimes={setSelectedTimes}
            customTime={customTime}
            setCustomTime={setCustomTime}
            slotsByDate={slotsByDate}
            saving={saving}
            onSave={handleAddSlots}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* ── MODAL: Manual booking (free mode) ── */}
      <AnimatePresence mode="wait">
        {showManualBookingModal && (() => {
          const hasClient = !!draft.customerId;
          const canCreate = draft.clientName.trim().length >= 2 && draft.clientPhone.trim().length >= 6 && !draft.customerId;
          const manualSelected = services.filter(s => manualServiceIds.includes(s.id));
          const manualUnselected = services.filter(s => !manualServiceIds.includes(s.id));
          const VISIBLE_UNSELECTED = 4;
          const hiddenCount = manualUnselected.length - VISIBLE_UNSELECTED;
          const visibleUnselected = manualShowAllServices ? manualUnselected : manualUnselected.slice(0, VISIBLE_UNSELECTED);
          const toggleManualService = (id: string) =>
            setManualServiceIds(ids => ids.includes(id) ? ids.filter(x => x !== id) : [...ids, id]);
          return (
            <motion.div
              initial={{ opacity: 0, pointerEvents: 'none' }}
              animate={{ opacity: 1, pointerEvents: 'auto' }}
              exit={{ opacity: 0, pointerEvents: 'none' }}
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
              onClick={(e) => { if (e.target === e.currentTarget) setShowManualBookingModal(false); }}
            >
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto overscroll-contain shadow-xl"
              >
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900">{t('addManualBookingTitle')}</h3>
                      <span className="shrink-0 text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md tabular-nums">
                        {manualStep}/2
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate">{manualDate || t('blockSlotDate')}</p>
                  </div>
                  <button onClick={() => setShowManualBookingModal(false)} className="p-2 rounded-lg hover:bg-gray-100 transition-colors shrink-0">
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Progress bar */}
                <div className="h-0.5 bg-gray-100">
                  <div
                    className="h-full bg-[#4b0082] transition-all duration-300"
                    style={{ width: manualStep === 1 ? '50%' : '100%' }}
                  />
                </div>

                <div className="p-4 space-y-4">
                  {/* ═══════ ÉTAPE 1 : PRESTATIONS + CRÉNEAU ═══════ */}
                  {manualStep === 1 && <>
                  {/* ───── 1. PRESTATIONS ───── */}
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">1. {t('manualServices')}</label>
                      {(manualServiceIds.length > 0 || manualCustomService) && (
                        <span className="text-[11px] font-semibold text-indigo-600">
                          {t('totalDuration', { duration: formatDuration(manualDuration) })}
                          {manualTotalPrice > 0 && ` · ${formatCurrency(manualTotalPrice, merchant?.country, locale)}`}
                        </span>
                      )}
                    </div>
                    {(manualSelected.length > 0 || manualCustomService) && (
                      <div className="space-y-1 mb-2">
                        {manualCustomService && (
                          <CustomServicePicker
                            value={manualCustomService}
                            onChange={setManualCustomService}
                            country={merchant?.country}
                            locale={locale}
                          />
                        )}
                        {manualSelected.map(svc => {
                          const svcColor = serviceColorMap.get(svc.id);
                          return (
                            <button key={svc.id} type="button" onClick={() => toggleManualService(svc.id)}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-indigo-300 bg-indigo-50 text-left transition-all text-[13px] text-indigo-700"
                              style={colorBorderStyle(svcColor)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border bg-indigo-600 border-indigo-600">
                                  <Check className="w-2.5 h-2.5 text-white" />
                                </div>
                                <span className="font-medium">{svc.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0 ml-2">
                                {svc.price > 0 && <span>{formatCurrency(svc.price, merchant?.country, locale)}</span>}
                                {svc.duration && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{svc.duration}</span>}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                    {manualUnselected.length > 0 && (
                      <div className="space-y-1">
                        {visibleUnselected.map(svc => {
                          const svcColor = serviceColorMap.get(svc.id);
                          return (
                            <button key={svc.id} type="button" onClick={() => toggleManualService(svc.id)}
                              className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-gray-200 hover:border-gray-300 text-left transition-all text-[13px] text-gray-700"
                              style={colorBorderStyle(svcColor)}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border border-gray-300" />
                                <span className="font-medium">{svc.name}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0 ml-2">
                                {svc.price > 0 && <span>{formatCurrency(svc.price, merchant?.country, locale)}</span>}
                                {svc.duration && <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{svc.duration}</span>}
                              </div>
                            </button>
                          );
                        })}
                        {hiddenCount > 0 && !manualShowAllServices && (
                          <button type="button" onClick={() => setManualShowAllServices(true)}
                            className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                            {t('showMoreServices', { count: hiddenCount })}
                            <ChevronDown className="w-3 h-3" />
                          </button>
                        )}
                        {manualShowAllServices && hiddenCount > 0 && (
                          <button type="button" onClick={() => setManualShowAllServices(false)}
                            className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-500 transition-colors">
                            {t('showLessServices')}
                            <ChevronDown className="w-3 h-3 rotate-180" />
                          </button>
                        )}
                      </div>
                    )}
                    {!manualCustomService && (
                      <CustomServicePicker
                        value={null}
                        onChange={setManualCustomService}
                        country={merchant?.country}
                        locale={locale}
                        hasSiblings={manualSelected.length > 0 || manualUnselected.length > 0}
                      />
                    )}
                  </div>

                  {/* ───── 2. CRÉNEAU ───── */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">2. {t('blockSlotDate')}</label>
                    {/* Date pleine largeur */}
                    <input type="date" value={manualDate} min={todayStr}
                      onChange={e => { setManualDate(e.target.value); setManualConflict(null); }}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400" />
                    {/* D\u00e9but → Fin sur une ligne */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1">
                        <input
                          type="time"
                          value={manualStartTime}
                          onChange={e => { setManualStartTime(e.target.value); setManualConflict(null); }}
                          aria-label={t('blockSlotFrom')}
                          className="w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 tabular-nums"
                        />
                      </div>
                      <span className="text-gray-400 text-xs shrink-0">→</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-center px-3 py-2 text-base sm:text-sm border border-gray-100 bg-gray-50 rounded-xl text-gray-600 font-medium tabular-nums">
                          {manualEndTime || '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Conflit de créneau (409) — affiché sur l'étape 1 pour que le merchant ajuste l'horaire */}
                  {manualConflict && (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-amber-800">{t('conflictTitle')}</p>
                          <p className="text-xs text-amber-700 mt-0.5">
                            {manualConflict.client_name} — {manualConflict.start_time} {t('conflictTo')} {manualConflict.end_time}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleManualBookingSubmit(true)}
                        disabled={savingManual}
                        className="w-full py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {savingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin mx-auto" /> : t('conflictForce')}
                      </button>
                    </div>
                  )}
                  </>}

                  {/* ═══════ ÉTAPE 2 : CLIENT + NOTES ═══════ */}
                  {manualStep === 2 && <>
                  {/* ───── 3. CLIENT ───── */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">3. {t('clientName')}</label>

                  {/* Client name with search */}
                  <div className="relative">
                    <div className="relative">
                      <input
                        type="text"
                        value={draft.clientName}
                        onChange={(e) => handleDraftNameChange(e.target.value)}
                        onFocus={() => { if (draft.clientName.length >= 2 && !draft.customerId) setShowCustomerSearch(true); }}
                        onBlur={() => setTimeout(() => setShowCustomerSearch(false), 200)}
                        placeholder={t('searchPlaceholder')}
                        className="w-full px-3 py-2.5 pr-9 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      />
                      {draft.clientName.length >= 2 && !draft.customerId && (
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                      )}
                    </div>
                    {hasClient && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-emerald-600">
                        <UserCheck className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-medium">{t('clientLinked')}</span>
                      </div>
                    )}
                    {showCustomerSearch && searchDone && (
                      <div className="absolute z-10 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {customerResults.length > 0 ? (
                          customerResults.map(c => (
                            <button key={c.id} onPointerDown={() => {
                              selectCustomer(c);
                              // Service a domicile : prefill l'adresse du client (mig 174)
                              // si pas deja saisie manuellement par le merchant.
                              if (homeServiceEnabled && c.address && !manualCustomerAddress.trim()) {
                                setManualCustomerAddress(c.address);
                                setManualCustomerLat(c.address_lat ?? null);
                                setManualCustomerLng(c.address_lng ?? null);
                              }
                            }}
                              className="w-full text-left px-3 py-2.5 hover:bg-indigo-50 transition-colors border-b border-gray-50 last:border-0 touch-manipulation">
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-800">{c.first_name} {c.last_name || ''}</span>
                                <div className="flex items-center gap-1.5">
                                  {c.instagram_handle && <Instagram className="w-3 h-3 text-pink-500" />}
                                  {c.tiktok_handle && <TikTokIcon className="w-3 h-3 text-gray-700" />}
                                  {c.facebook_url && <FacebookIcon className="w-3 h-3 text-blue-600" />}
                                </div>
                              </div>
                              <span className="text-[11px] text-gray-400">{formatPhoneLabel(c.phone_number)}</span>
                            </button>
                          ))
                        ) : (
                          <p className="px-3 py-3 text-xs text-gray-400">{t('noClientFound')}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Phone */}
                  <PhoneInput
                    label={hasClient ? t('phoneOptional') : t('phoneLabel')}
                    value={draft.clientPhone}
                    onChange={(v) => updateDraft({ clientPhone: v })}
                    country={(draft.phoneCountry || merchant?.country || 'FR') as MerchantCountry}
                    onCountryChange={(c) => updateDraft({ phoneCountry: c })}
                    countries={['FR', 'BE', 'CH']}
                    className="text-sm border-gray-200 rounded-r-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />

                  {/* Social links toggle */}
                  {(hasClient || canCreate) && (
                    <button onClick={() => setManualShowSocial(!manualShowSocial)}
                      className="text-xs text-indigo-600 font-medium hover:underline">
                      {manualShowSocial ? t('hideSocial') : t('addSocial')}
                    </button>
                  )}
                  {manualShowSocial && (hasClient || canCreate) && (
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-0.5 flex items-center gap-1">
                          <Instagram className="w-3 h-3 text-pink-500" /> Instagram
                        </label>
                        <input type="text" value={draft.instagramHandle} onChange={(e) => updateDraft({ instagramHandle: e.target.value })}
                          placeholder="@pseudo" className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                      <div>
                        <label className="text-[11px] font-medium text-gray-500 mb-0.5 flex items-center gap-1">
                          <TikTokIcon className="w-3 h-3 text-gray-700" /> TikTok
                        </label>
                        <input type="text" value={draft.tiktokHandle} onChange={(e) => updateDraft({ tiktokHandle: e.target.value })}
                          placeholder="@pseudo" className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[11px] font-medium text-gray-500 mb-0.5 flex items-center gap-1">
                          <FacebookIcon className="w-3 h-3 text-blue-600" /> Facebook
                        </label>
                        <input type="text" value={draft.facebookUrl} onChange={(e) => updateDraft({ facebookUrl: e.target.value })}
                          placeholder="https://facebook.com/..." className="w-full px-2.5 py-2 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                      </div>
                    </div>
                  )}

                  {/* Voucher grants for new clients */}
                  {canCreate && (merchant?.welcome_offer_enabled || manualActiveOffers.length > 0) && (
                    <div className="space-y-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      {merchant?.welcome_offer_enabled && (
                        <label className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox" checked={manualGrantWelcome} onChange={(e) => setManualGrantWelcome(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500" />
                          <Gift className="w-3.5 h-3.5 text-violet-500 shrink-0" />
                          <span className="text-xs text-gray-700">{t('grantWelcomeOffer')}</span>
                        </label>
                      )}
                      {manualActiveOffers.length > 0 && (
                        <div className="flex items-center gap-2.5">
                          <input type="checkbox" checked={!!manualGrantOfferId} onChange={(e) => setManualGrantOfferId(e.target.checked ? manualActiveOffers[0].id : null)}
                            className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500" />
                          <Gift className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          {manualActiveOffers.length === 1 ? (
                            <span className="text-xs text-gray-700">{manualActiveOffers[0].title}</span>
                          ) : (
                            <select value={manualGrantOfferId || ''} onChange={(e) => setManualGrantOfferId(e.target.value || null)}
                              className="text-xs text-gray-700 border border-gray-200 rounded-lg px-2 py-1 flex-1 focus:outline-none focus:ring-1 focus:ring-amber-500/20">
                              <option value="">{t('selectOffer')}</option>
                              {manualActiveOffers.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                            </select>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Create new client button */}
                  {canCreate && (
                    <button onClick={async () => {
                      const id = await handleCreateCustomer({
                        instagram_handle: draft.instagramHandle || undefined,
                        tiktok_handle: draft.tiktokHandle || undefined,
                        facebook_url: draft.facebookUrl || undefined,
                      });
                      if (id && manualGrantWelcome) {
                        fetch('/api/vouchers/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ customer_id: id, merchant_id: merchant?.id, type: 'welcome' }) }).catch(() => {});
                      }
                      if (id && manualGrantOfferId) {
                        fetch('/api/vouchers/grant', { method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ customer_id: id, merchant_id: merchant?.id, type: 'offer', offer_id: manualGrantOfferId }) }).catch(() => {});
                      }
                    }} disabled={creatingCustomer}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50">
                      {creatingCustomer
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> {t('creating')}</>
                        : <><UserPlus className="w-3.5 h-3.5" /> {t('createAsNewClient', { name: draft.clientName.trim().split(' ')[0] })}</>
                      }
                    </button>
                  )}
                  </div>

                  {/* ───── Adresse cliente (mode service à domicile) — apres la selection client
                       pour pouvoir auto-prefill depuis sa derniere resa home_service ───── */}
                  {homeServiceEnabled && (
                    <div>
                      <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 text-sky-600" />
                        {t('addressLabelOptional')}
                      </label>
                      <AddressAutocomplete
                        value={manualCustomerAddress}
                        onChange={(value: string, suggestion?: AddressSuggestion) => {
                          setManualCustomerAddress(value);
                          if (suggestion) {
                            setManualCustomerLat(suggestion.lat);
                            setManualCustomerLng(suggestion.lng);
                          } else {
                            setManualCustomerLat(null);
                            setManualCustomerLng(null);
                          }
                        }}
                        placeholder={t('addressPlaceholder')}
                        className="text-sm border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                      />
                      {manualCustomerAddress.trim() && manualCustomerLat == null && (
                        <p className="text-[10px] text-amber-700 mt-1">{t('addressNeedSelect')}</p>
                      )}
                    </div>
                  )}

                  {/* ───── 4. NOTES ───── */}
                  <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-1.5 block">4. {t('notesLabel')}</label>
                    <textarea value={manualNotes} onChange={e => setManualNotes(e.target.value)} rows={2} maxLength={500}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none" />
                  </div>

                  {/* SMS confirmation toggle (opt-in) */}
                  {draft.clientPhone.trim() && (() => {
                    const isPaid = merchant?.subscription_status === 'active' || merchant?.subscription_status === 'canceling' || merchant?.subscription_status === 'past_due';
                    return (
                      <button
                        type="button"
                        onClick={() => isPaid && setManualSendSms(s => !s)}
                        className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all ${
                          !isPaid
                            ? 'border-gray-100 bg-gray-50 cursor-not-allowed'
                            : manualSendSms
                              ? 'border-indigo-200 bg-indigo-50'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${manualSendSms ? 'bg-indigo-100' : 'bg-gray-100'}`}>
                          <MessageSquare className={`w-4 h-4 ${manualSendSms ? 'text-indigo-600' : 'text-gray-400'}`} />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                          <p className={`text-xs font-semibold ${manualSendSms ? 'text-indigo-700' : 'text-gray-700'}`}>
                            {t('sendSmsConfirmation')}
                          </p>
                          {!isPaid && (
                            <p className="text-[10px] text-gray-400 mt-0.5">{t('sendSmsTrialHint')}</p>
                          )}
                        </div>
                        {isPaid ? (
                          <div className={`shrink-0 w-9 h-5 rounded-full transition-colors relative ${manualSendSms ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${manualSendSms ? 'translate-x-4' : 'translate-x-0.5'}`} />
                          </div>
                        ) : (
                          <span className="shrink-0 text-[9px] font-bold text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded-md uppercase tracking-wide">Pro</span>
                        )}
                      </button>
                    );
                  })()}

                  {createError && (
                    <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createError}</p>
                  )}
                  {manualError && !manualConflict && <p className="text-xs text-red-500 font-medium">{manualError}</p>}
                  </>}
                </div>

                {/* Footer — dynamique selon l'étape */}
                <div className="p-4 border-t border-gray-100 flex gap-2">
                  {manualStep === 1 ? (
                    <>
                      <button onClick={() => setShowManualBookingModal(false)}
                        className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors">
                        {t('blockSlotCancel')}
                      </button>
                      <button
                        onClick={() => setManualStep(2)}
                        disabled={!manualDate || !manualStartTime || (manualServiceIds.length === 0 && !manualCustomService) || !!manualConflict}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {t('next')}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setManualStep(1)}
                        disabled={savingManual}
                        className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors"
                      >
                        {t('back')}
                      </button>
                      <button
                        onClick={() => handleManualBookingSubmit()}
                        disabled={savingManual || !manualDate || !draft.clientName.trim()}
                        className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {savingManual ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('confirmBooking')}
                      </button>
                    </>
                  )}
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── MODAL: Block slot/period (unified) ── */}
      <AnimatePresence mode="wait">
        {showBlockModal && (
          <PlanningModal onClose={() => setShowBlockModal(false)} size="sm">
            <ModalHeader
              title={t('blockSlotTitle')}
              icon={<Lock className="w-4 h-4" />}
              iconTint="gray"
              onClose={() => setShowBlockModal(false)}
            />
            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('blockSlotDate')}</label>
                  <input
                    type="date"
                    value={blockDate}
                    min={todayStr}
                    onChange={e => { setBlockDate(e.target.value); if (blockEndDate && blockEndDate < e.target.value) setBlockEndDate(''); }}
                    className="mt-1 w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('blockSlotUntil')}</label>
                  <input
                    type="date"
                    value={blockEndDate}
                    min={blockDate || todayStr}
                    onChange={e => setBlockEndDate(e.target.value)}
                    className="mt-1 w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={blockAllDay}
                  onChange={e => setBlockAllDay(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-gray-700 font-medium">{t('blockAllDay')}</span>
              </label>

              {!blockAllDay && (
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('blockSlotFrom')}</label>
                    <input
                      type="time"
                      value={blockStartTime}
                      onChange={e => setBlockStartTime(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('blockSlotTo')}</label>
                    <input
                      type="time"
                      value={blockEndTime}
                      onChange={e => setBlockEndTime(e.target.value)}
                      className="mt-1 w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{t('blockSlotReason')}</label>
                <input
                  type="text"
                  value={blockReason}
                  onChange={e => setBlockReason(e.target.value)}
                  placeholder={t('blockSlotReasonPlaceholder')}
                  maxLength={100}
                  className="mt-1 w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                />
              </div>
            </div>
            <ModalFooter>
              <button onClick={() => setShowBlockModal(false)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors">
                {t('blockSlotCancel')}
              </button>
              <button
                onClick={handleBlockSubmit}
                disabled={savingBlock || !blockDate || (!blockAllDay && blockStartTime >= blockEndTime)}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {savingBlock ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : t('blockSlotCta')}
              </button>
            </ModalFooter>
          </PlanningModal>
        )}
      </AnimatePresence>

      {/* ── CONFIRM: Delete blocked slot ── */}
      <AnimatePresence mode="wait">
        {confirmDeleteBlock && (
          <PlanningModal onClose={() => setConfirmDeleteBlock(null)} size="sm">
            <ModalHeader
              title={t('blockSlotDeleteConfirm')}
              subtitle={t('blockSlotDeleteHint')}
              icon={<AlertTriangle className="w-4 h-4" />}
              iconTint="red"
              onClose={() => setConfirmDeleteBlock(null)}
            />
            <ModalFooter>
              <button onClick={() => setConfirmDeleteBlock(null)} className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition-colors">
                {t('blockSlotCancel')}
              </button>
              <button
                onClick={async () => { await handleDeleteSlot(confirmDeleteBlock); setConfirmDeleteBlock(null); }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
              >
                {t('delete')}
              </button>
            </ModalFooter>
          </PlanningModal>
        )}
      </AnimatePresence>

      {/* ── BLOCK: Programme de fidélité non configuré ── */}
      <AnimatePresence mode="wait">
        {missingLoyaltyBlock && (
          <PlanningModal onClose={() => setMissingLoyaltyBlock(false)} size="sm">
            <ModalHeader
              title={t('missingLoyaltyTitle')}
              icon={<Gift className="w-4 h-4" />}
              iconTint="amber"
              onClose={() => setMissingLoyaltyBlock(false)}
            />
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {t('missingLoyaltyBody')}
              </p>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  {t('missingLoyaltyWarning')}
                </p>
              </div>
            </div>
            <ModalFooter>
              <button
                onClick={() => setMissingLoyaltyBlock(false)}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                {t('missingLoyaltyLater')}
              </button>
              <Link
                href="/dashboard/program"
                onClick={() => setMissingLoyaltyBlock(false)}
                className="w-full sm:flex-[2] py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {t('missingLoyaltyCta')}
              </Link>
            </ModalFooter>
          </PlanningModal>
        )}
      </AnimatePresence>

      {/* ── BLOCK: Mode libre sans horaires d'ouverture ── */}
      <AnimatePresence mode="wait">
        {missingHoursBlock && (
          <PlanningModal onClose={() => setMissingHoursBlock(false)} size="sm">
            <ModalHeader
              title={t('missingHoursTitle')}
              icon={<Clock className="w-4 h-4" />}
              iconTint="amber"
              onClose={() => setMissingHoursBlock(false)}
            />
            <div className="p-4 space-y-3">
              <p className="text-sm text-gray-700 leading-relaxed">
                {t('missingHoursBody')}
              </p>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  {t('missingHoursWarning')}
                </p>
              </div>
            </div>
            <ModalFooter>
              <button
                onClick={() => setMissingHoursBlock(false)}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors"
              >
                {t('missingHoursLater')}
              </button>
              <Link
                href="/dashboard/public-page"
                onClick={() => setMissingHoursBlock(false)}
                className="w-full sm:flex-[2] py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2"
              >
                {t('missingHoursCta')}
              </Link>
            </ModalFooter>
          </PlanningModal>
        )}
      </AnimatePresence>

      {/* ── CONFIRM: Mode switch ── */}
      <AnimatePresence mode="wait">
        {modeSwitchTarget && (
          <PlanningModal onClose={() => setModeSwitchTarget(null)} size="sm">
            <ModalHeader
              title={t('modeSwitchTitle')}
              icon={<AlertTriangle className="w-4 h-4" />}
              iconTint="amber"
              onClose={() => setModeSwitchTarget(null)}
            />
            <div className="p-4 space-y-2">
              <p className="text-sm text-gray-700 leading-relaxed">
                {modeSwitchTarget === 'free' ? t('modeSwitchToFreeWarning') : t('modeSwitchToSlotsWarning')}
              </p>
            </div>
            <ModalFooter>
              <button
                onClick={() => setModeSwitchTarget(null)}
                disabled={modeSwitchCleanup}
                className="w-full sm:flex-1 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                {t('modeSwitchCancel')}
              </button>
              <button
                onClick={confirmModeSwitch}
                disabled={modeSwitchCleanup}
                className="w-full sm:flex-[2] py-3 rounded-xl bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm flex items-center justify-center gap-2"
              >
                {modeSwitchCleanup && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('modeSwitchConfirm', { mode: modeSwitchTarget === 'free' ? t('bookingModeFree') : t('bookingModeSlots') })}
              </button>
            </ModalFooter>
          </PlanningModal>
        )}
      </AnimatePresence>

      {/* ── MODAL: Client select (Modal 1) ── */}
      <AnimatePresence mode="wait">
        {modalState.type === 'client-select' && (
          <ClientSelectModal
            slot={modalState.slot}
            draft={draft}
            merchantId={merchant!.id}
            customerResults={customerResults}
            showCustomerSearch={showCustomerSearch}
            searchDone={searchDone}
            creatingCustomer={creatingCustomer}
            createError={createError}
            locale={locale}
            phonePlaceholder={phonePlaceholder}
            onNameChange={handleDraftNameChange}
            onDraftChange={updateDraft}
            onSelectCustomer={selectCustomer}
            onCreateCustomer={handleCreateCustomer}
            onProceed={proceedToBookingDetails}
            onShowCustomerSearch={setShowCustomerSearch}
            onDelete={() => handleDeleteSlot(modalState.slot.id)}
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* ── MODAL: Bring back failed deposit ── */}
      <AnimatePresence mode="wait">
        {bringBackFailure && (
          <BringBackBookingModal
            failure={bringBackFailure}
            services={services}
            merchantCountry={merchant?.country || 'FR'}
            locale={locale}
            saving={saving}
            onBringBack={bringBackDepositFailure}
            onPickAnotherSlot={bookingMode === 'free' ? () => openManualBookingFromFailure(bringBackFailure) : undefined}
            onClose={() => { setBringBackFailure(null); fetchSlots(); invalidateUpcoming(); }}
          />
        )}
      </AnimatePresence>

      {/* ── MODAL: Booking details (Modal 2) ── */}
      <AnimatePresence mode="wait">
        {modalState.type === 'booking-details' && merchant && (
          <BookingDetailsModal
            slot={modalState.slot}
            customer={modalState.customer}
            draft={draft}
            services={services}
            serviceColorMap={serviceColorMap}
            slotsByDate={slotsByDate}
            merchantId={merchant.id}
            merchantCountry={merchant.country || 'FR'}
            merchantName={merchant.shop_name}
            merchantAddress={merchant.shop_address}
            bookingMode={bookingMode}
            homeServiceEnabled={homeServiceEnabled}
            saving={saving}
            locale={locale}
            depositPercent={merchant.deposit_percent}
            depositAmount={merchant.deposit_amount}
            subscriptionStatus={merchant.subscription_status}
            welcomeOfferDiscountPercent={merchant.welcome_offer_discount_percent}
            onDraftChange={updateDraft}
            onSave={handleUpdateSlot}
            onDelete={handleDeleteSlot}
            onShiftSlot={handleMoveSlot}
            onRefreshSlots={fetchSlots}
            onConfirmDeposit={handleConfirmDeposit}
            onCancelDeposit={handleCancelDeposit}
            onGoBack={goBackToClientSelect}
            onClose={closeModal}
            onFetchClientHistory={fetchClientHistory}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

