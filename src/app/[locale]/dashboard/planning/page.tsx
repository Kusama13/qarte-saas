'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import { useMerchant } from '@/contexts/MerchantContext';
import { getSupabase } from '@/lib/supabase';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Copy, Loader2, Check, Download, MessageSquare, Phone } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import type { PlanningSlot } from '@/types';
import { PHONE_CONFIG } from '@/lib/utils';
import { getWeekStart, formatDate, formatDateFr, fmtTime } from './utils';
import { handleDownloadStory } from './StoryExport';
import AddSlotsModal from './AddSlotsModal';
import SlotModal from './SlotModal';
import CopyWeekModal from './CopyWeekModal';

interface CustomerResult {
  id: string;
  first_name: string;
  last_name: string | null;
  phone_number: string;
}

type Tab = 'slots' | 'settings';

export default function PlanningDashboard() {
  const t = useTranslations('planning');
  const locale = useLocale();
  const { merchant, loading: merchantLoading, refetch } = useMerchant();
  const supabase = getSupabase();

  const [tab, setTab] = useState<Tab>('slots');
  const [weekOffset, setWeekOffset] = useState(0);
  const [slots, setSlots] = useState<PlanningSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Settings fields
  const [message, setMessage] = useState('');
  const [messageEnabled, setMessageEnabled] = useState(false);
  const [messageExpires, setMessageExpires] = useState('');
  const [bookingMessage, setBookingMessage] = useState('');
  const { saving: savingSettings, saved: savedSettings, save: saveSettings } = useDashboardSave(2000);

  // Modals
  const [addSlotsDay, setAddSlotsDay] = useState<string | null>(null);
  const [selectedTimes, setSelectedTimes] = useState<string[]>([]);
  const [customTime, setCustomTime] = useState('');
  const [editSlot, setEditSlot] = useState<PlanningSlot | null>(null);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [copyTarget, setCopyTarget] = useState<string | null>(null);

  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
  const [editServiceId, setEditServiceId] = useState<string | null>(null);
  const [editCustomerId, setEditCustomerId] = useState<string | null>(null);

  // Customer search & creation
  const [customerResults, setCustomerResults] = useState<CustomerResult[]>([]);
  const [showCustomerSearch, setShowCustomerSearch] = useState(false);
  const [searchDone, setSearchDone] = useState(false);
  const [creatingCustomer, setCreatingCustomer] = useState(false);
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

  // Pre-compute slots grouped by date (avoids 14x filter+sort per render)
  const slotsByDate = useMemo(() => {
    const map = new Map<string, PlanningSlot[]>();
    for (const s of slots) {
      if (!map.has(s.slot_date)) map.set(s.slot_date, []);
      map.get(s.slot_date)!.push(s);
    }
    for (const arr of map.values()) arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
    return map;
  }, [slots]);

  // Memoize stats
  const todayStr = useMemo(() => formatDate(new Date()), []); // eslint-disable-line react-hooks/exhaustive-deps
  const totalSlots = slots.length;
  const takenSlots = useMemo(() => slots.filter(s => s.client_name).length, [slots]);
  const freeSlots = totalSlots - takenSlots;
  const isToday = (d: Date) => formatDate(d) === todayStr;
  const isPast = (d: Date) => formatDate(d) < todayStr;

  useEffect(() => {
    if (merchant) {
      setMessage(merchant.planning_message || '');
      setMessageEnabled(!!merchant.planning_message);
      setMessageExpires(merchant.planning_message_expires || '');
      setBookingMessage(merchant.booking_message || '');
    }
  }, [merchant]);

  useEffect(() => {
    if (!merchant) return;
    fetch(`/api/services?merchantId=${merchant.id}`)
      .then(r => r.json())
      .then(data => setServices(data.services || []))
      .catch(() => {});
  }, [merchant]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, []);

  const fetchSlots = useCallback(async () => {
    if (!merchant) return;
    setLoadingSlots(true);
    try {
      const res = await fetch(`/api/planning?merchantId=${merchant.id}&from=${formatDate(weekStart)}&to=${formatDate(weekEnd)}`);
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  }, [merchant, weekStart, weekEnd]);

  useEffect(() => {
    if (merchant?.planning_enabled) fetchSlots();
  }, [merchant, fetchSlots]);

  // ── Actions ──

  const handleTogglePlanning = async (enabled: boolean) => {
    if (!merchant) return;
    setSaving(true);
    await supabase.from('merchants').update({ planning_enabled: enabled }).eq('id', merchant.id);
    await refetch();
    setSaving(false);
    if (enabled) fetchSlots();
  };

  const handleSaveSettings = async () => {
    if (!merchant) return;
    saveSettings(async () => {
      await supabase.from('merchants').update({
        planning_message: messageEnabled && message.trim() ? message.trim() : null,
        planning_message_expires: messageEnabled && messageExpires ? messageExpires : null,
        booking_message: bookingMessage.trim() || null,
      }).eq('id', merchant.id);
      await refetch();
    });
  };

  const handleAddSlots = async () => {
    if (!merchant || !addSlotsDay || selectedTimes.length === 0) return;
    setSaving(true);
    try {
      await fetch('/api/planning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, slots: selectedTimes.map(time => ({ date: addSlotsDay, time })) }),
      });
      await fetchSlots();
    } catch { /* */ }
    setSaving(false);
    setAddSlotsDay(null);
    setSelectedTimes([]);
    setCustomTime('');
  };

  const handleUpdateSlot = async () => {
    if (!merchant || !editSlot) return;
    setSaving(true);
    try {
      await fetch('/api/planning', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: editSlot.id, merchantId: merchant.id,
          client_name: editName.trim() || null, client_phone: editPhone.trim() || null,
          customer_id: editCustomerId || null,
          service_id: editServiceId || null, notes: editNotes.trim() || null,
        }),
      });
      await fetchSlots();
    } catch { /* */ }
    setSaving(false);
    setEditSlot(null);
  };

  const handleDeleteSlot = async (slotId: string) => {
    if (!merchant) return;
    try {
      await fetch('/api/planning', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId: merchant.id, slotIds: [slotId] }),
      });
      await fetchSlots();
    } catch { /* */ }
    setEditSlot(null);
  };

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
    } catch { /* */ }
    setSaving(false);
    setCopyTarget(null);
  };

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

  const handleNameChange = (value: string) => {
    setEditName(value);
    setEditCustomerId(null);
    setSearchDone(false);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => searchCustomers(value), 300);
  };

  const selectCustomer = (c: CustomerResult) => {
    setEditName(`${c.first_name}${c.last_name ? ` ${c.last_name}` : ''}`);
    setEditPhone(c.phone_number);
    setEditCustomerId(c.id);
    setShowCustomerSearch(false);
    setCustomerResults([]);
    setSearchDone(false);
  };

  const handleCreateCustomer = async () => {
    if (!merchant || !editName.trim() || !editPhone.trim()) return;
    setCreatingCustomer(true);
    try {
      // Split name into first/last
      const parts = editName.trim().split(/\s+/);
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ') || null;

      const res = await fetch('/api/customers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone_number: editPhone.trim(),
        }),
      });
      const data = await res.json();
      if (data.customer_id) {
        setEditCustomerId(data.customer_id);
        setShowCustomerSearch(false);
        setSearchDone(false);
      }
    } catch { /* */ }
    setCreatingCustomer(false);
  };

  const openEditSlot = (slot: PlanningSlot) => {
    setEditSlot(slot);
    setEditName(slot.client_name || '');
    setEditPhone(slot.client_phone || '');
    setEditCustomerId(slot.customer_id || null);
    setEditServiceId(slot.service_id || null);
    setEditNotes(slot.notes || '');
    setShowCustomerSearch(false);
    setCustomerResults([]);
  };

  const openAddSlotsModal = (day: string) => {
    setAddSlotsDay(day);
    setSelectedTimes([]);
    setCustomTime('');
  };

  const onDownloadStory = useCallback(async () => {
    if (!merchant || slots.length === 0) return;
    await handleDownloadStory({ merchant, slots, slotsByDate, weekStart, weekEnd, locale });
  }, [merchant, slots, slotsByDate, weekStart, weekEnd]);

  if (merchantLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  const planningEnabled = !!merchant?.planning_enabled;

  return (
    <div className="max-w-5xl mx-auto">
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

        {/* Toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-400 hidden sm:inline">{planningEnabled ? t('active') : t('inactive')}</span>
          <button
            type="button"
            role="switch"
            aria-checked={planningEnabled}
            onClick={() => handleTogglePlanning(!planningEnabled)}
            disabled={saving}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${planningEnabled ? 'bg-violet-600' : 'bg-gray-200'} ${saving ? 'opacity-50' : ''}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${planningEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 sm:w-fit">
        <button
          onClick={() => setTab('slots')}
          className={`flex-1 sm:flex-none sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all ${tab === 'slots' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('tabSlots')}
        </button>
        <button
          onClick={() => setTab('settings')}
          className={`flex-1 sm:flex-none sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all ${tab === 'settings' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          {t('tabSettings')}
        </button>
      </div>

      {/* ── TAB: CRÉNEAUX ── */}
      {tab === 'slots' && (
        <>
          {!planningEnabled ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center max-w-md mx-auto">
              <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-gray-700 mb-1">{t('disabledTitle')}</p>
              <p className="text-xs text-gray-400 mb-4">
                {t('disabledHint')}
              </p>
              <div className="text-left space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center mt-0.5">1</span>
                  <p className="text-xs text-gray-500">{t('disabledStep1')}</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center mt-0.5">2</span>
                  <p className="text-xs text-gray-500">{t('disabledStep2')}</p>
                </div>
                <div className="flex items-start gap-2.5">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold flex items-center justify-center mt-0.5">3</span>
                  <p className="text-xs text-gray-500">{t('disabledStep3')}</p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ── Navigation semaine + stats ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 mb-4">
                {/* Nav */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => setWeekOffset(o => o - 1)}
                    disabled={weekOffset <= -1}
                    className="p-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-30"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-500" />
                  </button>

                  <div className="flex flex-col items-center">
                    <span className="text-sm font-bold text-gray-900">
                      {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} — {weekEnd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}
                    </span>
                    {weekOffset !== 0 && (
                      <button
                        onClick={() => setWeekOffset(0)}
                        className="text-[11px] text-indigo-600 font-medium mt-0.5 hover:underline"
                      >
                        {t('backToToday')}
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setWeekOffset(o => o + 1)}
                    className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  </button>
                </div>

                {/* Stats inline */}
                {totalSlots > 0 && (
                  <div className="flex items-center justify-center gap-4 text-xs mb-3 pb-3 border-b border-gray-100">
                    <span className="text-gray-500">{totalSlots > 1 ? t('slotCountPlural', { count: totalSlots }) : t('slotCount', { count: totalSlots })}</span>
                    <span className="text-emerald-600 font-semibold">{freeSlots > 1 ? t('freeCountPlural', { count: freeSlots }) : t('freeCount', { count: freeSlots })}</span>
                    {takenSlots > 0 && <span className="text-indigo-600 font-semibold">{t('takenCount', { count: takenSlots })}</span>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={onDownloadStory}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm shadow-indigo-200"
                  >
                    <Download className="w-4 h-4" />
                    {t('downloadStory')}
                  </button>
                  <button
                    onClick={() => setCopyTarget('picking')}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-100 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{t('copy')}</span>
                  </button>
                </div>
              </div>

              {/* Copy week picker */}
              <AnimatePresence>
                {copyTarget === 'picking' && (
                  <CopyWeekModal
                    weekOffset={weekOffset}
                    saving={saving}
                    onCopyWeek={handleCopyWeek}
                    onClose={() => setCopyTarget(null)}
                  />
                )}
              </AnimatePresence>

              {saved && (
                <div className="mb-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium text-center">
                  {t('weekCopied')}
                </div>
              )}

              {/* Week grid */}
              {loadingSlots ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
              ) : (
                <>
                {/* Desktop: 7 columns */}
                <div className="hidden sm:grid sm:grid-cols-4 lg:grid-cols-7 gap-2">
                  {weekDays.map(day => {
                    const dateStr = formatDate(day);
                    const daySlots = slotsByDate.get(dateStr) || [];
                    const past = isPast(day);
                    const today = isToday(day);
                    return (
                      <div
                        key={dateStr}
                        className={`bg-white rounded-xl border p-2.5 min-h-[100px] transition-colors ${today ? 'border-indigo-300 ring-1 ring-indigo-100' : past ? 'border-gray-100 opacity-50' : 'border-gray-100'}`}
                      >
                        <p className={`text-[11px] font-bold mb-2 capitalize ${today ? 'text-indigo-600' : 'text-gray-400'}`}>
                          {formatDateFr(day, locale)}
                        </p>
                        <div className="space-y-1">
                          {daySlots.map(slot => (
                            <button
                              key={slot.id}
                              onClick={() => openEditSlot(slot)}
                              className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden ${slot.client_name ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}
                            >
                              <span className="font-bold">{fmtTime(slot.start_time, locale)}</span>
                              {slot.client_name && <span className="ml-1 opacity-70">— {slot.client_name.length > 8 ? slot.client_name.slice(0, 8) + '…' : slot.client_name}</span>}
                            </button>
                          ))}
                        </div>
                        {!past && (
                          <button
                            onClick={() => openAddSlotsModal(dateStr)}
                            className="mt-1.5 w-full flex items-center justify-center py-1 rounded-lg border border-dashed border-gray-200 text-gray-300 text-[11px] hover:border-indigo-300 hover:text-indigo-500 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Mobile: clean vertical list */}
                <div className="sm:hidden space-y-2">
                  {weekDays.map(day => {
                    const dateStr = formatDate(day);
                    const daySlots = slotsByDate.get(dateStr) || [];
                    const past = isPast(day);
                    const today = isToday(day);
                    if (past && daySlots.length === 0) return null;
                    return (
                      <div
                        key={dateStr}
                        className={`bg-white rounded-xl border p-3 transition-colors ${today ? 'border-indigo-300 ring-1 ring-indigo-100' : past ? 'border-gray-100 opacity-40' : 'border-gray-100'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <p className={`text-xs font-bold capitalize ${today ? 'text-indigo-600' : 'text-gray-500'}`}>
                            {formatDateFr(day, locale)}
                          </p>
                          {!past && (
                            <button
                              onClick={() => openAddSlotsModal(dateStr)}
                              className="p-1 rounded-lg hover:bg-indigo-50 text-gray-300 hover:text-indigo-500 transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        {daySlots.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {daySlots.map(slot => (
                              <button
                                key={slot.id}
                                onClick={() => openEditSlot(slot)}
                                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${slot.client_name ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}
                              >
                                {fmtTime(slot.start_time, locale)}
                                {slot.client_name && <span className="ml-1 opacity-70">— {slot.client_name}</span>}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-gray-300">{t('noSlots')}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
                </>
              )}
            </>
          )}
        </>
      )}

      {/* ── TAB: PARAMÈTRES ── */}
      {tab === 'settings' && (
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
          {/* ── Card: Message public ── */}
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
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${messageEnabled ? 'bg-violet-600' : 'bg-gray-200'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform ${messageEnabled ? 'translate-x-[18px]' : 'translate-x-[3px]'}`} />
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
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
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

          {/* ── Card: Conditions de réservation ── */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
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
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400 resize-none"
              />
              <p className="text-[10px] text-gray-300 text-right mt-1">{bookingMessage.length}/500</p>
            </div>
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-bold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 sm:col-span-2 sm:max-w-xs sm:mx-auto"
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
      )}

      {/* ── MODAL: Add slots ── */}
      <AnimatePresence>
        {addSlotsDay && (
          <AddSlotsModal
            addSlotsDay={addSlotsDay}
            selectedTimes={selectedTimes}
            setSelectedTimes={setSelectedTimes}
            customTime={customTime}
            setCustomTime={setCustomTime}
            slotsByDate={slotsByDate}
            saving={saving}
            onSave={handleAddSlots}
            onClose={() => setAddSlotsDay(null)}
            locale={locale}
          />
        )}
      </AnimatePresence>

      {/* ── MODAL: Edit slot ── */}
      <AnimatePresence>
        {editSlot && (
          <SlotModal
            editSlot={editSlot}
            editName={editName}
            editPhone={editPhone}
            editNotes={editNotes}
            editCustomerId={editCustomerId}
            editServiceId={editServiceId}
            services={services}
            customerResults={customerResults}
            showCustomerSearch={showCustomerSearch}
            searchDone={searchDone}
            creatingCustomer={creatingCustomer}
            saving={saving}
            onNameChange={handleNameChange}
            onPhoneChange={setEditPhone}
            onNotesChange={setEditNotes}
            onServiceChange={setEditServiceId}
            onCustomerIdChange={setEditCustomerId}
            onShowCustomerSearch={setShowCustomerSearch}
            onSelectCustomer={selectCustomer}
            onCreateCustomer={handleCreateCustomer}
            onClearSlot={() => { setEditName(''); setEditPhone(''); setEditCustomerId(null); setEditServiceId(null); setEditNotes(''); }}
            onSave={handleUpdateSlot}
            onDelete={handleDeleteSlot}
            onClose={() => setEditSlot(null)}
            phonePlaceholder={PHONE_CONFIG[merchant?.country || 'FR'].placeholder}
            locale={locale}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
