'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, ArrowLeft, Trash2, Check, Loader2, AlertTriangle, Clock, ImagePlus, Instagram, BookOpen, ChevronDown, CalendarClock, CalendarPlus, UserCheck, UserX } from 'lucide-react';
import SmsToggle from './SmsToggle';
import { getTypeStyle } from '@/lib/note-styles';
import { TikTokIcon, FacebookIcon } from '@/components/icons/SocialIcons';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/Toast';
import type { PlanningSlot, CustomerSearchResult, BookingMode } from '@/types';
import { formatTime, formatCurrency, toBCP47, getTimezoneForCountry, displayPhoneNumber, detectPhoneCountry } from '@/lib/utils';
import { downloadIcs } from '@/lib/ics';
import { compressOfferImage } from '@/lib/image-compression';
import { timeToMinutes, minutesToTime, roundUp5, formatDuration, getSlotServiceIds, colorBorderStyle, computeDepositAmount } from './utils';
import type { BookingDraft, ServiceWithDuration } from './usePlanningState';

function TabButton({ active, onClick, label, badge }: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 transition-colors ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
    >
      <span className="text-xs font-semibold">{label}</span>
      {badge}
    </button>
  );
}

interface BookingDetailsModalProps {
  slot: PlanningSlot;
  customer: CustomerSearchResult | null;
  draft: BookingDraft;
  services: ServiceWithDuration[];
  serviceColorMap: Map<string, string>;
  slotsByDate: Map<string, PlanningSlot[]>;
  merchantId: string;
  merchantCountry: string;
  merchantName?: string | null;
  merchantAddress?: string | null;
  bookingMode?: BookingMode;
  saving: boolean;
  locale: string;
  depositPercent?: number | null;
  depositAmount?: number | null;
  subscriptionStatus?: string | null;
  onDraftChange: (partial: Partial<BookingDraft>) => void;
  onSave: (slotId: string, data: {
    client_name: string | null;
    client_phone: string | null;
    customer_id: string | null;
    service_ids: string[];
    notes: string | null;
    send_sms?: boolean;
    send_sms_cancel?: boolean;
    delete_if_empty?: boolean;
  }) => Promise<void>;
  onDelete: (slotId: string) => Promise<void>;
  onShiftSlot: (slotId: string, newTime: string, newDate?: string, force?: boolean, sendSms?: boolean) => Promise<{ success: boolean; error?: string }>;
  onRefreshSlots: () => Promise<void>;
  onConfirmDeposit?: (slot: PlanningSlot, sendSms: boolean) => void;
  onCancelDeposit?: (slot: PlanningSlot) => void;
  onGoBack: () => void;
  onClose: () => void;
  onFetchClientHistory: (customerId: string) => Promise<PlanningSlot[]>;
}

export default function BookingDetailsModal({
  slot,
  customer,
  draft,
  services,
  serviceColorMap,
  slotsByDate,
  merchantId,
  merchantCountry,
  merchantName,
  merchantAddress,
  bookingMode = 'slots',
  saving,
  locale,
  depositPercent,
  depositAmount: depositFixed,
  subscriptionStatus,
  onDraftChange,
  onSave,
  onDelete,
  onShiftSlot,
  onRefreshSlots,
  onConfirmDeposit,
  onCancelDeposit,
  onGoBack,
  onClose,
  onFetchClientHistory,
}: BookingDetailsModalProps) {
  const t = useTranslations('planning');
  const { addToast } = useToast();
  const [activeTab, setActiveTab] = useState<'photos' | 'notes' | 'history' | null>(null);
  const [localPhotos, setLocalPhotos] = useState(slot.planning_slot_photos || []);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoSuccess, setPhotoSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [localResultPhotos, setLocalResultPhotos] = useState(slot.planning_slot_result_photos || []);
  const [uploadingResultPhoto, setUploadingResultPhoto] = useState(false);
  const [resultPhotoSuccess, setResultPhotoSuccess] = useState(false);
  const resultFileInputRef = useRef<HTMLInputElement>(null);

  const [clientHistory, setClientHistory] = useState<PlanningSlot[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const historyFetchedFor = useRef<string | null>(null);

  const [pinnedNotes, setPinnedNotes] = useState<Array<{ id: string; content: string; note_type: string }>>([]);
  const pinnedFetchedFor = useRef<string | null>(null);

  const isPaid = subscriptionStatus === 'active' || subscriptionStatus === 'canceling' || subscriptionStatus === 'past_due';
  const [sendSms, setSendSms] = useState(false);
  const [depositSendSms, setDepositSendSms] = useState(false);

  // Attendance tracking for past slots (no-show / came) — v1 manual only
  const [attendanceStatus, setAttendanceStatus] = useState<'pending' | 'attended' | 'no_show' | 'cancelled' | null>(slot.attendance_status ?? null);
  const [attendanceSaving, setAttendanceSaving] = useState(false);
  const todayStr = new Date().toISOString().slice(0, 10);
  const isPastSlot = slot.slot_date < todayStr && !!slot.client_name && slot.client_name !== '__blocked__';

  const handleMarkAttendance = async (status: 'attended' | 'no_show') => {
    if (attendanceSaving) return;
    const next = attendanceStatus === status ? null : status;
    setAttendanceSaving(true);
    const prev = attendanceStatus;
    setAttendanceStatus(next);
    try {
      const res = await fetch('/api/planning/attendance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slot_id: slot.id, merchant_id: merchantId, attendance_status: next }),
      });
      if (!res.ok) {
        setAttendanceStatus(prev);
        return;
      }
      if (next === 'attended') addToast(t('toastAttendanceAttended'), 'success');
      else if (next === 'no_show') addToast(t('toastAttendanceNoShow'), 'info');
    } catch {
      setAttendanceStatus(prev);
    } finally {
      setAttendanceSaving(false);
    }
  };

  const handleAddToCalendar = () => {
    const slotServices = services.filter(s => draft.serviceIds.includes(s.id));
    const duration = slotServices.reduce((sum, s) => sum + (s.duration || 30), 0) || 60;
    const serviceNames = slotServices.map(s => s.name).join(', ');
    const title = serviceNames
      ? `${slot.client_name} — ${serviceNames}`
      : (slot.client_name || t('addToCalendar'));
    const descLines: string[] = [];
    if (serviceNames) descLines.push(serviceNames);
    const total = slotServices.reduce((sum, s) => sum + (s.price || 0), 0);
    if (total > 0) descLines.push(formatCurrency(total, merchantCountry, locale));
    if (slot.client_phone) descLines.push(displayPhoneNumber(slot.client_phone, detectPhoneCountry(slot.client_phone)));
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

  const [showAllServices, setShowAllServices] = useState(false);
  const [moveSendSms, setMoveSendSms] = useState(false);
  const [cancelSendSms, setCancelSendSms] = useState(false);
  const [cancelMode, setCancelMode] = useState(false);
  const [moveMode, setMoveMode] = useState(false);
  const [moveDate, setMoveDate] = useState(slot.slot_date);
  const [moveTime, setMoveTime] = useState('');
  const [moveError, setMoveError] = useState<string | null>(null);
  const [moving, setMoving] = useState(false);
  const [freeModeSlots, setFreeModeSlots] = useState<string[]>([]);
  const [freeModeLoading, setFreeModeLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'history' && draft.customerId && historyFetchedFor.current !== draft.customerId) {
      historyFetchedFor.current = draft.customerId;
      setHistoryLoading(true);
      onFetchClientHistory(draft.customerId).then(slots => {
        setClientHistory(slots.filter(s => s.id !== slot.id).sort((a, b) =>
          b.slot_date.localeCompare(a.slot_date) || b.start_time.localeCompare(a.start_time)
        ).slice(0, 10));
      }).catch(() => {}).finally(() => setHistoryLoading(false));
    }
  }, [activeTab, draft.customerId, slot.id, onFetchClientHistory]);

  useEffect(() => {
    if (draft.customerId && pinnedFetchedFor.current !== draft.customerId) {
      pinnedFetchedFor.current = draft.customerId;
      fetch(`/api/customer-notes?customerId=${draft.customerId}&merchantId=${merchantId}&pinned=true`)
        .then(r => r.ok ? r.json() : { notes: [] })
        .then(data => setPinnedNotes(data.notes || []))
        .catch(() => {});
    }
  }, [draft.customerId, merchantId]);

  const serviceMap = useMemo(() => {
    const map = new Map<string, ServiceWithDuration>();
    for (const s of services) map.set(s.id, s);
    return map;
  }, [services]);

  const { totalMinutes, totalPrice } = useMemo(() => {
    let durationTotal = 0;
    let hasUnknown = false;
    let priceTotal = 0;
    for (const sid of draft.serviceIds) {
      const svc = serviceMap.get(sid);
      if (svc?.duration) durationTotal += svc.duration;
      else hasUnknown = true;
      if (svc?.price) priceTotal += svc.price;
    }
    return {
      totalMinutes: { total: durationTotal, hasUnknown },
      totalPrice: draft.serviceIds.length > 0 && priceTotal > 0 ? priceTotal : null,
    };
  }, [draft.serviceIds, serviceMap]);

  const durationLabel = useMemo(() => {
    if (draft.serviceIds.length === 0) return null;
    if (totalMinutes.total === 0 && totalMinutes.hasUnknown) return t('durationUnknown');
    return t('totalDuration', { duration: formatDuration(totalMinutes.total) });
  }, [draft.serviceIds.length, totalMinutes, t]);

  // Overlap detection — skip filler slots belonging to same booking
  const overlap = useMemo(() => {
    if (draft.serviceIds.length === 0 || totalMinutes.total === 0) return null;
    const daySlots = slotsByDate.get(slot.slot_date) || [];
    const slotIndex = daySlots.findIndex(s => s.id === slot.id);
    if (slotIndex === -1) return null;

    const startMins = timeToMinutes(slot.start_time);
    const endMins = startMins + totalMinutes.total;

    // Find the next slot that is NOT a filler of this booking
    let nextSlot: PlanningSlot | null = null;
    for (let i = slotIndex + 1; i < daySlots.length; i++) {
      const candidate = daySlots[i];
      if (candidate.primary_slot_id !== slot.id) {
        nextSlot = candidate;
        break;
      }
    }
    if (!nextSlot) return null;

    const nextMins = timeToMinutes(nextSlot.start_time);
    if (endMins > nextMins) {
      const suggestedTime = minutesToTime(roundUp5(endMins));
      return { nextSlot, endTime: minutesToTime(endMins), suggestedTime };
    }
    return null;
  }, [draft.serviceIds, totalMinutes.total, slotsByDate, slot]);

  const toggleService = (serviceId: string) => {
    const current = draft.serviceIds;
    const updated = current.includes(serviceId)
      ? current.filter(id => id !== serviceId)
      : [...current, serviceId];
    onDraftChange({ serviceIds: updated });
  };

  const handleSave = () => {
    onSave(slot.id, {
      client_name: draft.clientName.trim() || null,
      client_phone: draft.clientPhone.trim() || null,
      customer_id: draft.customerId,
      service_ids: draft.serviceIds,
      notes: draft.notes.trim() || null,
      ...(draft.phoneCountry && { phone_country: draft.phoneCountry }),
      ...(sendSms && { send_sms: true }),
    });
  };

  const handleClearSlot = () => {
    onSave(slot.id, {
      client_name: null,
      client_phone: null,
      customer_id: null,
      service_ids: [],
      notes: null,
      ...(cancelSendSms && { send_sms_cancel: true }),
      // Mode libre : supprimer le slot après annulation (pas de slot fantôme).
      ...(bookingMode === 'free' && { delete_if_empty: true }),
    });
  };

  // Duration of the booking being moved — used to filter candidate start times so the
  // booking actually fits (multi-slot bookings in créneaux mode + arbitrary duration in free mode)
  const bookingDuration = useMemo(() => {
    if (slot.total_duration_minutes && slot.total_duration_minutes > 0) return slot.total_duration_minutes;
    let total = 0;
    let hasAny = false;
    for (const sid of draft.serviceIds) {
      const svc = serviceMap.get(sid);
      if (svc?.duration) { total += svc.duration; hasAny = true; }
    }
    return hasAny ? total : 30;
  }, [slot.total_duration_minutes, draft.serviceIds, serviceMap]);

  // Mode créneaux : only show starts where the booking's full duration fits in consecutive empty slots
  const moveDateFreeSlots = useMemo(() => {
    if (!moveMode || bookingMode !== 'slots') return [];
    const daySlots = (slotsByDate.get(moveDate) || [])
      .filter(s => !s.primary_slot_id)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
    const empty = daySlots.filter(s => s.id !== slot.id && !s.client_name);
    // Each slot is implicitly 30 min in créneaux mode. Number of consecutive slots needed:
    const needed = Math.max(1, Math.ceil(bookingDuration / 30));
    if (needed === 1) return empty;
    const timeSet = new Set(empty.map(s => s.start_time));
    return empty.filter(s => {
      const startMins = timeToMinutes(s.start_time);
      for (let i = 1; i < needed; i++) {
        const next = minutesToTime(startMins + i * 30);
        if (!timeSet.has(next)) return false;
      }
      return true;
    });
  }, [moveMode, bookingMode, moveDate, slotsByDate, slot.id, bookingDuration]);

  // Mode libre : fetch free windows from server when the target date changes
  useEffect(() => {
    if (!moveMode || bookingMode !== 'free') { setFreeModeSlots([]); return; }
    const controller = new AbortController();
    setFreeModeLoading(true);
    fetch(`/api/planning/free-slots?merchantId=${merchantId}&date=${moveDate}&totalDuration=${bookingDuration}`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : { slots: [] })
      .then(data => {
        if (controller.signal.aborted) return;
        setFreeModeSlots((data.slots || []).map((s: { start_time: string }) => s.start_time));
        setFreeModeLoading(false);
      })
      .catch(() => {
        if (controller.signal.aborted) return;
        setFreeModeSlots([]);
        setFreeModeLoading(false);
      });
    return () => controller.abort();
  }, [moveMode, bookingMode, moveDate, merchantId, bookingDuration]);

  const handleMoveConfirm = async () => {
    if (!moveTime) {
      setMoveError(t('moveSelectTime'));
      return;
    }
    setMoveError(null);
    setMoving(true);
    const result = await onShiftSlot(slot.id, moveTime, moveDate !== slot.slot_date ? moveDate : undefined, true, moveSendSms);
    setMoving(false);
    if (result.success) {
      setMoveMode(false);
      onClose();
    } else {
      setMoveError(result.error || t('moveError'));
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const position = localPhotos.length + 1;
    if (position > 3) return;

    setUploadingPhoto(true);
    setPhotoSuccess(false);
    try {
      const compressed = await compressOfferImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('merchantId', merchantId);
      formData.append('slotId', slot.id);
      formData.append('position', String(position));

      const res = await fetch('/api/planning/photos', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.photo) {
        setLocalPhotos(prev => [...prev, { id: data.photo.id, url: data.photo.url, position: data.photo.position }]);
        setPhotoSuccess(true);
        setTimeout(() => setPhotoSuccess(false), 2000);
      }
      onRefreshSlots();
    } catch { /* */ }
    setUploadingPhoto(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDeletePhoto = async (photoId: string) => {
    setLocalPhotos(prev => prev.filter(p => p.id !== photoId));
    try {
      await fetch('/api/planning/photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, merchantId }),
      });
      onRefreshSlots();
    } catch { /* */ }
  };

  const handleResultPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const position = localResultPhotos.length + 1;
    if (position > 3) return;

    setUploadingResultPhoto(true);
    setResultPhotoSuccess(false);
    try {
      const compressed = await compressOfferImage(file);
      const formData = new FormData();
      formData.append('file', compressed);
      formData.append('merchantId', merchantId);
      formData.append('slotId', slot.id);
      formData.append('position', String(position));

      const res = await fetch('/api/planning/result-photos', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.photo) {
        setLocalResultPhotos(prev => [...prev, { id: data.photo.id, url: data.photo.url, position: data.photo.position }]);
        setResultPhotoSuccess(true);
        setTimeout(() => setResultPhotoSuccess(false), 2000);
      }
      onRefreshSlots();
    } catch { /* */ }
    setUploadingResultPhoto(false);
    if (resultFileInputRef.current) resultFileInputRef.current.value = '';
  };

  const handleDeleteResultPhoto = async (photoId: string) => {
    setLocalResultPhotos(prev => prev.filter(p => p.id !== photoId));
    try {
      await fetch('/api/planning/result-photos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photoId, merchantId }),
      });
      onRefreshSlots();
    } catch { /* */ }
  };

  return (
    <motion.div
      initial={{ opacity: 0, pointerEvents: 'none' }}
      animate={{ opacity: 1, pointerEvents: 'auto' }}
      exit={{ opacity: 0, pointerEvents: 'none' }}
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 50, opacity: 0 }}
        className="relative bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-sm border border-slate-100"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <button onClick={onGoBack} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-400" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900">
                  {formatTime(slot.start_time, locale)}
                </span>
                <span className="text-xs text-gray-400">{slot.slot_date}</span>
              </div>
              {draft.clientName && (
                <p className="text-xs text-gray-500">
                  {draft.clientName}
                  <button onClick={onGoBack} className="ml-1.5 text-indigo-600 font-medium hover:underline">
                    {t('changeClient')}
                  </button>
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            {slot.client_name && (
              <button
                onClick={handleAddToCalendar}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                title={t('addToCalendar')}
              >
                <CalendarPlus className="w-4 h-4 text-gray-400" />
              </button>
            )}
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* ── Attendance tracking: past slot only (v1 manual) ── */}
          {isPastSlot && (
            <div className="flex items-center gap-2 rounded-xl bg-slate-50 border border-slate-100 p-2.5">
              <p className="text-xs font-medium text-slate-600 flex-1">La cliente est-elle venue ?</p>
              <button
                type="button"
                onClick={() => handleMarkAttendance('attended')}
                disabled={attendanceSaving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 touch-manipulation disabled:opacity-50 ${
                  attendanceStatus === 'attended'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50'
                }`}
                aria-pressed={attendanceStatus === 'attended'}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Venue
              </button>
              <button
                type="button"
                onClick={() => handleMarkAttendance('no_show')}
                disabled={attendanceSaving}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors active:scale-95 touch-manipulation disabled:opacity-50 ${
                  attendanceStatus === 'no_show'
                    ? 'bg-rose-500 text-white'
                    : 'bg-white text-rose-700 border border-rose-200 hover:bg-rose-50'
                }`}
                aria-pressed={attendanceStatus === 'no_show'}
              >
                <UserX className="w-3.5 h-3.5" />
                Absente
              </button>
            </div>
          )}

          {/* ── Client info: social + memo ── */}
          {customer && (customer.instagram_handle || customer.tiktok_handle || customer.facebook_url) && (
            <div className="flex items-center gap-2 flex-wrap">
              {customer.instagram_handle && (
                <a href={`https://instagram.com/${customer.instagram_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-pink-50 text-pink-600 text-xs font-medium hover:bg-pink-100 transition-colors">
                  <Instagram className="w-3.5 h-3.5" />{customer.instagram_handle}
                </a>
              )}
              {customer.tiktok_handle && (
                <a href={`https://tiktok.com/@${customer.tiktok_handle.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-700 text-xs font-medium hover:bg-gray-200 transition-colors">
                  <TikTokIcon className="w-3.5 h-3.5" />{customer.tiktok_handle}
                </a>
              )}
              {customer.facebook_url && (
                <a href={customer.facebook_url.startsWith('http') ? customer.facebook_url : `https://${customer.facebook_url}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-xs font-medium hover:bg-blue-100 transition-colors">
                  <FacebookIcon className="w-3.5 h-3.5" />Facebook
                </a>
              )}
            </div>
          )}

          {pinnedNotes.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1.5">
              <p className="text-xs font-bold text-amber-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5" />{t('clientMemo')}
              </p>
              {pinnedNotes.map(note => {
                const style = getTypeStyle(note.note_type);
                return (
                  <div key={note.id} className="flex items-start gap-2">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${style.pillBg} ${style.pillText}`}>{note.note_type}</span>
                    <p className="text-xs text-gray-700">{note.content}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Prestations ── */}
          {services.length > 0 && (() => {
            const selected = services.filter(s => draft.serviceIds.includes(s.id));
            const unselected = services.filter(s => !draft.serviceIds.includes(s.id));
            const VISIBLE_UNSELECTED = 4;
            const hiddenCount = unselected.length - VISIBLE_UNSELECTED;
            const visibleUnselected = showAllServices ? unselected : unselected.slice(0, VISIBLE_UNSELECTED);

            const ServiceRow = ({ svc, isChecked }: { svc: ServiceWithDuration; isChecked: boolean }) => {
              const svcColor = serviceColorMap.get(svc.id);
              return (
                <button
                  key={svc.id}
                  onClick={() => toggleService(svc.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition-all text-[13px] ${isChecked ? 'border-indigo-300 bg-indigo-50 text-indigo-700' : 'border-gray-200 hover:border-gray-300 text-gray-700'}`}
                  style={colorBorderStyle(svcColor)}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border ${isChecked ? 'bg-indigo-600 border-indigo-600' : 'border-gray-300'}`}>
                      {isChecked && <Check className="w-2.5 h-2.5 text-white" />}
                    </div>
                    <span className="font-medium">{svc.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 shrink-0 ml-2">
                    {svc.price > 0 && <span>{formatCurrency(svc.price, merchantCountry, locale)}</span>}
                    {svc.duration && (
                      <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5" />{svc.duration}</span>
                    )}
                  </div>
                </button>
              );
            };

            return (
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1.5 block">{t('servicesLabel')}</label>

              {/* Selected services — always visible */}
              {selected.length > 0 && (
                <div className="space-y-1 mb-2">
                  {selected.map(svc => <ServiceRow key={svc.id} svc={svc} isChecked />)}
                </div>
              )}

              {/* Unselected services */}
              {unselected.length > 0 && (
                <div className="space-y-1">
                  {visibleUnselected.map(svc => <ServiceRow key={svc.id} svc={svc} isChecked={false} />)}
                  {hiddenCount > 0 && !showAllServices && (
                    <button
                      type="button"
                      onClick={() => setShowAllServices(true)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                    >
                      {t('showMoreServices', { count: hiddenCount })}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                  )}
                  {showAllServices && hiddenCount > 0 && (
                    <button
                      type="button"
                      onClick={() => setShowAllServices(false)}
                      className="w-full flex items-center justify-center gap-1 py-1.5 text-[11px] font-semibold text-gray-400 hover:text-gray-500 transition-colors"
                    >
                      {t('showLessServices')}
                      <ChevronDown className="w-3 h-3 rotate-180" />
                    </button>
                  )}
                </div>
              )}

              {(durationLabel || totalPrice) && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex items-center gap-3">
                    {durationLabel && <p className={`text-xs font-medium ${totalMinutes.hasUnknown ? 'text-amber-600' : 'text-indigo-600'}`}>{durationLabel}</p>}
                    {totalPrice !== null && <p className="text-xs font-medium text-emerald-600">{t('totalPrice', { price: formatCurrency(totalPrice, merchantCountry, locale) })}</p>}
                  </div>
                  {slot.deposit_confirmed !== null && totalPrice !== null && (() => {
                    const depAmt = computeDepositAmount(totalPrice, depositFixed, depositPercent);
                    if (!depAmt) return null;
                    const isPaid = slot.deposit_confirmed === true;
                    const bandeauClass = isPaid
                      ? 'bg-emerald-50/60 border-emerald-100'
                      : 'bg-amber-50 border-amber-100';
                    const textClass = isPaid ? 'text-emerald-800' : 'text-amber-700';
                    return (
                      <div className={`px-2.5 py-1.5 rounded-lg border ${bandeauClass}`}>
                        <p className={`text-[11px] font-medium ${textClass}`}>
                          {depAmt >= totalPrice
                            ? t('depositFullPaymentRecap', { deposit: formatCurrency(depAmt, merchantCountry, locale) })
                            : t('depositRecap', { deposit: formatCurrency(depAmt, merchantCountry, locale), remaining: formatCurrency(totalPrice - depAmt, merchantCountry, locale) })}
                        </p>
                        {slot.deposit_confirmed === false && (
                          <div className="flex flex-wrap items-center gap-1 mt-0.5">
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">{t('depositPending')}</span>
                            {slot.deposit_deadline_at && (
                              <span className="text-[10px] text-gray-400">
                                {t('depositDeadlineBefore', { date: new Date(slot.deposit_deadline_at).toLocaleString(toBCP47(locale), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) })}
                              </span>
                            )}
                          </div>
                        )}
                        {isPaid && (
                          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 mt-0.5">
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                              <Check className="w-2.5 h-2.5" />
                              {t('depositConfirmed')}
                            </span>
                            {onCancelDeposit && (
                              <button
                                type="button"
                                onClick={() => { onCancelDeposit(slot); onClose(); }}
                                className="text-[10px] font-medium text-gray-400 hover:text-orange-600 underline-offset-2 hover:underline transition-colors"
                              >
                                {t('cancelDeposit')}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
            );
          })()}

          {/* Overlap warning */}
          {overlap && (
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
              <div className="flex items-start gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <p className="text-xs text-orange-800 font-medium">
                  {t('overlapWarning', { endTime: overlap.endTime, nextTime: formatTime(overlap.nextSlot.start_time, locale) })}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 ml-6">
                <button onClick={() => onShiftSlot(overlap.nextSlot.id, overlap.suggestedTime)} disabled={saving} className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-semibold hover:bg-orange-600 transition-colors disabled:opacity-50">
                  {t('shiftNextSlot', { newTime: formatTime(overlap.suggestedTime, locale) })}
                </button>
                <button onClick={() => onDelete(overlap.nextSlot.id)} disabled={saving} className="px-3 py-1.5 rounded-lg bg-white text-orange-700 border border-orange-200 text-xs font-semibold hover:bg-orange-100 transition-colors disabled:opacity-50">
                  {t('deleteNextSlot')}
                </button>
              </div>
            </div>
          )}

          {/* ── Unified tabs: Photos · Notes · Historique ── */}
          <div className="border border-gray-100 rounded-xl overflow-hidden">
            <div className="flex divide-x divide-gray-100">
              <TabButton
                active={activeTab === 'photos'}
                onClick={() => setActiveTab(prev => prev === 'photos' ? null : 'photos')}
                label={t('photosSection')}
                badge={(photoSuccess || resultPhotoSuccess) ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                ) : (localPhotos.length + localResultPhotos.length) > 0 ? (
                  <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-1.5 rounded-full tabular-nums">{localPhotos.length + localResultPhotos.length}</span>
                ) : null}
              />
              <TabButton
                active={activeTab === 'notes'}
                onClick={() => setActiveTab(prev => prev === 'notes' ? null : 'notes')}
                label={t('notesTab')}
                badge={draft.notes?.trim() ? <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> : null}
              />
              {draft.customerId && (
                <TabButton
                  active={activeTab === 'history'}
                  onClick={() => setActiveTab(prev => prev === 'history' ? null : 'history')}
                  label={t('historyTab')}
                />
              )}
            </div>

            {activeTab === 'photos' && (
                  <div className="px-3 pb-3 space-y-3 border-t border-gray-100 pt-3">
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('inspirationPhotos')}</p>
                      <div className="flex gap-2">
                        {localPhotos.map(photo => (
                          <div key={photo.id} className="relative group">
                            <img src={photo.url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" loading="lazy" />
                            <button onClick={() => handleDeletePhoto(photo.id)} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {localPhotos.length < 3 && (
                          <button onClick={() => fileInputRef.current?.click()} disabled={uploadingPhoto} className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors disabled:opacity-50">
                            {uploadingPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                          </button>
                        )}
                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                      </div>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('resultPhotos')}</p>
                      <div className="flex gap-2">
                        {localResultPhotos.map(photo => (
                          <div key={photo.id} className="relative group">
                            <img src={photo.url} alt="" className="w-20 h-20 object-cover rounded-xl border border-gray-200" loading="lazy" />
                            <button onClick={() => handleDeleteResultPhoto(photo.id)} className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        {localResultPhotos.length < 3 && (
                          <button onClick={() => resultFileInputRef.current?.click()} disabled={uploadingResultPhoto} className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-300 hover:border-indigo-300 hover:text-indigo-400 transition-colors disabled:opacity-50">
                            {uploadingResultPhoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <ImagePlus className="w-5 h-5" />}
                          </button>
                        )}
                        <input ref={resultFileInputRef} type="file" accept="image/*" onChange={handleResultPhotoUpload} className="hidden" />
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'notes' && (
                  <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                    <textarea
                      value={draft.notes}
                      onChange={(e) => onDraftChange({ notes: e.target.value })}
                      placeholder={t('notesPlaceholder')}
                      maxLength={300}
                      rows={2}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 resize-none"
                    />
                  </div>
                )}

            {activeTab === 'history' && draft.customerId && (
              <div className="px-3 pb-3 border-t border-gray-100 pt-3">
                {historyLoading ? (
                  <div className="flex items-center justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-gray-400" /></div>
                ) : clientHistory.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-2">{t('noHistory')}</p>
                ) : (
                  <div className="space-y-1.5">
                    {clientHistory.map(h => {
                      const svcIds = getSlotServiceIds(h);
                      const svcNames = svcIds.map(id => serviceMap.get(id)?.name).filter(Boolean).join(', ');
                      const histDate = new Date(h.slot_date + 'T12:00:00');
                      const histResultPhotos = h.planning_slot_result_photos || [];
                      return (
                        <div key={h.id} className="px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold text-gray-700">{histDate.toLocaleDateString(toBCP47(locale), { day: 'numeric', month: 'short' })}</span>
                                <span className="text-[11px] text-gray-400">{formatTime(h.start_time, locale)}</span>
                              </div>
                              {svcNames && <p className="text-[10px] text-gray-400">{svcNames}</p>}
                            </div>
                            {svcIds.length > 0 && (
                              <div className="flex gap-0.5">
                                {svcIds.slice(0, 3).map(id => {
                                  const color = serviceColorMap.get(id);
                                  return color ? <div key={id} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /> : null;
                                })}
                              </div>
                            )}
                          </div>
                          {histResultPhotos.length > 0 && (
                            <div className="flex gap-1.5 mt-1.5">
                              {histResultPhotos.map(p => (
                                <img key={p.id} src={p.url} alt="" className="w-8 h-8 object-cover rounded-lg border border-gray-200" loading="lazy" />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer actions — sticky bottom pour garder les boutons visibles pendant scroll des tabs */}
        <div className="p-4 border-t border-gray-100 space-y-2 sticky bottom-0 bg-white z-10">
          {!slot.client_name && draft.clientPhone.trim() && (
            <SmsToggle
              checked={sendSms}
              onToggle={() => setSendSms(s => !s)}
              label={t('sendSmsConfirmation')}
              hint={t('sendSmsTrialHint')}
              isPaid={isPaid}
              proLabel="Pro"
              tint="indigo"
            />
          )}

          {/* Confirm / cancel deposit */}
          {slot.deposit_confirmed === false && onConfirmDeposit && (
            <div className="space-y-2">
              {slot.client_phone && (
                <SmsToggle
                  checked={depositSendSms}
                  onToggle={() => setDepositSendSms(s => !s)}
                  label={t('sendSmsConfirmation')}
                  isPaid={isPaid}
                  proLabel="Pro"
                  tint="emerald"
                />
              )}
              <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-gray-100 text-gray-700 text-sm font-bold hover:bg-gray-200 transition-colors disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  {t('save')}
                </button>
                <button
                  onClick={() => { onConfirmDeposit(slot, depositSendSms); onClose(); }}
                  className="w-full sm:flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 active:scale-[0.98] touch-manipulation transition-all"
                >
                  <Check className="w-4 h-4" />
                  {t('confirmDeposit')}
                </button>
              </div>
            </div>
          )}
          {slot.deposit_confirmed !== false && (
            slot.client_name ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="col-span-2 sm:col-span-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {t('save')}
                </button>
                <button
                  onClick={() => { setMoveDate(slot.slot_date); setMoveTime(''); setMoveError(null); setMoveMode(true); }}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-white text-slate-700 border border-slate-200 text-sm font-bold hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50"
                >
                  <CalendarClock className="w-4 h-4" />
                  {t('moveBooking')}
                </button>
                <button
                  onClick={() => setCancelMode(true)}
                  disabled={saving}
                  className="flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-white text-red-600 border border-red-200 text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  {t('cancel')}
                </button>
              </div>
            ) : (
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={() => onDelete(slot.id)}
                  disabled={saving}
                  aria-label={t('deleteSlot')}
                  className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 py-3 rounded-xl bg-white text-red-600 border border-red-200 text-sm font-bold hover:bg-red-50 hover:border-red-300 transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full sm:flex-1 flex items-center justify-center gap-1.5 px-3 py-3 rounded-xl bg-slate-900 text-white text-sm font-bold hover:bg-slate-800 active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {t('save')}
                </button>
              </div>
            )
          )}
        </div>

        {/* Move booking overlay */}
        {moveMode && (
          <div className="absolute inset-0 z-20 bg-white rounded-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-violet-600" />
                <h3 className="text-sm font-bold text-gray-900">{t('moveBookingTitle')}</h3>
              </div>
              <button onClick={() => setMoveMode(false)} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="text-[11px] text-gray-500">
                {t('moveBookingCurrent', { date: slot.slot_date, time: formatTime(slot.start_time, locale) })}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('moveBookingDate')}</label>
                <input
                  type="date"
                  value={moveDate}
                  onChange={(e) => { setMoveDate(e.target.value); setMoveTime(''); setMoveError(null); }}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                />
              </div>

              {(() => {
                const moveFreeTimes = bookingMode === 'free'
                  ? freeModeSlots
                  : moveDateFreeSlots.map(s => s.start_time);
                const moveLoading = bookingMode === 'free' && freeModeLoading;
                return (
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">{t('moveBookingTime')}</label>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
                      {t('moveBookingFreeSlots')}
                      <span className="ml-1 font-normal normal-case tracking-normal text-gray-300">— {formatDuration(bookingDuration)}</span>
                    </p>
                    {moveLoading ? (
                      <div className="flex items-center gap-2 py-2 text-[11px] text-gray-400">
                        <Loader2 className="w-3 h-3 animate-spin" /> {t('loading')}
                      </div>
                    ) : moveFreeTimes.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {moveFreeTimes.map(startTime => (
                          <button
                            key={startTime}
                            type="button"
                            onClick={() => { setMoveTime(startTime); setMoveError(null); }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all tabular-nums ${moveTime === startTime ? 'bg-slate-900 text-white border border-slate-900' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}
                          >
                            {formatTime(startTime, locale)}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-100 mb-3">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700">{t('moveBookingNoFreeSlot')}</p>
                      </div>
                    )}
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{t('moveBookingCustomTime')}</p>
                    <input
                      type="time"
                      value={moveTime}
                      onChange={(e) => { setMoveTime(e.target.value); setMoveError(null); }}
                      className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-400"
                    />
                  </div>
                );
              })()}

              {moveError && (
                <div className="flex items-start gap-2 px-3 py-2 rounded-xl bg-red-50 border border-red-100">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-red-600 font-medium">{moveError}</p>
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 space-y-2">
              {slot.client_phone && (
                <SmsToggle
                  checked={moveSendSms}
                  onToggle={() => setMoveSendSms(s => !s)}
                  label={t('sendSmsMove')}
                  isPaid={isPaid}
                  proLabel="Pro"
                  tint="violet"
                />
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={() => setMoveMode(false)}
                  disabled={moving}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  onClick={handleMoveConfirm}
                  disabled={moving || !moveTime}
                  className="w-full sm:flex-[2] py-3 rounded-xl bg-[#4b0082] text-white text-sm font-bold hover:bg-[#4b0082]/90 active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {moving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CalendarClock className="w-4 h-4" />}
                  {t('moveBookingConfirm')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Cancel booking overlay */}
        {cancelMode && (
          <div className="absolute inset-0 z-20 bg-white rounded-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-red-500" />
                <h3 className="text-sm font-bold text-gray-900">{t('cancelBookingTitle')}</h3>
              </div>
              <button onClick={() => { setCancelMode(false); setCancelSendSms(false); }} className="p-1.5 rounded-lg hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="flex-1 p-5 space-y-4">
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-500" />
                </div>
                <p className="text-sm font-semibold text-gray-900 mb-1">{t('cancelBookingMessage')}</p>
                <p className="text-xs text-gray-500">
                  {draft.clientName} — {slot.slot_date} {t('at')} {formatTime(slot.start_time, locale)}
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-100 space-y-2">
              {slot.client_phone && (
                <SmsToggle
                  checked={cancelSendSms}
                  onToggle={() => setCancelSendSms(s => !s)}
                  label={t('sendSmsCancel')}
                  isPaid={isPaid}
                  proLabel="Pro"
                  tint="red"
                />
              )}
              <div className="flex flex-col-reverse sm:flex-row gap-2">
                <button
                  onClick={() => { setCancelMode(false); setCancelSendSms(false); }}
                  disabled={saving}
                  className="w-full sm:flex-1 py-3 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold hover:bg-gray-200 transition-colors"
                >
                  {t('cancelBookingKeep')}
                </button>
                <button
                  onClick={() => { handleClearSlot(); setCancelMode(false); }}
                  disabled={saving}
                  className="w-full sm:flex-[2] py-3 rounded-xl bg-red-600 text-white text-sm font-bold hover:bg-red-700 active:scale-[0.98] touch-manipulation transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  {t('cancelBookingConfirm')}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
