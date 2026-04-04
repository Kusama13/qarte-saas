'use client';

import { useCallback, useEffect, useMemo, useState, DragEvent } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useDashboardSave } from '@/hooks/useDashboardSave';
import { getSupabase } from '@/lib/supabase';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Copy, Loader2, Check, Download, MessageSquare, Phone, LayoutGrid, Calendar, Globe, CreditCard, Info, AlertTriangle } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import type { PlanningSlot } from '@/types';
import { PHONE_CONFIG, formatTime, toBCP47, getCurrencySymbol } from '@/lib/utils';
import { formatDate, formatDateFr, getServiceColorMap, getSlotColor, colorBorderStyle } from './utils';
import { handleDownloadStory } from './StoryExport';
import { usePlanningState } from './usePlanningState';
import AddSlotsModal from './AddSlotsModal';
import CopyWeekModal from './CopyWeekModal';
import ClientSelectModal from './ClientSelectModal';
import BookingDetailsModal from './BookingDetailsModal';
import ReservationsSection from './ReservationsSection';
import DayView from './DayView';

export default function PlanningDashboard() {
  const t = useTranslations('planning');
  const locale = useLocale();
  const supabase = getSupabase();

  const state = usePlanningState();
  const {
    merchant, merchantLoading, refetch,
    tab, setTab,
    viewMode, setViewMode, selectedDay, setSelectedDay,
    weekOffset, setWeekOffset, weekStart, weekDays, weekEnd,
    slots, loadingSlots, slotsByDate, fetchSlots, upcomingSlots,
    todayStr, totalSlots, takenSlots, freeSlots, isToday, isPast,
    message, setMessage, messageEnabled, setMessageEnabled,
    messageExpires, setMessageExpires, bookingMessage, setBookingMessage,
    autoBookingEnabled, setAutoBookingEnabled,
    depositLink, setDepositLink, depositPercent, setDepositPercent, depositAmount, setDepositAmount,
    services,
    modalState, setModalState, closeModal,
    selectedTimes, setSelectedTimes, customTime, setCustomTime,
    draft, updateDraft,
    customerResults, showCustomerSearch, setShowCustomerSearch,
    searchDone, creatingCustomer, createError,
    handleDraftNameChange, selectCustomer, handleCreateCustomer,
    saving, saved,
    handleTogglePlanning, handleAddSlots, handleUpdateSlot,
    handleDeleteSlot, handleMoveSlot, handleCopyWeek,
    openEditSlot, openAddSlotsModal,
    proceedToBookingDetails, goBackToClientSelect,
    fetchClientHistory,
  } = state;

  const { saving: savingSettings, saved: savedSettings, save: saveSettings } = useDashboardSave(2000);

  // Service color map
  const serviceColorMap = useMemo(() => getServiceColorMap(services), [services]);

  // Handle ?slot= deep link from dashboard
  const searchParams = useSearchParams();
  const [deepLinkSlotId, setDeepLinkSlotId] = useState<string | null>(() => searchParams.get('slot'));
  useEffect(() => {
    if (!deepLinkSlotId) return;
    setTab('reservations');
  }, [deepLinkSlotId, setTab]);

  // Deposit validation error
  const [depositError, setDepositError] = useState<string | null>(null);

  // Drag & drop state
  const [dragSlotId, setDragSlotId] = useState<string | null>(null);
  const [dragOverDate, setDragOverDate] = useState<string | null>(null);

  const handleDragStart = (e: DragEvent, slotId: string) => {
    setDragSlotId(slotId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slotId);
  };

  const handleDragOver = (e: DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverDate(dateStr);
  };

  const handleDragLeave = () => {
    setDragOverDate(null);
  };

  const handleDrop = async (e: DragEvent, targetDate: string) => {
    e.preventDefault();
    setDragOverDate(null);
    const slotId = e.dataTransfer.getData('text/plain');
    if (!slotId || !dragSlotId) return;

    // Find the source slot
    const sourceSlot = slots.find(s => s.id === slotId);
    if (!sourceSlot || sourceSlot.slot_date === targetDate) {
      setDragSlotId(null);
      return;
    }

    // Move to same time on new date
    await handleMoveSlot(slotId, sourceSlot.start_time, targetDate);
    setDragSlotId(null);
  };

  const handleDragEnd = () => {
    setDragSlotId(null);
    setDragOverDate(null);
  };

  const handleConfirmDeposit = async (slot: PlanningSlot) => {
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
        }),
      });
      if (!res.ok) console.error('Confirm deposit error:', await res.text());
    } catch (err) {
      console.error('Confirm deposit error:', err);
    }
    await fetchSlots();
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
      if (!res.ok) console.error('Cancel deposit error:', await res.text());
    } catch (err) {
      console.error('Cancel deposit error:', err);
    }
    await fetchSlots();
  };

  const handleSaveSettings = async () => {
    if (!merchant) return;
    // Validate deposit config: if link → need amount, if amount → need link
    if (autoBookingEnabled) {
      const hasLink = !!depositLink.trim();
      const hasAmount = !!(depositPercent || depositAmount);
      if (hasAmount && !hasLink) { setDepositError(t('depositLinkRequired')); return; }
      if (hasLink && !hasAmount) { setDepositError(t('depositAmountRequired')); return; }
    }
    setDepositError(null);
    saveSettings(async () => {
      const { error } = await supabase.from('merchants').update({
        planning_message: messageEnabled && message.trim() ? message.trim() : null,
        planning_message_expires: messageEnabled && messageExpires ? messageExpires : null,
        booking_message: bookingMessage.trim() || null,
        auto_booking_enabled: autoBookingEnabled,
        deposit_link: autoBookingEnabled && depositLink.trim() ? depositLink.trim() : null,
        deposit_percent: autoBookingEnabled && depositPercent ? parseInt(depositPercent) : null,
        deposit_amount: autoBookingEnabled && depositAmount ? parseFloat(depositAmount) : null,
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

  // Day view navigation
  const handlePrevDay = () => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() - 1);
    setSelectedDay(d);
  };
  const handleNextDay = () => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + 1);
    setSelectedDay(d);
  };
  const handleGoToToday = () => setSelectedDay(new Date());

  // Sync day view when clicking a day in week view
  const switchToDayView = (day: Date) => {
    setSelectedDay(day);
    setViewMode('day');
  };

  // Selected day data
  const selectedDayStr = formatDate(selectedDay);
  const selectedDaySlots = slotsByDate.get(selectedDayStr) || [];
  const selectedDayIsPast = isPast(selectedDay);
  const selectedDayIsToday = isToday(selectedDay);

  if (merchantLoading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
  }

  const planningEnabled = !!merchant?.planning_enabled;
  const phonePlaceholder = PHONE_CONFIG[merchant?.country || 'FR'].placeholder;

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
      <div className="grid grid-cols-2 sm:flex gap-1 bg-gray-100 p-1 rounded-xl mb-5 sm:w-fit">
        {(['slots', 'reservations', 'online', 'settings'] as const).map(tabKey => {
          const colors: Record<string, { active: string; inactive: string }> = {
            slots: { active: 'bg-indigo-600 text-white', inactive: 'text-indigo-600 hover:bg-indigo-50' },
            reservations: { active: 'bg-violet-600 text-white', inactive: 'text-violet-600 hover:bg-violet-50' },
            online: { active: 'bg-emerald-600 text-white', inactive: 'text-emerald-600 hover:bg-emerald-50' },
            settings: { active: 'bg-gray-700 text-white', inactive: 'text-gray-500 hover:bg-gray-200' },
          };
          const c = colors[tabKey];
          return (
          <button
            key={tabKey}
            onClick={() => {
              setTab(tabKey);
              if (tabKey === 'reservations' && merchant?.planning_enabled) {
                state.fetchReservations();
              }
            }}
            className={`sm:px-5 py-2 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${tab === tabKey ? c.active : c.inactive}`}
          >
            {tabKey === 'slots' ? t('tabSlots') : tabKey === 'reservations' ? t('tabReservations') : tabKey === 'online' ? t('tabOnline') : t('tabSettings')}
          </button>
          );
        })}
      </div>

      {/* ── TAB: CRENEAUX ── */}
      {tab === 'slots' && (
        <>
          {!planningEnabled ? (
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
          ) : (
            <>
              {/* ── Navigation + stats ── */}
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 sm:p-4 mb-4">
                {/* View mode toggle + navigation */}
                <div className="flex items-center justify-between mb-3">
                  {viewMode === 'week' ? (
                    <>
                      <button
                        onClick={() => setWeekOffset(o => o - 1)}
                        disabled={weekOffset <= -1}
                        className="p-2 rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-30"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                      </button>

                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-900">
                          {weekStart.toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'long' })} — {weekEnd.toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'long' })}
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
                    </>
                  ) : (
                    <>
                      <button
                        onClick={handlePrevDay}
                        className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <ChevronLeft className="w-5 h-5 text-gray-500" />
                      </button>

                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold text-gray-900 capitalize">
                          {selectedDay.toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                        {!selectedDayIsToday && (
                          <button
                            onClick={handleGoToToday}
                            className="text-[11px] text-indigo-600 font-medium mt-0.5 hover:underline"
                          >
                            {t('backToToday')}
                          </button>
                        )}
                      </div>

                      <button
                        onClick={handleNextDay}
                        className="p-2 rounded-xl hover:bg-gray-50 transition-colors"
                      >
                        <ChevronRight className="w-5 h-5 text-gray-500" />
                      </button>
                    </>
                  )}
                </div>

                {/* Stats (week view only) */}
                {viewMode === 'week' && totalSlots > 0 && (
                  <div className="flex items-center justify-center gap-4 text-xs mb-3 pb-3 border-b border-gray-100">
                    <span className="text-gray-500">{totalSlots > 1 ? t('slotCountPlural', { count: totalSlots }) : t('slotCount', { count: totalSlots })}</span>
                    <span className="text-emerald-600 font-semibold">{freeSlots > 1 ? t('freeCountPlural', { count: freeSlots }) : t('freeCount', { count: freeSlots })}</span>
                    {takenSlots > 0 && <span className="text-indigo-600 font-semibold">{t('takenCount', { count: takenSlots })}</span>}
                  </div>
                )}

                {/* Actions row */}
                <div className="flex gap-2">
                  {/* View mode toggle */}
                  <div className="hidden sm:flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('week')}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'week' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                      title={t('viewWeek')}
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => { setViewMode('day'); setSelectedDay(new Date()); }}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === 'day' ? 'bg-white shadow-sm text-gray-700' : 'text-gray-400 hover:text-gray-600'}`}
                      title={t('viewDay')}
                    >
                      <Calendar className="w-4 h-4" />
                    </button>
                  </div>

                  {viewMode === 'week' && (
                    <>
                      <button
                        onClick={onDownloadStory}
                        className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-xs hover:from-indigo-700 hover:to-violet-700 transition-all shadow-sm shadow-indigo-200"
                      >
                        <Download className="w-4 h-4" />
                        {t('downloadStory')}
                      </button>
                      <button
                        onClick={() => setModalState({ type: 'copy-week' })}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-gray-600 font-semibold text-xs hover:bg-gray-100 transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('copy')}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Copy week picker */}
              <AnimatePresence>
                {modalState.type === 'copy-week' && (
                  <CopyWeekModal
                    weekOffset={weekOffset}
                    saving={saving}
                    onCopyWeek={handleCopyWeek}
                    onClose={closeModal}
                  />
                )}
              </AnimatePresence>

              {saved && (
                <div className="mb-3 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 font-medium text-center">
                  {t('weekCopied')}
                </div>
              )}

              {/* ── WEEK VIEW ── */}
              {viewMode === 'week' && (
                <>
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
                        const isDragOver = dragOverDate === dateStr;
                        return (
                          <div
                            key={dateStr}
                            className={`bg-white rounded-xl border p-2.5 min-h-[100px] transition-colors ${
                              isDragOver ? 'border-indigo-400 ring-2 ring-indigo-200 bg-indigo-50/30' :
                              today ? 'border-indigo-300 ring-1 ring-indigo-100' :
                              past ? 'border-gray-100 opacity-50' : 'border-gray-100'
                            }`}
                            onDragOver={(e) => !past && handleDragOver(e, dateStr)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => !past && handleDrop(e, dateStr)}
                          >
                            <button
                              onClick={() => switchToDayView(day)}
                              className={`text-[11px] font-bold mb-2 capitalize block hover:text-indigo-600 transition-colors ${today ? 'text-indigo-600' : 'text-gray-400'}`}
                            >
                              {formatDateFr(day, locale)}
                            </button>
                            <div className="space-y-1">
                              {daySlots.map(slot => {
                                const slotColor = getSlotColor(slot, serviceColorMap);
                                return (
                                  <button
                                    key={slot.id}
                                    onClick={() => openEditSlot(slot)}
                                    draggable={!past}
                                    onDragStart={(e) => handleDragStart(e, slot.id)}
                                    onDragEnd={handleDragEnd}
                                    className={`w-full text-left px-2 py-1 rounded-lg text-[11px] font-medium transition-all hover:scale-[1.02] active:scale-[0.98] overflow-hidden cursor-grab active:cursor-grabbing ${
                                      dragSlotId === slot.id ? 'opacity-40' : ''
                                    } ${slot.client_name ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}
                                    style={colorBorderStyle(slotColor)}
                                  >
                                    <span className="font-bold">{formatTime(slot.start_time, locale)}</span>
                                    {slot.client_name && <span className="ml-1 opacity-70">— {slot.client_name.length > 8 ? slot.client_name.slice(0, 8) + '…' : slot.client_name}</span>}
                                  </button>
                                );
                              })}
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
                              <button
                                onClick={() => switchToDayView(day)}
                                className={`text-xs font-bold capitalize hover:text-indigo-600 transition-colors ${today ? 'text-indigo-600' : 'text-gray-500'}`}
                              >
                                {formatDateFr(day, locale)}
                              </button>
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
                                {daySlots.map(slot => {
                                  const slotColor = getSlotColor(slot, serviceColorMap);
                                  return (
                                    <button
                                      key={slot.id}
                                      onClick={() => openEditSlot(slot)}
                                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all active:scale-95 ${slot.client_name ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}
                                      style={{
                                        borderLeftWidth: slotColor ? '3px' : undefined,
                                        borderLeftColor: slotColor || undefined,
                                      }}
                                    >
                                      {formatTime(slot.start_time, locale)}
                                      {slot.client_name && <span className="ml-1 opacity-70">— {slot.client_name}</span>}
                                    </button>
                                  );
                                })}
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

              {/* ── DAY VIEW ── */}
              {viewMode === 'day' && (
                loadingSlots ? (
                  <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
                ) : (
                  <DayView
                    day={selectedDay}

                    daySlots={selectedDaySlots}
                    services={services}
                    serviceColorMap={serviceColorMap}
                    locale={locale}
                    isPast={selectedDayIsPast}
                    isToday={selectedDayIsToday}
                    onSlotClick={openEditSlot}
                    onAddSlots={openAddSlotsModal}
                  />
                )
              )}
            </>
          )}
        </>
      )}

      {/* ── TAB: RESERVATIONS ── */}
      {tab === 'reservations' && (
        <ReservationsSection
          slots={upcomingSlots}
          services={services}
          serviceColorMap={serviceColorMap}
          locale={locale}
          merchantCountry={merchant?.country || 'FR'}
          depositPercent={merchant?.deposit_percent}
          depositAmount={merchant?.deposit_amount}
          onEditSlot={openEditSlot}
          onConfirmDeposit={handleConfirmDeposit}
          onCancelDeposit={handleCancelDeposit}
          deepLinkSlotId={deepLinkSlotId}
          onDeepLinkHandled={() => setDeepLinkSlotId(null)}
        />
      )}

      {/* ── TAB: RESA EN LIGNE ── */}
      {tab === 'online' && (
        <div className="max-w-lg mx-auto space-y-5">
          {/* Hero card — Toggle + explanation */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Globe className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">{t('autoBookingTitle')}</h2>
                  <p className="text-[11px] text-emerald-600/70 mt-0.5">{t('autoBookingHint')}</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoBookingEnabled}
                onClick={() => setAutoBookingEnabled(!autoBookingEnabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${autoBookingEnabled ? 'bg-emerald-600' : 'bg-gray-300'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${autoBookingEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {!autoBookingEnabled && (
              <p className="text-xs text-gray-400 italic ml-[52px]">{t('autoBookingOffHint')}</p>
            )}
          </div>

          {/* Info banner when auto booking is enabled */}
          {autoBookingEnabled && (
            <div className="flex gap-2.5 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3">
              <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">{t('autoBookingInfo')}</p>
            </div>
          )}

          {/* Warning if external booking URL is configured */}
          {autoBookingEnabled && merchant?.booking_url && (
            <div className="flex gap-2.5 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700">{t('externalBookingWarning')}</p>
            </div>
          )}

          {/* Acompte config */}
          {autoBookingEnabled && (() => {
            const hasAmount = !!(depositPercent || depositAmount);
            const hasLink = !!depositLink.trim();
            const linkMissing = hasAmount && !hasLink;
            const amountMissing = hasLink && !hasAmount;
            return (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Section header */}
                <div className="px-5 py-3 bg-amber-50/50 border-b border-amber-100/50 flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-amber-500" />
                  <h2 className="text-sm font-bold text-gray-800">{t('depositTitle')}</h2>
                  <span className="text-[10px] text-gray-400 ml-auto">({t('optional')})</span>
                </div>

                <div className="p-5 space-y-5">
                  {/* Payment link */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{t('depositLinkLabel')}</label>
                    <input
                      type="url"
                      value={depositLink}
                      onChange={(e) => setDepositLink(e.target.value)}
                      placeholder={t('depositLinkPlaceholder')}
                      className={`w-full px-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-400 transition-colors ${linkMissing ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}
                    />
                    {linkMissing && <p className="text-[10px] text-red-400 mt-1.5 flex items-center gap-1">{t('depositLinkRequired')}</p>}
                    <p className="text-[10px] text-gray-400 mt-2">
                      {t('depositLinkAffiliate')}{' '}
                      <a href="https://revolut.com/referral/?referral-code=judicasay3!APR1-26-VR-FR&geo-redirect" target="_blank" rel="noopener noreferrer" className="text-indigo-500 font-semibold hover:underline">
                        {t('depositLinkAffiliateJoin')}
                      </a>
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-gray-100" />

                  {/* Amount selection */}
                  <div>
                    <label className="text-xs font-semibold text-gray-600 mb-2 block">{t('depositAmountLabel')}</label>

                    {/* Percentage pills */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('percentageLabel')}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {['10', '15', '20', '25', '30'].map(v => (
                        <button key={`p${v}`} type="button" onClick={() => { setDepositPercent(v); setDepositAmount(''); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${depositPercent === v ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >{v}%</button>
                      ))}
                      <input
                        type="number"
                        value={!['10', '15', '20', '25', '30'].includes(depositPercent) ? depositPercent : ''}
                        onChange={(e) => { setDepositPercent(e.target.value); if (e.target.value) setDepositAmount(''); }}
                        placeholder={t('customPercent')}
                        min={1}
                        max={100}
                        className={`w-20 px-2.5 py-1.5 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${amountMissing ? 'border-red-300' : 'border-gray-200'}`}
                      />
                    </div>

                    {/* OR divider */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="flex-1 border-t border-gray-100" />
                      <span className="text-[10px] font-semibold text-gray-300 uppercase">{t('or')}</span>
                      <div className="flex-1 border-t border-gray-100" />
                    </div>

                    {/* Fixed amount pills */}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('fixedAmountLabel')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {['10', '15', '20', '25', '30'].map(v => (
                        <button key={`a${v}`} type="button" onClick={() => { setDepositAmount(v); setDepositPercent(''); }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${depositAmount === v ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >{v}{getCurrencySymbol(merchant?.country)}</button>
                      ))}
                      <input
                        type="number"
                        value={!['10', '15', '20', '25', '30'].includes(depositAmount) ? depositAmount : ''}
                        onChange={(e) => { setDepositAmount(e.target.value); if (e.target.value) setDepositPercent(''); }}
                        placeholder={t('customAmount')}
                        min={1}
                        className={`w-20 px-2.5 py-1.5 text-xs border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${amountMissing ? 'border-red-300' : 'border-gray-200'}`}
                      />
                    </div>
                    {amountMissing && <p className="text-[10px] text-red-400 mt-1.5">{t('depositAmountRequired')}</p>}
                  </div>

                </div>
              </div>
            );
          })()}

          {/* Deposit validation error */}
          {depositError && (
            <div className="flex gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-600 font-medium">{depositError}</p>
            </div>
          )}

          {/* Save */}
          <button
            onClick={handleSaveSettings}
            disabled={savingSettings}
            className={`w-full py-3.5 rounded-2xl font-bold text-sm transition-all disabled:opacity-50 shadow-md ${savedSettings ? 'bg-emerald-500 text-white shadow-emerald-200/50' : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200/50'}`}
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

      {/* ── TAB: PARAMETRES ── */}
      {tab === 'settings' && (
        <div className="space-y-4 sm:grid sm:grid-cols-2 sm:gap-4 sm:space-y-0">
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

          {/* Card: Conditions de reservation */}
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

      {/* ── MODAL: Client select (Modal 1) ── */}
      <AnimatePresence>
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
            onClose={closeModal}
          />
        )}
      </AnimatePresence>

      {/* ── MODAL: Booking details (Modal 2) ── */}
      <AnimatePresence>
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
            saving={saving}
            locale={locale}
            depositPercent={merchant.deposit_percent}
            depositAmount={merchant.deposit_amount}
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
