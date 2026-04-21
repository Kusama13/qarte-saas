'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarDays, Clock, ChevronRight, Wallet, AlertTriangle, Trash2, Undo2, Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { PlanningSlot, BookingDepositFailure } from '@/types';
import { formatTime, toBCP47, formatCurrency, formatPhoneLabel } from '@/lib/utils';
import { getSlotServiceIds, formatDate, colorBorderStyle, endTimeFromStart, formatDateLong } from './utils';
import type { ServiceWithDuration } from './usePlanningState';

interface ReservationsSectionProps {
  slots: PlanningSlot[];
  services: ServiceWithDuration[];
  serviceColorMap: Map<string, string>;
  locale: string;
  merchantCountry: string;
  onEditSlot: (slot: PlanningSlot) => void;
  deepLinkSlotId?: string | null;
  onDeepLinkHandled?: () => void;
  depositFailures: BookingDepositFailure[];
  onBringBackFailure: (failure: BookingDepositFailure) => void;
  onDeleteFailure: (failureId: string) => Promise<void> | void;
}

interface DayGroup {
  date: string;
  label: string;
  isToday: boolean;
  isPast: boolean;
  slots: PlanningSlot[];
}

export default function ReservationsSection({ slots, services, serviceColorMap, locale, merchantCountry, onEditSlot, deepLinkSlotId, onDeepLinkHandled, depositFailures, onBringBackFailure, onDeleteFailure }: ReservationsSectionProps) {
  const t = useTranslations('planning');
  const [showPast, setShowPast] = useState(false);
  const [showFailures, setShowFailures] = useState(true);
  const [confirmDeleteFailureId, setConfirmDeleteFailureId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const failuresRef = useRef<HTMLDivElement | null>(null);

  const scrollToFailures = () => {
    setShowFailures(true);
    requestAnimationFrame(() => {
      failuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  };

  // Handle deep link: route to unified BookingDetailsModal via onEditSlot
  useEffect(() => {
    if (deepLinkSlotId && slots.length > 0) {
      const slot = slots.find(s => s.id === deepLinkSlotId);
      if (slot) onEditSlot(slot);
      onDeepLinkHandled?.();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deepLinkSlotId, slots]);

  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceWithDuration>();
    for (const s of services) map.set(s.id, s);
    return map;
  }, [services]);

  const todayStr = useMemo(() => formatDate(new Date()), []);

  // Normalize search query: lowercase name part + digits-only phone part
  const normalizedQuery = useMemo(() => {
    const q = searchQuery.trim();
    if (!q) return null;
    return { text: q.toLowerCase(), digits: q.replace(/\D+/g, '') };
  }, [searchQuery]);

  // Split into upcoming and past groups
  const { upcomingGroups, pastGroups } = useMemo(() => {
    // Only show primary slots (not fillers from multi-slot bookings)
    let primarySlots = slots.filter(s => s.client_name && s.client_name !== '__blocked__' && !s.primary_slot_id);

    if (normalizedQuery) {
      const { text, digits } = normalizedQuery;
      primarySlots = primarySlots.filter(s => {
        const nameMatch = s.client_name?.toLowerCase().includes(text) ?? false;
        const phoneMatch = digits.length >= 2 && s.client_phone
          ? s.client_phone.replace(/\D+/g, '').includes(digits)
          : false;
        return nameMatch || phoneMatch;
      });
    }

    const groups = new Map<string, PlanningSlot[]>();

    for (const slot of primarySlots) {
      if (!groups.has(slot.slot_date)) groups.set(slot.slot_date, []);
      groups.get(slot.slot_date)!.push(slot);
    }

    for (const arr of groups.values()) {
      arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }

    const upcoming: DayGroup[] = [];
    const past: DayGroup[] = [];

    const sortedDates = [...groups.keys()].sort();
    for (const date of sortedDates) {
      const d = new Date(date + 'T12:00:00');
      const label = formatDateLong(d, locale);
      const isToday = date === todayStr;
      const isPast = date < todayStr;
      const group: DayGroup = { date, label, isToday, isPast, slots: groups.get(date)! };

      if (isPast) past.push(group);
      else upcoming.push(group);
    }

    // Past: most recent first
    past.reverse();

    return { upcomingGroups: upcoming, pastGroups: past };
  }, [slots, locale, todayStr, normalizedQuery]);

  const getSlotServices = (slot: PlanningSlot) => {
    const svcIds = getSlotServiceIds(slot);
    return svcIds.map(id => serviceMap.get(id)).filter(Boolean) as ServiceWithDuration[];
  };

  const getServiceNames = (slot: PlanningSlot): string => {
    return getSlotServices(slot).map(s => s.name).join(', ');
  };

  const getTotalDuration = (slot: PlanningSlot): number | null => {
    const svcs = getSlotServices(slot);
    if (svcs.length === 0) return null;
    let total = 0;
    for (const svc of svcs) {
      if (svc.duration) total += svc.duration;
    }
    return total || null;
  };

  const totalReservations = upcomingGroups.reduce((n, g) => n + g.slots.length, 0) + pastGroups.reduce((n, g) => n + g.slots.length, 0);

  // Total before filtering — used to decide whether to show the search bar
  const hasAnySlotsBeforeFilter = useMemo(
    () => slots.some(s => s.client_name && s.client_name !== '__blocked__' && !s.primary_slot_id),
    [slots],
  );

  // Keep computed counts accessible to the empty state AND the main render
  const upcomingCountInline = upcomingGroups.reduce((n, g) => n + g.slots.length, 0);
  const pastCountInline = pastGroups.reduce((n, g) => n + g.slots.length, 0);
  const hasOnlyPast = upcomingCountInline === 0 && pastCountInline > 0;
  const isFullyEmpty = totalReservations === 0;
  const isSearching = !!normalizedQuery;
  const hasNoResults = isSearching && isFullyEmpty;

  const SearchBar = hasAnySlotsBeforeFilter ? (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300 pointer-events-none" />
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        autoComplete="off"
        spellCheck={false}
        enterKeyHint="search"
        className="w-full pl-9 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 [&::-webkit-search-cancel-button]:appearance-none"
      />
      {searchQuery && (
        <button
          onClick={() => setSearchQuery('')}
          aria-label={t('cancel')}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  ) : null;

  const EmptyStateBlock = (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center">
      <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-50 mb-3">
        <CalendarDays className="w-6 h-6 text-indigo-600" />
      </div>
      <p className="text-base font-bold text-gray-900 mb-1">{t('noReservations')}</p>
      <p className="text-xs text-gray-500 max-w-xs mx-auto">{t('noReservationsHint')}</p>
    </div>
  );

  if (isFullyEmpty && !isSearching) {
    return <div className="max-w-lg mx-auto">{EmptyStateBlock}</div>;
  }

  const renderDayGroup = (group: DayGroup) => {
    const dayCount = group.slots.length;
    const dayTotal = group.slots.reduce((sum, slot) => {
      const svcs = getSlotServices(slot);
      return sum + svcs.reduce((s, svc) => s + (svc.price || 0), 0);
    }, 0);
    return (
    <div key={group.date} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${group.isPast ? 'border-gray-100 opacity-60' : group.isToday ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100'}`}>
      {/* Day header */}
      <div className={`px-4 py-2.5 border-b ${group.isToday ? 'bg-indigo-50/50 border-indigo-100' : group.isPast ? 'bg-gray-50 border-gray-100' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <p className={`text-xs font-bold capitalize ${group.isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
            {group.label}
          </p>
          {group.isToday && (
            <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">{t('today')}</span>
          )}
          {group.isPast && (
            <span className="text-[10px] font-medium text-gray-400">{t('past')}</span>
          )}
        </div>
      </div>

      {/* Day stats bar — 2 chips en carte (RDV + Total estimé) */}
      <div className={`px-3 py-2.5 border-b border-gray-100 ${group.isPast ? 'bg-slate-50/60' : group.isToday ? 'bg-indigo-50/60' : 'bg-slate-50'}`}>
        <div className="flex items-center gap-2">
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-white rounded-xl border border-white shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${group.isPast ? 'bg-gray-100' : 'bg-indigo-100'}`}>
              <CalendarDays className={`w-4 h-4 ${group.isPast ? 'text-gray-400' : 'text-indigo-600'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">{t('statsBookings')}</p>
              <p className={`text-base font-bold tabular-nums leading-tight mt-0.5 ${group.isPast ? 'text-gray-500' : 'text-gray-900'}`}>{dayCount}</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-white rounded-xl border border-white shadow-sm">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${group.isPast ? 'bg-gray-100' : 'bg-emerald-100'}`}>
              <Wallet className={`w-4 h-4 ${group.isPast ? 'text-gray-400' : 'text-emerald-600'}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider leading-none">{t('statsRevenue')}</p>
              <p className={`text-base font-bold tabular-nums leading-tight mt-0.5 truncate ${group.isPast ? 'text-gray-500' : 'text-gray-900'}`}>
                {formatCurrency(dayTotal, merchantCountry, locale, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Slots */}
      <div className="divide-y divide-gray-50">
        {group.slots.map(slot => {
          const serviceNames = getServiceNames(slot);
          const duration = getTotalDuration(slot);

          const svcIds = getSlotServiceIds(slot);
          const slotColors = svcIds.map(id => serviceColorMap.get(id)).filter(Boolean) as string[];

          return (
            <button
              key={slot.id}
              onClick={() => onEditSlot(slot)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors group ${group.isPast ? 'hover:bg-gray-50' : 'hover:bg-indigo-50/50'}`}
              style={colorBorderStyle(slotColors[0])}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="shrink-0 w-14 flex flex-col leading-tight tabular-nums">
                  <span className={`text-sm font-bold ${group.isPast ? 'text-gray-400' : 'text-indigo-600'}`}>
                    {formatTime(slot.start_time, locale)}
                  </span>
                  {duration !== null && duration > 0 && (
                    <span className={`text-sm font-semibold ${group.isPast ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatTime(endTimeFromStart(slot.start_time, duration), locale)}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${group.isPast ? 'text-gray-500' : 'text-gray-800'}`}>{slot.client_name}</p>
                  {serviceNames && (
                    <p className="text-xs text-gray-400">{serviceNames}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {duration !== null && duration > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-300">
                        <Clock className="w-3 h-3" />
                        <span>{duration}min</span>
                      </div>
                    )}
                    {slot.deposit_confirmed === false && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        {t('depositPending')}
                        {slot.deposit_deadline_at && ` — ${new Date(slot.deposit_deadline_at).toLocaleString(toBCP47(locale), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    )}
                    {slot.deposit_confirmed === true && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">{t('depositConfirmed')}</span>
                    )}
                  </div>
                </div>
              </div>
              <ChevronRight className={`w-4 h-4 shrink-0 transition-colors ${group.isPast ? 'text-gray-200' : 'text-gray-300 group-hover:text-indigo-400'}`} />
            </button>
          );
        })}
      </div>
    </div>
    );
  };

  const upcomingCount = upcomingGroups.reduce((n, g) => n + g.slots.length, 0);
  const pastCount = pastGroups.reduce((n, g) => n + g.slots.length, 0);
  const failuresCount = depositFailures.length;

  return (
    <div className="space-y-3">
        {/* Search bar — visible d\u00e8s qu'il y a au moins 1 r\u00e9sa */}
        {SearchBar}

        {/* No-results state (recherche active sans match) */}
        {hasNoResults && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gray-50 mb-2">
              <Search className="w-5 h-5 text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-700">{t('noReservationsForQuery', { query: searchQuery })}</p>
          </div>
        )}

        {/* Si seulement des r\u00e9sas pass\u00e9es : afficher l'empty state enrichi en haut */}
        {hasOnlyPast && !isSearching && (
          <div className="max-w-lg mx-auto">
            {EmptyStateBlock}
          </div>
        )}

        {/* Summary bar (masqu\u00e9 si seulement des pass\u00e9es — on a d\u00e9j\u00e0 l'empty state) */}
        {!hasOnlyPast && !hasNoResults && (
          <div className="flex items-center justify-between gap-2 px-1 flex-wrap">
            <p className="text-sm font-bold text-gray-900">
              {upcomingCount > 0
                ? t('upcomingCount', { count: upcomingCount })
                : t('noUpcoming')}
            </p>
            <div className="flex items-center gap-2">
              {failuresCount > 0 && (
                <button
                  onClick={scrollToFailures}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  <AlertTriangle className="w-3 h-3" />
                  {t('depositFailuresBadge', { count: failuresCount })}
                </button>
              )}
              {pastCount > 0 && (
                <button
                  onClick={() => setShowPast(!showPast)}
                  className="text-xs font-medium text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPast ? t('hidePast') : t('showPast', { count: pastCount })}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Upcoming */}
        {upcomingGroups.map(renderDayGroup)}

        {/* Historique toggle — quand il n'y a que des pass\u00e9es, section dissociable en bas */}
        {hasOnlyPast && (
          <div className="flex items-center justify-between px-1 pt-2 mt-3 border-t border-gray-100">
            <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              {t('past')}
            </p>
            <button
              onClick={() => setShowPast(!showPast)}
              className="text-xs font-medium text-indigo-600 hover:text-indigo-700 transition-colors"
            >
              {showPast ? t('hidePast') : t('showPast', { count: pastCount })}
            </button>
          </div>
        )}

        {/* Past — auto-shown when searching so matching past results are visible */}
        {(showPast || isSearching) && pastGroups.map(renderDayGroup)}

        {/* Acomptes échoués */}
        {failuresCount > 0 && (
          <div ref={failuresRef} className="pt-2 mt-3 border-t border-amber-100">
            <div className="flex items-center justify-between px-1 mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
                  {t('depositFailuresTitle')} ({failuresCount})
                </p>
              </div>
              <button
                onClick={() => setShowFailures(!showFailures)}
                className="text-xs font-medium text-amber-700 hover:text-amber-800 transition-colors"
              >
                {showFailures ? t('hidePast') : t('showDepositFailures')}
              </button>
            </div>

            {showFailures && (
              <div className="space-y-2">
                {depositFailures.map(failure => {
                  const svcNames = failure.service_ids
                    .map(id => serviceMap.get(id)?.name)
                    .filter(Boolean) as string[];
                  const slotDate = new Date(failure.original_slot_date + 'T12:00:00');
                  const expiredDate = new Date(failure.expired_at);
                  return (
                    <div
                      key={failure.id}
                      className="bg-amber-50/40 border border-amber-100 rounded-2xl px-4 py-3"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-gray-800 truncate">{failure.client_name}</p>
                          {failure.client_phone && (
                            <p className="text-xs text-gray-500 tabular-nums">
                              {formatPhoneLabel(failure.client_phone)}
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mt-1 capitalize">
                            {formatDateLong(slotDate, locale)} · {formatTime(failure.original_start_time.slice(0, 5), locale)}
                          </p>
                          {svcNames.length > 0 && (
                            <p className="text-xs text-gray-500 mt-0.5 truncate">{svcNames.join(', ')}</p>
                          )}
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            {failure.deposit_amount != null && failure.deposit_amount > 0 && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white border border-amber-200 text-amber-700">
                                {t('depositExpected')} : {formatCurrency(failure.deposit_amount, merchantCountry, locale)}
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {t('expiredOn', { date: expiredDate.toLocaleString(toBCP47(locale), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {confirmDeleteFailureId === failure.id ? (
                            <>
                              <button
                                onClick={() => setConfirmDeleteFailureId(null)}
                                className="text-[11px] font-medium text-gray-500 hover:text-gray-700 px-2 py-1"
                              >
                                {t('cancel')}
                              </button>
                              <button
                                onClick={async () => {
                                  await onDeleteFailure(failure.id);
                                  setConfirmDeleteFailureId(null);
                                }}
                                className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-2 py-1 rounded-lg"
                              >
                                <Trash2 className="w-3 h-3" />
                                {t('confirmDelete')}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setConfirmDeleteFailureId(failure.id)}
                                aria-label={t('delete')}
                                className="w-8 h-8 rounded-lg border border-gray-200 bg-white text-gray-400 hover:text-rose-600 hover:border-rose-200 flex items-center justify-center transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => onBringBackFailure(failure)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-[#4b0082] hover:bg-violet-800 text-white transition-colors"
                              >
                                <Undo2 className="w-3.5 h-3.5" />
                                {t('bringBack')}
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
  );
}
