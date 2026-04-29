'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useMerchant } from '@/contexts/MerchantContext';
import { useToast } from '@/components/ui/Toast';
import { getSupabase } from '@/lib/supabase';
import type { PlanningSlot, CustomerSearchResult, MerchantCountry, BookingMode, BookingDepositFailure } from '@/types';
import { getWeekStart, formatDate, getSlotServiceIds, SERVICE_COLORS } from './utils';
import { toLocalPhone } from '@/lib/utils';

export interface ServiceWithDuration {
  id: string;
  name: string;
  duration: number | null;
  price: number;
  category_id: string | null;
}

export type ModalState =
  | { type: 'closed' }
  | { type: 'add-slots'; day: string }
  | { type: 'copy-week' }
  | { type: 'bulk-delete'; scope: 'day' | 'week'; slotIds: string[]; emptyCount: number; bookedCount: number; label: string }
  | { type: 'client-select'; slot: PlanningSlot }
  | { type: 'booking-details'; slot: PlanningSlot; customer: CustomerSearchResult | null; isNewCustomer: boolean };

export interface CustomServiceDraft {
  name: string;
  duration: number; // minutes
  price: number; // centimes
  color: string; // hex
}

export interface BookingDraft {
  clientName: string;
  clientPhone: string;
  phoneCountry: MerchantCountry | '';
  customerId: string | null;
  serviceIds: string[];
  customService: CustomServiceDraft | null;
  notes: string;
  instagramHandle: string;
  tiktokHandle: string;
  facebookUrl: string;
}

const emptyDraft: BookingDraft = {
  clientName: '',
  clientPhone: '',
  phoneCountry: '',
  customerId: null,
  serviceIds: [],
  customService: null,
  notes: '',
  instagramHandle: '',
  tiktokHandle: '',
  facebookUrl: '',
};

export function usePlanningState() {
  const { merchant, loading: merchantLoading, refetch } = useMerchant();
  const supabase = getSupabase();
  const t = useTranslations('planning');
  const { addToast } = useToast();

  const [tab, setTab] = useState<'slots' | 'reservations' | 'settings'>('slots');
  const [selectedDay, setSelectedDay] = useState<Date>(new Date());
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState<PlanningSlot[]>([]);
  const [upcomingSlots, setUpcomingSlots] = useState<PlanningSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingUpcoming, setLoadingUpcoming] = useState(false);
  const [upcomingFetched, setUpcomingFetched] = useState(false);
  const [depositFailures, setDepositFailures] = useState<BookingDepositFailure[]>([]);
  const [failuresFetched, setFailuresFetched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Settings
  const [message, setMessage] = useState('');
  const [messageEnabled, setMessageEnabled] = useState(false);
  const [messageExpires, setMessageExpires] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const [autoBookingEnabled, setAutoBookingEnabled] = useState(false);
  const [allowCustomerCancel, setAllowCustomerCancel] = useState(false);
  const [allowCustomerReschedule, setAllowCustomerReschedule] = useState(false);
  const [cancelDeadlineDays, setCancelDeadlineDays] = useState('1');
  const [rescheduleDeadlineDays, setRescheduleDeadlineDays] = useState('1');
  const [depositLink, setDepositLink] = useState('');
  const [depositLinkLabel, setDepositLinkLabel] = useState('');
  const [depositLink2, setDepositLink2] = useState('');
  const [depositLink2Label, setDepositLink2Label] = useState('');
  const [depositPercent, setDepositPercent] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositDeadlineHours, setDepositDeadlineHours] = useState('1');
  // Booking mode + buffer
  const [bookingMode, setBookingMode] = useState<BookingMode>('slots');
  const [bufferMinutes, setBufferMinutes] = useState<0 | 10 | 15 | 30>(0);
  // Service à domicile
  const [homeServiceEnabled, setHomeServiceEnabled] = useState(false);
  const [hideAddressOnPublicPage, setHideAddressOnPublicPage] = useState(false);

  // Services with duration
  const [services, setServices] = useState<ServiceWithDuration[]>([]);

  // Modal state machine
  const [modalState, setModalState] = useState<ModalState>({ type: 'closed' });

  // Add slots modal state
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState('');

  // Booking draft (shared between modals)
  const [draft, setDraft] = useState<BookingDraft>(emptyDraft);

  // Customer search
  const [customerResults, setCustomerResults] = useState<CustomerSearchResult[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Week dates
  const weekStart = useMemo(() => getWeekStart(weekOffset), [weekOffset]);
  const weekDays = useMemo(() => Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  }), [weekStart]);
  const weekEnd = useMemo(() => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + 6);
    return d;
  }, [weekStart]);

  // Pre-compute slots grouped by date (excluding filler slots for display)
  const slotsByDate = useMemo(() => {
    const map = new Map<string, PlanningSlot[]>();
    for (const s of slots) {
      if (s.primary_slot_id) continue; // skip filler slots
      if (!map.has(s.slot_date)) map.set(s.slot_date, []);
      map.get(s.slot_date)!.push(s);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return map;
  }, [slots]);

  // Stats
  const todayStr = useMemo(() => formatDate(new Date()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const realSlots = useMemo(() => slots.filter(s => s.client_name !== '__blocked__'), [slots]);
  const totalSlots = realSlots.length;
  const takenSlots = useMemo(() => realSlots.filter(s => s.client_name).length, [realSlots]);
  const freeSlots = totalSlots - takenSlots;
  const isToday = (d: Date) => formatDate(d) === todayStr;
  const isPast = (d: Date) => formatDate(d) < todayStr;

  // Init settings from merchant
  useEffect(() => {
    if (merchant) {
      setMessage(merchant.planning_message || '');
      setMessageEnabled(!!merchant.planning_message);
      setMessageExpires(merchant.planning_message_expires || '');
      setBookingMessage(merchant.booking_message || '');
      setAutoBookingEnabled(!!merchant.auto_booking_enabled);
      setDepositLink(merchant.deposit_link || '');
      setDepositLinkLabel(merchant.deposit_link_label || '');
      setDepositLink2(merchant.deposit_link_2 || '');
      setDepositLink2Label(merchant.deposit_link_2_label || '');
      setDepositPercent(merchant.deposit_percent ? String(merchant.deposit_percent) : '');
      setDepositAmount(merchant.deposit_amount ? String(merchant.deposit_amount) : '');
      setDepositDeadlineHours(merchant.deposit_deadline_hours != null ? String(merchant.deposit_deadline_hours) : '1');
      setAllowCustomerCancel(!!merchant.allow_customer_cancel);
      setAllowCustomerReschedule(!!merchant.allow_customer_reschedule);
      setCancelDeadlineDays(String(merchant.cancel_deadline_days ?? 1));
      setRescheduleDeadlineDays(String(merchant.reschedule_deadline_days ?? 1));
      setBookingMode((merchant.booking_mode as BookingMode) || 'slots');
      setBufferMinutes((merchant.buffer_minutes as 0 | 10 | 15 | 30) || 0);
      setHomeServiceEnabled(!!merchant.home_service_enabled);
      setHideAddressOnPublicPage(!!merchant.hide_address_on_public_page);
    }
  }, [merchant]);

  // Fetch services with duration
  useEffect(() => {
    if (!merchant) return;
    fetch(`/api/services?merchantId=${merchant.id}`)
      .then(r => r.ok ? r.json() : { services: [] })
      .then(data => setServices((data.services || []).map((s: ServiceWithDuration) => ({
        id: s.id, name: s.name, duration: s.duration ?? null, price: s.price, category_id: s.category_id ?? null,
      }))))
      .catch(() => {});
  }, [merchant]);

  // Cleanup search timeout
  useEffect(() => {
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, []);

  // Invalidate upcoming cache — will refetch via effect if on upcoming tab.
  // Failures are independent (cron-only writes) — mutated locally by bring-back/delete.
  const invalidateUpcoming = useCallback(() => { setUpcomingFetched(false); }, []);

  const fetchDepositFailures = useCallback(async () => {
    if (!merchant) return;
    try {
      const res = await fetch(`/api/planning/deposit-failures?merchantId=${merchant.id}`);
      const data = await res.json();
      setDepositFailures(data.failures || []);
      setFailuresFetched(true);
    } catch {
      setDepositFailures([]);
      setFailuresFetched(true);
    }
  }, [merchant]);

  const deleteDepositFailure = useCallback(async (failureId: string) => {
    if (!merchant) return;
    try {
      await fetch('/api/planning/deposit-failures', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: failureId, merchantId: merchant.id }),
      });
      setDepositFailures(prev => prev.filter(f => f.id !== failureId));
    } catch { /* */ }
  }, [merchant]);

  const bringBackDepositFailure = useCallback(async (
    failureId: string,
    opts: { markDepositConfirmed: boolean; sendSms: boolean; customService?: CustomServiceDraft | null; customOverridden?: boolean },
  ): Promise<{ success: boolean; error?: string }> => {
    if (!merchant) return { success: false, error: 'Merchant non chargé' };
    try {
      const { customService, customOverridden, ...rest } = opts;
      const customPayload = customOverridden
        ? {
            custom_service_name: customService?.name?.trim() || null,
            custom_service_duration: customService?.duration ?? null,
            custom_service_price: customService?.price ?? null,
            custom_service_color: customService?.color ?? null,
          }
        : {};
      const res = await fetch('/api/planning/deposit-failures/bring-back', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, failureId, ...rest, ...customPayload }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.error || 'Erreur' };
      }
      setDepositFailures(prev => prev.filter(f => f.id !== failureId));
      setUpcomingFetched(false);
      addToast(t('toastBringBackSuccess'), 'success');
      return { success: true };
    } catch {
      return { success: false, error: 'Erreur réseau' };
    }
  }, [merchant, addToast, t]);

  // Fetch slots
  const fetchSlots = useCallback(async (opts?: { silent?: boolean }) => {
    if (!merchant) return;
    const silent = opts?.silent === true;
    if (!silent) setLoadingSlots(true);
    try {
      const res = await fetch(`/api/planning?merchantId=${merchant.id}&from=${formatDate(weekStart)}&to=${formatDate(weekEnd)}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      if (!silent) setLoadingSlots(false);
    }
  }, [merchant, weekStart, weekEnd]);

  useEffect(() => {
    if (merchant?.planning_enabled) fetchSlots();
  }, [merchant, fetchSlots]);

  // Sync modalState.slot with refreshed slots data (e.g. after deposit confirm)
  useEffect(() => {
    if (modalState.type !== 'booking-details' && modalState.type !== 'client-select') return;
    const updated = slots.find(s => s.id === modalState.slot.id);
    if (updated && updated !== modalState.slot) {
      setModalState({ ...modalState, slot: updated });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slots]);

  // Sync weekOffset when selectedDay falls outside the currently loaded week
  useEffect(() => {
    const dayStr = formatDate(selectedDay);
    const startStr = formatDate(weekStart);
    const endStr = formatDate(weekEnd);
    if (dayStr < startStr || dayStr > endStr) {
      const now = getWeekStart(0);
      const diffMs = selectedDay.getTime() - now.getTime();
      const diffWeeks = Math.floor(diffMs / (7 * 24 * 60 * 60 * 1000));
      setWeekOffset(diffWeeks);
    }
  }, [selectedDay, weekStart, weekEnd]);

  // ── Actions ──

  const handleTogglePlanning = async (enabled: boolean) => {
    if (!merchant) return;
    setSaving(true);
    await supabase.from('merchants').update({ planning_enabled: enabled }).eq('id', merchant.id);
    await refetch();
    setSaving(false);
    if (enabled) fetchSlots();
  };

  const handleAddSlots = async () => {
    if (!merchant || modalState.type !== 'add-slots' || selectedTimes.length === 0) return;
    setSaving(true);
    const count = selectedTimes.length;
    let ok = false;
    try {
      const res = await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, slots: selectedTimes.map(time => ({ date: modalState.day, time })) }),
      });
      ok = res.ok;
      await fetchSlots();
      invalidateUpcoming();
    } catch { /* */ }
    setSaving(false);
    setModalState({ type: 'closed' });
    setSelectedTimes([]);
    setCustomTime('');
    if (ok) addToast(t(count > 1 ? 'toastSlotsAddedPlural' : 'toastSlotsAdded', { count }), 'success');
  };

  const handleUpdateSlot = async (slotId: string, data: {
    client_name: string | null;
    client_phone: string | null;
    customer_id: string | null;
    service_ids: string[];
    custom_service_name?: string | null;
    custom_service_duration?: number | null;
    custom_service_price?: number | null;
    custom_service_color?: string | null;
    notes: string | null;
    phone_country?: string;
    send_sms?: boolean;
    send_sms_cancel?: boolean;
    delete_if_empty?: boolean;
  }) => {
    if (!merchant) return;
    setSaving(true);
    // Détecte create vs update vs cancel pour toast ciblé
    const previousSlot = slots.find(s => s.id === slotId);
    const wasEmpty = !previousSlot?.client_name;
    const isNowEmpty = !data.client_name;
    let ok = false;
    try {
      const res = await fetch('/api/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slotId, merchantId: merchant.id, ...data }),
      });
      ok = res.ok;
      await fetchSlots();
      invalidateUpcoming();
    } catch { /* */ }
    setSaving(false);
    setModalState({ type: 'closed' });
    if (ok) {
      if (wasEmpty && !isNowEmpty && data.client_name) {
        const firstName = data.client_name.trim().split(/\s+/)[0];
        addToast(t('toastBookingCreated', { name: firstName }), 'success');
      } else if (!wasEmpty && isNowEmpty) {
        addToast(t('toastBookingCancelled'), 'info');
      } else {
        addToast(t('toastBookingSaved'), 'success');
      }
    }
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!merchant) return;
    const wasBlock = slots.find(s => s.id === slotId)?.client_name === '__blocked__';
    let ok = false;
    try {
      const res = await fetch('/api/planning', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, slotIds: [slotId] }),
      });
      ok = res.ok;
      await fetchSlots();
      invalidateUpcoming();
    } catch { /* */ }
    setModalState({ type: 'closed' });
    if (ok) addToast(t(wasBlock ? 'toastBlockDeleted' : 'toastSlotDeleted'), 'info');
  };

  const handleBulkDeleteSlots = async (slotIds: string[]) => {
    if (!merchant || slotIds.length === 0) return;
    setSaving(true);
    const count = slotIds.length;
    const targeted = slots.filter(s => slotIds.includes(s.id));
    const blockCount = targeted.filter(s => s.client_name === '__blocked__').length;
    const allBlocks = blockCount === count;
    const allSlots = blockCount === 0;
    let ok = false;
    try {
      // Batch by 200 (API limit)
      for (let i = 0; i < slotIds.length; i += 200) {
        const chunk = slotIds.slice(i, i + 200);
        await fetch('/api/planning', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ merchantId: merchant.id, slotIds: chunk }),
        });
      }
      ok = true;
      await fetchSlots();
      invalidateUpcoming();
    } catch { /* */ }
    setSaving(false);
    setModalState({ type: 'closed' });
    if (ok) {
      const key = allBlocks
        ? (count > 1 ? 'toastBlocksDeleted' : 'toastBlockDeleted')
        : allSlots
          ? (count > 1 ? 'toastSlotsDeleted' : 'toastSlotDeleted')
          : 'toastMixedDeleted';
      addToast(t(key, { count }), 'info');
    }
  };

  const handleMoveSlot = async (slotId: string, newTime: string, newDate?: string, force?: boolean, sendSms?: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!merchant) return { success: false, error: 'Merchant non charge' };
    setSaving(true);
    try {
      const payload: Record<string, string | boolean> = { merchantId: merchant.id, slotId, newTime };
      if (newDate) payload.newDate = newDate;
      if (force) payload.force = true;
      if (sendSms) payload.send_sms = true;
      const res = await fetch('/api/planning/shift-slot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setSaving(false);
        return { success: false, error: data.error || 'Erreur lors du deplacement' };
      }
      await fetchSlots();
      invalidateUpcoming();
      setSaving(false);
      addToast(t('toastBookingMoved'), 'success');
      return { success: true };
    } catch {
      setSaving(false);
      return { success: false, error: 'Erreur reseau' };
    }
  };

  const fetchClientHistory = useCallback(async (customerId: string): Promise<PlanningSlot[]> => {
    if (!merchant) return [];
    try {
      const res = await fetch(`/api/planning?merchantId=${merchant.id}&customerId=${customerId}&booked=true`);
      const data = await res.json();
      return data.slots || [];
    } catch {
      return [];
    }
  }, [merchant]);

  const handleCopyWeek = async (targetWeekOffset: number) => {
    if (!merchant) return;
    setSaving(true);
    try {
      await fetch('/api/planning/copy-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId: merchant.id,
          sourceWeekStart: formatDate(weekStart),
          targetWeekStart: formatDate(getWeekStart(targetWeekOffset)),
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      invalidateUpcoming();
    } catch { /* */ }
    setSaving(false);
    setModalState({ type: 'closed' });
  };

  // Customer search
  const searchCustomers = useCallback(async (query: string) => {
    if (!merchant || query.length < 2) {
      setCustomerResults([]);
      setSearchDone(false);
      return;
    }
    try {
      const res = await fetch(`/api/customers/search?merchantId=${merchant.id}&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setCustomerResults(data.customers || []);
      setSearchDone(true);
      setShowCustomerSearch(true);
    } catch {
      setCustomerResults([]);
      setSearchDone(true);
    }
  }, [merchant]);

  const handleDraftNameChange = (value: string) => {
    setDraft(d => ({ ...d, clientName: value, customerId: null }));
    setSearchDone(false);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchCustomers(value), 300);
  };

  const selectCustomer = (c: CustomerSearchResult) => {
    const { local, country: detectedCountry } = toLocalPhone(c.phone_number);
    setDraft(d => ({
      ...d,
      clientName: `${c.first_name}${c.last_name ? ` ${c.last_name}` : ''}`,
      clientPhone: local,
      phoneCountry: detectedCountry,
      customerId: c.id,
      instagramHandle: c.instagram_handle || '',
      tiktokHandle: c.tiktok_handle || '',
      facebookUrl: c.facebook_url || '',
    }));
    setShowCustomerSearch(false);
    setCustomerResults([]);
    setSearchDone(false);
  };

  const handleCreateCustomer = async (socialData?: { instagram_handle?: string; tiktok_handle?: string; facebook_url?: string }): Promise<string | null> => {
    if (!merchant || !draft.clientName.trim() || !draft.clientPhone.trim()) return null;
    setCreatingCustomer(true);
    setCreateError(null);
    try {
      const parts = draft.clientName.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || null;

      const res = await fetch('/api/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: draft.clientPhone.trim(),
          ...(draft.phoneCountry && { phone_country: draft.phoneCountry }),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        // 409 = customer already exists with loyalty card — reuse their ID
        if (res.status === 409 && data.customer_id) {
          setDraft(d => ({ ...d, customerId: data.customer_id }));
          setShowCustomerSearch(false);
          setSearchDone(false);
          setCreatingCustomer(false);
          return data.customer_id as string;
        }
        setCreateError(data.error || 'Erreur lors de la création');
        setCreatingCustomer(false);
        return null;
      }

      if (data.customer_id) {
        setDraft(d => ({ ...d, customerId: data.customer_id }));
        setShowCustomerSearch(false);
        setSearchDone(false);

        // Update social links if provided
        if (socialData && (socialData.instagram_handle || socialData.tiktok_handle || socialData.facebook_url)) {
          fetch('/api/customers/social', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              customerId: data.customer_id,
              merchantId: merchant.id,
              ...socialData,
            }),
          }).catch(() => {});
        }

        addToast(t('toastCustomerCreated', { name: firstName }), 'success');
        setCreatingCustomer(false);
        return data.customer_id as string;
      }

      setCreateError('Erreur inattendue');
    } catch {
      setCreateError('Erreur réseau');
    }
    setCreatingCustomer(false);
    return null;
  };

  // Open slot for editing (enters client-select modal)
  const openEditSlot = (slot: PlanningSlot) => {
    const serviceIds = getSlotServiceIds(slot);
    const social = slot.customer;
    const phoneInfo = slot.client_phone ? toLocalPhone(slot.client_phone) : null;
    const customService = (slot.custom_service_duration && slot.custom_service_duration > 0)
      ? {
          name: slot.custom_service_name || '',
          duration: slot.custom_service_duration,
          price: slot.custom_service_price || 0,
          color: slot.custom_service_color || SERVICE_COLORS[0],
        }
      : null;
    setDraft({
      clientName: slot.client_name || '',
      clientPhone: phoneInfo?.local || '',
      phoneCountry: phoneInfo?.country || '',
      customerId: slot.customer_id || null,
      serviceIds,
      customService,
      notes: slot.notes || '',
      instagramHandle: social?.instagram_handle || '',
      tiktokHandle: social?.tiktok_handle || '',
      facebookUrl: social?.facebook_url || '',
    });
    setShowCustomerSearch(false);
    setCustomerResults([]);
    // Skip client-select and go directly to booking-details if slot already has a client
    if (slot.client_name) {
      const customer: CustomerSearchResult | null = slot.customer_id ? {
        id: slot.customer_id,
        first_name: slot.client_name.split(' ')[0],
        last_name: slot.client_name.split(' ').slice(1).join(' ') || null,
        phone_number: slot.client_phone || '',
        instagram_handle: social?.instagram_handle || null,
        tiktok_handle: social?.tiktok_handle || null,
        facebook_url: social?.facebook_url || null,
      } : null;
      setModalState({ type: 'booking-details', slot, customer, isNewCustomer: false });
    } else {
      setModalState({ type: 'client-select', slot });
    }
  };

  const openAddSlotsModal = (day: string) => {
    setSelectedTimes([]);
    setCustomTime('');
    setModalState({ type: 'add-slots', day });
  };

  // Transition from client-select to booking-details
  const proceedToBookingDetails = (customer: CustomerSearchResult | null, isNewCustomer: boolean) => {
    if (modalState.type !== 'client-select') return;
    setModalState({ type: 'booking-details', slot: modalState.slot, customer, isNewCustomer });
  };

  // Go back to client-select from booking-details
  const goBackToClientSelect = () => {
    if (modalState.type !== 'booking-details') return;
    setModalState({ type: 'client-select', slot: modalState.slot });
  };

  const closeModal = () => {
    setModalState({ type: 'closed' });
    setDraft(emptyDraft);
    setShowCustomerSearch(false);
    setCustomerResults([]);
    setSearchDone(false);
    setCreatingCustomer(false);
  };

  // Fetch upcoming booked slots (separate state, 14 days)
  // Fetch all reservations (past 30 days + next 30 days)
  const fetchReservations = useCallback(async () => {
    if (!merchant || upcomingFetched) return;
    setLoadingUpcoming(true);
    try {
      // Fenêtre : 30 jours passés → 90 jours futurs (couvre mode libre 3 mois + marge mode créneaux 60j)
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 30);
      const fromStr = formatDate(pastDate);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 90);
      const toStr = formatDate(futureDate);
      const res = await fetch(`/api/planning?merchantId=${merchant.id}&from=${fromStr}&to=${toStr}&booked=true`);
      const data = await res.json();
      setUpcomingSlots((data.slots || []).filter((s: PlanningSlot) => s.client_name !== '__blocked__'));
      setUpcomingFetched(true);
    } catch { /* */ }
    setLoadingUpcoming(false);
  }, [merchant, upcomingFetched]);

  // Auto-refetch reservations when invalidated while on the tab
  useEffect(() => {
    if (tab === 'reservations' && !upcomingFetched && merchant?.planning_enabled) {
      fetchReservations();
    }
  }, [tab, upcomingFetched, merchant, fetchReservations]);

  useEffect(() => {
    if (tab === 'reservations' && !failuresFetched && merchant?.planning_enabled) {
      fetchDepositFailures();
    }
  }, [tab, failuresFetched, merchant, fetchDepositFailures]);

  return {
    // Merchant
    merchant, merchantLoading, refetch,
    // Tab
    tab, setTab,
    // Selected day
    selectedDay, setSelectedDay,
    // Week navigation
    weekOffset, setWeekOffset, weekStart, weekDays, weekEnd,
    // Slots
    slots, loadingSlots, slotsByDate, fetchSlots, fetchReservations, invalidateUpcoming, upcomingSlots, loadingUpcoming,
    // Deposit failures archive
    depositFailures, fetchDepositFailures, deleteDepositFailure, bringBackDepositFailure,
    // Stats
    todayStr, totalSlots, takenSlots, freeSlots, isToday, isPast,
    // Settings
    message, setMessage, messageEnabled, setMessageEnabled,
    messageExpires, setMessageExpires, bookingMessage, setBookingMessage,
    autoBookingEnabled, setAutoBookingEnabled,
    allowCustomerCancel, setAllowCustomerCancel, allowCustomerReschedule, setAllowCustomerReschedule,
    cancelDeadlineDays, setCancelDeadlineDays, rescheduleDeadlineDays, setRescheduleDeadlineDays,
    depositLink, setDepositLink, depositLinkLabel, setDepositLinkLabel, depositLink2, setDepositLink2, depositLink2Label, setDepositLink2Label, depositPercent, setDepositPercent, depositAmount, setDepositAmount, depositDeadlineHours, setDepositDeadlineHours,
    bookingMode, setBookingMode, bufferMinutes, setBufferMinutes,
    homeServiceEnabled, setHomeServiceEnabled,
    hideAddressOnPublicPage, setHideAddressOnPublicPage,
    // Services
    services,
    // Modal state machine
    modalState, setModalState, closeModal,
    // Add slots
    selectedTimes, setSelectedTimes, customTime, setCustomTime,
    // Booking draft
    draft, updateDraft: (partial: Partial<BookingDraft>) => setDraft(d => ({ ...d, ...partial })),
    // Customer search
    customerResults, showCustomerSearch, setShowCustomerSearch,
    searchDone, creatingCustomer, createError,
    handleDraftNameChange, selectCustomer, handleCreateCustomer,
    // Actions
    saving, setSaving, saved,
    handleTogglePlanning, handleAddSlots, handleUpdateSlot,
    handleDeleteSlot, handleBulkDeleteSlots, handleMoveSlot, handleCopyWeek,
    openEditSlot, openAddSlotsModal,
    proceedToBookingDetails, goBackToClientSelect,
    fetchClientHistory,
  };
}
