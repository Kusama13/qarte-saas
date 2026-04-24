'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import { getSupabase } from '@/lib/supabase';
import { CalendarDays, CalendarX2, ChevronLeft, ChevronRight, Plus, Copy, Loader2, Check, Download, MessageSquare, Phone, LayoutGrid, Calendar, Globe, CreditCard, Info, AlertTriangle, X, Trash2, Moon, Bell, Clock, Lock, Search, UserCheck, UserPlus, Instagram, Gift, ChevronDown, MoreVertical, Settings } from 'lucide-react';
import type { BookingMode, MerchantCountry, BookingDepositFailure } from '@/types';
import { useMerchantPushNotifications } from '@/hooks/useMerchantPushNotifications';
import { AnimatePresence, motion } from 'framer-motion';
import type { PlanningSlot } from '@/types';
import { PHONE_CONFIG, toBCP47, getCurrencySymbol, formatCurrency, formatPhoneLabel } from '@/lib/utils';
import { formatDate, getServiceColorMap, colorBorderStyle, getWeekStart, timeToMinutes, minutesToTime, formatDuration, getISOWeekNumber } from './utils';
import { handleDownloadStory } from './StoryExport';
import { PhoneInput } from '@/components/ui/PhoneInput';
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
import { getPlanFeatures } from '@/lib/plan-tiers';
import { useToast } from '@/components/ui/Toast';
import { Link } from '@/i18n/navigation';
import { hasValidOpeningHours } from '@/lib/opening-hours';

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
    cancelDeadlineDays, setCancelDeadlineDays, rescheduleDeadlineDays, setRescheduleDeadlineDays,
    depositLink, setDepositLink, depositLinkLabel, setDepositLinkLabel, depositLink2, setDepositLink2, depositLink2Label, setDepositLink2Label, depositPercent, setDepositPercent, depositAmount, setDepositAmount, depositDeadlineHours, setDepositDeadlineHours,
    bookingMode, setBookingMode, bufferMinutes, setBufferMinutes,
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
  const [depositError, setDepositError] = useState<string | null>(null);

  // Sync deposit toggle when merchant loads
  useEffect(() => {
    if (merchant) {
      setDepositEnabled(!!(merchant.deposit_link || merchant.deposit_percent || merchant.deposit_amount));
    }
  }, [merchant?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Mode choice (shown when planning is freshly enabled with no slots)
  const [showModeChoice, setShowModeChoice] = useState(false);
  const [missingHoursBlock, setMissingHoursBlock] = useState(false);
  // Auto-dismiss mode choice if real slots already exist
  useEffect(() => {
    if (showModeChoice && !loadingSlots && slots.some(s => !s.client_name)) {
      setShowModeChoice(false);
    }
  }, [showModeChoice, loadingSlots, slots]);

  // Manual booking modal (free mode)
  const [showManualBookingModal, setShowManualBookingModal] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualStartTime, setManualStartTime] = useState('09:00');
  const [manualServiceIds, setManualServiceIds] = useState<string[]>([]);
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

  const manualDuration = useMemo(() => manualServiceIds.reduce((sum, id) => {
    return sum + (serviceMap.get(id)?.duration ?? 30);
  }, 0) || 30, [manualServiceIds, serviceMap]);

  const manualEndTime = useMemo(() => {
    if (!manualStartTime) return '';
    return minutesToTime(timeToMinutes(manualStartTime) + manualDuration);
  }, [manualStartTime, manualDuration]);

  const manualTotalPrice = useMemo(() => manualServiceIds.reduce((sum, id) => {
    return sum + (serviceMap.get(id)?.price || 0);
  }, 0), [manualServiceIds, serviceMap]);

  const openManualBookingModal = (date: string) => {
    setManualDate(date);
    setManualStartTime('09:00');
    setManualServiceIds([]);
    setManualNotes('');
    setManualShowSocial(false);
    setManualShowAllServices(false);
    setManualGrantWelcome(false);
    setManualGrantOfferId(null);
    setManualError(null);
    setManualConflict(null);
    setManualSendSms(false);
    setManualStep(1);
    updateDraft({ clientName: '', clientPhone: '', customerId: null, phoneCountry: merchant?.country as MerchantCountry || 'FR', instagramHandle: '', tiktokHandle: '', facebookUrl: '' });
    // Fetch active offers for grant options
    if (merchant?.id) {
      fetch(`/api/merchant-offers?merchantId=${merchant.id}&public=true`)
        .then(r => r.ok ? r.json() : { offers: [] })
        .then(d => setManualActiveOffers(d.offers || []))
        .catch(() => {});
    }
    setShowManualBookingModal(true);
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
          notes: manualNotes.trim() || undefined,
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
  // Slots → free : les créneaux vides bloqueraient la création libre
  // (contrainte unique slot_date+start_time).
  const emptySlotIds = useMemo(
    () => slots.filter(s => !s.client_name && !s.primary_slot_id).map(s => s.id),
    [slots],
  );
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
      if (modeSwitchTarget === 'free' && bookingMode === 'slots' && emptySlotIds.length > 0) {
        const chunks: Promise<Response>[] = [];
        for (let i = 0; i < emptySlotIds.length; i += 200) {
          chunks.push(fetch('/api/planning', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ merchantId: merchant.id, slotIds: emptySlotIds.slice(i, i + 200) }),
          }));
        }
        await Promise.all(chunks);
        await fetchSlots();
      }
      setBookingMode(modeSwitchTarget);
      if (modeSwitchTarget === 'free') setAutoBookingEnabled(true);
    } finally {
      setModeSwitchCleanup(false);
      setModeSwitchTarget(null);
    }
  };

  // SMS usage
  const [smsUsage, setSmsUsage] = useState<{ sent: number; remaining: number } | null>(null);
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
    setDepositError(null);
    saveSettings(async () => {
      const { error } = await supabase.from('merchants').update({
        planning_message: messageEnabled && message.trim() ? message.trim() : null,
        planning_message_expires: messageEnabled && messageExpires ? messageExpires : null,
        booking_message: bookingMessage.trim() || null,
        auto_booking_enabled: autoBookingEnabled,
        deposit_link: autoBookingEnabled && depositEnabled && depositLink.trim()
          ? (/^https?:\/\//i.test(depositLink.trim()) ? depositLink.trim() : `https://${depositLink.trim()}`)
          : null,
        deposit_link_label: autoBookingEnabled && depositEnabled && depositLink.trim() && depositLinkLabel.trim() ? depositLinkLabel.trim() : null,
        deposit_link_2: autoBookingEnabled && depositEnabled && depositLink2.trim()
          ? (/^https?:\/\//i.test(depositLink2.trim()) ? depositLink2.trim() : `https://${depositLink2.trim()}`)
          : null,
        deposit_link_2_label: autoBookingEnabled && depositEnabled && depositLink2.trim() && depositLink2Label.trim() ? depositLink2Label.trim() : null,
        deposit_percent: autoBookingEnabled && depositEnabled && depositPercent ? parseInt(depositPercent) : null,
        deposit_amount: autoBookingEnabled && depositEnabled && depositAmount ? parseFloat(depositAmount) : null,
        deposit_deadline_hours: autoBookingEnabled && depositEnabled && depositDeadlineHours ? parseInt(depositDeadlineHours) : null,
        allow_customer_cancel: allowCustomerCancel,
        allow_customer_reschedule: allowCustomerReschedule,
        cancel_deadline_days: parseInt(cancelDeadlineDays) || 1,
        reschedule_deadline_days: parseInt(rescheduleDeadlineDays) || 1,
        booking_mode: bookingMode,
        buffer_minutes: bufferMinutes,
      }).eq('id', merchant.id);
      if (error) {
        console.error('Settings save error:', error);
        throw error;
      }
      refetch().catch(() => {});
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

  const handleTogglePlanningWrapper = async (enabled: boolean) => {
    // Only show mode choice on first activation (no slots yet and no prior mode configured)
    if (enabled && !slots.length && !merchant?.booking_mode) setShowModeChoice(true);
    await handleTogglePlanning(enabled);
  };

  const handleModeChoice = async (mode: BookingMode) => {
    if (!merchant) return;
    if (mode === 'free' && !hasValidOpeningHours(merchant.opening_hours)) {
      setMissingHoursBlock(true);
      return;
    }
    setBookingMode(mode);
    const update: Record<string, unknown> = { booking_mode: mode };
    if (mode === 'free') {
      update.auto_booking_enabled = true;
      setAutoBookingEnabled(true);
    }
    await supabase.from('merchants').update(update).eq('id', merchant.id);
    await refetch();
    setShowModeChoice(false);
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
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-5 lg:max-w-md">
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
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center max-w-md mx-auto">
          <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-gray-700 mb-1">{t('disabledTitle')}</p>
          <p className="text-xs text-gray-400 mb-4">{t('disabledHint')}</p>
          <div className="text-left space-y-2.5">
            {[1, 2, 3].map(n => (
              <div key={n} className="flex items-start gap-2.5">
                <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center mt-0.5">{n}</span>
                <p className="text-xs text-gray-500">{t(`disabledStep${n}` as 'disabledStep1')}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: CRENEAUX ── */}
      {planningEnabled && tab === 'slots' && (
        <>
          {showModeChoice ? (
            /* ── MODE CHOICE SCREEN (first activation) ── */
            <div className="max-w-lg mx-auto">
              <div className="text-center mb-6">
                <h2 className="text-base font-bold text-gray-900 mb-1">{t('modeChoiceTitle')}</h2>
                <p className="text-xs text-gray-400">{t('modeChoiceSubtitle')}</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                {(['slots', 'free'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handleModeChoice(mode)}
                    className="text-left bg-white rounded-2xl border-2 border-gray-100 hover:border-indigo-300 shadow-sm p-5 transition-all hover:shadow-md group"
                  >
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center mb-3 group-hover:bg-indigo-100 transition-colors">
                      {mode === 'slots' ? <LayoutGrid className="w-4.5 h-4.5 text-indigo-600" /> : <Clock className="w-4.5 h-4.5 text-indigo-600" />}
                    </div>
                    <p className="text-sm font-bold text-gray-900 mb-1.5">
                      {mode === 'slots' ? t('modeChoiceSlotTitle') : t('modeChoiceFreeTitle')}
                    </p>
                    <p className="text-[11px] text-gray-400 leading-relaxed">
                      {mode === 'slots' ? t('modeChoiceSlotDesc') : t('modeChoiceFreeDesc')}
                    </p>
                    <span className="mt-3 inline-block text-[11px] font-bold text-indigo-600 group-hover:underline">{t('modeChoiceCta')} →</span>
                  </button>
                ))}
              </div>
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

                {/* Actions row — day-scoped + kebab menu for week-scoped */}
                {!selectedDayIsPast && (
                  <div className="flex gap-2 items-center">
                    {isFreeMod ? (
                      <button
                        onClick={() => openManualBookingModal(selectedDayStr)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        {t('addManualBooking')}
                      </button>
                    ) : (
                      <button
                        onClick={() => openAddSlotsModal(selectedDayStr)}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-indigo-600 text-white font-semibold text-xs hover:bg-indigo-700 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5 shrink-0" />
                        {t('addSlotsTitle')}
                      </button>
                    )}
                    <button
                      onClick={() => openBlockModal(selectedDayStr)}
                      className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-200 transition-all"
                      title={t('blockSlot')}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{t('blockSlot')}</span>
                    </button>

                    {/* Kebab menu — week-scoped actions (hidden in mode libre if rien à supprimer) */}
                    {(!isFreeMod || selectedDayFreeCount > 0 || freeSlots > 0) && (
                    <div className="relative">
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
                          <div className="absolute right-0 top-full mt-2 z-20 w-56 bg-white rounded-xl shadow-xl border border-gray-200 p-1.5">
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
        <div className="space-y-6">

          {/* ═══════ SECTION 1: MON AGENDA ═══════ */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 mb-2 px-1">{t('sectionAgenda')}</h3>
            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">

              {/* Card: Mode de planning */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:col-span-2">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-800">{t('bookingModeTitle')}</h2>
                </div>
                <div className="ml-9 grid grid-cols-2 gap-2 mt-2">
                  {(['slots', 'free'] as const).map(mode => {
                    const isActive = bookingMode === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => handleBookingModeChange(mode)}
                        className={`text-left rounded-xl border p-3 transition-all ${isActive ? 'bg-slate-900 border-slate-900' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}
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
                        <p className={`text-[10px] leading-relaxed ${isActive ? 'text-white/80' : 'text-gray-400'}`}>
                          {mode === 'slots' ? t('bookingModeSlotHint') : t('bookingModeFreeHint')}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Card: Tampon entre les RDV (mode libre uniquement) */}
              {bookingMode === 'free' && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center shrink-0">
                      <Clock className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">{t('bufferTitle')}</h2>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-3 ml-9">{t('bufferHint')}</p>
                  <div className="flex gap-2 ml-9 flex-wrap">
                    {([0, 10, 15, 30] as const).map(val => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setBufferMinutes(val)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${bufferMinutes === val ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'}`}
                      >
                        {val === 0 ? t('bufferNone') : `${val} min`}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Hint: horaires depuis la vitrine (mode libre uniquement) */}
              {bookingMode === 'free' && (
                <div className="bg-indigo-50 rounded-2xl border border-indigo-100 p-4">
                  <p className="text-[11px] text-indigo-700 leading-relaxed">
                    {t('bookingModeFreeHoursHint')}{' '}
                    <a href="/dashboard/public-page" className="font-semibold underline underline-offset-2 hover:text-indigo-900">
                      {t('bookingModeFreeHoursLink')}
                    </a>
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ═══════ SECTION 2: RÉSA EN LIGNE ═══════ */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 mb-2 px-1">{t('sectionOnlineBooking')}</h3>
            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">

              {/* Card: Resa en ligne — toggle */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:col-span-2">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                      <Globe className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-800">{t('autoBookingTitle')}</h2>
                      <p className="text-[11px] text-gray-400 mt-0.5">{autoBookingEnabled ? t('autoBookingHint') : t('autoBookingOffHint')}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={autoBookingEnabled}
                    onClick={() => setAutoBookingEnabled(!autoBookingEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 ${autoBookingEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${autoBookingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>

              {/* Card: Conditions de reservation (only when online booking enabled) */}
              {autoBookingEnabled && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                      <Phone className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">{t('bookingTitle')}</h2>
                  </div>
                  <p className="text-[11px] text-gray-400 mb-3 ml-9">{t('bookingHint')}</p>

                  <div className="ml-9">
                    <textarea
                      value={bookingMessage}
                      onChange={(e) => setBookingMessage(e.target.value)}
                      placeholder={t('bookingPlaceholder')}
                      maxLength={500}
                      rows={4}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                    />
                    <p className="text-[10px] text-gray-300 text-right mt-1">{bookingMessage.length}/500</p>
                  </div>
                </div>
              )}

          {/* ── Online booking advanced settings (visible when auto-booking enabled) ── */}
          {autoBookingEnabled && (
            <>
              {/* Warning if external booking URL is configured */}
              {merchant?.booking_url && (
                <div className="flex gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-3 sm:px-4 py-3 sm:col-span-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-700">{t('externalBookingWarning')}</p>
                </div>
              )}

              {/* Acompte config */}
              {(() => {
                const hasAmount = !!(depositPercent || depositAmount);
                const hasLink = !!depositLink.trim();
                const linkMissing = depositEnabled && hasAmount && !hasLink;
                const amountMissing = depositEnabled && hasLink && !hasAmount;
                return (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden sm:col-span-2">
                    <div className="px-4 sm:px-5 py-3 bg-amber-50/50 border-b border-amber-100/50 flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-amber-500 shrink-0" />
                      <h2 className="text-sm font-bold text-gray-800">{t('depositTitle')}</h2>
                      <button type="button" role="switch" aria-checked={depositEnabled} onClick={() => setDepositEnabled(!depositEnabled)}
                        className={`ml-auto relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${depositEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${depositEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
                      </button>
                    </div>
                    {depositEnabled && <div className="p-4 sm:p-5 space-y-4">
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{t('depositLinkLabel')}</label>
                        <div className="flex gap-2">
                          <input type="url" value={depositLink} onChange={(e) => setDepositLink(e.target.value)} placeholder={t('depositLinkPlaceholder')}
                            className={`flex-1 min-w-0 px-3 py-2 sm:px-3.5 sm:py-2.5 text-base sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors ${linkMissing ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`} />
                          <input type="text" value={depositLinkLabel} onChange={(e) => setDepositLinkLabel(e.target.value)} placeholder={t('depositLinkNamePlaceholder')} maxLength={20}
                            className="w-24 sm:w-28 px-2.5 py-2 sm:py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" />
                        </div>
                        {linkMissing && <p className="text-[10px] text-red-400 mt-1.5">{t('depositLinkRequired')}</p>}
                        <div className="flex gap-2 mt-2">
                          <input type="url" value={depositLink2} onChange={(e) => setDepositLink2(e.target.value)} placeholder={t('depositLink2Placeholder')}
                            className="flex-1 min-w-0 px-3 py-2 sm:px-3.5 sm:py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" />
                          <input type="text" value={depositLink2Label} onChange={(e) => setDepositLink2Label(e.target.value)} placeholder={t('depositLinkNamePlaceholder')} maxLength={20}
                            className="w-24 sm:w-28 px-2.5 py-2 sm:py-2.5 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-colors" />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">{t('depositLink2Hint')}</p>
                        <p className="text-[11px] text-gray-400 mt-2">
                          {t('depositLinkAffiliate')}{' '}
                          <a href="https://revolut.com/referral/?referral-code=judicasay3!APR1-26-VR-FR&geo-redirect" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-semibold hover:underline">{t('depositLinkAffiliateJoin')}</a>
                        </p>
                      </div>
                      <div className="border-t border-gray-100" />
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('depositAmountLabel')}</label>
                        <div className={`transition-opacity ${depositAmount ? 'opacity-40' : ''}`}>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('percentageLabel')}</p>
                          <div className="flex flex-wrap gap-1.5 mb-3">
                            {['10', '15', '20', '25', '30'].map(v => (
                              <button key={`p${v}`} type="button" onClick={() => { setDepositPercent(v); setDepositAmount(''); }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${depositPercent === v ? 'bg-slate-900 text-white border border-slate-900' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>{v}%</button>
                            ))}
                            <input type="number" value={!['10', '15', '20', '25', '30'].includes(depositPercent) ? depositPercent : ''} onChange={(e) => { setDepositPercent(e.target.value); if (e.target.value) setDepositAmount(''); }} placeholder={t('customPercent')} min={1} max={100}
                              className={`w-[72px] px-2.5 py-1.5 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${amountMissing ? 'border-red-300' : 'border-gray-200'}`} />
                          </div>
                        </div>
                        <div className="flex items-center gap-3 mb-3"><div className="flex-1 border-t border-gray-100" /><span className="text-[10px] font-semibold text-gray-300 uppercase">{t('or')}</span><div className="flex-1 border-t border-gray-100" /></div>
                        <div className={`transition-opacity ${depositPercent ? 'opacity-40' : ''}`}>
                          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('fixedAmountLabel')}</p>
                          <div className="flex flex-wrap gap-1.5">
                            {['10', '15', '20', '25', '30'].map(v => (
                              <button key={`a${v}`} type="button" onClick={() => { setDepositAmount(v); setDepositPercent(''); }}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${depositAmount === v ? 'bg-slate-900 text-white border border-slate-900' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>{v}{getCurrencySymbol(merchant?.country)}</button>
                            ))}
                            <input type="number" value={!['10', '15', '20', '25', '30'].includes(depositAmount) ? depositAmount : ''} onChange={(e) => { setDepositAmount(e.target.value); if (e.target.value) setDepositPercent(''); }} placeholder={t('customAmount')} min={1}
                              className={`w-[72px] px-2.5 py-1.5 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${amountMissing ? 'border-red-300' : 'border-gray-200'}`} />
                          </div>
                        </div>
                        {amountMissing && <p className="text-[10px] text-red-400 mt-1.5">{t('depositAmountRequired')}</p>}
                      </div>
                      <div className="border-t border-gray-100" />
                      <div>
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('depositDeadlineLabel')}</label>
                        <div className="flex flex-wrap gap-1.5">
                          <button type="button" onClick={() => setDepositDeadlineHours('')} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${!depositDeadlineHours ? 'bg-gray-900 text-white border border-gray-900 shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>{t('depositDeadlineFree')}</button>
                          {['1', '2', '3', '4'].map(v => (
                            <button key={`d${v}`} type="button" onClick={() => setDepositDeadlineHours(v)} className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${depositDeadlineHours === v ? 'bg-slate-900 text-white border border-slate-900' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>{v}h</button>
                          ))}
                          <input type="number" value={!['', '1', '2', '3', '4'].includes(depositDeadlineHours) ? depositDeadlineHours : ''} onChange={(e) => setDepositDeadlineHours(e.target.value)} placeholder={t('customHours')} min={1}
                            className="w-[72px] px-2.5 py-1.5 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 border-gray-200" />
                        </div>
                        <p className="text-[11px] text-gray-400 mt-1.5">{depositDeadlineHours ? t('depositDeadlineHint') : t('depositDeadlineFreeHint')}</p>
                        {depositDeadlineHours && (
                          <div className="mt-2 flex items-start gap-2 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100">
                            <Moon className="w-3.5 h-3.5 text-gray-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-gray-500">{t('depositNightGraceHint')}</p>
                          </div>
                        )}
                        <div className="mt-2 rounded-xl bg-indigo-50/60 border border-indigo-100 p-3">
                          <div className="flex items-start gap-2">
                            <div className="w-6 h-6 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0"><Bell className="w-3.5 h-3.5 text-indigo-600" /></div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-bold text-indigo-900 mb-0.5">{t('depositValidationTitle')}</p>
                              <p className="text-[11px] text-indigo-800/80 leading-relaxed">{t('depositValidationBody')}</p>
                            </div>
                          </div>
                          <div className="mt-2 pt-2 border-t border-indigo-100/80 flex items-start gap-2">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-gray-600 leading-relaxed">{t('depositEmailSpamWarning')}</p>
                          </div>
                        </div>
                      </div>
                    </div>}
                  </div>
                );
              })()}

              {/* Customer self-service cancel/reschedule */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-visible sm:col-span-2">
                <div className="px-4 sm:px-5 py-3 bg-gray-50/80 border-b border-gray-100 flex items-center gap-2">
                  <CalendarX2 className="w-4 h-4 text-gray-500 shrink-0" />
                  <h2 className="text-sm font-bold text-gray-800">{t('customerEditTitle')}</h2>
                </div>
                <div className="p-4 sm:p-5 space-y-3">
                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t('allowCustomerCancel')}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{t('allowCustomerCancelDesc')}</p>
                      </div>
                      <button type="button" role="switch" aria-checked={allowCustomerCancel} onClick={() => setAllowCustomerCancel(!allowCustomerCancel)}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${allowCustomerCancel ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${allowCustomerCancel ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                    {allowCustomerCancel && (
                      <div className="pl-1">
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('editDeadlineDays')}</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[{ value: '1', label: t('deadlineDay1') }, { value: '2', label: t('deadlineDay2') }, { value: '3', label: t('deadlineDay3') }, { value: '7', label: t('deadlineDay7') }].map(opt => (
                            <button key={opt.value} type="button" onClick={() => setCancelDeadlineDays(opt.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${cancelDeadlineDays === opt.value ? 'bg-slate-900 text-white border border-slate-900' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="border-t border-gray-100" />
                  <div className="space-y-2.5">
                    <label className="flex items-center justify-between gap-3 cursor-pointer">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{t('allowCustomerReschedule')}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{t('allowCustomerRescheduleDesc')}</p>
                      </div>
                      <button type="button" role="switch" aria-checked={allowCustomerReschedule} onClick={() => setAllowCustomerReschedule(!allowCustomerReschedule)}
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors ${allowCustomerReschedule ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform mt-0.5 ${allowCustomerReschedule ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                      </button>
                    </label>
                    {allowCustomerReschedule && (
                      <div className="pl-1">
                        <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('editDeadlineDays')}</label>
                        <div className="flex flex-wrap gap-1.5">
                          {[{ value: '1', label: t('deadlineDay1') }, { value: '2', label: t('deadlineDay2') }, { value: '3', label: t('deadlineDay3') }, { value: '7', label: t('deadlineDay7') }].map(opt => (
                            <button key={opt.value} type="button" onClick={() => setRescheduleDeadlineDays(opt.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${rescheduleDeadlineDays === opt.value ? 'bg-slate-900 text-white border border-slate-900' : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300'}`}>{opt.label}</button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
            </div>
          </section>

          {/* ═══════ SECTION 3: COMMUNICATION ═══════ */}
          <section>
            <h3 className="text-[11px] font-bold uppercase tracking-wider text-violet-600 mb-2 px-1">{t('sectionCommunication')}</h3>
            <div className="space-y-3 sm:grid sm:grid-cols-2 sm:gap-3 sm:space-y-0">

              {/* Card: Notifications push */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:col-span-2">
                <div className="flex items-center justify-between gap-3 mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                      <Bell className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-800 truncate">{t('pushNotifTitle')}</h2>
                  </div>
                  {pushSubscribed ? (
                    <span className="shrink-0 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold">
                      <Check className="w-3 h-3" />
                      {t('pushNotifActive')}
                    </span>
                  ) : pushSupported ? (
                    <button
                      type="button"
                      onClick={subscribePush}
                      disabled={pushSubscribing || pushPermission === 'denied'}
                      className="shrink-0 px-3 py-1.5 rounded-lg bg-[#4b0082] hover:bg-[#4b0082]/90 text-white text-xs font-bold active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50"
                    >
                      {pushSubscribing ? '...' : t('pushNotifEnable')}
                    </button>
                  ) : null}
                </div>
                <p className="text-[11px] text-gray-500 ml-9 leading-relaxed">
                  {pushSubscribed
                    ? t('pushNotifActiveHint')
                    : !pushSupported
                      ? (isIOS && !isStandalone ? t('pushNotifIosPwa') : t('pushNotifUnsupported'))
                      : pushPermission === 'denied'
                        ? t('pushNotifDenied')
                        : t('pushNotifHint')}
                </p>
                {pushError && (
                  <p className="text-[11px] text-red-500 font-medium ml-9 mt-1.5">{pushError}</p>
                )}
              </div>

              {/* Card: Message public */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-800">{t('publicMessageTitle')}</h2>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={messageEnabled}
                    onClick={() => setMessageEnabled(!messageEnabled)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 ${messageEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${messageEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 mb-3 ml-9">{t('publicMessageHint')}</p>

                {messageEnabled && (
                  <div className="space-y-2.5 ml-9">
                    <input
                      type="text"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={t('publicMessagePlaceholder')}
                      maxLength={200}
                      className="w-full px-3 py-2 text-base sm:text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-[11px] text-gray-400 shrink-0">{t('expiresOn')}</label>
                      <input
                        type="date"
                        value={messageExpires}
                        onChange={(e) => setMessageExpires(e.target.value)}
                        min={formatDate(new Date())}
                        className="px-2 py-1 text-xs border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                      />
                      {messageExpires ? (
                        <button onClick={() => setMessageExpires('')} className="text-[11px] text-red-400 hover:text-red-500 transition-colors">
                          {t('remove')}
                        </button>
                      ) : (
                        <span className="text-[11px] text-gray-300">{t('permanent')}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Card: SMS Notifications */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h2 className="text-sm font-bold text-gray-800">{t('smsTitle')}</h2>
                </div>
                {merchant?.subscription_status === 'active' || merchant?.subscription_status === 'canceling' || merchant?.subscription_status === 'past_due' ? (
                  <div className="ml-9">
                    <p className="text-[11px] text-gray-500 leading-relaxed">{t('smsActiveInfo')}</p>
                    {smsUsage && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="text-gray-500">{t('smsQuotaLabel')}</span>
                          <span className="font-bold text-gray-700">{smsUsage.sent} {t('smsQuotaOf')} 100</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${smsUsage.sent >= 100 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                            style={{ width: `${Math.min(100, smsUsage.sent)}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1">{t('smsOverageInfo')}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ml-9 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-gray-500">{t('smsTrialMessage')}</p>
                    <a href="/dashboard/subscription" className="shrink-0 px-3 py-1.5 rounded-lg bg-[#4b0082] hover:bg-[#4b0082]/90 text-white text-[11px] font-bold active:scale-[0.98] touch-manipulation transition-all">
                      {t('smsTrialCta')}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Save button — sticky at bottom on mobile/desktop so the merchant never loses it */}
          <div className="sticky bottom-4 flex justify-center pt-2 z-10 pointer-events-none">
            <button
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className={`pointer-events-auto w-full sm:w-auto sm:min-w-[220px] px-6 py-3 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg ${savedSettings ? 'bg-emerald-500 text-white shadow-emerald-300/60' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-300/60'}`}
            >
              {savedSettings ? (
                <span className="flex items-center justify-center gap-2"><Check className="w-4 h-4" /> {t('saved')}</span>
              ) : savingSettings ? (
                <Loader2 className="w-4 h-4 animate-spin mx-auto" />
              ) : (
                t('save')
              )}
            </button>
          </div>
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
                className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
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
                  {services.length > 0 && (
                    <div>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-400">1. {t('manualServices')}</label>
                        {manualServiceIds.length > 0 && (
                          <span className="text-[11px] font-semibold text-indigo-600">
                            {t('totalDuration', { duration: formatDuration(manualDuration) })}
                            {manualTotalPrice > 0 && ` · ${formatCurrency(manualTotalPrice, merchant?.country, locale)}`}
                          </span>
                        )}
                      </div>
                      {manualSelected.length > 0 && (
                        <div className="space-y-1 mb-2">
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
                    </div>
                  )}

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
                            <button key={c.id} onPointerDown={() => selectCustomer(c)}
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
                        disabled={!manualDate || !manualStartTime || manualServiceIds.length === 0 || !!manualConflict}
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
              {modeSwitchTarget === 'free' && emptySlotIds.length > 0 && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-100">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    {t(emptySlotIds.length > 1 ? 'modeSwitchEmptySlotsWarningPlural' : 'modeSwitchEmptySlotsWarning', { count: emptySlotIds.length })}
                  </p>
                </div>
              )}
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
            saving={saving}
            locale={locale}
            depositPercent={merchant.deposit_percent}
            depositAmount={merchant.deposit_amount}
            subscriptionStatus={merchant.subscription_status}
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
