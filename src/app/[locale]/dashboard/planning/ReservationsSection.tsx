'use client';

import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, CalendarPlus, Clock, ChevronRight, Pencil, X, ImageIcon, Download, Instagram, Check } from 'lucide-react';
import { TikTokIcon, FacebookIcon } from '@/components/icons/SocialIcons';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { PlanningSlot } from '@/types';
import { formatTime, formatCurrency, toBCP47, getTimezoneForCountry } from '@/lib/utils';
import { downloadIcs } from '@/lib/ics';
import { getSlotServiceIds, formatDate, formatDuration, colorBorderStyle, computeDepositAmount } from './utils';
import type { ServiceWithDuration } from './usePlanningState';

interface ReservationsSectionProps {
  slots: PlanningSlot[];
  services: ServiceWithDuration[];
  serviceColorMap: Map<string, string>;
  locale: string;
  merchantCountry: string;
  merchantName?: string | null;
  merchantAddress?: string | null;
  depositPercent?: number | null;
  depositAmount?: number | null;
  onEditSlot: (slot: PlanningSlot) => void;
  onConfirmDeposit?: (slot: PlanningSlot) => void;
  onCancelDeposit?: (slot: PlanningSlot) => void;
  deepLinkSlotId?: string | null;
  onDeepLinkHandled?: () => void;
}

interface DayGroup {
  date: string;
  label: string;
  isToday: boolean;
  isPast: boolean;
  slots: PlanningSlot[];
}

export default function ReservationsSection({ slots, services, serviceColorMap, locale, merchantCountry, merchantName, merchantAddress, depositPercent, depositAmount: depositFixed, onEditSlot, onConfirmDeposit, onCancelDeposit, deepLinkSlotId, onDeepLinkHandled }: ReservationsSectionProps) {
  const t = useTranslations('planning');
  const [viewingSlot, setViewingSlot] = useState<PlanningSlot | null>(null);
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  const [showPast, setShowPast] = useState(false);

  // Sync viewingSlot with updated slots data (e.g. after deposit confirm/cancel)
  useEffect(() => {
    if (viewingSlot) {
      const updated = slots.find(s => s.id === viewingSlot.id);
      if (updated && updated !== viewingSlot) setViewingSlot(updated);
      else if (!updated) setViewingSlot(null);
    }
  }, [slots, viewingSlot]);

  // Handle deep link: open slot detail modal from ?slot= param
  useEffect(() => {
    if (deepLinkSlotId && slots.length > 0) {
      const slot = slots.find(s => s.id === deepLinkSlotId);
      if (slot) setViewingSlot(slot);
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

  // Split into upcoming and past groups
  const { upcomingGroups, pastGroups } = useMemo(() => {
    // Only show primary slots (not fillers from multi-slot bookings)
    const primarySlots = slots.filter(s => s.client_name && !s.primary_slot_id);
    const groups = new Map<string, PlanningSlot[]>();

    for (const slot of primarySlots) {
      if (!groups.has(slot.slot_date)) groups.set(slot.slot_date, []);
      groups.get(slot.slot_date)!.push(slot);
    }

    for (const arr of groups.values()) {
      arr.sort((a, b) => a.start_time.localeCompare(b.start_time));
    }

    const bcp47 = toBCP47(locale);
    const upcoming: DayGroup[] = [];
    const past: DayGroup[] = [];

    const sortedDates = [...groups.keys()].sort();
    for (const date of sortedDates) {
      const d = new Date(date + 'T12:00:00');
      const label = d.toLocaleDateString(bcp47, { weekday: 'long', day: 'numeric', month: 'long' });
      const isToday = date === todayStr;
      const isPast = date < todayStr;
      const group: DayGroup = { date, label, isToday, isPast, slots: groups.get(date)! };

      if (isPast) past.push(group);
      else upcoming.push(group);
    }

    // Past: most recent first
    past.reverse();

    return { upcomingGroups: upcoming, pastGroups: past };
  }, [slots, locale, todayStr]);

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

  if (totalReservations === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-8 text-center max-w-md mx-auto">
        <CalendarDays className="w-10 h-10 text-gray-200 mx-auto mb-3" />
        <p className="text-sm font-semibold text-gray-700 mb-1">{t('noReservations')}</p>
        <p className="text-xs text-gray-400">{t('noReservationsHint')}</p>
      </div>
    );
  }

  const photos = viewingSlot?.planning_slot_photos || [];
  const resultPhotos = viewingSlot?.planning_slot_result_photos || [];
  const viewServices = viewingSlot ? getSlotServices(viewingSlot) : [];
  const viewDuration = viewingSlot ? getTotalDuration(viewingSlot) : null;
  const viewIsPast = viewingSlot ? viewingSlot.slot_date < todayStr : false;

  const handleAddToCalendar = (slot: PlanningSlot) => {
    const slotServices = getSlotServices(slot);
    const duration = getTotalDuration(slot) || 60;
    const serviceNames = slotServices.map(s => s.name).join(', ');
    const title = serviceNames
      ? `${slot.client_name} — ${serviceNames}`
      : (slot.client_name || t('addToCalendar'));

    const descLines: string[] = [];
    if (serviceNames) descLines.push(serviceNames);
    const total = slotServices.reduce((sum, s) => sum + (s.price || 0), 0);
    if (total > 0) descLines.push(formatCurrency(total, merchantCountry, locale));
    if (slot.client_phone) descLines.push(slot.client_phone);
    if (slot.notes) descLines.push(slot.notes);
    if (merchantName) descLines.push(`— ${merchantName}`);

    const startTime = slot.start_time.length === 5 ? slot.start_time : slot.start_time.slice(0, 5);
    downloadIcs(
      {
        uid: `qarte-slot-${slot.id}@getqarte.com`,
        title,
        description: descLines.join('\n') || undefined,
        location: merchantAddress || undefined,
        startLocal: `${slot.slot_date}T${startTime}`,
        durationMinutes: duration,
        timezone: getTimezoneForCountry(merchantCountry),
      },
      `reservation-${slot.slot_date}-${(slot.client_name || 'client').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.ics`
    );
  };

  const renderDayGroup = (group: DayGroup) => (
    <div key={group.date} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${group.isPast ? 'border-gray-100 opacity-60' : group.isToday ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-100'}`}>
      {/* Day header */}
      <div className={`px-4 py-2.5 border-b ${group.isToday ? 'bg-indigo-50/50 border-indigo-100' : group.isPast ? 'bg-gray-50 border-gray-100' : 'bg-gray-50 border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <p className={`text-xs font-bold capitalize ${group.isToday ? 'text-indigo-600' : 'text-gray-700'}`}>
            {group.label}
          </p>
          {group.isToday && (
            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">{t('today')}</span>
          )}
          {group.isPast && (
            <span className="text-[10px] font-medium text-gray-400">{t('past')}</span>
          )}
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
              onClick={() => setViewingSlot(slot)}
              className={`w-full text-left px-4 py-3 flex items-center justify-between transition-colors group ${group.isPast ? 'hover:bg-gray-50' : 'hover:bg-indigo-50/50'}`}
              style={colorBorderStyle(slotColors[0])}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${group.isPast ? 'bg-gray-100' : 'bg-indigo-50'}`}>
                  <span className={`text-xs font-bold ${group.isPast ? 'text-gray-400' : 'text-indigo-600'}`}>{formatTime(slot.start_time, locale)}</span>
                </div>
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${group.isPast ? 'text-gray-500' : 'text-gray-800'}`}>{slot.client_name}</p>
                  {serviceNames && (
                    <p className="text-xs text-gray-400 truncate max-w-[180px] sm:max-w-[250px]">{serviceNames}</p>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {duration !== null && duration > 0 && (
                      <div className="flex items-center gap-1 text-xs text-gray-300">
                        <Clock className="w-3 h-3" />
                        <span>{duration}min</span>
                      </div>
                    )}
                    {slot.deposit_confirmed === false && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
                        {t('depositPending')}
                        {slot.deposit_deadline_at && ` — ${new Date(slot.deposit_deadline_at).toLocaleString(toBCP47(locale), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                    )}
                    {slot.deposit_confirmed === true && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">{t('depositConfirmed')}</span>
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

  return (
    <>
      <div className="space-y-4">
        {/* Stats */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {upcomingGroups.length > 0 && (
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                {t('upcomingCount', { count: upcomingGroups.reduce((n, g) => n + g.slots.length, 0) })}
              </span>
            )}
            {pastGroups.length > 0 && (
              <span className="text-xs font-medium text-gray-400">
                {t('pastCount', { count: pastGroups.reduce((n, g) => n + g.slots.length, 0) })}
              </span>
            )}
          </div>
        </div>

        {/* Upcoming */}
        {upcomingGroups.map(renderDayGroup)}

        {/* Past toggle */}
        {pastGroups.length > 0 && (
          <>
            <button
              onClick={() => setShowPast(!showPast)}
              className="w-full py-2.5 text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors flex items-center justify-center gap-1.5"
            >
              {showPast ? t('hidePast') : t('showPast', { count: pastGroups.reduce((n, g) => n + g.slots.length, 0) })}
            </button>
            {showPast && pastGroups.map(renderDayGroup)}
          </>
        )}
      </div>

      {/* ── View Details Modal ── */}
      <AnimatePresence>
        {viewingSlot && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setViewingSlot(null); }}
          >
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              className="bg-white rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto shadow-xl"
            >
              {/* Header */}
              <div className={`flex items-center justify-between p-4 border-b ${viewIsPast ? 'border-gray-200 bg-gray-50' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${viewIsPast ? 'bg-gray-200' : 'bg-indigo-50'}`}>
                    <span className={`text-xs font-bold ${viewIsPast ? 'text-gray-500' : 'text-indigo-600'}`}>{formatTime(viewingSlot.start_time, locale)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{viewingSlot.client_name}</p>
                    <p className="text-xs text-gray-400">{new Date(viewingSlot.slot_date + 'T12:00:00').toLocaleDateString(toBCP47(locale), { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                  </div>
                </div>
                <button onClick={() => setViewingSlot(null)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                {/* Phone */}
                {viewingSlot.client_phone && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('phoneLabel')}</p>
                    <a href={`tel:${viewingSlot.client_phone}`} className="text-sm text-indigo-600 font-medium hover:underline">
                      {viewingSlot.client_phone}
                    </a>
                  </div>
                )}

                {/* Social links */}
                {viewingSlot.customer && (viewingSlot.customer.instagram_handle || viewingSlot.customer.tiktok_handle || viewingSlot.customer.facebook_url) && (
                  <div className="flex items-center gap-2 flex-wrap">
                    {viewingSlot.customer.instagram_handle && (
                      <a
                        href={`https://instagram.com/${viewingSlot.customer.instagram_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition-colors"
                      >
                        <Instagram className="w-3.5 h-3.5" />
                        {viewingSlot.customer.instagram_handle}
                      </a>
                    )}
                    {viewingSlot.customer.tiktok_handle && (
                      <a
                        href={`https://tiktok.com/@${viewingSlot.customer.tiktok_handle.replace('@', '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors"
                      >
                        <TikTokIcon className="w-3.5 h-3.5" />
                        {viewingSlot.customer.tiktok_handle}
                      </a>
                    )}
                    {viewingSlot.customer.facebook_url && (
                      <a
                        href={viewingSlot.customer.facebook_url.startsWith('http') ? viewingSlot.customer.facebook_url : `https://${viewingSlot.customer.facebook_url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors"
                      >
                        <FacebookIcon className="w-3.5 h-3.5" />
                        Facebook
                      </a>
                    )}
                  </div>
                )}

                {/* Services */}
                {viewServices.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('servicesLabel')}</p>
                    <div className="space-y-1.5">
                      {viewServices.map(svc => {
                        const svcColor = serviceColorMap.get(svc.id);
                        return (
                        <div key={svc.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-xl"
                          style={colorBorderStyle(svcColor)}
                        >
                          <span className="text-sm font-medium text-gray-700">{svc.name}</span>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            {svc.price > 0 && <span>{formatCurrency(svc.price, merchantCountry, locale)}</span>}
                            {svc.duration && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {svc.duration}min
                              </span>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                    {(viewDuration !== null && viewDuration > 0) && (
                      <p className="mt-1.5 text-xs font-medium text-indigo-600">
                        {t('totalDuration', { duration: formatDuration(viewDuration) })}
                      </p>
                    )}
                    {(() => {
                      const total = viewServices.reduce((sum, s) => sum + (s.price || 0), 0);
                      if (total <= 0) return null;
                      const depAmt = computeDepositAmount(total, depositFixed, depositPercent);
                      return (
                        <>
                          <p className="mt-0.5 text-xs font-medium text-emerald-600">
                            {t('totalPrice', { price: formatCurrency(total, merchantCountry, locale) })}
                          </p>
                          {viewingSlot.deposit_confirmed !== null && depAmt && (
                            <div className="mt-1.5 px-2.5 py-1.5 rounded-lg bg-amber-50 border border-amber-100">
                              <p className="text-[11px] text-amber-700 font-medium">
                                {t('depositRecap', { deposit: formatCurrency(depAmt, merchantCountry, locale), remaining: formatCurrency(total - depAmt, merchantCountry, locale) })}
                              </p>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                )}

                {/* Notes */}
                {viewingSlot.notes && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">{t('notesLabel')}</p>
                    <p className="text-sm text-gray-600 bg-gray-50 rounded-xl px-3 py-2">{viewingSlot.notes}</p>
                  </div>
                )}

                {/* Photos */}
                {photos.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('inspirationPhotos')}</p>
                    <div className="flex gap-2 flex-wrap">
                      {photos.map(photo => (
                        <button
                          key={photo.id}
                          onClick={() => setExpandedPhoto(photo.url)}
                          className="rounded-xl overflow-hidden border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                        >
                          <img src={photo.url} alt="" className="w-24 h-24 object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Result photos */}
                {resultPhotos.length > 0 && (
                  <div>
                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('resultPhotos')}</p>
                    <div className="flex gap-2 flex-wrap">
                      {resultPhotos.map(photo => (
                        <button
                          key={photo.id}
                          onClick={() => setExpandedPhoto(photo.url)}
                          className="rounded-xl overflow-hidden border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                        >
                          <img src={photo.url} alt="" className="w-24 h-24 object-cover" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {viewServices.length === 0 && !viewingSlot.notes && photos.length === 0 && resultPhotos.length === 0 && (
                  <div className="text-center py-4">
                    <ImageIcon className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                    <p className="text-xs text-gray-400">{t('noDetailsYet')}</p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-gray-100 space-y-2">
                {/* Deposit confirm / cancel — full width CTA when actionable */}
                {viewingSlot.deposit_confirmed === false && onConfirmDeposit && (
                  <button
                    onClick={() => { onConfirmDeposit(viewingSlot); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {t('confirmDeposit')}
                  </button>
                )}
                {viewingSlot.deposit_confirmed === true && onCancelDeposit && (
                  <button
                    onClick={() => { onCancelDeposit(viewingSlot); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    {t('cancelDeposit')}
                  </button>
                )}
                {/* Secondary + primary side by side */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleAddToCalendar(viewingSlot)}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200 transition-colors"
                  >
                    <CalendarPlus className="w-3.5 h-3.5" />
                    {t('addToCalendar')}
                  </button>
                  <button
                    onClick={() => { setViewingSlot(null); onEditSlot(viewingSlot); }}
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {t('editSlot')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Photo Lightbox ── */}
      <AnimatePresence>
        {expandedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/80 flex items-center justify-center"
            onClick={() => setExpandedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-[90vw] max-h-[85vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <img src={expandedPhoto} alt="" className="max-w-full max-h-[85vh] object-contain rounded-2xl" loading="lazy" />
              <div className="absolute top-3 right-3 flex gap-2">
                <a
                  href={expandedPhoto}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors shadow-lg"
                >
                  <Download className="w-5 h-5" />
                </a>
                <button
                  onClick={() => setExpandedPhoto(null)}
                  className="p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white transition-colors shadow-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
